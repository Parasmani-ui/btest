'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SimulationData, MarkdownSimulationData, ResponsibleParty, MisconductType, PrimaryMotivation } from '@/types/simulation';
import { SimulationConclusion } from '@/simulation';
import { ThemeProvider } from '@/utils/theme';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { useRouter } from 'next/navigation';

interface SimulationClientProps {
  simulationText: string;
  onStartNewCase: () => void;
}

interface ConclusionState {
  text: string;
  responsibleParty: string;
  misconductType: string;
  primaryMotivation: string;
}

export default function SimulationClient({ simulationText, onStartNewCase }: SimulationClientProps) {
  const [activeTab, setActiveTab] = useState('case');
  const [showLegalGuide, setShowLegalGuide] = useState(false);
  const [conclusion, setConclusion] = useState<ConclusionState>({
    text: '',
    responsibleParty: '',
    misconductType: '',
    primaryMotivation: ''
  });
  const [showConclusionForm, setShowConclusionForm] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [parsedData, setParsedData] = useState<{
    simulationData: SimulationData | null;
    markdownData: MarkdownSimulationData | null;
  }>({
    simulationData: null,
    markdownData: null
  });
  const router = useRouter();
  
  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  // Parse simulation text into structured data
  useEffect(() => {
    try {
      // First, try to parse as JSON
      try {
        const jsonData = JSON.parse(simulationText);
        if (jsonData) {
          setParsedData({
            simulationData: jsonData as SimulationData,
            markdownData: null
          });
          setParseError(null);
          return;
        }
      } catch (e) {
        // If JSON parsing fails, try markdown format
      }
      
      // If that fails, try to parse as markdown
      const markdownData = parseMarkdownSimulation(simulationText);
      setParsedData({
        simulationData: null,
        markdownData
      });
      setParseError(null);
    } catch (e) {
      console.error('Error parsing simulation data:', e);
      setParseError(`Failed to parse simulation data: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [simulationText]);
  
  // Parse markdown format simulation
  const parseMarkdownSimulation = (text: string): MarkdownSimulationData => {
    const sections: MarkdownSimulationData = {
      case: '',
      evidence: '',
      legal: ''
    };
    
    // Extract main sections using regex pattern matching
    const caseMatch = text.match(/## Case Overview\s([\s\S]*?)(?=## Evidence|## Legal Reference|$)/i);
    const evidenceMatch = text.match(/## Evidence\s([\s\S]*?)(?=## Case Overview|## Legal Reference|$)/i);
    const legalMatch = text.match(/## Legal Reference\s([\s\S]*?)(?=## Case Overview|## Evidence|$)/i);
    
    if (caseMatch && caseMatch[1]) sections.case = caseMatch[1].trim();
    if (evidenceMatch && evidenceMatch[1]) sections.evidence = evidenceMatch[1].trim();
    if (legalMatch && legalMatch[1]) sections.legal = legalMatch[1].trim();
    
    // Extract hidden information for later validation
    const hiddenMatch = text.match(/## HIDDEN_INFO\s([\s\S]*?)(?=## |$)/i);
    if (hiddenMatch && hiddenMatch[1]) {
      try {
        sections.hiddenInfo = hiddenMatch[1].trim();
      } catch (e) {
        console.error('Error parsing hidden info:', e);
      }
    }
    
    return sections;
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  const handleSubmitConclusion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Set a default text value if not provided
      if (!conclusion.text) {
        setConclusion({
          ...conclusion,
          text: "Conclusion submitted without detailed text explanation."
        });
      }
      
      // Create payload based on which format we have
      const payload = {
        conclusion: conclusion.text || "Conclusion submitted without detailed text explanation.",
        responsible: conclusion.responsibleParty,
        misconduct: conclusion.misconductType,
        motivation: conclusion.primaryMotivation,
        hiddenInfo: parsedData.markdownData?.hiddenInfo || '',
        simulationData: parsedData.simulationData ? JSON.stringify(parsedData.simulationData) : null,
      };
      
      // Submit conclusion to API endpoint
      const response = await fetch('/api/simulation/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok && data.analysis) {
        setAnalysis(data.analysis);
        setHasSubmitted(true);
        setShowConclusionForm(false); // Hide the form after submission
      } else {
        throw new Error(data.error || 'Failed to analyze conclusion');
      }
    } catch (error) {
      console.error('Error submitting conclusion:', error);
      alert('Failed to analyze your conclusion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderAnalysis = () => {
    if (!hasSubmitted) return null;
    
    // Get correct answers from simulationData if available
    const correctResponsible = parsedData.simulationData?.correctResponsibleParty;
    const correctMisconduct = parsedData.simulationData?.correctMisconductType;
    const correctMotivation = parsedData.simulationData?.correctPrimaryMotivation;
    
    return (
      <SimulationConclusion
        conclusion={conclusion.text}
        selectedResponsible={conclusion.responsibleParty}
        selectedMisconduct={conclusion.misconductType}
        selectedMotivation={conclusion.primaryMotivation}
        analysis={analysis}
        onStartNewCase={onStartNewCase}
        correctResponsible={correctResponsible}
        correctMisconduct={correctMisconduct}
        correctMotivation={correctMotivation}
      />
    );
  };
  
  const renderConclusionForm = () => {
    const isFormValid = conclusion.responsibleParty && conclusion.misconductType && conclusion.primaryMotivation;
    
    return (
      <form onSubmit={handleSubmitConclusion} className={`${theme === 'dark' ? 'bg-green-800 text-gray-200' : 'bg-white text-gray-800'} rounded-lg shadow-lg p-6`}>
        <TextAnimate
          className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
          animation="blurInUp"
          by="word"
          duration={0.4}
        >
          Conclude Investigation
        </TextAnimate>
        
        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
              Responsible Individual <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, responsibleParty: 'Respondent'})}
                className={`p-3 rounded-lg transition ${conclusion.responsibleParty === 'Respondent' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.responsibleParty === 'Respondent'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Respondent
              </ShimmerButton>
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, responsibleParty: 'Complainant'})}
                className={`p-3 rounded-lg transition ${conclusion.responsibleParty === 'Complainant' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.responsibleParty === 'Complainant'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Complainant
              </ShimmerButton>
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, responsibleParty: 'Both Parties'})}
                className={`p-3 rounded-lg transition ${conclusion.responsibleParty === 'Both Parties' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.responsibleParty === 'Both Parties'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Both Parties
              </ShimmerButton>
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, responsibleParty: 'Neither Party'})}
                className={`p-3 rounded-lg transition ${conclusion.responsibleParty === 'Neither Party' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.responsibleParty === 'Neither Party'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Neither Party
              </ShimmerButton>
            </div>
            {!conclusion.responsibleParty && (
              <p className="mt-1 text-sm text-red-400">Please select a responsible party</p>
            )}
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
              Nature of Misconduct <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, misconductType: 'Sexual Harassment'})}
                className={`p-3 rounded-lg transition ${conclusion.misconductType === 'Sexual Harassment' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.misconductType === 'Sexual Harassment'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Sexual Harassment
              </ShimmerButton>
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, misconductType: 'Discrimination'})}
                className={`p-3 rounded-lg transition ${conclusion.misconductType === 'Discrimination' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.misconductType === 'Discrimination'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Discrimination
              </ShimmerButton>
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, misconductType: 'Retaliation'})}
                className={`p-3 rounded-lg transition ${conclusion.misconductType === 'Retaliation' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.misconductType === 'Retaliation'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Retaliation
              </ShimmerButton>
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, misconductType: 'No Misconduct'})}
                className={`p-3 rounded-lg transition ${conclusion.misconductType === 'No Misconduct' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.misconductType === 'No Misconduct'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                No Misconduct
              </ShimmerButton>
            </div>
            {!conclusion.misconductType && (
              <p className="mt-1 text-sm text-red-400">Please select a misconduct type</p>
            )}
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
              Primary Motivation <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, primaryMotivation: 'Genuine Complaint'})}
                className={`p-3 rounded-lg transition ${conclusion.primaryMotivation === 'Genuine Complaint' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.primaryMotivation === 'Genuine Complaint'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Genuine Complaint
              </ShimmerButton>
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, primaryMotivation: 'Personal Vendetta'})}
                className={`p-3 rounded-lg transition ${conclusion.primaryMotivation === 'Personal Vendetta' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.primaryMotivation === 'Personal Vendetta'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Personal Vendetta
              </ShimmerButton>
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, primaryMotivation: 'Career Advancement'})}
                className={`p-3 rounded-lg transition ${conclusion.primaryMotivation === 'Career Advancement' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.primaryMotivation === 'Career Advancement'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Career Advancement
              </ShimmerButton>
              <ShimmerButton
                type="button"
                onClick={() => setConclusion({...conclusion, primaryMotivation: 'Misunderstanding'})}
                className={`p-3 rounded-lg transition ${conclusion.primaryMotivation === 'Misunderstanding' ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                background={conclusion.primaryMotivation === 'Misunderstanding'
                  ? 'rgb(37, 99, 235)'
                  : theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Misunderstanding
              </ShimmerButton>
            </div>
            {!conclusion.primaryMotivation && (
              <p className="mt-1 text-sm text-red-400">Please select a primary motivation</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-4">
            <ShimmerButton
              type="button"
              onClick={() => setShowConclusionForm(false)}
              className={`px-4 py-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
              shimmerColor="rgba(255, 255, 255, 0.5)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
            >
              Go Back
            </ShimmerButton>
            <ShimmerButton
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`px-4 py-2 flex items-center ${
                !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              shimmerColor="rgba(255, 255, 255, 0.8)"
              shimmerSize="0.1em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={isFormValid ? 'rgb(37, 99, 235)' : theme === 'dark' ? 'rgb(75, 85, 99)' : 'rgb(209, 213, 219)'}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Submit Conclusion'
              )}
            </ShimmerButton>
          </div>
        </div>
      </form>
    );
  };
  
  // Handle parse errors
  if (parseError) {
    return (
      <ThemeProvider value={{ theme, toggleTheme }}>
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-green-900' : 'bg-gray-100'} flex items-center justify-center`}>
          <div className={`${theme === 'dark' ? 'bg-green-800 text-white' : 'bg-white text-gray-800'} p-8 rounded-lg shadow-lg max-w-md w-full`}>
            <h2 className="text-2xl font-bold mb-4">Error Loading Simulation</h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>{parseError}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={onStartNewCase}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Start New Case
              </button>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }
  
  // If no data is loaded yet, show loading
  if (!parsedData.simulationData && !parsedData.markdownData) {
    return (
      <ThemeProvider value={{ theme, toggleTheme }}>
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-green-900' : 'bg-gray-100'} flex items-center justify-center`}>
          <div className={`${theme === 'dark' ? 'bg-green-800 text-white' : 'bg-white text-gray-800'} p-8 rounded-lg shadow-lg max-w-md w-full`}>
            <h2 className="text-2xl font-bold mb-4">Loading Simulation</h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Please wait while we prepare your case...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider value={{ theme, toggleTheme }}>
      <div className={`flex h-screen ${theme === 'dark' ? 'bg-green-900' : 'bg-gray-100'}`}>
        {/* Sidebar */}
        <div className={`w-64 ${theme === 'dark' ? 'bg-green-800' : 'bg-gray-200'} flex flex-col p-4 border-r ${theme === 'dark' ? 'border-green-700' : 'border-gray-300'}`}>
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <Link href="/">
              <div className="w-24 h-24 relative cursor-pointer">
                <img 
                  src="/img.png" 
                  alt="POSH Training Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
          </div>
          
          {/* Home Button */}
          <ShimmerButton
            onClick={() => router.push('/')}
            className={`group mb-4 w-full py-2 px-4 flex items-center justify-center transition ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
            shimmerColor="rgba(255, 255, 255, 0.5)"
            shimmerSize="0.05em"
            shimmerDuration="2s"
            borderRadius="0.375rem"
            background={theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 transition ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Home
          </ShimmerButton>
          
          {/* Navigation Title */}
          <div className="mb-4">
            <TextAnimate
              className={`text-xl font-bold text-center ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}
              animation="blurInUp"
              by="word"
              duration={0.3}
            >
              POSH Investigation
            </TextAnimate>
  
            <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-600'} text-center text-sm mt-1`}>
              Training Simulation
            </p>
          </div>

          
          {/* Theme toggle button */}
          <ShimmerButton
            onClick={toggleTheme}
            className={`mb-4 w-full py-2 px-4 flex items-center justify-center transition ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
            shimmerColor="rgba(255, 255, 255, 0.5)"
            shimmerSize="0.05em"
            shimmerDuration="2s"
            borderRadius="0.375rem"
            background={theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </ShimmerButton>
          
          {/* Legal Guidance Button and Content */}
          <div className="mb-6 flex flex-col space-y-3">
            <ShimmerButton
              onClick={() => setShowLegalGuide(!showLegalGuide)}
              className={`w-full py-3 flex items-center justify-center space-x-2 shadow-md ${theme === 'dark' ? 'text-white' : 'text-green-800'}`}
              shimmerColor="rgba(255, 255, 255, 0.5)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={showLegalGuide 
                ? 'rgb(22, 163, 74)' 
                : theme === 'dark' ? 'rgba(6, 78, 59, 0.4)' : 'rgba(16, 185, 129, 0.2)'}
            >
              <div className={`h-5 w-5 flex items-center justify-center rounded-full ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-500/40'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <span className="font-medium">Legal Guidance</span>
            </ShimmerButton>
            
            {/* Legal Reference Guide Content - Shown only when legal guide toggle is active */}
            {showLegalGuide && (
              <div className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'} p-3 rounded-lg text-sm max-h-80 overflow-y-auto`}>
                <TextAnimate 
                  className="font-bold mb-2" 
                  animation="slideUp" 
                  by="word" 
                  duration={0.3}
                >
                  Legal Reference Guide
                </TextAnimate>
                <div className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} text-xs whitespace-pre-line`}>
                  {parsedData.simulationData?.legalReferenceGuide || parsedData.markdownData?.legal}
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="mt-auto space-y-3">
            <h3 className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider mb-2 px-2`}>ACTIONS</h3>
            
            <ShimmerButton
              onClick={onStartNewCase}
              className="w-full py-3 text-center font-medium shadow-md text-white"
              shimmerColor="rgba(255, 255, 255, 0.8)"
              shimmerSize="0.1em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={hasSubmitted 
                ? 'rgb(37, 99, 235)' 
                : 'rgb(5, 150, 105)'}
            >
              Start New Case
            </ShimmerButton>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {hasSubmitted ? (
            renderAnalysis()
          ) : (
            showConclusionForm ? (
              renderConclusionForm()
            ) : (
              <div className="space-y-6">
                {/* Content Display Area */}
                <div className={`${theme === 'dark' ? 'bg-green-800' : 'bg-white'} p-5 rounded-lg shadow-lg overflow-hidden`}>
                  {/* Colored header bar based on active tab */}
                  <div className={`h-1 -mx-5 -mt-5 mb-4 ${
                    activeTab === 'case' ? 'bg-blue-600' :
                    activeTab === 'complainant' ? 'bg-purple-600' :
                    activeTab === 'respondent' ? 'bg-orange-600' :
                    'bg-yellow-600'
                  }`}></div>
                  
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4 flex items-center`}>
                    {activeTab === 'case' && (
                      <>
                        <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
                        Case Overview
                      </>
                    )}
                    {activeTab === 'complainant' && (
                      <>
                        <span className="inline-block w-3 h-3 bg-purple-600 rounded-full mr-2"></span>
                        Complainant Statement
                      </>
                    )}
                    {activeTab === 'respondent' && (
                      <>
                        <span className="inline-block w-3 h-3 bg-orange-600 rounded-full mr-2"></span>
                        Respondent Statement
                      </>
                    )}
                    {activeTab === 'evidence' && (
                      <>
                        <span className="inline-block w-3 h-3 bg-yellow-600 rounded-full mr-2"></span>
                        Evidence
                      </>
                    )}
                  </h2>
                  
                  <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none`}>
                    {/* For new format */}
                    {parsedData.simulationData && (
                      <div className={`whitespace-pre-line ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {activeTab === 'case' && parsedData.simulationData.caseOverview}
                        {activeTab === 'complainant' && parsedData.simulationData.complainantStatement}
                        {activeTab === 'respondent' && parsedData.simulationData.respondentStatement}
                        {activeTab === 'evidence' && parsedData.simulationData.additionalEvidence}
                      </div>
                    )}
                    
                    {/* For old format */}
                    {parsedData.markdownData && (
                      <div className={`whitespace-pre-line ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {activeTab === 'case' && parsedData.markdownData.case}
                        {activeTab === 'evidence' && parsedData.markdownData.evidence}
                      </div>
                    )}
                  </div>
                </div>

                {/* Investigation Tools */}
                <div className={`${theme === 'dark' ? 'bg-green-800' : 'bg-white'} p-4 rounded-lg shadow-lg`}>
                  <TextAnimate
                    // className="text-xl font-bold mb-3"
                    className={`text-xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
                    animation="slideUp"
                    by="word"
                    duration={0.3}
                  >
                    Investigation Tools
                  </TextAnimate>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    {/* Case Overview Button */}
                    <ShimmerButton
                      onClick={() => handleTabChange('case')}
                      className="w-full flex items-center space-x-2"
                      shimmerColor="rgba(255, 255, 255, 0.8)"
                      shimmerSize="0.1em"
                      shimmerDuration="2s"
                      borderRadius="0.5rem"
                      background={activeTab === 'case' 
                        ? 'rgb(37, 99, 235)' 
                        : theme === 'dark' ? 'rgba(30, 58, 138, 0.4)' : 'rgba(219, 234, 254, 1)'}
                    >
                      <div className={`h-5 w-5 flex items-center justify-center rounded-full ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/40'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className={`text-sm ${activeTab === 'case' ? 'text-white' : theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>Case Overview</span>
                    </ShimmerButton>

                    {parsedData.simulationData && (
                      <>
                        {/* Complainant Button */}
                        <ShimmerButton
                          onClick={() => handleTabChange('complainant')}
                          className="w-full flex items-center space-x-2"
                          shimmerColor="rgba(255, 255, 255, 0.8)"
                          shimmerSize="0.1em"
                          shimmerDuration="2s"
                          borderRadius="0.5rem"
                          background={activeTab === 'complainant' 
                            ? 'rgb(147, 51, 234)' 
                            : theme === 'dark' ? 'rgba(88, 28, 135, 0.4)' : 'rgba(233, 213, 255, 1)'}
                        >
                          <div className={`h-5 w-5 flex items-center justify-center rounded-full ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-500/40'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className={`text-sm ${activeTab === 'complainant' ? 'text-white' : theme === 'dark' ? 'text-purple-200' : 'text-purple-800'}`}>Complainant Statement</span>
                        </ShimmerButton>

                        {/* Respondent Button */}
                        <ShimmerButton
                          onClick={() => handleTabChange('respondent')}
                          className="w-full flex items-center space-x-2"
                          shimmerColor="rgba(255, 255, 255, 0.8)"
                          shimmerSize="0.1em"
                          shimmerDuration="2s"
                          borderRadius="0.5rem"
                          background={activeTab === 'respondent' 
                            ? 'rgb(234, 88, 12)' 
                            : theme === 'dark' ? 'rgba(124, 45, 18, 0.4)' : 'rgba(254, 215, 170, 1)'}
                        >
                          <div className={`h-5 w-5 flex items-center justify-center rounded-full ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-500/40'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className={`text-sm ${activeTab === 'respondent' ? 'text-white' : theme === 'dark' ? 'text-orange-200' : 'text-orange-800'}`}>Respondent Statement</span>
                        </ShimmerButton>
                      </>
                    )}

                    {/* Evidence Button */}
                    <ShimmerButton
                      onClick={() => handleTabChange('evidence')}
                      className="w-full flex items-center space-x-2"
                      shimmerColor="rgba(255, 255, 255, 0.8)"
                      shimmerSize="0.1em"
                      shimmerDuration="2s"
                      borderRadius="0.5rem"
                      background={activeTab === 'evidence' 
                        ? 'rgb(202, 138, 4)' 
                        : theme === 'dark' ? 'rgba(113, 63, 18, 0.4)' : 'rgba(254, 240, 138, 1)'}
                    >
                      <div className={`h-5 w-5 flex items-center justify-center rounded-full ${theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-500/40'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className={`text-sm ${activeTab === 'evidence' ? 'text-white' : theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>Evidence</span>
                    </ShimmerButton>
                  </div>

                  {/* Conclude Button - Separated in its own row */}
                  {!hasSubmitted && (
                    <div className="flex justify-center">
                      <ShimmerButton
                        onClick={() => setShowConclusionForm(!showConclusionForm)}
                        className="px-6 py-2 flex items-center space-x-2 text-white"
                        shimmerColor="rgba(255, 255, 255, 0.8)"
                        shimmerSize="0.1em"
                        shimmerDuration="2s"
                        borderRadius="0.5rem"
                        background={showConclusionForm ? 'rgb(75, 85, 99)' : 'rgb(220, 38, 38)'}
                      >
                        <div className="h-5 w-5 flex items-center justify-center rounded-full bg-red-500/20">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">{showConclusionForm ? 'Go Back' : 'Submit Conclusion'}</span>
                      </ShimmerButton>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </ThemeProvider>
  );
} 