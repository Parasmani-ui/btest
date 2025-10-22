'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/utils/theme';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';

import ReactMarkdown from 'react-markdown';
import GameHeader from '@/components/ui/GameHeader';
import { useGameSession, handleGameEnd } from '@/lib/gameSession';
import { calculateSimulationScore, formatFinalScores } from '@/utils/scoring';

// Define props for the component
interface HospitalSimulationClientProps {
  simulationText: string;
  onStartNewCase: () => void;
  onSessionStart?: (startTime: Date) => void;
  onSessionEnd?: (endTime: Date, elapsedTime: string) => void;
}

interface ScenarioOption {
  label: string;
  text: string;
}

const HospitalSimulationClient: React.FC<HospitalSimulationClientProps> = ({ 
  simulationText, 
  onStartNewCase,
  onSessionStart,
  onSessionEnd
}) => {
  const router = useRouter();
  const { startSession } = useGameSession();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [userInput, setUserInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState(0);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [role, setRole] = useState<string>('');
  const [scenarioText, setScenarioText] = useState<string>('');
  const [options, setOptions] = useState<ScenarioOption[]>([]);
  const [sessionStarted, setSessionStarted] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [finalElapsedTime, setFinalElapsedTime] = useState<string>('');
  const sessionInitialized = useRef<boolean>(false);
  const gameEndedRef = useRef<boolean>(false); // Flag to prevent duplicate game end calls
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  // Initialize simulation content
  useEffect(() => {
    if (simulationText) {
      // Initialize with the first message from the AI
      setMessages([
        { role: 'system', content: 'Hospital Crisis Simulation started.' },
        { role: 'assistant', content: simulationText }
      ]);
      
      // Set game as started when simulation text is received
      setGameStarted(true);
      
      // Try to parse the role from the simulation text
      const roleMatch = simulationText.match(/Your role: ([A-Za-z\s]+)/);
      if (roleMatch && roleMatch[1]) {
        setRole(roleMatch[1].trim());
      }

      // Parse the scenario and options
      parseScenarioAndOptions(simulationText);
    }
  }, [simulationText]);

  // Separate effect for starting the session
  useEffect(() => {
    if (simulationText && !sessionStarted && !sessionInitialized.current) {
      sessionInitialized.current = true;
      const startTime = new Date();
      startSession('hospital').then(() => {
        setSessionStartTime(startTime);
        setSessionStarted(true);
        onSessionStart?.(startTime); // Notify parent of session start
        console.log('✅ Hospital simulation session started when scenario loaded');
      }).catch(error => {
        console.error('❌ Error starting hospital session:', error);
      });
    }
  }, [simulationText, sessionStarted]);
  
  // Parse incoming AI messages to separate scenario text from options
  const parseScenarioAndOptions = (content: string) => {
    // Reset options for the latest message only
    setOptions([]);
    
    // Parse round number from content
    const roundMatch = content.match(/🩺 Round (\d+)\/10/);
    if (roundMatch && roundMatch[1]) {
      setCurrentRound(parseInt(roundMatch[1]));
    }
    
    // Extract role information if available and not already set
    const roleMatch = content.match(/Your role: ([A-Za-z\s]+)/);
    if (roleMatch && roleMatch[1] && !role) {
      setRole(roleMatch[1].trim());
    }
    
    // Check if this is the final performance evaluation
    if (content.includes('FINAL PERFORMANCE EVALUATION') || content.includes('Final Score:')) {
      setIsCompleted(true);
      setScenarioText(content);
      
      // End game session when simulation completes (only if not already ended)
      if (!gameEndedRef.current) {
        gameEndedRef.current = true;
        const totalScore = calculateHospitalScore(messages, currentRound);
        const caseSolved = totalScore >= 70; // Consider case solved if score >= 70%
        
        try {
          handleGameEnd(caseSolved, totalScore).then(() => {
            console.log('✅ Hospital simulation stats updated successfully');
          }).catch(error => {
            console.error('❌ Error updating hospital simulation stats:', error);
          });
        } catch (error) {
          console.error('❌ Error in handleGameEnd:', error);
        }
      } else {
        console.log('🔄 Game already ended, skipping duplicate handleGameEnd call');
      }
      
      return;
    }
    
    // Check if content has options (A, B, C format)
    // More robust pattern to match options - handles various formats:
    // [A] Option text
    // A. Option text
    // Option A: Option text
    const optionPattern = /(?:\[([A-C])\]|\b([A-C])\.|\bOption\s+([A-C]):)\s+(.+?)(?=$|\n|(?:\[B|\bB\.|\bOption\s+B:)|\n(?:\[C|\bC\.|\bOption\s+C:))/g;
    let optionMatches = [];
    let match;
    
    // Find all option matches
    while ((match = optionPattern.exec(content)) !== null) {
      // The option label is in one of the capturing groups
      const label = match[1] || match[2] || match[3];
      const text = match[4].trim();
      
      if (label && text) {
        optionMatches.push({ label, text });
      }
    }
    
    if (optionMatches.length > 0) {
      // Sort options to ensure A, B, C order
      optionMatches.sort((a, b) => a.label.localeCompare(b.label));
      setOptions(optionMatches);
      
      // Find the first occurrence of an option to split scenario text
      let startIndex = content.length;
      for (const option of optionMatches) {
        // Look for different possible formats
        const patterns = [
          `[${option.label}]`,
          `${option.label}.`,
          `Option ${option.label}:`
        ];
        
        for (const pattern of patterns) {
          const index = content.indexOf(pattern);
          if (index !== -1 && index < startIndex) {
            startIndex = index;
          }
        }
      }
      
      // Extract scenario text (everything before the first option)
      if (startIndex < content.length) {
        setScenarioText(content.substring(0, startIndex).trim());
      } else {
        setScenarioText(content);
      }
    } else {
      // No options found or couldn't parse them, treat entire content as scenario text
      setScenarioText(content);
      
      // Try a simpler approach for options with just the letter in brackets
      const simpleOptionPattern = /\[([A-C])\]\s+(.+?)($|\n)/g;
      const simpleMatches = [...content.matchAll(simpleOptionPattern)];
      
      if (simpleMatches.length > 0) {
        const newOptions: ScenarioOption[] = simpleMatches.map(match => ({
          label: match[1], // A, B, or C
          text: match[2].trim() // The option text
        }));
        
        setOptions(newOptions);
      }
    }
  };
  
  // Format message content with Markdown
  const formatMessage = (content: string) => {
    return (
      <ReactMarkdown
        components={{
          p: ({ node, ...props }) => <p className="mb-2" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-1" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />
        }}
      >
        {content.replace(/\\n/g, '\n')}
      </ReactMarkdown>
    );
  };
  
  // Handle option button click
  const handleOptionClick = (option: string) => {
    setUserInput(option);
    handleSubmit(null, option);
  };
  
  // Scroll to the bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Parse only the latest assistant message to update scenario and options
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      parseScenarioAndOptions(lastMessage.content);
    }
  }, [messages]);
  
  // Handle user input submission
  const handleSubmit = async (event: React.FormEvent | null, optionInput?: string) => {
    if (event) event.preventDefault();
    if (isThinking || isCompleted) return;
    
    const inputText = optionInput || userInput.trim();
    if (!inputText) return;
    
    setIsThinking(true);
    setUserInput(''); // Clear the input immediately
    
    // Add user message to the conversation
    const userMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Send the conversation to the API
      const response = await fetch('/api/hospital-simulation/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentRound: currentRound
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add AI response to the conversation
        const aiMessage = { role: 'assistant', content: data.response };
        setMessages(prev => [...prev, aiMessage]);
        
        // Parse the new response for options and scenario
        parseScenarioAndOptions(data.response);
        
        // Check if the simulation is completed
        if (data.response.includes('FINAL PERFORMANCE EVALUATION') || data.response.includes('Final Score:')) {
          setIsCompleted(true);
          
          // Capture elapsed time before ending session
          if (sessionStartTime) {
            const endTime = new Date();
            const elapsedMs = endTime.getTime() - sessionStartTime.getTime();
            const elapsedMinutes = Math.floor(elapsedMs / 60000);
            const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
            const elapsedTimeStr = `${elapsedMinutes}m ${elapsedSeconds}s`;
            setFinalElapsedTime(elapsedTimeStr);
            onSessionEnd?.(endTime, elapsedTimeStr); // Notify parent of session end
          }
          
          // End game session when simulation completes (only if not already ended)
          if (!gameEndedRef.current) {
            gameEndedRef.current = true;
            const totalScore = calculateHospitalScore(messages, currentRound);
            const caseSolved = totalScore >= 0; // SIMPLE: Any score (0-100) counts as solved
            
            try {
              await handleGameEnd(caseSolved, totalScore);
              console.log('✅ Hospital simulation stats updated successfully');
            } catch (error) {
              console.error('❌ Error updating hospital simulation stats:', error);
            }
          } else {
            console.log('🔄 Game already ended, skipping duplicate handleGameEnd call');
          }
        }
      } else {
        console.error('Failed to get response from hospital simulation API');
      }
    } catch (error) {
      console.error('Error in hospital simulation:', error);
    } finally {
      setIsThinking(false);
    }
  };
  
  // Render assistant message with separated scenario and options
  const renderAssistantMessage = (content: string, index: number) => {
    // Only apply special scenario rendering for the latest assistant message
    const isLatestAssistantMessage = index === messages.length - 1 || 
      (index === messages.length - 3 && messages[messages.length - 1].role === 'user');
    
    // Check if this is a scenario message that should show options
    const isScenarioWithOptions = isLatestAssistantMessage && options.length > 0;

    if (isScenarioWithOptions && isLatestAssistantMessage) {
      // This is a scenario with options and it's the latest message
      return (
        <div>
          <div className="mb-4">
            {formatMessage(scenarioText)}
          </div>
          
          {/* Options as buttons */}
          <div className="mt-6 px-4 py-3 bg-red-100 dark:bg-rose-950 text-black dark:text-white border border-red-500 border-opacity-20 rounded-lg">
            <p className="font-medium mb-3 text-lg">🤔 What do you do?</p>
            <div className="flex flex-col space-y-3">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option.label)}
                  className={`p-4 text-left rounded-md transition hover:opacity-90 shadow-sm border-l-4 ${
                    theme === 'dark' 
                      ? 'bg-red-900 text-white hover:bg-red-800 border-red-600' 
                      : 'bg-red-50 text-red-900 hover:bg-red-100 border-red-500'
                  }`}
                >
                  <div className="flex items-start">
                    <span className="font-bold text-lg mr-2">[{option.label}]</span>
                    <span>{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 text-sm text-opacity-70">
              Type your own decision or select an option above.
            </div>
          </div>
        </div>
      );
    } else {
      // Regular formatting for non-latest messages or final evaluation
      return formatMessage(content);
    }
  };
  
  // Enhanced onStartNewCase to reset all states
  const handleStartNewCase = () => {
    setIsCompleted(false);
    setGameStarted(false);
    setMessages([]);
    setCurrentRound(1);
    setRole('');
    setScenarioText('');
    setOptions([]);
    setUserInput('');
    setIsThinking(false);
    // Reset all session timing state
    setSessionStarted(false);
    setSessionStartTime(null);
    setFinalElapsedTime('');
    sessionInitialized.current = false; // Reset session initialization flag
    setResetKey(prev => prev + 1); // Increment reset key to trigger timer reset
    onStartNewCase(); // Call the original function
  };
  
  // Calculate 3-parameter score for hospital simulation
  const calculateHospitalScore = (messages: {role: string, content: string}[], currentRound: number): number => {
    const finalMessage = messages[messages.length - 1];
    if (finalMessage?.content) {
      // Use the new 3-parameter scoring system
      const score = calculateSimulationScore('HOSPITAL_CRISIS_SIMULATION', finalMessage.content, null, messages);
      return score.overall;
    }
    
    // Fallback scoring logic if no content is found
    const maxRounds = 10;
    const completionBonus = (currentRound / maxRounds) * 60; // 60% for completion
    return Math.min(100, Math.max(0, Math.round(completionBonus)));
  };
  
  return (
    <ThemeProvider value={{ theme, toggleTheme }}>
      <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        {/* Game Info Bar */}
        <div className={`p-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} flex justify-between items-center shadow-sm border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            {role && (
              <div className={`px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-red-100 text-red-800'}`}>
                Role: {role}
              </div>
            )}
            <div className={`px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
              Round: {currentRound}/10
            </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        
        {/* Chat Messages */}
        <div className={`flex-1 overflow-y-auto p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message, index) => {
              // Skip system messages
              if (message.role === 'system') return null;
              
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-lg max-w-3xl ${
                    message.role === 'assistant' 
                      ? theme === 'dark' ? 'bg-gray-800 ml-auto mr-auto' : 'bg-white ml-auto mr-auto shadow' 
                      : theme === 'dark' ? 'bg-gray-700 mr-auto' : 'bg-blue-100 mr-auto'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    message.role === 'assistant' 
                      ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
                      : theme === 'dark' ? 'text-gray-300' : 'text-blue-700'
                  }`}>
                    {message.role === 'assistant' ? 'MEDICRUX' : 'You'}
                  </div>
                  <div className={`${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    {message.role === 'assistant' 
                      ? renderAssistantMessage(message.content, index)
                      : formatMessage(message.content)
                    }
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} /> {/* For auto-scrolling */}
            
            {isThinking && (
              <div className={`p-4 rounded-lg max-w-3xl ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              } ml-auto mr-auto flex items-center space-x-2`}>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-200"></div>
                <span className="text-sm ml-2">MEDICRUX is thinking...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Input Area */}
        <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="max-w-4xl mx-auto">
            {isCompleted ? (
              <div className="space-y-4">
                {finalElapsedTime && (
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-red-600'}`}>
                      Total Time: {finalElapsedTime}
                    </div>
                  </div>
                )}
                <div className="flex space-x-4">
                  <ShimmerButton
                    onClick={handleStartNewCase}
                    className="flex-1 p-3 text-white"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(220, 38, 38)"
                  >
                    Start New Simulation
                  </ShimmerButton>
                  <ShimmerButton
                    onClick={() => router.push('/')}
                    className="flex-1 p-3"
                    shimmerColor="rgba(255, 255, 255, 0.5)"
                    shimmerSize="0.05em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background={theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
                  >
                    Return Home
                  </ShimmerButton>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => handleSubmit(e)} className="flex space-x-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your custom response... (or select an option above)"
                  className={`flex-1 p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-900 text-white border-red-600' : 'bg-gray-100 text-gray-900 border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-red-500`}
                  disabled={isThinking}
                />
                <ShimmerButton
                  type="submit"
                  className="p-3 text-white"
                  shimmerColor="rgba(255, 255, 255, 0.8)"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background={isThinking ? "rgb(156, 163, 175)" : "rgb(220, 38, 38)"}
                  disabled={isThinking || !userInput.trim()}
                >
                  {isThinking ? 'Sending...' : 'Send'}
                </ShimmerButton>
                <ShimmerButton
                  onClick={() => handleSubmit(null, "exit")}
                  className="p-3 text-white"
                  shimmerColor="rgba(255, 255, 255, 0.8)"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background={isThinking ? "rgb(156, 163, 175)" : "rgb(55, 65, 81)"}
                  disabled={isThinking}
                >
                  End
                </ShimmerButton>
              </form>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default HospitalSimulationClient; 