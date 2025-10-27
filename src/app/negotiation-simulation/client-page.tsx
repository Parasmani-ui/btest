'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/utils/theme';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';

import ReactMarkdown from 'react-markdown';
import GameHeader from '@/components/ui/GameHeader';
import { useGameSession, handleGameEnd } from '@/lib/gameSession';
import { useAuth } from '@/contexts/AuthContext';
import { calculateSimulationScore, formatFinalScores } from '@/utils/scoring';

// Define props for the component
interface NegotiationSimulationClientProps {
  simulationText: string;
  subGameIndex: number;
  onStartNewCase: () => void;
  onBackToSelection: () => void;
  onSessionStart?: (startTime: Date) => void;
  onSessionEnd?: (endTime: Date, elapsedTime: string) => void;
}

interface ScenarioOption {
  label: string;
  text: string;
}

const NegotiationSimulationClient: React.FC<NegotiationSimulationClientProps> = ({
  simulationText,
  subGameIndex,
  onStartNewCase,
  onBackToSelection,
  onSessionStart,
  onSessionEnd
}) => {
  const router = useRouter();
  const { startSession, updateSession } = useGameSession();
  const { userData } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [userInput, setUserInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState(0);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [role, setRole] = useState<string>('');
  const [scenarioText, setScenarioText] = useState<string>('');
  const [options, setOptions] = useState<ScenarioOption[]>([]);
  const [sessionStarted, setSessionStarted] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [finalElapsedTime, setFinalElapsedTime] = useState<string>('');
  const [currentElapsedTime, setCurrentElapsedTime] = useState<string>('');
  const sessionInitialized = useRef<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintText, setHintText] = useState<string>('');
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [gameScore, setGameScore] = useState<any>(null);
  const [negotiationProgress, setNegotiationProgress] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('');

  const SUB_GAME_TITLES = [
    "Salary Negotiation",
    "Project Timeline Negotiation",
    "Vendor Discount Conflict",
    "Cross-Functional Team Negotiation",
    "Crisis Negotiation in Product Recall"
  ];

  const SUB_GAME_EMOJIS = [
    "💰", "⏰", "🤝", "👥", "🚨"
  ];

  const SUB_GAME_COLORS = [
    "emerald", "blue", "purple", "orange", "red"
  ];

  const currentColor = SUB_GAME_COLORS[subGameIndex] || "purple";
  const currentEmoji = SUB_GAME_EMOJIS[subGameIndex] || "🤝";

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Initialize simulation content
  useEffect(() => {
    if (simulationText) {
      // Initialize with the first message from the AI
      setMessages([
        { role: 'system', content: 'Negotiation Simulation started.' },
        { role: 'assistant', content: simulationText }
      ]);

      // Set game as started when simulation text is received
      setGameStarted(true);

      // Try to parse the role from the simulation text
      const roleMatch = simulationText.match(/Your role: ([A-Za-z\s,\-]+)/);
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
      startSession('negotiation').then(() => {
        setSessionStartTime(startTime);
        setSessionStarted(true);
        setCurrentElapsedTime('0m 0s'); // Initialize timer
        onSessionStart?.(startTime); // Notify parent of session start
        console.log('✅ Negotiation simulation session started when scenario loaded');
      }).catch(error => {
        console.error('❌ Error starting negotiation session:', error);
      });
    }
  }, [simulationText, sessionStarted]);

  // Real-time timer update
  useEffect(() => {
    if (!sessionStartTime || isCompleted) return;

    const timer = setInterval(() => {
      const now = new Date();
      const elapsedMs = now.getTime() - sessionStartTime.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
      const elapsedTimeStr = `${elapsedMinutes}m ${elapsedSeconds}s`;
      setCurrentElapsedTime(elapsedTimeStr);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime, isCompleted]);

  // Parse incoming AI messages to separate scenario text from options
  const parseScenarioAndOptions = (content: string) => {
    // Reset options for the latest message only
    setOptions([]);
    setSelectedOption('');

    // Parse turn number from content
    const turnMatch = content.match(/Turn (\d+)\/5|Round (\d+)\/5/);
    if (turnMatch) {
      const turn = parseInt(turnMatch[1] || turnMatch[2]);
      if (turn) {
        setCurrentTurn(turn);
      }
    }

    // Extract role information if available and not already set
    const roleMatch = content.match(/Your role: ([A-Za-z\s,\-]+)/);
    if (roleMatch && roleMatch[1] && !role) {
      setRole(roleMatch[1].trim());
    }

    // Extract negotiation progress if available
    const progressMatch = content.match(/Progress: ([^\n]+)/);
    if (progressMatch && progressMatch[1]) {
      setNegotiationProgress(progressMatch[1].trim());
    }

    // Check if this is the final performance evaluation
    if (content.includes('FINAL PERFORMANCE EVALUATION') ||
        content.includes('Final Score:') ||
        content.includes('NEGOTIATION COMPLETE') ||
        content.includes('Final Assessment:')) {
      // Set the full final text, but don't handle completion logic here.
      // Completion is handled in handleSubmit to ensure correct state.
      setScenarioText(content);
      return;
    }

    // Enhanced option parsing - handles multiple formats
    const optionPatterns = [
      /\[([A-D])\]\s+(.+?)(?=\n\[|$)/g,
      /^([A-D])\.?\s+(.+?)(?=\n[A-D]\.|\n\n|$)/gm,
      /Option\s+([A-D]):\s+(.+?)(?=\nOption\s+[A-D]:|$)/g,
      /([A-D])\)\s+(.+?)(?=\n[A-D]\)|$)/g,
      /([1-4])\.?\s+(.+?)(?=\n[1-4]\.|\n\n|$)/gm
    ];

    let optionMatches: ScenarioOption[] = [];

    for (const pattern of optionPatterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        optionMatches = matches.map(match => ({
          label: match[1],
          text: match[2].trim().replace(/\n/g, ' ')
        }));
        break; // Use the first pattern that finds matches
      }
    }

    if (optionMatches.length > 0) {
      // Sort options to ensure proper order
      optionMatches.sort((a, b) => {
        if (/[A-D]/.test(a.label) && /[A-D]/.test(b.label)) {
          return a.label.localeCompare(b.label);
        }
        if (/[1-4]/.test(a.label) && /[1-4]/.test(b.label)) {
          return parseInt(a.label) - parseInt(b.label);
        }
        return a.label.localeCompare(b.label);
      });

      setOptions(optionMatches);

      // Find the first occurrence of an option to split scenario text
      let startIndex = content.length;
      for (const option of optionMatches) {
        const patterns = [
          `[${option.label}]`,
          `${option.label}.`,
          `Option ${option.label}:`,
          `${option.label})`
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
      // No options found, treat entire content as scenario text
      setScenarioText(content);
    }
  };

  // Format message content with Markdown
  const formatMessage = (content: string) => {
    return (
      <ReactMarkdown
        components={{
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
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

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  // Handle option button click
  const handleOptionClick = (option: string) => {
    if (selectedOption) {
      setUserInput(selectedOption);
      handleSubmit(null, selectedOption);
    }
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
    setSelectedOption(''); // Clear selected option

    // Add user message to the conversation
    const userMessage = { role: 'user', content: inputText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      // Send the conversation to the API
      const response = await fetch('/api/negotiation-simulation/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          currentTurn: currentTurn,
          subGameIndex: subGameIndex
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add AI response to the conversation
        const aiMessage = { role: 'assistant', content: data.response };
        setMessages(prev => [...prev, aiMessage]);
        
        // Try to extract score from response
        if (data.score) {
          setGameScore(data.score);
        }

        // Check if the simulation is completed
        const isFinal = data.isComplete || 
                        data.response.includes('FINAL PERFORMANCE EVALUATION') ||
                        data.response.includes('Final Score:') ||
                        data.response.includes('NEGOTIATION COMPLETE') ||
                        data.response.includes('Final Assessment:') ||
                        currentTurn >= 5;

        if (isFinal) {
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
          
          // End game session when simulation completes
          const finalMessagesForScoring = [...newMessages, aiMessage];
          const totalScore = calculateNegotiationScore(finalMessagesForScoring, currentTurn);
          const caseSolved = totalScore >= 0; // SIMPLE: Any score (0-100) counts as solved

          // Save analysis data to game session before ending
          try {
            const scoreCalc = calculateSimulationScore('NEGOTIATION_SIMULATION', aiMessage.content, null, finalMessagesForScoring);
            await updateSession({
              analysis: data.response || aiMessage.content,
              caseTitle: `Negotiation Simulation`,
              scoreBreakdown: {
                parameter1: scoreCalc.parameter1,
                parameter1Name: 'Assertiveness',
                parameter2: scoreCalc.parameter2,
                parameter2Name: 'Data-Driven Arguments',
                parameter3: scoreCalc.parameter3,
                parameter3Name: 'Empathy/Relationship Maintenance',
                overall: totalScore
              }
            });
            console.log('✅ Analysis data saved to game session');
          } catch (error) {
            console.error('❌ Error saving analysis data:', error);
          }

          try {
            await handleGameEnd(caseSolved, totalScore);
            console.log('✅ Negotiation simulation stats updated successfully');
          } catch (error) {
            console.error('❌ Error updating negotiation simulation stats:', error);
          }
        } else {
          // Increment turn for next round
          setCurrentTurn(prev => prev + 1);
          
          // Reset hint for next turn
          setShowHint(false);
          setHintText('');
          setHintUsed(false);
        }
      } else {
        console.error('Failed to get response from negotiation simulation API');
        setMessages(prev => [...prev, {role: 'assistant', content: 'Sorry, there was an error processing your request.'}]);
      }
    } catch (error) {
      console.error('Error in negotiation simulation:', error);
      setMessages(prev => [...prev, {role: 'assistant', content: 'Sorry, an unexpected error occurred.'}]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handle hint functionality
  const handleHint = async () => {
    if (hintUsed || isCompleted) return;

    setIsThinking(true);

    try {
      const response = await fetch('/api/negotiation-simulation/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          currentTurn: currentTurn,
          subGameIndex: subGameIndex,
          requestHint: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHintText(data.hint || 'Consider your negotiation strategy and the other party\'s interests.');
        setShowHint(true);
        setHintUsed(true);
      } else {
        setHintText('Sorry, unable to get a hint at this time.');
        setShowHint(true);
      }
    } catch (error) {
      console.error('Error getting hint:', error);
      setHintText('Sorry, unable to get a hint at this time.');
      setShowHint(true);
    } finally {
      setIsThinking(false);
    }
  };

  // Render assistant message with separated scenario and options
  const renderAssistantMessage = (content: string, index: number) => {
    const isLatestAssistantMessage = index === messages.length - 1;
    const isScenarioWithOptions = isLatestAssistantMessage && options.length > 0 && !isCompleted;

    if (isScenarioWithOptions) {
      return (
        <div>
          <div className="mb-6">
            {formatMessage(scenarioText)}
          </div>
          <div className={`mt-6 p-6 border border-opacity-30 rounded-xl ${
            currentColor === 'emerald' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 border-emerald-400' :
            currentColor === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-400' :
            currentColor === 'purple' ? 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-400' :
            currentColor === 'orange' ? 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-400' :
            'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-400'
          } text-black dark:text-white shadow-lg`}>
            <p className="font-semibold mb-4 text-xl flex items-center">
              <span className="mr-2">🤔</span>
              Select Your Strategy
            </p>
            <div className="space-y-3">
              {options.map((option, index) => (
                <label
                  key={index}
                  className={`group cursor-pointer block p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                    selectedOption === option.label
                      ? (theme === 'dark' 
                          ? `${
                              currentColor === 'emerald' ? 'border-emerald-400 bg-emerald-900/60' :
                              currentColor === 'blue' ? 'border-blue-400 bg-blue-900/60' :
                              currentColor === 'purple' ? 'border-purple-400 bg-purple-900/60' :
                              currentColor === 'orange' ? 'border-orange-400 bg-orange-900/60' :
                              'border-red-400 bg-red-900/60'
                            } shadow-lg` 
                          : `${
                              currentColor === 'emerald' ? 'border-emerald-500 bg-emerald-200/80' :
                              currentColor === 'blue' ? 'border-blue-500 bg-blue-200/80' :
                              currentColor === 'purple' ? 'border-purple-500 bg-purple-200/80' :
                              currentColor === 'orange' ? 'border-orange-500 bg-orange-200/80' :
                              'border-red-500 bg-red-200/80'
                            } shadow-lg`)
                      : (theme === 'dark' 
                          ? 'border-gray-600 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-700/60' 
                          : 'border-gray-300 bg-white/80 hover:border-gray-400 hover:bg-gray-50')
                  } ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="negotiation-option"
                    value={option.label}
                    checked={selectedOption === option.label}
                    onChange={() => handleOptionSelect(option.label)}
                    disabled={isThinking}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${
                      selectedOption === option.label
                        ? (currentColor === 'emerald' ? 'border-emerald-500 bg-emerald-500' :
                           currentColor === 'blue' ? 'border-blue-500 bg-blue-500' :
                           currentColor === 'purple' ? 'border-purple-500 bg-purple-500' :
                           currentColor === 'orange' ? 'border-orange-500 bg-orange-500' :
                           'border-red-500 bg-red-500')
                        : 'border-gray-400 bg-transparent'
                    }`}>
                      {selectedOption === option.label && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start">
                        <span className={`font-bold text-lg mr-3 px-2 py-1 rounded-md ${
                          selectedOption === option.label
                            ? 'bg-white/20 text-white' 
                            : (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
                        }`}>
                          {option.label}
                        </span>
                        <span className="flex-1 leading-relaxed">{option.text}</span>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 text-sm opacity-70 text-center">
              Select an option above or type your own strategy below.
            </div>
          </div>
        </div>
      );
    } else {
      return formatMessage(content);
    }
  };

  // Enhanced onStartNewCase to reset all states
  const handleStartNewCase = () => {
    setIsCompleted(false);
    setGameStarted(false);
    setMessages([]);
    setCurrentTurn(1);
    setRole('');
    setScenarioText('');
    setOptions([]);
    setUserInput('');
    setIsThinking(false);
    setNegotiationProgress('');
    setGameScore(null);
    setSessionStarted(false);
    setSessionStartTime(null);
    setFinalElapsedTime('');
    setCurrentElapsedTime('');
    sessionInitialized.current = false;
    setResetKey(prev => prev + 1);
    setShowHint(false);
    setHintText('');
    setHintUsed(false);
    setSelectedOption('');
    onStartNewCase();
  };

  // Calculate 3-parameter score for negotiation simulation
  const calculateNegotiationScore = (messages: {role: string, content: string}[], currentTurn: number): number => {
    const finalMessage = messages[messages.length - 1];
    if (finalMessage?.content) {
      // Use the new 3-parameter scoring system
      const score = calculateSimulationScore('NEGOTIATION_SIMULATION', finalMessage.content, null, messages);
      return score.overall;
    }
    
    // Fallback scoring logic if no content is found
    const maxTurns = 5;
    const completionBonus = (currentTurn / maxTurns) * 60; // Up to 60% for completion
    return Math.min(100, Math.max(0, Math.round(completionBonus)));
  };

  const getThemeColors = () => {
    const colorClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const backgroundClass = theme === 'dark' 
      ? `bg-gray-900`
      : 'bg-gray-50';
    return `${colorClass} ${backgroundClass}`;
  };

  return (
    <ThemeProvider value={{ theme, toggleTheme }}>
      <div className={`flex flex-col h-screen w-full ${getThemeColors()}`}>
        <div className={`p-4 w-full ${theme === 'dark' 
          ? `bg-gray-800 border-gray-700`
          : `bg-white border-gray-200`
        } flex justify-between items-center shadow-sm border-b`}>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              theme === 'dark' 
                ? (currentColor === 'emerald' ? 'bg-emerald-900 text-emerald-200' :
                   currentColor === 'blue' ? 'bg-blue-900 text-blue-200' :
                   currentColor === 'purple' ? 'bg-purple-900 text-purple-200' :
                   currentColor === 'orange' ? 'bg-orange-900 text-orange-200' : 'bg-red-900 text-red-200')
                : (currentColor === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                   currentColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                   currentColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                   currentColor === 'orange' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800')
            }`}>
              {currentEmoji} {SUB_GAME_TITLES[subGameIndex]}
            </div>
            {role && (
              <div className={`px-4 py-2 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                Role: {role}
              </div>
            )}
            <div className={`px-4 py-2 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              Turn: {Math.min(currentTurn, 5)}/5
            </div>
            {negotiationProgress && (
              <div className={`px-4 py-2 rounded-full text-sm ${theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                {negotiationProgress}
              </div>
            )}
            {false && (currentElapsedTime || finalElapsedTime) && (
              <div className={`px-4 py-2 rounded-full text-sm ${isCompleted ? 
                (theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800') :
                (theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')
              }`}>
                ⏱️ {isCompleted ? 'Completed in: ' : 'Time: '}{isCompleted ? finalElapsedTime : currentElapsedTime}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push('/')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              🏠 Home
            </button>
            <button
              onClick={onBackToSelection}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              ← Back
            </button>
            <button
              onClick={handleHint}
              disabled={hintUsed || isCompleted || isThinking}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                hintUsed || isCompleted || isThinking
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              💡 {hintUsed ? 'Used' : 'Hint'}
            </button>
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            {/* User Profile */}
            {userData && (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-600">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userData.displayName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-white">
                    {userData.displayName}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{userData.role}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showHint && hintText && (
          <div className="w-full px-6 pt-4">
            <div className="p-4 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm opacity-90">{hintText}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 w-full">
            <div className="w-full max-w-none space-y-6">
                {messages.filter(msg => msg.role !== 'system').map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                                🤖
                            </div>
                        )}
			<div className={`max-w-4xl p-6 rounded-xl shadow-md ${
                            msg.role === 'user'
                                ? `ml-auto ${
                                    currentColor === 'emerald' ? 'bg-emerald-600 text-white' :
                                    currentColor === 'blue' ? 'bg-blue-600 text-white' :
                                    currentColor === 'purple' ? 'bg-purple-600 text-white' :
                                    currentColor === 'orange' ? 'bg-orange-600 text-white' :
                                    'bg-red-600 text-white'
                                  }`
                                : `${theme === 'dark' 
                                    ? 'bg-gray-800 border border-gray-700' 
                                    : 'bg-white border border-gray-200'
                                  } ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`
                        }`}>
                            {msg.role === 'assistant' 
                                ? renderAssistantMessage(msg.content, messages.filter(m => m.role !== 'system').indexOf(msg))
                                : formatMessage(msg.content)
                            }
                        </div>
                        {msg.role === 'user' && (
                            <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                                👤
                            </div>
                        )}
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex items-start gap-4 w-full justify-start">
                        <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                            🤖
                        </div>
                        <div className={`max-w-4xl p-6 rounded-xl shadow-md ${
                          theme === 'dark' 
                            ? 'bg-gray-800 border border-gray-700 text-white' 
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}>
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                <span>AI is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
        </main>

        {!isCompleted && gameStarted && (
          <div className={`p-6 border-t w-full ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {selectedOption ? (
              <div className="mb-4">
                <div className={`p-3 rounded-lg ${
                  currentColor === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700' :
                  currentColor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700' :
                  currentColor === 'purple' ? 'bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-700' :
                  currentColor === 'orange' ? 'bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700' :
                  'bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700'
                }`}>
                  <p className="text-sm font-medium mb-1">Selected Option:</p>
                  <p className="text-sm opacity-80">Option {selectedOption} selected</p>
                </div>
              </div>
            ) : null}
            
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={selectedOption ? `Option ${selectedOption} selected. Click Send or type your own response...` : "Type your negotiation strategy or response... (Type 'exit' to end early)"}
                  disabled={isThinking}
                  rows={1}
                  className={`flex-1 p-2 border rounded-xl resize-none focus:outline-none focus:ring-2 transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-gray-400'
                  } ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <div className="flex flex-col space-y-2">
                  <button
                    type="submit"
                    disabled={isThinking || (!userInput.trim() && !selectedOption)}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isThinking || (!userInput.trim() && !selectedOption)
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        : (currentColor === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                           currentColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                           currentColor === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                           currentColor === 'orange' ? 'bg-orange-600 hover:bg-orange-700 text-white' :
                           'bg-red-600 hover:bg-red-700 text-white')
                    }`}
                  >
                    {isThinking ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      'Send'
                    )}
                  </button>
                  {selectedOption && (
                    <button
                      type="button"
                      onClick={() => setSelectedOption('')}
                      className="px-4 py-1 text-sm rounded-lg border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}
                
        {isCompleted && (
        <div
          className={`p-4 border-t w-full max-w-md mx-auto rounded-lg shadow-md ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="text-center">
              <div className="text-xl font-bold mb-1">
                🎯 Negotiation Complete!
              </div>
            </div>

            <div className="flex space-x-3">
              <ShimmerButton
                onClick={handleStartNewCase}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentColor === 'emerald'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : currentColor === 'blue'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : currentColor === 'purple'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : currentColor === 'orange'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                Try Another Case
              </ShimmerButton>

              <button
                onClick={onBackToSelection}
                className={`px-4 py-2 rounded-lg font-medium border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </ThemeProvider>
  );
};

export default NegotiationSimulationClient;