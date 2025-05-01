'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SimulationData, MarkdownSimulationData, ResponsibleParty, MisconductType, PrimaryMotivation } from '@/types/simulation';
import { SimulationConclusion } from '@/simulation';

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
  const [parsedData, setParsedData] = useState<{
    simulationData: SimulationData | null;
    markdownData: MarkdownSimulationData | null;
  }>({
    simulationData: null,
    markdownData: null
  });
  
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
      <form onSubmit={handleSubmitConclusion} className="bg-gray-800 rounded-lg shadow-lg p-6 text-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-white">Conclude Investigation</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Responsible Individual <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, responsibleParty: 'Respondent'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.responsibleParty === 'Respondent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Respondent
              </button>
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, responsibleParty: 'Complainant'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.responsibleParty === 'Complainant'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Complainant
              </button>
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, responsibleParty: 'Both Parties'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.responsibleParty === 'Both Parties'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Both Parties
              </button>
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, responsibleParty: 'Neither Party'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.responsibleParty === 'Neither Party'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Neither Party
              </button>
            </div>
            {!conclusion.responsibleParty && (
              <p className="mt-1 text-sm text-red-400">Please select a responsible party</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Nature of Misconduct <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, misconductType: 'Sexual Harassment'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.misconductType === 'Sexual Harassment'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Sexual Harassment
              </button>
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, misconductType: 'Discrimination'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.misconductType === 'Discrimination'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Discrimination
              </button>
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, misconductType: 'Retaliation'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.misconductType === 'Retaliation'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Retaliation
              </button>
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, misconductType: 'No Misconduct'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.misconductType === 'No Misconduct'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                No Misconduct
              </button>
            </div>
            {!conclusion.misconductType && (
              <p className="mt-1 text-sm text-red-400">Please select a misconduct type</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Primary Motivation <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, primaryMotivation: 'Genuine Complaint'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.primaryMotivation === 'Genuine Complaint'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Genuine Complaint
              </button>
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, primaryMotivation: 'Personal Vendetta'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.primaryMotivation === 'Personal Vendetta'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Personal Vendetta
              </button>
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, primaryMotivation: 'Career Advancement'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.primaryMotivation === 'Career Advancement'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Career Advancement
              </button>
              <button
                type="button"
                onClick={() => setConclusion({...conclusion, primaryMotivation: 'Misunderstanding'})}
                className={`p-3 rounded-lg transition ${
                  conclusion.primaryMotivation === 'Misunderstanding'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              >
                Misunderstanding
              </button>
            </div>
            {!conclusion.primaryMotivation && (
              <p className="mt-1 text-sm text-red-400">Please select a primary motivation</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowConclusionForm(false)}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            >
              Go Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`px-4 py-2 rounded-lg transition flex items-center ${
                isFormValid 
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
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
            </button>
          </div>
        </div>
      </form>
    );
  };
  
  // Handle parse errors
  if (parseError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Simulation</h2>
          <p className="text-gray-300 mb-6">{parseError}</p>
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
    );
  }
  
  // If no data is loaded yet, show loading
  if (!parsedData.simulationData && !parsedData.markdownData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-4">Loading Simulation</h2>
          <p className="text-gray-300 mb-6">Please wait while we prepare your case...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col p-4 border-r border-gray-700">
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
        <Link href="/" className="group mb-4 w-full py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Home
        </Link>
        
        {/* Navigation Title */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white text-center">POSH Investigation</h2>
          <p className="text-gray-400 text-center text-sm mt-1">Training Simulation</p>
        </div>
        
        {/* Legal Guidance Button and Content */}
        <div className="mb-6 flex flex-col space-y-3">
          <button
            onClick={() => setShowLegalGuide(!showLegalGuide)}
            className={`w-full py-3 rounded-lg transition flex items-center justify-center space-x-2 shadow-md ${
              showLegalGuide 
                ? 'bg-green-600 text-white' 
                : 'bg-green-900/40 text-green-200 hover:bg-green-900/70'
            }`}
          >
            <div className="h-5 w-5 flex items-center justify-center rounded-full bg-green-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <span className="font-medium">Legal Guidance</span>
          </button>
          
          {/* Legal Reference Guide Content - Shown only when legal guide toggle is active */}
          {showLegalGuide && (
            <div className="bg-gray-700 p-3 rounded-lg text-sm max-h-80 overflow-y-auto">
              <h3 className="text-white font-bold mb-2">Legal Reference Guide</h3>
              <div className="text-gray-200 text-xs whitespace-pre-line">
                {parsedData.simulationData?.legalReferenceGuide || parsedData.markdownData?.legal}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-auto space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">ACTIONS</h3>
          
          <button
            onClick={onStartNewCase}
            className={`w-full py-3 rounded-lg transition text-center font-medium shadow-md ${
              hasSubmitted 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            Start New Case
          </button>
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
              <div className="bg-gray-800 p-5 rounded-lg shadow-lg overflow-hidden">
                {/* Colored header bar based on active tab */}
                <div className={`h-1 -mx-5 -mt-5 mb-4 ${
                  activeTab === 'case' ? 'bg-blue-600' :
                  activeTab === 'complainant' ? 'bg-purple-600' :
                  activeTab === 'respondent' ? 'bg-orange-600' :
                  'bg-yellow-600'
                }`}></div>
                
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
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
                
                <div className="prose prose-invert max-w-none">
                  {/* For new format */}
                  {parsedData.simulationData && (
                    <div className="whitespace-pre-line">
                      {activeTab === 'case' && parsedData.simulationData.caseOverview}
                      {activeTab === 'complainant' && parsedData.simulationData.complainantStatement}
                      {activeTab === 'respondent' && parsedData.simulationData.respondentStatement}
                      {activeTab === 'evidence' && parsedData.simulationData.additionalEvidence}
                    </div>
                  )}
                  
                  {/* For old format */}
                  {parsedData.markdownData && (
                    <div className="whitespace-pre-line">
                      {activeTab === 'case' && parsedData.markdownData.case}
                      {activeTab === 'evidence' && parsedData.markdownData.evidence}
                    </div>
                  )}
                </div>
              </div>

              {/* Investigation Tools */}
              <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-3">Investigation Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  {/* Case Overview Button */}
                  <button
                    onClick={() => handleTabChange('case')}
                    className={`px-3 py-2 rounded-lg transition flex items-center space-x-2 shadow-md ${
                      activeTab === 'case' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-900/40 text-blue-200 hover:bg-blue-900/70'
                    }`}
                  >
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-blue-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm">Case Overview</span>
                  </button>

                  {parsedData.simulationData && (
                    <>
                      {/* Complainant Button */}
                      <button
                        onClick={() => handleTabChange('complainant')}
                        className={`px-3 py-2 rounded-lg transition flex items-center space-x-2 shadow-md ${
                          activeTab === 'complainant' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-purple-900/40 text-purple-200 hover:bg-purple-900/70'
                        }`}
                      >
                        <div className="h-5 w-5 flex items-center justify-center rounded-full bg-purple-500/20">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-sm">Complainant Statement</span>
                      </button>

                      {/* Respondent Button */}
                      <button
                        onClick={() => handleTabChange('respondent')}
                        className={`px-3 py-2 rounded-lg transition flex items-center space-x-2 shadow-md ${
                          activeTab === 'respondent' 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-orange-900/40 text-orange-200 hover:bg-orange-900/70'
                        }`}
                      >
                        <div className="h-5 w-5 flex items-center justify-center rounded-full bg-orange-500/20">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-sm">Respondent Statement</span>
                      </button>
                    </>
                  )}

                  {/* Evidence Button */}
                  <button
                    onClick={() => handleTabChange('evidence')}
                    className={`px-3 py-2 rounded-lg transition flex items-center space-x-2 shadow-md ${
                      activeTab === 'evidence' 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-yellow-900/40 text-yellow-200 hover:bg-yellow-900/70'
                    }`}
                  >
                    <div className="h-5 w-5 flex items-center justify-center rounded-full bg-yellow-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm">Evidence</span>
                  </button>
                </div>

                {/* Conclude Button - Separated in its own row */}
                {!hasSubmitted && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowConclusionForm(!showConclusionForm)}
                      className={`px-6 py-2 rounded-lg transition flex items-center space-x-2 shadow-md ${
                        showConclusionForm
                          ? 'bg-gray-600 text-white'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      <div className="h-5 w-5 flex items-center justify-center rounded-full bg-red-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">{showConclusionForm ? 'Go Back' : 'Submit Conclusion'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
} 