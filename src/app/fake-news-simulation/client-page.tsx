'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, AlertTriangle, Eye, Users, FileText, Target } from 'lucide-react';

import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';
import { SparklesText } from '@/components/magicui/sparkles-text';
import GameHeader from '@/components/ui/GameHeader';
import { useGameSession, handleGameEnd } from '@/lib/gameSession';

interface FakeNewsDecisions {
  postFactuality: string;
  keyAmplifier: string;
  criticalEvidence: string;
  consequenceSeverity: string;
}

interface FakeNewsSimulationClientProps {
  simulationText: string;
  onStartNewCase: () => void;
  onGameEnd: () => void;
  onSessionStart?: (startTime: Date) => void;
  onSessionEnd?: (endTime: Date, elapsedTime: string) => void;
}

export default function FakeNewsSimulationClient({ simulationText, onStartNewCase, onGameEnd, onSessionStart, onSessionEnd }: FakeNewsSimulationClientProps) {
  const router = useRouter();
  const { startSession } = useGameSession();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [caseData, setCaseData] = useState<string>('');
  const [currentView, setCurrentView] = useState<'overview' | 'timeline' | 'evidence' | 'individuals' | 'analysis' | 'final_result'>('overview');
  const [decisions, setDecisions] = useState<FakeNewsDecisions>({
    postFactuality: '',
    keyAmplifier: '',
    criticalEvidence: '',
    consequenceSeverity: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hasSubmittedFinal, setHasSubmittedFinal] = useState(false);
  const [loadedAnalysisType, setLoadedAnalysisType] = useState<string>('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [finalElapsedTime, setFinalElapsedTime] = useState<string>('');

  // Initialize with the passed simulation text
  useEffect(() => {
    if (simulationText) {
      setCaseData(simulationText);
      
      // Start game session tracking when case is loaded and ready
      if (!sessionStarted) {
        const startTime = new Date();
        startSession('fake-news').then(() => {
          setSessionStartTime(startTime);
          setSessionStarted(true);
          onSessionStart?.(startTime); // Notify parent of session start
          console.log('✅ Fake news simulation session started when case loaded');
        }).catch(error => {
          console.error('❌ Error starting fake news session:', error);
        });
      }
    }
  }, [simulationText, startSession, sessionStarted, onSessionStart]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const analyzeCase = async (analysisType: string) => {
    if (analysisType !== 'final_judgment' && analysisType !== 'view_timeline' && analysisType !== 'examine_evidence' && analysisType !== 'profile_individuals') {
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysis(''); // Clear previous analysis
    
    try {
      const response = await fetch('/api/fake-news-simulation/analyze', {
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
          
          // Calculate score based on analysis and decisions
          const totalScore = calculateFakeNewsScore(data.analysis, decisions);
          const caseSolved = totalScore >= 70; // Consider case solved if score >= 70%
          
          // Update user stats when game ends
          try {
            await handleGameEnd(caseSolved, totalScore);
            console.log('✅ Fake news simulation stats updated successfully');
          } catch (error) {
            console.error('❌ Error updating fake news simulation stats:', error);
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

  const handleDecisionChange = (field: keyof FakeNewsDecisions, value: string) => {
    setDecisions(prev => ({ ...prev, [field]: value }));
  };

  const canMakeFinalAnalysis = () => {
    return decisions.postFactuality && decisions.keyAmplifier && decisions.criticalEvidence && decisions.consequenceSeverity;
  };

  const formatCaseContent = (content: string) => {
    if (!content) return '';
    
    // More aggressive content cleaning
    let cleanedContent = content
      .replace(/\*\*/g, '') // Remove ** bold markdown
      .replace(/\*/g, '') // Remove * asterisks
      .replace(/##/g, '') // Remove ## headers
      .replace(/#/g, '') // Remove # headers
      .replace(/\[Button:\s*[^\]]*\]/g, '') // Remove button descriptions
      .replace(/^\s*[-\*\+]\s*/gm, '• ') // Convert list markers to bullets
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive line breaks (3 or more)
      .replace(/\n\s*\n/g, '\n') // Convert double line breaks to single
      .replace(/\n\s+/g, '\n') // Remove spaces after line breaks
      .replace(/\s+\n/g, '\n') // Remove spaces before line breaks
      .replace(/\n+/g, '\n') // Collapse multiple line breaks
      .trim();
    
    return cleanedContent.split('\n').filter(line => line.trim() !== '').map((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle section headers
      if (trimmedLine.match(/^(CASE TITLE|VIRAL POST|CHAIN TIMELINE|KEY INDIVIDUALS|EVIDENCE|CRISIS OUTCOME|OBJECTIVE):/)) {
        const headerText = trimmedLine.replace(/^[A-Z\s]+:/, '').trim();
        const sectionName = trimmedLine.split(':')[0];
        return (
          <div key={index} className="mb-3">
            <h3 className="font-bold text-lg text-orange-400 mb-1">{sectionName}</h3>
            {headerText && <p className="mb-1">{headerText}</p>}
          </div>
        );
      }
      
      // Handle list items
      if (trimmedLine.startsWith('•') || trimmedLine.match(/^\d+\./)) {
        return <p key={index} className="ml-4 mb-1 leading-normal">{trimmedLine}</p>;
      }
      
      // Regular paragraphs
      return <p key={index} className="mb-2 leading-normal">{trimmedLine}</p>;
    });
  };

  const formatAnalysisContent = (content: string) => {
    if (!content) return '';
    
    // More aggressive analysis content cleaning
    let cleanedContent = content
      .replace(/\*\*/g, '') // Remove ** bold markdown
      .replace(/\*/g, '') // Remove * asterisks
      .replace(/##/g, '') // Remove ## headers
      .replace(/#/g, '') // Remove # headers
      .replace(/^\s*[-\*\+]\s*/gm, '• ') // Convert list markers to bullets
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive line breaks (3 or more)
      .replace(/\n\s*\n/g, '\n') // Convert double line breaks to single
      .replace(/\[Button:\s*[^\]]*\]/g, '') // Remove button descriptions
      .replace(/\n\s+/g, '\n') // Remove spaces after line breaks
      .replace(/\s+\n/g, '\n') // Remove spaces before line breaks
      .replace(/\n+/g, '\n') // Collapse multiple line breaks
      .trim();
    
    return cleanedContent.split('\n').filter(line => line.trim() !== '').map((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle analysis section headers
      if (trimmedLine.match(/^(ANALYSIS|EVALUATION|SCORE|FEEDBACK|PERFORMANCE|RESULTS?):/i)) {
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
        return <p key={index} className="mb-1 font-medium text-orange-300">{trimmedLine}</p>;
      }
      
      // Regular paragraphs
      return <p key={index} className="mb-2 leading-normal">{trimmedLine}</p>;
    });
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="mb-4 p-4 bg-red-600 text-white rounded">
          {error}
        </div>
      );
    }

    if (isAnalyzing) {
      return (
        <div className="mb-4 p-4 bg-orange-600 text-white rounded flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
          Analyzing case data...
        </div>
      );
    }

    switch (currentView) {
      case 'overview':
        return (
          <div className="space-y-4">
            <TextAnimate
              className="text-2xl font-bold text-orange-400"
              animation="blurInUp"
              by="word"
              duration={0.3}
            >
              📱 Case Overview
            </TextAnimate>
            <div className={`${theme === 'dark' ? 'bg-orange-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
              <div className="prose prose-invert max-w-none">
                {formatCaseContent(caseData)}
              </div>
            </div>
          </div>
        );
      case 'timeline':
      case 'evidence':
      case 'individuals':
        return (
          <div className="space-y-4">
            <TextAnimate
              className="text-2xl font-bold text-orange-400"
              animation="blurInUp"
              by="word"
              duration={0.3}
            >
              {currentView === 'timeline' ? '⏱️ Timeline Analysis' : 
               currentView === 'evidence' ? '🔍 Evidence Examination' : 
               '👥 Individual Profiles'}
            </TextAnimate>
            <div className={`${theme === 'dark' ? 'bg-orange-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
              {analysis ? (
                <div className="prose prose-invert max-w-none">
                  {formatAnalysisContent(analysis)}
                </div>
              ) : (
                <p>Loading analysis...</p>
              )}
            </div>
          </div>
        );
      case 'analysis':
        return (
          <div className="space-y-6">
            <TextAnimate
              className="text-2xl font-bold text-orange-400"
              animation="blurInUp"
              by="word"
              duration={0.3}
            >
              🎯 Make Final Analysis
            </TextAnimate>
            
            <div className={`${theme === 'dark' ? 'bg-orange-800' : 'bg-white'} rounded-lg p-6 space-y-8 shadow-lg`}>
              {/* Helper Text */}
              <div className={`${theme === 'dark' ? 'bg-orange-700' : 'bg-blue-50'} p-4 rounded-lg border-l-4 border-orange-500`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  💡 <strong>Tip:</strong> Review the evidence and timeline carefully before making your decisions. Each choice affects your final score.
                </p>
              </div>

              {/* Post Factuality */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="mr-2">📝</span>
                    How would you classify the original post?
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    Consider the accuracy and intent behind the original viral content.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'FACTUAL', label: 'Factual', desc: 'Content is accurate and truthful' },
                    { value: 'MISLEADING', label: 'Misleading', desc: 'Contains partial truths but distorts reality' },
                    { value: 'MALICIOUS', label: 'Malicious', desc: 'Deliberately false and harmful' }
                  ].map((option) => (
                    <label key={option.value} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      decisions.postFactuality === option.value 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                        : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="postFactuality"
                        value={option.value}
                        checked={decisions.postFactuality === option.value}
                        onChange={(e) => handleDecisionChange('postFactuality', e.target.value)}
                        className="w-5 h-5 mt-0.5 text-orange-500"
                      />
                      <div>
                        <span className="font-medium">{option.label}</span>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Key Amplifier */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="mr-2">👤</span>
                    Who was the key amplifier of this misinformation?
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    Select the individual who played the most significant role in spreading the content.
                  </p>
                </div>
                <select
                  value={decisions.keyAmplifier}
                  onChange={(e) => handleDecisionChange('keyAmplifier', e.target.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    decisions.keyAmplifier 
                      ? 'border-orange-500' 
                      : theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                  } focus:border-orange-500 focus:outline-none`}
                >
                  <option value="">Choose the key amplifier...</option>
                  <option value="primary_influencer">Primary Influencer (with large following)</option>
                  <option value="celebrity_figure">Celebrity or Public Figure</option>
                  <option value="news_outlet">News Outlet or Media Organization</option>
                  <option value="political_figure">Political Figure or Official</option>
                  <option value="community_leader">Community Leader or Activist</option>
                  <option value="anonymous_account">Anonymous Account with Bot Network</option>
                  <option value="expert_figure">Expert or Authority Figure</option>
                  <option value="original_poster">Original Poster (if viral)</option>
                  <option value="whistleblower">Whistleblower or Insider Source</option>
                  <option value="multiple_accounts">Multiple Coordinated Accounts</option>
                </select>
                {decisions.keyAmplifier && (
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'} text-sm`}>
                    ✓ Selection made: {decisions.keyAmplifier.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                )}
              </div>

              {/* Critical Evidence */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="mr-2">🔍</span>
                    What was the most critical piece of evidence?
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    Identify the evidence that was most crucial in understanding or resolving the case.
                  </p>
                </div>
                <select
                  value={decisions.criticalEvidence}
                  onChange={(e) => handleDecisionChange('criticalEvidence', e.target.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    decisions.criticalEvidence 
                      ? 'border-orange-500' 
                      : theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                  } focus:border-orange-500 focus:outline-none`}
                >
                  <option value="">Select the most critical evidence...</option>
                  <option value="screenshot_dm">Screenshot of Direct Messages</option>
                  <option value="metadata_analysis">Social Media Metadata Analysis</option>
                  <option value="timeline_timestamps">Timeline and Timestamp Data</option>
                  <option value="video_evidence">Video or Audio Evidence</option>
                  <option value="witness_testimony">Witness Testimony or Statements</option>
                  <option value="financial_records">Financial Records or Transactions</option>
                  <option value="technical_forensics">Technical/Digital Forensic Evidence</option>
                  <option value="contradictory_posts">Contradictory Social Media Posts</option>
                  <option value="leaked_documents">Leaked Documents or Communications</option>
                  <option value="expert_analysis">Expert or Professional Analysis</option>
                  <option value="bot_activity">Automated Bot Activity Evidence</option>
                  <option value="geolocation_data">Geolocation or IP Address Data</option>
                </select>
                {decisions.criticalEvidence && (
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'} text-sm`}>
                    ✓ Evidence selected: {decisions.criticalEvidence.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                )}
              </div>

              {/* Consequence Severity */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="mr-2">⚠️</span>
                    How severe were the final consequences?
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    Assess the overall impact and harm caused by the misinformation campaign.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'Minor', label: 'Minor Impact', desc: 'Limited harm, easily corrected', icon: '🟢' },
                    { value: 'Major', label: 'Major Impact', desc: 'Significant harm to individuals or groups', icon: '🟡' },
                    { value: 'Catastrophic', label: 'Catastrophic Impact', desc: 'Severe, long-lasting damage or loss of life', icon: '🔴' }
                  ].map((option) => (
                    <label key={option.value} className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      decisions.consequenceSeverity === option.value 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                        : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="consequenceSeverity"
                        value={option.value}
                        checked={decisions.consequenceSeverity === option.value}
                        onChange={(e) => handleDecisionChange('consequenceSeverity', e.target.value)}
                        className="w-5 h-5 mt-0.5 text-orange-500"
                      />
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{option.icon}</span>
                        <div>
                          <span className="font-medium">{option.label}</span>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{option.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Progress Indicator */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-orange-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Analysis Progress</span>
                  <span className="text-sm">{Object.values(decisions).filter(Boolean).length}/4 Complete</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(Object.values(decisions).filter(Boolean).length / 4) * 100}%` }}
                  ></div>
                </div>
              </div>

              <ShimmerButton
                onClick={() => analyzeCase('final_judgment')}
                disabled={!canMakeFinalAnalysis() || isAnalyzing}
                className={`w-full py-4 px-6 font-semibold text-lg transition-all ${
                  canMakeFinalAnalysis() && !isAnalyzing ? 'text-white' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
                shimmerColor="rgba(255, 255, 255, 0.8)"
                shimmerSize="0.1em"
                shimmerDuration="2s"
                borderRadius="0.75rem"
                background={canMakeFinalAnalysis() && !isAnalyzing ? 'rgb(245, 101, 39)' : theme === 'dark' ? 'rgb(75, 85, 99)' : 'rgb(209, 213, 219)'}
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Analyzing Your Decisions...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🎯</span>
                    Submit Final Analysis & Get Results
                  </div>
                )}
              </ShimmerButton>
              
              {!canMakeFinalAnalysis() && (
                <p className={`text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Please complete all fields above to submit your analysis
                </p>
              )}
            </div>
          </div>
        );
      case 'final_result':
        return (
          <div className="space-y-4">
            <TextAnimate
              className="text-2xl font-bold text-green-400"
              animation="blurInUp"
              by="word"
              duration={0.3}
            >
              📊 Analysis Results
            </TextAnimate>
            {finalElapsedTime && (
              <div className="text-center">
                <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'}`}>
                  Total Time: {finalElapsedTime}
                </div>
              </div>
            )}
            <div className={`${theme === 'dark' ? 'bg-orange-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
              <div className="prose prose-invert max-w-none">
                {formatAnalysisContent(analysis)}
              </div>
              <div className="mt-6 flex gap-4">
                <ShimmerButton
                  onClick={onStartNewCase}
                  className="text-white"
                  shimmerColor="rgba(255, 255, 255, 0.8)"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                  borderRadius="0.375rem"
                  background="rgb(245, 101, 39)"
                >
                  Try New Case
                </ShimmerButton>
                <ShimmerButton
                  onClick={() => router.push('/')}
                  className={theme === 'dark' ? 'text-white' : 'text-gray-800'}
                  shimmerColor="rgba(255, 255, 255, 0.5)"
                  shimmerSize="0.05em"
                  shimmerDuration="2s"
                  borderRadius="0.375rem"
                  background={theme === 'dark' ? 'rgb(234, 88, 12)' : 'rgb(229, 231, 235)'}
                >
                  Return Home
                </ShimmerButton>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Calculate score for fake-news simulation
  const calculateFakeNewsScore = (analysis: string, decisions: FakeNewsDecisions): number => {
    let score = 0;
    const maxScore = 100;

    // Base score for having all required decisions
    if (decisions.postFactuality && decisions.keyAmplifier && decisions.criticalEvidence && decisions.consequenceSeverity) {
      score += 30; // 30% for completing all fields
    }

    // Score based on analysis content quality
    if (analysis) {
      const positiveIndicators = [
        'accurate', 'thorough', 'excellent', 'comprehensive', 'correct',
        'well-identified', 'properly', 'effective', 'insightful', 'detailed'
      ];
      
      const negativeIndicators = [
        'inaccurate', 'incomplete', 'poor', 'incorrect', 'missed',
        'failed', 'superficial', 'lacking', 'inadequate', 'insufficient'
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
      
      const indicatorScore = Math.max(0, (positiveCount - negativeCount) * 8);
      score += Math.min(40, indicatorScore); // Max 40% for analysis quality
    }

    // Score based on decision quality
    if (decisions.postFactuality && decisions.postFactuality.length > 15) {
      score += 7.5; // 7.5% for detailed factuality assessment
    }
    
    if (decisions.keyAmplifier && decisions.keyAmplifier.length > 15) {
      score += 7.5; // 7.5% for detailed amplifier identification
    }
    
    if (decisions.criticalEvidence && decisions.criticalEvidence.length > 15) {
      score += 7.5; // 7.5% for detailed evidence analysis
    }
    
    if (decisions.consequenceSeverity && decisions.consequenceSeverity.length > 15) {
      score += 7.5; // 7.5% for detailed consequence assessment
    }

    return Math.min(maxScore, score);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-orange-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <div className={`${theme === 'dark' ? 'bg-orange-800' : 'bg-white'} border-b ${theme === 'dark' ? 'border-orange-700' : 'border-gray-200'} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShimmerButton
              onClick={() => router.push('/')}
              className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
              shimmerColor="rgba(255, 255, 255, 0.5)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={theme === 'dark' ? 'rgb(234, 88, 12)' : 'rgb(229, 231, 235)'}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Exit Simulation
            </ShimmerButton>
            
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <SparklesText 
                className="text-xl font-bold"
                colors={{ first: "#f97316", second: "#fb923c" }}
                sparklesCount={5}
              >
                FACTLOCK - Critical Misinformation Training
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
              background={theme === 'dark' ? 'rgb(234, 88, 12)' : 'rgb(229, 231, 235)'}
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
              background="rgb(245, 101, 39)"
            >
              New Case
            </ShimmerButton>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className={`w-64 ${theme === 'dark' ? 'bg-orange-800' : 'bg-gray-200'} border-r ${theme === 'dark' ? 'border-orange-700' : 'border-gray-200'} overflow-y-auto`}>
          <div className="p-4">
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
                    ? `${theme === 'dark' ? 'bg-orange-700 text-white' : 'bg-orange-100 text-orange-800'}` 
                    : `${theme === 'dark' ? 'text-orange-200 hover:bg-orange-700' : 'text-gray-700 hover:bg-gray-300'}`
                }`}
                shimmerColor="rgba(255, 255, 255, 0.3)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                borderRadius="0.375rem"
                background={currentView === 'overview' 
                  ? (theme === 'dark' ? 'rgb(194, 65, 12)' : 'rgb(255, 237, 213)') 
                  : (theme === 'dark' ? 'rgb(234, 88, 12)' : 'rgb(229, 231, 235)')}
              >
                <FileText className="h-4 w-4 mr-2 inline" />
                Case Overview
              </ShimmerButton>

              <ShimmerButton
                onClick={() => {
                  setCurrentView('timeline');
                  analyzeCase('view_timeline');
                }}
                className={`w-full p-3 text-left transition ${
                  currentView === 'timeline' 
                    ? `${theme === 'dark' ? 'bg-orange-700 text-white' : 'bg-orange-100 text-orange-800'}` 
                    : `${theme === 'dark' ? 'text-orange-200 hover:bg-orange-700' : 'text-gray-700 hover:bg-gray-300'}`
                }`}
                shimmerColor="rgba(255, 255, 255, 0.3)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                borderRadius="0.375rem"
                background={currentView === 'timeline' 
                  ? (theme === 'dark' ? 'rgb(194, 65, 12)' : 'rgb(255, 237, 213)') 
                  : (theme === 'dark' ? 'rgb(234, 88, 12)' : 'rgb(229, 231, 235)')}
              >
                <Eye className="h-4 w-4 mr-2 inline" />
                View Timeline
              </ShimmerButton>

              <ShimmerButton
                onClick={() => {
                  setCurrentView('evidence');
                  analyzeCase('examine_evidence');
                }}
                className={`w-full p-3 text-left transition ${
                  currentView === 'evidence' 
                    ? `${theme === 'dark' ? 'bg-orange-700 text-white' : 'bg-orange-100 text-orange-800'}` 
                    : `${theme === 'dark' ? 'text-orange-200 hover:bg-orange-700' : 'text-gray-700 hover:bg-gray-300'}`
                }`}
                shimmerColor="rgba(255, 255, 255, 0.3)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                borderRadius="0.375rem"
                background={currentView === 'evidence' 
                  ? (theme === 'dark' ? 'rgb(194, 65, 12)' : 'rgb(255, 237, 213)') 
                  : (theme === 'dark' ? 'rgb(234, 88, 12)' : 'rgb(229, 231, 235)')}
              >
                <FileText className="h-4 w-4 mr-2 inline" />
                Examine Evidence
              </ShimmerButton>

              <ShimmerButton
                onClick={() => {
                  setCurrentView('individuals');
                  analyzeCase('profile_individuals');
                }}
                className={`w-full p-3 text-left transition ${
                  currentView === 'individuals' 
                    ? `${theme === 'dark' ? 'bg-orange-700 text-white' : 'bg-orange-100 text-orange-800'}` 
                    : `${theme === 'dark' ? 'text-orange-200 hover:bg-orange-700' : 'text-gray-700 hover:bg-gray-300'}`
                }`}
                shimmerColor="rgba(255, 255, 255, 0.3)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                borderRadius="0.375rem"
                background={currentView === 'individuals' 
                  ? (theme === 'dark' ? 'rgb(194, 65, 12)' : 'rgb(255, 237, 213)') 
                  : (theme === 'dark' ? 'rgb(234, 88, 12)' : 'rgb(229, 231, 235)')}
              >
                <Users className="h-4 w-4 mr-2 inline" />
                Profile Individuals
              </ShimmerButton>

              <ShimmerButton
                onClick={() => setCurrentView('analysis')}
                className={`w-full p-3 text-left transition ${
                  currentView === 'analysis' 
                    ? `${theme === 'dark' ? 'bg-orange-700 text-white' : 'bg-orange-100 text-orange-800'}` 
                    : `${theme === 'dark' ? 'text-orange-200 hover:bg-orange-700' : 'text-gray-700 hover:bg-gray-300'}`
                }`}
                shimmerColor="rgba(255, 255, 255, 0.3)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                borderRadius="0.375rem"
                background={currentView === 'analysis' 
                  ? (theme === 'dark' ? 'rgb(194, 65, 12)' : 'rgb(255, 237, 213)') 
                  : (theme === 'dark' ? 'rgb(234, 88, 12)' : 'rgb(229, 231, 235)')}
              >
                <Target className="h-4 w-4 mr-2 inline" />
                Make Analysis
              </ShimmerButton>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
} 