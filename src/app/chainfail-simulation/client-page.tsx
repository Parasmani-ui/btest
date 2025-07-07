'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Settings, User, Wrench, FileText, Target } from 'lucide-react';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { useGameSession, handleGameEnd } from '@/lib/gameSession';

interface ChainFailDecisions {
  rootCause: string;
  secondaryFactor: string;
  preventiveAction: string;
}

interface ChainFailSimulationClientProps {
  simulationText: string;
  onStartNewCase: () => void;
  onGameEnd: () => void;
}

interface ParsedCaseData {
  caseOverview: string;
  lineOperatorStatement: string;
  supervisorStatement: string;
  maintenanceEngineerStatement: string;
  technicalArtifact: string;
  rootCauseGuide: string;
}

export default function ChainFailSimulationClient({ simulationText, onStartNewCase, onGameEnd }: ChainFailSimulationClientProps) {
  const router = useRouter();
  const { startSession } = useGameSession();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [caseData, setCaseData] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedCaseData | null>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'operator' | 'supervisor' | 'maintenance' | 'artifact' | 'analysis' | 'final_result'>('overview');
  const [decisions, setDecisions] = useState<ChainFailDecisions>({
    rootCause: '',
    secondaryFactor: '',
    preventiveAction: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hasSubmittedFinal, setHasSubmittedFinal] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Calculate score for chainfail simulation
  const calculateChainFailScore = (analysis: string, decisions: ChainFailDecisions): number => {
    let score = 0;
    const maxScore = 100;

    // Base score for having all required decisions
    if (decisions.rootCause && decisions.preventiveAction) {
      score += 30; // 30% for completing the analysis
    }

    // Score based on analysis content quality
    if (analysis) {
      // Check for positive indicators in the analysis
      const positiveIndicators = [
        'comprehensive', 'thorough', 'excellent', 'good', 'appropriate', 
        'correct', 'accurate', 'well-identified', 'properly', 'effective'
      ];
      
      const negativeIndicators = [
        'insufficient', 'inadequate', 'poor', 'incorrect', 'missed', 
        'failed', 'incomplete', 'lacking', 'not enough', 'superficial'
      ];
      
      const analysisLower = analysis.toLowerCase();
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveIndicators.forEach(indicator => {
        if (analysisLower.includes(indicator)) {
          positiveCount++;
        }
      });
      
      negativeIndicators.forEach(indicator => {
        if (analysisLower.includes(indicator)) {
          negativeCount++;
        }
      });
      
      // Score based on positive vs negative indicators
      const indicatorScore = Math.max(0, (positiveCount - negativeCount) * 10);
      score += Math.min(40, indicatorScore); // Max 40% for analysis quality
    }

    // Score based on decision quality
    if (decisions.rootCause && decisions.rootCause.length > 20) {
      score += 15; // 15% for detailed root cause
    }
    
    if (decisions.preventiveAction && decisions.preventiveAction.length > 20) {
      score += 15; // 15% for detailed preventive action
    }

    return Math.min(maxScore, score);
  };

  // Parse JSON data if it exists
  const parseSimulationData = (text: string): ParsedCaseData | null => {
    try {
      // Try to parse as JSON first
      const jsonData = JSON.parse(text);
      return {
        caseOverview: jsonData.caseOverview || '',
        lineOperatorStatement: jsonData.lineOperatorStatement || '',
        supervisorStatement: jsonData.supervisorStatement || '',
        maintenanceEngineerStatement: jsonData.maintenanceEngineerStatement || '',
        technicalArtifact: jsonData.technicalArtifact || '',
        rootCauseGuide: jsonData.rootCauseGuide || ''
      };
    } catch (error) {
      // If not JSON, treat as plain text and try to extract sections
      const sections = extractSectionsFromText(text);
      return sections;
    }
  };

  // Extract sections from plain text
  const extractSectionsFromText = (text: string): ParsedCaseData => {
    const defaultData: ParsedCaseData = {
      caseOverview: '',
      lineOperatorStatement: '',
      supervisorStatement: '',
      maintenanceEngineerStatement: '',
      technicalArtifact: '',
      rootCauseGuide: ''
    };

    // If it's already structured text, try to split by common headers
    const lines = text.split('\n');
    let currentSection = 'caseOverview';
    let currentContent: string[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.match(/^(ACCIDENT CASE FILE|CASE OVERVIEW|INCIDENT OVERVIEW):/i)) {
        if (currentContent.length > 0) {
          defaultData[currentSection as keyof ParsedCaseData] = currentContent.join('\n');
          currentContent = [];
        }
        currentSection = 'caseOverview';
      } else if (trimmedLine.match(/^(LINE OPERATOR|OPERATOR STATEMENT):/i)) {
        if (currentContent.length > 0) {
          defaultData[currentSection as keyof ParsedCaseData] = currentContent.join('\n');
          currentContent = [];
        }
        currentSection = 'lineOperatorStatement';
      } else if (trimmedLine.match(/^(SUPERVISOR|FLOOR MANAGER).*STATEMENT:/i)) {
        if (currentContent.length > 0) {
          defaultData[currentSection as keyof ParsedCaseData] = currentContent.join('\n');
          currentContent = [];
        }
        currentSection = 'supervisorStatement';
      } else if (trimmedLine.match(/^(MAINTENANCE|ENGINEER).*STATEMENT:/i)) {
        if (currentContent.length > 0) {
          defaultData[currentSection as keyof ParsedCaseData] = currentContent.join('\n');
          currentContent = [];
        }
        currentSection = 'maintenanceEngineerStatement';
      } else if (trimmedLine.match(/^(TECHNICAL|ARTIFACT|EVIDENCE):/i)) {
        if (currentContent.length > 0) {
          defaultData[currentSection as keyof ParsedCaseData] = currentContent.join('\n');
          currentContent = [];
        }
        currentSection = 'technicalArtifact';
      } else {
        currentContent.push(line);
      }
    });

    // Add remaining content
    if (currentContent.length > 0) {
      defaultData[currentSection as keyof ParsedCaseData] = currentContent.join('\n');
    }

    // If no sections were found, put everything in case overview
    if (!defaultData.caseOverview && !defaultData.lineOperatorStatement && !defaultData.supervisorStatement) {
      defaultData.caseOverview = text;
    }

    return defaultData;
  };

  // Initialize with the passed simulation text
  useEffect(() => {
    if (simulationText) {
      setCaseData(simulationText);
      const parsed = parseSimulationData(simulationText);
      setParsedData(parsed);
      
      // Start game session tracking
      if (!sessionStarted) {
        startSession('chainfail').then(() => {
          console.log('✅ Chainfail simulation session started');
          setSessionStarted(true);
        }).catch(error => {
          console.error('❌ Error starting chainfail session:', error);
        });
      }
    }
  }, [simulationText, startSession, sessionStarted]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const analyzeCase = async (analysisType: string) => {
    if (analysisType !== 'final_judgment' && analysisType !== 'review_operator' && analysisType !== 'review_supervisor' && analysisType !== 'review_maintenance' && analysisType !== 'analyze_artifact') {
      return;
    }

    setIsAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('/api/chainfail-simulation/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseData,
          userDecisions: decisions,
          analysisType
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        if (analysisType === 'final_judgment') {
          setCurrentView('final_result');
          setHasSubmittedFinal(true);
          
          // Calculate score based on analysis and decisions
          const totalScore = calculateChainFailScore(data.analysis, decisions);
          const caseSolved = totalScore >= 70; // Consider case solved if score >= 70%
          
          // Update user stats when game ends
          try {
            await handleGameEnd(caseSolved, totalScore);
            console.log('✅ Chainfail simulation stats updated successfully');
          } catch (error) {
            console.error('❌ Error updating chainfail simulation stats:', error);
          }
          
          onGameEnd();
        }
      } else {
        throw new Error(data.error || 'Failed to analyze case');
      }
    } catch (error) {
      console.error('Error analyzing case:', error);
      setError('Failed to analyze case. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDecisionChange = (field: keyof ChainFailDecisions, value: string) => {
    setDecisions(prev => ({ ...prev, [field]: value }));
  };

  const canMakeFinalAnalysis = () => {
    return decisions.rootCause && decisions.preventiveAction;
  };

  const formatContent = (content: string) => {
    if (!content) return <p className="text-gray-500 italic">No information available for this section.</p>;
    
    // First, let's properly break the content at key sections
    let processedContent = content
      .replace(/\*\*/g, '') // Remove ** bold markdown
      .replace(/\*/g, '') // Remove * asterisks
      .replace(/##/g, '') // Remove ## headers
      .replace(/#/g, '') // Remove # headers
      .replace(/\[Button:\s*[^\]]*\]/g, '') // Remove button descriptions
      .trim();

    // Add line breaks before major sections if they're missing
    processedContent = processedContent
      .replace(/(ACCIDENT CASE FILE|INVOLVED INDIVIDUALS|INCIDENT OVERVIEW|INVESTIGATION REPORT|STATEMENTS|TECHNICAL ARTIFACT|CASE OVERVIEW):/g, '\n\n$1:')
      .replace(/- (Injured Operator|Maintenance Lead|Supervisor|Line Operator):/g, '\n- $1:')
      .replace(/\. ([A-Z][a-z]+ [A-Z][a-z]+,)/g, '. \n- $1') // Break at person names
      .replace(/\. (On [A-Z][a-z]+ \d+|The incident|Weather|The press|Witnesses|Confusion|Maria had|Emily Zhang|Devon Harris|The production)/g, '. \n\n$1') // Break at key sentences
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive line breaks
      .trim();

    return processedContent.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) return null; // Skip empty lines
      
      // Handle major section headers
      if (trimmedLine.match(/^(ACCIDENT CASE FILE|INVOLVED INDIVIDUALS|INCIDENT OVERVIEW|INVESTIGATION REPORT|STATEMENTS|TECHNICAL ARTIFACT|CASE OVERVIEW):/)) {
        const parts = trimmedLine.split(':');
        const sectionName = parts[0];
        const headerText = parts.slice(1).join(':').trim();
        return (
          <div key={index} className="mb-4 mt-6">
            <h3 className="font-bold text-xl text-purple-400 mb-2 border-b border-purple-600 pb-1">{sectionName}</h3>
            {headerText && <p className="mb-2 font-medium text-purple-200">{headerText}</p>}
          </div>
        );
      }
      
      // Handle person listings (like "- Injured Operator: Maria Lopez")
      if (trimmedLine.match(/^-\s*(Injured Operator|Maintenance Lead|Supervisor|Line Operator):/)) {
        return (
          <div key={index} className="ml-4 mb-2 p-2 bg-purple-900/30 rounded border-l-2 border-purple-500">
            <p className="font-medium text-purple-300">{trimmedLine.replace(/^-\s*/, '')}</p>
          </div>
        );
      }
      
      // Handle regular list items
      if (trimmedLine.startsWith('-') || trimmedLine.match(/^\d+\./)) {
        return <p key={index} className="ml-4 mb-2 leading-relaxed">{trimmedLine}</p>;
      }
      
      // Handle sentences that start with key time/event indicators
      if (trimmedLine.match(/^(On [A-Z][a-z]+ \d+|The incident|Weather|The press|Witnesses|Confusion|Maria had|Emily Zhang|Devon Harris|The production)/)) {
        return <p key={index} className="mb-3 leading-relaxed text-gray-200">{trimmedLine}</p>;
      }
      
      // Regular paragraphs
      return <p key={index} className="mb-2 leading-relaxed">{trimmedLine}</p>;
    }).filter(Boolean); // Remove null entries
  };

  const formatAnalysisContent = (content: string) => {
    if (!content) return '';
    
    // Clean analysis content
    let cleanedContent = content
      .replace(/\*\*/g, '') // Remove ** bold markdown
      .replace(/\*/g, '') // Remove * asterisks
      .replace(/##/g, '') // Remove ## headers
      .replace(/#/g, '') // Remove # headers
      .replace(/^\s*[-\*\+]\s*/gm, '• ') // Convert list markers to bullets
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive line breaks
      .replace(/\n\s*\n/g, '\n') // Convert double line breaks to single
      .replace(/\[Button:\s*[^\]]*\]/g, '') // Remove button descriptions
      .replace(/\n\s+/g, '\n') // Remove spaces after line breaks
      .replace(/\s+\n/g, '\n') // Remove spaces before line breaks
      .replace(/\n+/g, '\n') // Collapse multiple line breaks
      .trim();
    
    return cleanedContent.split('\n').filter(line => line.trim() !== '').map((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle analysis section headers
      if (trimmedLine.match(/^(ANALYSIS|EVALUATION|SCORE|FEEDBACK|PERFORMANCE|RESULTS?|ROOT CAUSE):/i)) {
        const headerText = trimmedLine.replace(/^[A-Za-z\s]+:/, '').trim();
        const sectionName = trimmedLine.split(':')[0];
        return (
          <div key={index} className="mb-3">
            <h4 className="font-semibold text-lg text-green-400 mb-1">{sectionName}</h4>
            {headerText && <p className="mb-1">{headerText}</p>}
          </div>
        );
      }
      
      // Handle numbered items and bullets
      if (trimmedLine.startsWith('•') || trimmedLine.match(/^\d+\./)) {
        return <p key={index} className="ml-4 mb-1 leading-normal">{trimmedLine}</p>;
      }
      
      // Score lines
      if (trimmedLine.match(/score|rating|points/i)) {
        return <p key={index} className="mb-1 font-medium text-purple-300">{trimmedLine}</p>;
      }
      
      // Regular paragraphs
      return <p key={index} className="mb-2 leading-normal">{trimmedLine}</p>;
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return (
          <div>
            <TextAnimate
              className="text-2xl font-bold mb-4 text-purple-400"
              animation="slideUp"
              by="word"
              duration={0.3}
            >
              Investigation Overview
            </TextAnimate>
            <div className={`${theme === 'dark' ? 'bg-purple-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
              {formatContent(parsedData?.caseOverview || '')}
            </div>
          </div>
        );
      case 'operator':
        return (
          <div>
            <TextAnimate
              className="text-2xl font-bold mb-4 text-purple-400"
              animation="slideUp"
              by="word"
              duration={0.3}
            >
              Line Operator Statement
            </TextAnimate>
            <div className={`${theme === 'dark' ? 'bg-purple-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
              {formatContent(parsedData?.lineOperatorStatement || '')}
            </div>
          </div>
        );
      case 'supervisor':
        return (
          <div>
            <TextAnimate
              className="text-2xl font-bold mb-4 text-purple-400"
              animation="slideUp"
              by="word"
              duration={0.3}
            >
              Supervisor Statement
            </TextAnimate>
            <div className={`${theme === 'dark' ? 'bg-purple-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
              {formatContent(parsedData?.supervisorStatement || '')}
            </div>
          </div>
        );
      case 'maintenance':
        return (
          <div>
            <TextAnimate
              className="text-2xl font-bold mb-4 text-purple-400"
              animation="slideUp"
              by="word"
              duration={0.3}
            >
              Maintenance Engineer Statement
            </TextAnimate>
            <div className={`${theme === 'dark' ? 'bg-purple-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
              {formatContent(parsedData?.maintenanceEngineerStatement || '')}
            </div>
          </div>
        );
      case 'artifact':
        return (
          <div>
            <TextAnimate
              className="text-2xl font-bold mb-4 text-purple-400"
              animation="slideUp"
              by="word"
              duration={0.3}
            >
              Technical Artifact
            </TextAnimate>
            <div className={`${theme === 'dark' ? 'bg-purple-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
              {formatContent(parsedData?.technicalArtifact || '')}
            </div>
          </div>
        );
      case 'analysis':
        return (
          <div>
            <TextAnimate
              className="text-2xl font-bold mb-4 text-purple-400"
              animation="slideUp"
              by="word"
              duration={0.3}
            >
              Root Cause Assessment
            </TextAnimate>
            
            <div className={`${theme === 'dark' ? 'bg-purple-800' : 'bg-white'} p-6 rounded-lg shadow-lg space-y-8`}>
              {/* Assessment Instructions */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50'} border border-purple-200`}>
                <h3 className="font-semibold text-lg mb-2 text-purple-400">Assessment Instructions</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-purple-200' : 'text-purple-800'}`}>
                  Based on your review of all evidence, statements, and technical artifacts, determine the primary root cause of this industrial accident. 
                  Consider the chain of events and identify what could have prevented this incident.
                </p>
              </div>

              {/* Root Cause Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Primary Root Cause <span className="text-red-500">*</span>
                </h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select the main underlying cause that led to this accident:
                </p>
                <div className="space-y-3">
                  {[
                    { 
                      value: 'Human Error', 
                      description: 'Operator mistake, procedure violation, or human oversight' 
                    },
                    { 
                      value: 'Equipment Failure', 
                      description: 'Mechanical malfunction, system breakdown, or component failure' 
                    },
                    { 
                      value: 'SOP Deviation', 
                      description: 'Inadequate procedures, unclear instructions, or systemic issues' 
                    }
                  ].map((cause) => (
                    <label 
                      key={cause.value} 
                      className={`flex flex-col p-3 rounded-lg border cursor-pointer transition ${
                        decisions.rootCause === cause.value 
                          ? 'border-purple-500 bg-purple-500/10' 
                          : theme === 'dark' 
                            ? 'border-gray-600 hover:border-gray-500' 
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="rootCause"
                          value={cause.value}
                          checked={decisions.rootCause === cause.value}
                          onChange={(e) => handleDecisionChange('rootCause', e.target.value)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <span className="font-medium">{cause.value}</span>
                          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {cause.description}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Secondary Factor */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Secondary Contributing Factor <span className="text-gray-500">(Optional)</span>
                </h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select any additional factors that may have contributed to the incident:
                </p>
                <select
                  value={decisions.secondaryFactor}
                  onChange={(e) => handleDecisionChange('secondaryFactor', e.target.value)}
                  className={`w-full p-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                >
                  <option value="">Select a contributing factor (optional)</option>
                  <optgroup label="Human Factors">
                    <option value="Fatigue">Worker Fatigue</option>
                    <option value="Inadequate Training">Inadequate Training</option>
                    <option value="Stress">Work Stress/Pressure</option>
                    <option value="Distraction">Distraction/Inattention</option>
                    <option value="Complacency">Overconfidence/Complacency</option>
                  </optgroup>
                  <optgroup label="Communication Issues">
                    <option value="Miscommunication">Miscommunication</option>
                    <option value="Language Barrier">Language Barrier</option>
                    <option value="Lack of Information">Lack of Information</option>
                    <option value="Poor Handover">Poor Shift Handover</option>
                  </optgroup>
                  <optgroup label="Equipment Issues">
                    <option value="Poor Maintenance">Poor Maintenance</option>
                    <option value="Design Flaw">Equipment Design Flaw</option>
                    <option value="Tool Malfunction">Tool Malfunction</option>
                    <option value="Sensor Failure">Sensor/Warning System Failure</option>
                    <option value="Age of Equipment">Equipment Age/Wear</option>
                  </optgroup>
                  <optgroup label="Environmental Factors">
                    <option value="Poor Lighting">Poor Lighting</option>
                    <option value="Noise">Excessive Noise</option>
                    <option value="Weather">Weather Conditions</option>
                    <option value="Temperature">Temperature Extremes</option>
                    <option value="Workspace Layout">Poor Workspace Layout</option>
                  </optgroup>
                  <optgroup label="Organizational Issues">
                    <option value="Time Pressure">Time Pressure</option>
                    <option value="Inadequate Staffing">Inadequate Staffing</option>
                    <option value="Poor Safety Culture">Poor Safety Culture</option>
                    <option value="Inadequate Supervision">Inadequate Supervision</option>
                    <option value="Cost Cutting">Cost-Cutting Measures</option>
                  </optgroup>
                </select>
              </div>

              {/* Preventive Action */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Preventive Action Recommendation <span className="text-red-500">*</span>
                </h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Choose the most appropriate preventive measure to prevent similar incidents:
                </p>
                <div className="space-y-3">
                  {[
                    { 
                      value: 'Training', 
                      description: 'Enhanced worker training, skill development, or safety education programs' 
                    },
                    { 
                      value: 'Equipment Overhaul', 
                      description: 'Equipment replacement, upgrade, or comprehensive maintenance program' 
                    },
                    { 
                      value: 'SOP Revision', 
                      description: 'Update procedures, improve safety protocols, or enhance documentation' 
                    }
                  ].map((action) => (
                    <label 
                      key={action.value} 
                      className={`flex flex-col p-3 rounded-lg border cursor-pointer transition ${
                        decisions.preventiveAction === action.value 
                          ? 'border-purple-500 bg-purple-500/10' 
                          : theme === 'dark' 
                            ? 'border-gray-600 hover:border-gray-500' 
                            : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="preventiveAction"
                          value={action.value}
                          checked={decisions.preventiveAction === action.value}
                          onChange={(e) => handleDecisionChange('preventiveAction', e.target.value)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <span className="font-medium">{action.value}</span>
                          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assessment Status */}
              {!canMakeFinalAnalysis() && (
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50'} border border-yellow-200`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    ⚠️ Please select both Primary Root Cause and Preventive Action to submit your assessment.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <ShimmerButton
                  onClick={() => analyzeCase('final_judgment')}
                  disabled={!canMakeFinalAnalysis() || isAnalyzing || hasSubmittedFinal}
                  className="px-8 py-4 text-white text-lg font-semibold"
                  shimmerColor="rgba(255, 255, 255, 0.8)"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background={canMakeFinalAnalysis() && !hasSubmittedFinal ? "rgb(168, 85, 247)" : "rgb(107, 114, 128)"}
                >
                  {isAnalyzing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Analyzing Investigation...
                    </div>
                  ) : hasSubmittedFinal ? (
                    <div className="flex items-center">
                      <span className="mr-2">✅</span>
                      Assessment Complete
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="mr-2">📋</span>
                      Submit Final Assessment
                    </div>
                  )}
                </ShimmerButton>
              </div>
            </div>
          </div>
        );
      case 'final_result':
        return (
          <div>
            <TextAnimate
              className="text-2xl font-bold mb-4"
              animation="slideUp"
              by="word"
              duration={0.3}
            >
              Investigation Results
            </TextAnimate>
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
              {formatAnalysisContent(analysis)}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-purple-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <div className={`${theme === 'dark' ? 'bg-purple-800' : 'bg-white'} border-b ${theme === 'dark' ? 'border-purple-700' : 'border-gray-200'} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShimmerButton
              onClick={() => router.push('/')}
              className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
              shimmerColor="rgba(255, 255, 255, 0.5)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={theme === 'dark' ? 'rgb(147, 51, 234)' : 'rgb(229, 231, 235)'}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Exit Investigation
            </ShimmerButton>
            
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-purple-500" />
              <SparklesText 
                className="text-xl font-bold"
                colors={{ first: "#a855f7", second: "#c084fc" }}
                sparklesCount={5}
              >
                GAMECHAIN - Critical ChainFail Training
              </SparklesText>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ShimmerButton
              onClick={toggleTheme}
              className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
              shimmerColor="rgba(255, 255, 255, 0.5)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={theme === 'dark' ? 'rgb(147, 51, 234)' : 'rgb(229, 231, 235)'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </ShimmerButton>
            
            <ShimmerButton
              onClick={onStartNewCase}
              className="text-white"
              shimmerColor="rgba(255, 255, 255, 0.8)"
              shimmerSize="0.1em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background="rgb(168, 85, 247)"
            >
              New Investigation
            </ShimmerButton>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className={`w-64 ${theme === 'dark' ? 'bg-purple-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-purple-700' : 'border-gray-200'} p-4`}>
          <TextAnimate
            className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            animation="slideUp"
            by="word"
            duration={0.3}
          >
            Investigation Tools
          </TextAnimate>
          
          <div className="space-y-2">
            <ShimmerButton
              onClick={() => setCurrentView('overview')}
              className={`w-full p-3 text-left transition ${
                currentView === 'overview' 
                  ? `${theme === 'dark' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'}` 
                  : `${theme === 'dark' ? 'text-purple-200 hover:bg-purple-700' : 'text-gray-700 hover:bg-gray-300'}`
              }`}
              shimmerColor="rgba(255, 255, 255, 0.3)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={currentView === 'overview' 
                ? (theme === 'dark' ? 'rgb(126, 34, 206)' : 'rgb(243, 232, 255)') 
                : (theme === 'dark' ? 'rgb(147, 51, 234)' : 'rgb(229, 231, 235)')}
            >
              <FileText className="h-4 w-4 mr-2 inline" />
              Case Overview
            </ShimmerButton>

            <ShimmerButton
              onClick={() => setCurrentView('operator')}
              className={`w-full p-3 text-left transition ${
                currentView === 'operator' 
                  ? `${theme === 'dark' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'}` 
                  : `${theme === 'dark' ? 'text-purple-200 hover:bg-purple-700' : 'text-gray-700 hover:bg-gray-300'}`
              }`}
              shimmerColor="rgba(255, 255, 255, 0.3)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={currentView === 'operator' 
                ? (theme === 'dark' ? 'rgb(126, 34, 206)' : 'rgb(243, 232, 255)') 
                : (theme === 'dark' ? 'rgb(147, 51, 234)' : 'rgb(229, 231, 235)')}
            >
              <User className="h-4 w-4 mr-2 inline" />
              Operator Statement
            </ShimmerButton>

            <ShimmerButton
              onClick={() => setCurrentView('supervisor')}
              className={`w-full p-3 text-left transition ${
                currentView === 'supervisor' 
                  ? `${theme === 'dark' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'}` 
                  : `${theme === 'dark' ? 'text-purple-200 hover:bg-purple-700' : 'text-gray-700 hover:bg-gray-300'}`
              }`}
              shimmerColor="rgba(255, 255, 255, 0.3)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={currentView === 'supervisor' 
                ? (theme === 'dark' ? 'rgb(126, 34, 206)' : 'rgb(243, 232, 255)') 
                : (theme === 'dark' ? 'rgb(147, 51, 234)' : 'rgb(229, 231, 235)')}
            >
              <User className="h-4 w-4 mr-2 inline" />
              Supervisor Statement
            </ShimmerButton>

            <ShimmerButton
              onClick={() => setCurrentView('maintenance')}
              className={`w-full p-3 text-left transition ${
                currentView === 'maintenance' 
                  ? `${theme === 'dark' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'}` 
                  : `${theme === 'dark' ? 'text-purple-200 hover:bg-purple-700' : 'text-gray-700 hover:bg-gray-300'}`
              }`}
              shimmerColor="rgba(255, 255, 255, 0.3)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={currentView === 'maintenance' 
                ? (theme === 'dark' ? 'rgb(126, 34, 206)' : 'rgb(243, 232, 255)') 
                : (theme === 'dark' ? 'rgb(147, 51, 234)' : 'rgb(229, 231, 235)')}
            >
              <Wrench className="h-4 w-4 mr-2 inline" />
              Maintenance Report
            </ShimmerButton>

            <ShimmerButton
              onClick={() => setCurrentView('artifact')}
              className={`w-full p-3 text-left transition ${
                currentView === 'artifact' 
                  ? `${theme === 'dark' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'}` 
                  : `${theme === 'dark' ? 'text-purple-200 hover:bg-purple-700' : 'text-gray-700 hover:bg-gray-300'}`
              }`}
              shimmerColor="rgba(255, 255, 255, 0.3)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={currentView === 'artifact' 
                ? (theme === 'dark' ? 'rgb(126, 34, 206)' : 'rgb(243, 232, 255)') 
                : (theme === 'dark' ? 'rgb(147, 51, 234)' : 'rgb(229, 231, 235)')}
            >
              <FileText className="h-4 w-4 mr-2 inline" />
              Technical Artifact
            </ShimmerButton>

            <ShimmerButton
              onClick={() => setCurrentView('analysis')}
              className={`w-full p-3 text-left transition ${
                currentView === 'analysis' 
                  ? `${theme === 'dark' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'}` 
                  : `${theme === 'dark' ? 'text-purple-200 hover:bg-purple-700' : 'text-gray-700 hover:bg-gray-300'}`
              }`}
              shimmerColor="rgba(255, 255, 255, 0.3)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={currentView === 'analysis' 
                ? (theme === 'dark' ? 'rgb(126, 34, 206)' : 'rgb(243, 232, 255)') 
                : (theme === 'dark' ? 'rgb(147, 51, 234)' : 'rgb(229, 231, 235)')}
            >
              <Target className="h-4 w-4 mr-2 inline" />
              Final Assessment
            </ShimmerButton>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 