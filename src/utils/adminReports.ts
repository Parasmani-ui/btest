import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  organizationName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserStats {
  gamesPlayed: number;
  casesCompleted: number;
  totalPlaytime: number;
  averageScore: number;
  completionRate: number;
  gameTypeStats: any;
}

interface GameSession {
  id: string;
  gameType: string;
  caseTitle: string;
  caseSolved: boolean;
  startedAt: string;
  elapsedTime: number;
  hintsUsed: number;
  overallScore: number;
  scoreBreakdown?: {
    parameter1Name?: string;
    parameter1?: number;
    parameter2Name?: string;
    parameter2?: number;
    parameter3Name?: string;
    parameter3?: number;
    summary?: string;
  };
  analysisText?: string;
}

// Helper: Format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Helper: Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate Excel report for individual user
 */
export function generateUserReportExcel(
  profile: UserProfile,
  stats: UserStats,
  gameHistory: GameSession[]
): { success: boolean; filename: string; buffer?: Buffer; error?: string } {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Profile
    const profileData = [
      ['User Profile Report'],
      [''],
      ['Name', profile.displayName],
      ['Email', profile.email],
      ['Role', profile.role],
      ['Organization', profile.organizationName || 'N/A'],
      ['Account Created', formatDate(profile.createdAt)],
      ['Last Login', profile.lastLoginAt ? formatDate(profile.lastLoginAt) : 'Never'],
    ];

    const profileSheet = XLSX.utils.aoa_to_sheet(profileData);
    XLSX.utils.book_append_sheet(wb, profileSheet, 'Profile');

    // Sheet 2: Summary Statistics
    const statsData = [
      ['Summary Statistics'],
      [''],
      ['Metric', 'Value'],
      ['Total Games Played', stats.gamesPlayed],
      ['Cases Completed', stats.casesCompleted],
      ['Completion Rate', `${stats.completionRate}%`],
      ['Average Score', `${stats.averageScore.toFixed(2)}%`],
      ['Total Playtime', formatDuration(stats.totalPlaytime)],
    ];

    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsSheet, 'Summary');

    // Sheet 3: Game History with 3-Parameter Scores
    const historyData: any[] = [
      ['Game History'],
      [''],
      ['#', 'Game Type', 'Case Title', 'Status', 'Date', 'Duration', 'Hints', 'Overall Score', 'Param 1', 'Param 2', 'Param 3'],
    ];

    gameHistory.forEach((game, index) => {
      // Extract 3-parameter scores from scoreBreakdown
      const breakdown = game.scoreBreakdown;
      const param1 = breakdown && breakdown.parameter1Name
        ? `${breakdown.parameter1Name}: ${breakdown.parameter1}/10`
        : 'N/A';
      const param2 = breakdown && breakdown.parameter2Name
        ? `${breakdown.parameter2Name}: ${breakdown.parameter2}/10`
        : 'N/A';
      const param3 = breakdown && breakdown.parameter3Name
        ? `${breakdown.parameter3Name}: ${breakdown.parameter3}/10`
        : 'N/A';

      historyData.push([
        index + 1,
        game.gameType,
        game.caseTitle,
        game.caseSolved ? 'Solved' : 'Incomplete',
        formatDate(game.startedAt),
        formatDuration(game.elapsedTime || 0),
        game.hintsUsed || 0,
        `${game.overallScore || 0}%`,
        param1,
        param2,
        param3,
      ]);
    });

    const historySheet = XLSX.utils.aoa_to_sheet(historyData);
    historySheet['!cols'] = [
      { wch: 5 },  // #
      { wch: 15 }, // Game Type
      { wch: 30 }, // Case Title
      { wch: 12 }, // Status
      { wch: 18 }, // Date
      { wch: 12 }, // Duration
      { wch: 8 },  // Hints
      { wch: 12 }, // Overall Score
      { wch: 20 }, // Param 1
      { wch: 20 }, // Param 2
      { wch: 20 }, // Param 3
    ];
    XLSX.utils.book_append_sheet(wb, historySheet, 'Game History');

    // Sheet 4: Performance by Game Type
    const gameTypeData: any[] = [
      ['Performance by Game Type'],
      [''],
      ['Game Type', 'Total Played', 'Completed', 'Avg Score', 'Completion Rate'],
    ];

    Object.entries(stats.gameTypeStats).forEach(([gameType, typeStats]: [string, any]) => {
      const completionRate = typeStats.total > 0
        ? Math.round((typeStats.completed / typeStats.total) * 100)
        : 0;

      gameTypeData.push([
        gameType,
        typeStats.total,
        typeStats.completed,
        `${typeStats.avgScore.toFixed(2)}%`,
        `${completionRate}%`,
      ]);
    });

    const gameTypeSheet = XLSX.utils.aoa_to_sheet(gameTypeData);
    XLSX.utils.book_append_sheet(wb, gameTypeSheet, 'Performance');

    // Generate filename and buffer
    const filename = `${profile.displayName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Write to buffer instead of file
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return { success: true, filename, buffer };
  } catch (error: any) {
    console.error('Error generating Excel report:', error);
    return { success: false, filename: '', error: error.message };
  }
}

/**
 * Generate PDF report for individual user
 */
export function generateUserReportPDF(
  profile: UserProfile,
  stats: UserStats,
  gameHistory: GameSession[]
): { success: boolean; filename: string; buffer?: Buffer; error?: string } {
  try {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('User Performance Report', 105, yPosition, { align: 'center' });

    yPosition += 15;

    // Profile Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Profile Information', 20, yPosition);
    yPosition += 5;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Name: ${profile.displayName}`, 20, yPosition + 5);
    doc.text(`Email: ${profile.email}`, 20, yPosition + 11);
    doc.text(`Role: ${profile.role}`, 20, yPosition + 17);
    doc.text(`Organization: ${profile.organizationName || 'N/A'}`, 20, yPosition + 23);
    doc.text(`Account Created: ${formatDate(profile.createdAt)}`, 20, yPosition + 29);

    yPosition += 40;

    // Summary Statistics
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Statistics', 20, yPosition);
    yPosition += 10;

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Games Played', stats.gamesPlayed.toString()],
        ['Cases Completed', stats.casesCompleted.toString()],
        ['Completion Rate', `${stats.completionRate}%`],
        ['Average Score', `${stats.averageScore.toFixed(2)}%`],
        ['Total Playtime', formatDuration(stats.totalPlaytime)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Game Type Performance
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Performance by Game Type', 20, yPosition);
    yPosition += 10;

    const gameTypeRows = Object.entries(stats.gameTypeStats).map(([gameType, typeStats]: [string, any]) => {
      const completionRate = typeStats.total > 0
        ? Math.round((typeStats.completed / typeStats.total) * 100)
        : 0;

      return [
        gameType,
        typeStats.total.toString(),
        typeStats.completed.toString(),
        `${typeStats.avgScore.toFixed(2)}%`,
        `${completionRate}%`,
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Game Type', 'Played', 'Completed', 'Avg Score', 'Rate']],
      body: gameTypeRows,
      theme: 'grid',
      headStyles: { fillColor: [92, 184, 92] },
    });

    // Game History
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(14);
    doc.text('Game History', 20, yPosition);
    yPosition += 10;

    const historyRows = gameHistory.slice(0, 50).map((game, index) => {
      // Extract 3-parameter scores from scoreBreakdown
      const breakdown = game.scoreBreakdown;
      const params: string[] = [];

      if (breakdown) {
        if (breakdown.parameter1Name) {
          params.push(`${breakdown.parameter1Name}: ${breakdown.parameter1}/10`);
        }
        if (breakdown.parameter2Name) {
          params.push(`${breakdown.parameter2Name}: ${breakdown.parameter2}/10`);
        }
        if (breakdown.parameter3Name) {
          params.push(`${breakdown.parameter3Name}: ${breakdown.parameter3}/10`);
        }
      }

      const paramsStr = params.length > 0 ? params.join(', ') : 'N/A';

      return [
        (index + 1).toString(),
        game.gameType || 'Unknown',
        (game.caseTitle || 'Untitled').substring(0, 25),
        game.caseSolved ? 'Solved' : 'Incomplete',
        formatDate(game.startedAt),
        `${game.overallScore || 0}%`,
        paramsStr.substring(0, 50), // Truncate if too long
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Type', 'Title', 'Status', 'Date', 'Score', '3-Param Scores']],
      body: historyRows,
      theme: 'striped',
      headStyles: { fillColor: [51, 122, 183] },
      styles: { fontSize: 7 },
      columnStyles: {
        6: { cellWidth: 40 }, // 3-Param Scores column
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        105,
        285,
        { align: 'center' }
      );
    }

    // Generate filename and buffer
    const filename = `${profile.displayName.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;

    // Get PDF as buffer
    const buffer = Buffer.from(doc.output('arraybuffer'));

    return { success: true, filename, buffer };
  } catch (error: any) {
    console.error('Error generating PDF report:', error);
    return { success: false, filename: '', error: error.message };
  }
}

/**
 * Generate Excel report for organization
 */
export function generateOrganizationReportExcel(
  organizationName: string,
  users: any[],
  aggregateStats: any
): { success: boolean; filename: string; buffer?: Buffer; error?: string } {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Organization Overview
    const overviewData = [
      ['Organization Report'],
      [''],
      ['Organization Name', organizationName],
      ['Report Date', new Date().toLocaleString()],
      [''],
      ['Summary Statistics'],
      ['Total Users', users.length],
      ['Active Users (30 days)', aggregateStats.activeUsers],
      ['Total Games Played', aggregateStats.totalGames],
      ['Total Cases Completed', aggregateStats.totalCasesCompleted],
      ['Average Score', `${aggregateStats.avgScore.toFixed(2)}%`],
      ['Total Playtime', formatDuration(aggregateStats.totalPlaytime)],
    ];

    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview');

    // Sheet 2: User Performance with game-specific parameters
    // Define game types and their parameters (from scoring.ts)
    const gameParameters: { [key: string]: { param1: string; param2: string; param3: string } } = {
      'POSH_SIMULATION': {
        param1: 'Awareness',
        param2: 'Decision Integrity',
        param3: 'Sensitivity',
      },
      'DETECTIVE_SIMULATION': {
        param1: 'Critical Thinking',
        param2: 'Evidence Analysis',
        param3: 'Intuition',
      },
      'FINANCIAL_FORENSIC_SIMULATION': {
        param1: 'Data Accuracy',
        param2: 'Compliance Awareness',
        param3: 'Risk Assessment',
      },
      'FORENSIC_AUDIT_SIMULATION': {
        param1: 'Data Accuracy',
        param2: 'Compliance Awareness',
        param3: 'Risk Assessment',
      },
      'FOOD_SAFETY_SIMULATION': {
        param1: 'Risk Analysis',
        param2: 'Regulatory Knowledge',
        param3: 'Crisis Response',
      },
      'FINANCIAL_NEGOTIATION_SIMULATION': {
        param1: 'Financial Analysis',
        param2: 'Investigative Reasoning',
        param3: 'Evidence Synthesis',
      },
      'HOSPITAL_CRISIS_SIMULATION': {
        param1: 'Leadership',
        param2: 'Resource Management',
        param3: 'Decision Clarity',
      },
      'CHAINFAIL_SIMULATION': {
        param1: 'Technical Analysis',
        param2: 'Safety Awareness',
        param3: 'Preventive Planning',
      },
      'FAKE_NEWS_SIMULATION': {
        param1: 'Fact Verification',
        param2: 'Bias Awareness',
        param3: 'Ethical Judgement',
      },
      'SUICIDE_AWARENESS_SIMULATION': {
        param1: 'Empathy',
        param2: 'Response Time',
        param3: 'Intervention Quality',
      },
      'NEGOTIATION_SIMULATION': {
        param1: 'Assertiveness',
        param2: 'Data-Driven Arguments',
        param3: 'Empathy/Relationship Maintenance',
      },
      'POWERPLANT_CRISIS_SIMULATION': {
        param1: 'Leadership',
        param2: 'Resource Management',
        param3: 'Decision Clarity',
      },
      'POSH_ACADEMY_SIMULATION': {
        param1: 'Communication Clarity',
        param2: 'Policy Knowledge',
        param3: 'Case Handling',
      },
    };

    // Map database gameType values to expected simulation names
    const gameTypeMapping: { [key: string]: string } = {
      // Lowercase database values to uppercase simulation names
      'quick': 'DETECTIVE_SIMULATION',
      'simulation': 'POSH_SIMULATION', // Generic simulation maps to POSH
      'hospital': 'HOSPITAL_CRISIS_SIMULATION',
      'fake-news': 'FAKE_NEWS_SIMULATION',
      'chainfail': 'CHAINFAIL_SIMULATION',
      'forensic-audit': 'FORENSIC_AUDIT_SIMULATION',
      'food-safety': 'FOOD_SAFETY_SIMULATION',
      'negotiation': 'NEGOTIATION_SIMULATION',
      'financial-negotiation': 'FINANCIAL_NEGOTIATION_SIMULATION',
      'powercrisis': 'POWERPLANT_CRISIS_SIMULATION',
      // Legacy mappings for backward compatibility
      'detective': 'DETECTIVE_SIMULATION',
      'posh': 'POSH_SIMULATION',
      'suicide-awareness': 'SUICIDE_AWARENESS_SIMULATION',
      'posh-academy': 'POSH_ACADEMY_SIMULATION',
    };

    // First pass: collect all unique game types from all users' sessions
    const gameTypesInData = new Set<string>();
    users.forEach((user: any) => {
      if (user.gameSessions && Array.isArray(user.gameSessions)) {
        user.gameSessions.forEach((session: any) => {
          const rawType = session.gameType;
          const mappedType = gameTypeMapping[rawType] || rawType;
          // Only include if it's a valid simulation type we have parameters for
          if (gameParameters[mappedType]) {
            gameTypesInData.add(mappedType);
          }
        });
      }
    });

    console.log('🎮 Game types found in data:', Array.from(gameTypesInData));

    // Use only the game types that exist in the data, in a consistent order
    const activeGameTypes = Object.keys(gameParameters).filter(gameType =>
      gameTypesInData.has(gameType)
    );

    console.log('📊 Active game types for Excel:', activeGameTypes);

    // Build header rows with only active game types
    const gameNameRow = ['Name', 'Email', 'Games', 'Completed', 'Avg Score', 'Playtime', 'Last Active'];
    const parameterRow = ['', '', '', '', '', '', '']; // Empty cells for basic info columns

    // Add game names and parameter names for active games only
    activeGameTypes.forEach((gameType) => {
      const params = gameParameters[gameType];
      // Add game name spanning 3 columns (merged in Excel rendering)
      gameNameRow.push(gameType, '', '');
      // Add parameter names
      parameterRow.push(params.param1, params.param2, params.param3);
    });

    const userPerformanceData: any[] = [
      ['User Performance'],
      [''],
      gameNameRow,
      parameterRow,
    ];

    users.forEach((user) => {
      // Aggregate parameter scores by game type
      const gameTypeScores: { [gameType: string]: { [param: string]: { total: number; count: number } } } = {};

      // Initialize only active game types
      activeGameTypes.forEach((gameType) => {
        gameTypeScores[gameType] = {
          param1: { total: 0, count: 0 },
          param2: { total: 0, count: 0 },
          param3: { total: 0, count: 0 },
        };
      });

      // Calculate playtime from sessions (more accurate than user profile value)
      let calculatedPlaytime = 0;

      // Aggregate scores from game sessions
      if (user.gameSessions && Array.isArray(user.gameSessions)) {
        console.log(`Processing ${user.gameSessions.length} sessions for user: ${user.displayName}`);

        user.gameSessions.forEach((session: any, idx: number) => {
          let rawGameType = session.gameType;

          // Map gameType to expected simulation name
          const mappedGameType = gameTypeMapping[rawGameType] || rawGameType;

          // Calculate playtime from this session
          const sessionTime = session.elapsedTime || (session.duration ? session.duration * 60 : 0);
          calculatedPlaytime += sessionTime;

          // Try to get scoreBreakdown from different possible locations
          let breakdown = session.scoreBreakdown;

          // Fallback: check if parameters are at root level
          if (!breakdown && (session.parameter1 !== undefined || session.parameter2 !== undefined || session.parameter3 !== undefined)) {
            breakdown = {
              parameter1: session.parameter1,
              parameter1Name: session.parameter1Name,
              parameter2: session.parameter2,
              parameter2Name: session.parameter2Name,
              parameter3: session.parameter3,
              parameter3Name: session.parameter3Name,
            };
          }

          console.log(`Session ${idx + 1}: rawType=${rawGameType}, mappedType=${mappedGameType}, hasBreakdown=${!!breakdown}`, breakdown ? `param1=${breakdown.parameter1}, param2=${breakdown.parameter2}, param3=${breakdown.parameter3}` : '');

          if (mappedGameType && gameTypeScores[mappedGameType] && breakdown) {
            // Aggregate param1
            if (breakdown.parameter1 !== undefined && breakdown.parameter1 !== null) {
              gameTypeScores[mappedGameType].param1.total += breakdown.parameter1;
              gameTypeScores[mappedGameType].param1.count += 1;
              console.log(`  Added param1: ${breakdown.parameter1} to ${mappedGameType}`);
            }
            // Aggregate param2
            if (breakdown.parameter2 !== undefined && breakdown.parameter2 !== null) {
              gameTypeScores[mappedGameType].param2.total += breakdown.parameter2;
              gameTypeScores[mappedGameType].param2.count += 1;
              console.log(`  Added param2: ${breakdown.parameter2} to ${mappedGameType}`);
            }
            // Aggregate param3
            if (breakdown.parameter3 !== undefined && breakdown.parameter3 !== null) {
              gameTypeScores[mappedGameType].param3.total += breakdown.parameter3;
              gameTypeScores[mappedGameType].param3.count += 1;
              console.log(`  Added param3: ${breakdown.parameter3} to ${mappedGameType}`);
            }
          } else {
            console.log(`  Skipped - raw: ${rawGameType}, mapped: ${mappedGameType}, has breakdown: ${!!breakdown}, gameType exists: ${!!(mappedGameType && gameTypeScores[mappedGameType])}`);
          }
        });
      }

      // Use calculated playtime from sessions (more accurate)
      const playtimeSeconds = calculatedPlaytime || user.totalPlaytime || 0;
      console.log(`User ${user.displayName}: Calculated playtime=${calculatedPlaytime}s, Profile playtime=${user.totalPlaytime}s, Using=${playtimeSeconds}s`);
      const hours = Math.floor(playtimeSeconds / 3600);
      const minutes = Math.floor((playtimeSeconds % 3600) / 60);
      const seconds = Math.floor(playtimeSeconds % 60);

      let playtimeFormatted: string;
      if (hours > 0) {
        playtimeFormatted = `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        playtimeFormatted = `${minutes}m`;
      } else {
        playtimeFormatted = `${seconds}s`;
      }

      // Build user row
      const userRow = [
        user.displayName,
        user.email,
        user.gamesPlayed || 0,
        user.casesCompleted || 0,
        `${(user.averageScore || 0).toFixed(2)}%`,
        playtimeFormatted,
        user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never',
      ];

      // Add parameter scores for each active game type only
      activeGameTypes.forEach((gameType) => {
        const scores = gameTypeScores[gameType];

        // Calculate averages
        const param1Avg = scores.param1.count > 0
          ? (scores.param1.total / scores.param1.count).toFixed(1)
          : '0.0';
        const param2Avg = scores.param2.count > 0
          ? (scores.param2.total / scores.param2.count).toFixed(1)
          : '0.0';
        const param3Avg = scores.param3.count > 0
          ? (scores.param3.total / scores.param3.count).toFixed(1)
          : '0.0';

        userRow.push(param1Avg, param2Avg, param3Avg);
      });

      userPerformanceData.push(userRow);
    });

    const userPerfSheet = XLSX.utils.aoa_to_sheet(userPerformanceData);

    // Set column widths
    const columnWidths = [
      { wch: 20 },  // Name
      { wch: 25 },  // Email
      { wch: 10 },  // Games
      { wch: 12 },  // Completed
      { wch: 12 },  // Avg Score
      { wch: 15 },  // Playtime
      { wch: 18 },  // Last Active
    ];

    // Add widths for parameter columns (activeGameTypes.length × 3 params)
    const parameterColumnCount = activeGameTypes.length * 3;
    for (let i = 0; i < parameterColumnCount; i++) {
      columnWidths.push({ wch: 15 }); // Standard width for parameter columns
    }

    userPerfSheet['!cols'] = columnWidths;

    // Merge cells for game names (spanning 3 columns each)
    const merges: any[] = [];
    let startCol = 7; // Start after basic info columns (0-6)

    activeGameTypes.forEach(() => {
      // Merge 3 columns for game name in row 2 (0-indexed)
      merges.push({
        s: { r: 2, c: startCol },     // Start: row 2, column startCol
        e: { r: 2, c: startCol + 2 }  // End: row 2, column startCol+2
      });
      startCol += 3;
    });

    userPerfSheet['!merges'] = merges;

    XLSX.utils.book_append_sheet(wb, userPerfSheet, 'Users');

    // Generate filename and buffer
    const filename = `${organizationName.replace(/\s+/g, '_')}_OrgReport_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Write to buffer instead of file
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return { success: true, filename, buffer };
  } catch (error: any) {
    console.error('Error generating organization Excel report:', error);
    return { success: false, filename: '', error: error.message };
  }
}

/**
 * Generate PDF report for organization
 */
export function generateOrganizationReportPDF(
  organizationName: string,
  users: any[],
  aggregateStats: any
): { success: boolean; filename: string; buffer?: Buffer; error?: string } {
  try {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Organization Performance Report', 105, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(12);
    doc.text(organizationName, 105, yPosition, { align: 'center' });

    yPosition += 15;

    // Summary Statistics
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Organization Summary', 20, yPosition);
    yPosition += 10;

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Users', users.length.toString()],
        ['Active Users (30 days)', aggregateStats.activeUsers.toString()],
        ['Total Games Played', aggregateStats.totalGames.toString()],
        ['Total Cases Completed', aggregateStats.totalCasesCompleted.toString()],
        ['Average Score', `${aggregateStats.avgScore.toFixed(2)}%`],
        ['Total Playtime', formatDuration(aggregateStats.totalPlaytime)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
    });

    // User Performance Table
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(14);
    doc.text('User Performance', 20, yPosition);
    yPosition += 10;

    const userRows = users.map((user) => [
      user.displayName,
      user.email,
      (user.gamesPlayed || 0).toString(),
      (user.casesCompleted || 0).toString(),
      `${(user.averageScore || 0).toFixed(2)}%`,
      user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Email', 'Games', 'Completed', 'Avg Score', 'Last Active']],
      body: userRows,
      theme: 'striped',
      headStyles: { fillColor: [51, 122, 183] },
      styles: { fontSize: 8 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        105,
        285,
        { align: 'center' }
      );
    }

    // Generate filename and buffer
    const filename = `${organizationName.replace(/\s+/g, '_')}_OrgReport_${new Date().toISOString().split('T')[0]}.pdf`;

    // Get PDF as buffer
    const buffer = Buffer.from(doc.output('arraybuffer'));

    return { success: true, filename, buffer };
  } catch (error: any) {
    console.error('Error generating organization PDF report:', error);
    return { success: false, filename: '', error: error.message };
  }
}
