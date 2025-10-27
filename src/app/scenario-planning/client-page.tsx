'use client';

import { useState, useEffect, useRef } from 'react';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import GameHeader from '@/components/ui/GameHeader';
import { SCENARIO_PLANNING_SIMULATIONS } from '@/utils/prompts';

interface ScenarioPlanningClientProps {
  navigatorId: number;
  onBackToSelection: () => void;
  onSessionStart?: (startTime: Date) => void;
  onSessionEnd?: (endTime: Date, elapsedTime: string) => void;
}

export default function ScenarioPlanningClient({ 
  navigatorId, 
  onBackToSelection,
  onSessionStart,
  onSessionEnd
}: ScenarioPlanningClientProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [userInput, setUserInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const sessionInitialized = useRef<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);

  const navigator = SCENARIO_PLANNING_SIMULATIONS[navigatorId];
  const navigatorIcons = ['🏛️', '👥', '🔬', '💰', '🎯', '🔮'];

  // Initialize session and start conversation
  useEffect(() => {
    if (!sessionInitialized.current && navigator && navigator.QUESTION_SEQUENCE) {
      sessionInitialized.current = true;
      const startTime = new Date();
      setSessionStartTime(startTime);
      onSessionStart?.(startTime);
      
      // Start the conversation with first question
      const firstQuestion = (navigator.QUESTION_SEQUENCE && navigator.QUESTION_SEQUENCE.length > 0) 
        ? navigator.QUESTION_SEQUENCE[0] 
        : "What is the key strategic issue, question, or decision we are trying to address through this scenario planning exercise?";
      
      setMessages([{
        role: 'assistant',
        content: `Welcome! I'm your ${navigator.name} consultant. ${navigator.TASK}\n\n${firstQuestion}`
      }]);
    }
  }, [navigatorId, navigator, onSessionStart]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!userInput.trim() || isThinking || isCompleted) return;

    const userMessage = userInput.trim();

    // Check if user wants to exit
    if (userMessage.toLowerCase() === 'exit' || userMessage.toLowerCase() === 'quit' || userMessage.toLowerCase() === 'end') {
      await handleExit();
      return;
    }

    setIsThinking(true);
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setUserInput('');

    try {
      const response = await fetch('/api/scenario-planning/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigatorId,
          messages: newMessages,
          userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      if (data.isComplete) {
        setIsCompleted(true);
        if (sessionStartTime && onSessionEnd) {
          const endTime = new Date();
          const elapsed = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);
          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          onSessionEnd(endTime, `${minutes}m ${seconds}s`);
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again or type "exit" to end the session.' 
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleExit = async () => {
    if (isEnding) return;
    setIsEnding(true);
    setIsCompleted(true);

    try {
      const response = await fetch('/api/scenario-planning/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navigatorId,
          messages: [...messages],
          userMessage: 'exit',
          isExiting: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.summary) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.summary }]);
        }
      }

      if (sessionStartTime && onSessionEnd) {
        const endTime = new Date();
        const elapsed = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        onSessionEnd(endTime, `${minutes}m ${seconds}s`);
      }
    } catch (error) {
      console.error('Error during exit:', error);
    } finally {
      setIsEnding(false);
    }
  };

  // Safety check for navigator
  if (!navigator) {
    return (
      <div className={`flex flex-col h-screen items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Error</h2>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Navigator not found. Please go back and try again.</p>
          <ShimmerButton
            onClick={onBackToSelection}
            className="px-6 py-3"
            shimmerColor="rgba(255, 255, 255, 0.8)"
            shimmerSize="0.1em"
            shimmerDuration="2s"
            borderRadius="0.5rem"
            background="rgb(99, 102, 241)"
          >
            ← Back to Selection
          </ShimmerButton>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <GameHeader gameTitle={navigator?.name || 'Scenario Planning'} />
      
      {/* Header */}
      <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{navigatorIcons[navigatorId] || '📋'}</span>
              <div>
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {navigator?.name || 'Navigator'}
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {navigator?.ROLE || ''}
                </p>
              </div>
            </div>
            <ShimmerButton
              onClick={onBackToSelection}
              className="px-4 py-2 text-sm"
              shimmerColor="rgba(255, 255, 255, 0.8)"
              shimmerSize="0.1em"
              shimmerDuration="2s"
              borderRadius="0.5rem"
              background="rgb(55, 65, 81)"
            >
              ← Back
            </ShimmerButton>
          </div>
      </div>

      {/* Chat Messages */}
      <div className={`flex-1 overflow-y-auto p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl p-4 rounded-lg ${
                  message.role === 'assistant'
                    ? theme === 'dark' 
                      ? 'bg-gray-800 text-white border border-gray-700' 
                      : 'bg-white text-gray-900 border border-gray-200 shadow'
                    : theme === 'dark'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-100 text-indigo-900'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{navigatorIcons[navigatorId] || '🤖'}</span>
                      <span className="text-sm font-semibold">{navigator?.name || 'Consultant'}</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            
            {isThinking && (
              <div className="flex justify-start">
                <div className={`max-w-xs p-4 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Input Area */}
      <div className={`px-6 py-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            {isCompleted ? (
              <div className="text-center">
                <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Session completed. Thank you for your participation!
                </p>
                <div className="flex gap-3 justify-center">
                  <ShimmerButton
                    onClick={onBackToSelection}
                    className="px-6 py-3"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(99, 102, 241)"
                  >
                    Back to Selection
                  </ShimmerButton>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Share your thoughts or type 'exit' to end..."
                  className={`flex-1 p-3 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-gray-900 text-white border-indigo-600' 
                      : 'bg-gray-100 text-gray-900 border-indigo-300'
                  } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  disabled={isThinking || isCompleted}
                />
                <ShimmerButton
                  type="submit"
                  className="px-6 py-3"
                  shimmerColor="rgba(255, 255, 255, 0.8)"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background={isThinking ? "rgb(156, 163, 175)" : "rgb(99, 102, 241)"}
                  disabled={isThinking || !userInput.trim() || isCompleted}
                >
                  {isThinking ? 'Sending...' : 'Send'}
                </ShimmerButton>
              </div>
            )}
        </form>
      </div>
    </div>
  );
}
