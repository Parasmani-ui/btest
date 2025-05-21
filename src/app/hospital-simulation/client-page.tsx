'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/utils/theme';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';
import { SparklesText } from '@/components/magicui/sparkles-text';
import ReactMarkdown from 'react-markdown';

// Define props for the component
interface HospitalSimulationClientProps {
  simulationText: string;
  onStartNewCase: () => void;
}

interface ScenarioOption {
  label: string;
  text: string;
}

const HospitalSimulationClient: React.FC<HospitalSimulationClientProps> = ({ 
  simulationText, 
  onStartNewCase 
}) => {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [userInput, setUserInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [role, setRole] = useState<string>('');
  const [scenarioText, setScenarioText] = useState<string>('');
  const [options, setOptions] = useState<ScenarioOption[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  // Initialize simulation
  useEffect(() => {
    if (simulationText) {
      // Initialize with the first message from the AI
      setMessages([
        { role: 'system', content: 'Hospital Crisis Simulation started.' },
        { role: 'assistant', content: simulationText }
      ]);
      
      // Try to parse the role from the simulation text
      const roleMatch = simulationText.match(/Your role: ([A-Za-z\s]+)/);
      if (roleMatch && roleMatch[1]) {
        setRole(roleMatch[1].trim());
      }

      // Parse the scenario and options
      parseScenarioAndOptions(simulationText);
    }
  }, [simulationText]);
  
  // Parse incoming AI messages to separate scenario text from options
  const parseScenarioAndOptions = (content: string) => {
    // Reset options for the latest message only
    setOptions([]);
    
    // First, try to parse as JSON if the content appears to be JSON formatted
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      try {
        const jsonData = JSON.parse(content);
        
        // Extract data from JSON structure
        if (jsonData.roundNumber && jsonData.crisisTitle && jsonData.scenarioText && jsonData.options) {
          // Set current round from JSON
          setCurrentRound(jsonData.roundNumber);
          
          // Extract scenario text with proper formatting
          let formattedScenario = `🩺 Round ${jsonData.roundNumber}/10 – ${jsonData.crisisTitle}\n\n${jsonData.scenarioText}`;
          
          // Add role information if available
          if (jsonData.role && !role) {
            setRole(jsonData.role);
            formattedScenario = `Your role: ${jsonData.role}\n\n${formattedScenario}`;
          }
          
          setScenarioText(formattedScenario);
          
          // Extract options
          const extractedOptions: ScenarioOption[] = [];
          if (jsonData.options.A) extractedOptions.push({ label: 'A', text: jsonData.options.A });
          if (jsonData.options.B) extractedOptions.push({ label: 'B', text: jsonData.options.B });
          if (jsonData.options.C) extractedOptions.push({ label: 'C', text: jsonData.options.C });
          if (jsonData.options.D) extractedOptions.push({ label: 'D', text: jsonData.options.D });
          
          setOptions(extractedOptions);
          return; // Successfully parsed JSON, don't continue with other parsing methods
        }
        
        // For end-of-simulation JSON, handle differently
        if (jsonData.role && jsonData.decisionHistory && jsonData.performanceSummary) {
          setIsCompleted(true);
          // Format as readable text instead of raw JSON
          const formattedSummary = formatPerformanceSummary(jsonData);
          setScenarioText(formattedSummary);
          return;
        }
      } catch (e) {
        // Failed to parse as JSON, continue with regular parsing
        console.log("Failed to parse as JSON:", e);
      }
    }
    
    // Check if content has options (A, B, C format) - this is the fallback method
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
  
  // Format performance summary from JSON to readable text
  const formatPerformanceSummary = (data: any) => {
    let summary = `## Final Performance Evaluation\n\n`;
    summary += `**Role:** ${data.role}\n\n`;
    
    // Add decision history
    summary += `### Decision History\n\n`;
    if (data.decisionHistory && data.decisionHistory.length > 0) {
      data.decisionHistory.forEach((decision: any) => {
        summary += `**Round ${decision.round}:** ${decision.userDecision}\n`;
        summary += `${decision.summary}\n\n`;
      });
    }
    
    // Add performance metrics
    summary += `### Performance Assessment\n\n`;
    if (data.performanceSummary) {
      const metrics = data.performanceSummary;
      for (const key in metrics) {
        if (key !== 'finalScore') {
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
          summary += `**${capitalizedKey}:** ${metrics[key]}\n\n`;
        }
      }
      
      // Add final score
      if (metrics.finalScore) {
        summary += `## Final Score: ${metrics.finalScore}/10\n\n`;
      }
    }
    
    return summary;
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
    
    const input = optionInput || userInput;
    
    if (!input.trim() && !isCompleted) return;
    
    // Check for exit command
    const isExit = input.trim().toLowerCase() === 'exit' || 
                  input.trim().toLowerCase() === 'quit';
    
    // Add user message to the chat
    const updatedMessages = [
      ...messages,
      { role: 'user', content: input }
    ];
    setMessages(updatedMessages);
    setUserInput('');
    setIsThinking(true);
    
    try {
      // Make API call to get the next scenario
      const response = await fetch('/api/hospital-simulation/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simulationHistory: updatedMessages,
          userInput: input,
          isExit: isExit
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      const responseText = data.responseText;
      
      // Create a new array with the AI response (don't modify the existing one)
      const newMessagesWithResponse = [
        ...updatedMessages,
        { role: 'assistant', content: responseText }
      ];
      
      // Set the updated messages
      setMessages(newMessagesWithResponse);
      
      // Check if this is the final round or performance evaluation
      if (responseText.includes('performance summary') || 
          responseText.includes('final score') || 
          responseText.toLowerCase().includes('evaluation') || 
          isExit) {
        setIsCompleted(true);
      } else {
        try {
          // Try to update the current round from JSON if possible
          const jsonData = JSON.parse(responseText);
          if (jsonData && jsonData.roundNumber) {
            setCurrentRound(jsonData.roundNumber);
          }
        } catch (e) {
          // Try to update the current round from text matching
          const roundMatch = responseText.match(/Round (\d+)\/10/);
          if (roundMatch && roundMatch[1]) {
            setCurrentRound(parseInt(roundMatch[1]));
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      // Add error message
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Sorry, there was an error processing your response. Please try again.' }
      ]);
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
    const isJsonContent = content.trim().startsWith('{') && content.trim().endsWith('}');

    // If this is the raw JSON content and it's the latest message, show the formatted version
    if (isJsonContent && isLatestAssistantMessage) {
      return (
        <div>
          <div className="mb-4">
            {formatMessage(scenarioText)}
          </div>
          
          {/* Options as buttons */}
          {options.length > 0 && (
            // <div className="mt-6 px-4 py-3 bg-opacity-10 rounded-lg border border-opacity-20 border-red-500 bg-rose-950">
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
          )}
        </div>
      );
    } else if (isScenarioWithOptions && isLatestAssistantMessage) {
      // This is a non-JSON scenario with options (fallback case) and it's the latest message
      return (
        <div>
          <div className="mb-4">
            {formatMessage(scenarioText)}
          </div>
          
          {/* Options as buttons */}
          <div className="mt-6 px-4 py-3 bg-opacity-10 rounded-lg border border-opacity-20 border-red-500 bg-red-500">
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
  
  return (
    <ThemeProvider value={{ theme, toggleTheme }}>
      <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        {/* Header */}
        <header className={`p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} flex justify-between items-center shadow-md`}>
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/')}
              className="mr-4 p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <SparklesText 
              className="text-xl font-bold"
              colors={{ first: "#ef4444", second: "#f97316" }}
            >
              Hospital Crisis Simulation
            </SparklesText>
          </div>
          
          <div className="flex items-center space-x-4">
            {role && (
              <div className={`px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'}`}>
                Role: {role}
              </div>
            )}
            <div className={`px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
              Round: {currentRound}/10
            </div>
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>
        
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
                      : theme === 'dark' ? 'bg-blue-900 mr-auto' : 'bg-blue-100 mr-auto'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    message.role === 'assistant' 
                      ? theme === 'dark' ? 'text-red-400' : 'text-red-600'
                      : theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    {message.role === 'assistant' ? 'MEDICRUX' : 'You'}
                  </div>
                  <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
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
              <div className="flex space-x-4">
                <ShimmerButton
                  onClick={onStartNewCase}
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
            ) : (
              <form onSubmit={(e) => handleSubmit(e)} className="flex space-x-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your custom response... (or select an option above)"
                  className={`flex-1 p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300'
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
                  background={isThinking ? "rgb(156, 163, 175)" : "rgb(107, 114, 128)"}
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