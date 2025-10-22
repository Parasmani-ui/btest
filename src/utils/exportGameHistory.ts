import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GameSession } from '@/types/user';

// Game type label mapping
const getGameTypeLabel = (gameType: string): string => {
  const labels: Record<string, string> = {
    'quick': 'Quick Investigation',
    'simulation': 'POSH Simulation',
    'hospital': 'Hospital Crisis',
    'fake-news': 'Fake News Detection',
    'chainfail': 'ChainFail Investigation',
    'forensic-audit': 'Forensic Audit',
    'food-safety': 'Food Safety',
    'negotiation': 'Negotiation',
    'financial-negotiation': 'Financial Forensics'
  };
  return labels[gameType] || gameType;
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format duration
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Export game history to Excel
export const exportToExcel = (gameHistory: GameSession[], userName: string = 'User') => {
  try {
    // Prepare data for Excel
    const excelData = gameHistory.map((game, index) => {
      const row: any = {
        '#': index + 1,
        'Game Type': getGameTypeLabel(game.gameType),
        'Case Title': game.caseTitle || 'N/A',
        'Status': game.caseSolved ? 'Solved' : 'Incomplete',
        'Started At': formatDate(game.startedAt),
        'Duration': formatDuration(game.duration),
        'Hints Used': game.hints || 0,
        'Overall Score': game.score || 0,
      };

      // Add 3-parameter scores if available
      if (game.scoreBreakdown) {
        if (game.scoreBreakdown.parameter1Name && game.scoreBreakdown.parameter1 !== undefined) {
          row[game.scoreBreakdown.parameter1Name] = `${game.scoreBreakdown.parameter1}/10`;
        }
        if (game.scoreBreakdown.parameter2Name && game.scoreBreakdown.parameter2 !== undefined) {
          row[game.scoreBreakdown.parameter2Name] = `${game.scoreBreakdown.parameter2}/10`;
        }
        if (game.scoreBreakdown.parameter3Name && game.scoreBreakdown.parameter3 !== undefined) {
          row[game.scoreBreakdown.parameter3Name] = `${game.scoreBreakdown.parameter3}/10`;
        }
        if (game.scoreBreakdown.summary) {
          row['Summary'] = game.scoreBreakdown.summary;
        }
      }

      return row;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 5 },  // #
      { wch: 25 }, // Game Type
      { wch: 30 }, // Case Title
      { wch: 12 }, // Status
      { wch: 20 }, // Started At
      { wch: 12 }, // Duration
      { wch: 12 }, // Hints Used
      { wch: 15 }, // Overall Score
      { wch: 20 }, // Parameter 1
      { wch: 20 }, // Parameter 2
      { wch: 20 }, // Parameter 3
      { wch: 50 }, // Summary
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Game History');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${userName}_GameHistory_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(wb, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: 'Failed to export to Excel' };
  }
};

// Export game history to PDF
export const exportToPDF = (gameHistory: GameSession[], userName: string = 'User') => {
  try {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Game History Report', 14, 20);

    // Add user info and date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Player: ${userName}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);
    doc.text(`Total Games: ${gameHistory.length}`, 14, 42);

    // Calculate statistics
    const totalGames = gameHistory.length;
    const solvedGames = gameHistory.filter(g => g.caseSolved).length;
    const avgScore = Math.round(
      gameHistory.reduce((sum, g) => sum + (g.score || 0), 0) / totalGames
    );

    doc.text(`Cases Solved: ${solvedGames}`, 14, 48);
    doc.text(`Average Score: ${avgScore}`, 14, 54);

    // Add a line
    doc.setLineWidth(0.5);
    doc.line(14, 58, 196, 58);

    // Prepare table data
    const tableData = gameHistory.map((game, index) => {
      const baseRow = [
        (index + 1).toString(),
        getGameTypeLabel(game.gameType),
        game.caseSolved ? 'Solved' : 'Incomplete',
        formatDate(game.startedAt),
        formatDuration(game.duration),
        (game.score || 0).toString(),
      ];

      return baseRow;
    });

    // Add main table
    autoTable(doc, {
      startY: 62,
      head: [['#', 'Game Type', 'Status', 'Date', 'Duration', 'Score']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
      },
    });

    // Add detailed scores on new pages if available
    let currentY = (doc as any).lastAutoTable.finalY + 10;

    gameHistory.forEach((game, index) => {
      if (game.scoreBreakdown) {
        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Game ${index + 1}: ${getGameTypeLabel(game.gameType)}`, 14, currentY);
        currentY += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        if (game.caseTitle) {
          doc.text(`Case: ${game.caseTitle.substring(0, 80)}`, 14, currentY);
          currentY += 6;
        }

        // Add 3-parameter scores
        const scoreDetails: string[][] = [];

        if (game.scoreBreakdown.parameter1Name) {
          scoreDetails.push([
            game.scoreBreakdown.parameter1Name,
            `${game.scoreBreakdown.parameter1}/10`
          ]);
        }
        if (game.scoreBreakdown.parameter2Name) {
          scoreDetails.push([
            game.scoreBreakdown.parameter2Name,
            `${game.scoreBreakdown.parameter2}/10`
          ]);
        }
        if (game.scoreBreakdown.parameter3Name) {
          scoreDetails.push([
            game.scoreBreakdown.parameter3Name,
            `${game.scoreBreakdown.parameter3}/10`
          ]);
        }

        if (scoreDetails.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [['Parameter', 'Score']],
            body: scoreDetails,
            theme: 'grid',
            headStyles: {
              fillColor: [52, 152, 219],
              textColor: 255,
            },
            styles: {
              fontSize: 9,
            },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 30 },
            },
          });

          currentY = (doc as any).lastAutoTable.finalY + 6;
        }

        // Add summary if available
        if (game.scoreBreakdown.summary) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          const summaryLines = doc.splitTextToSize(
            `Summary: ${game.scoreBreakdown.summary}`,
            170
          );
          doc.text(summaryLines, 14, currentY);
          currentY += summaryLines.length * 5 + 8;
        }

        // Add a separator line
        if (index < gameHistory.length - 1) {
          doc.setLineWidth(0.2);
          doc.line(14, currentY, 196, currentY);
          currentY += 8;
        }
      }
    });

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${userName}_GameHistory_${timestamp}.pdf`;

    // Save PDF
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: 'Failed to export to PDF' };
  }
};

// Export single game report to PDF
export const exportSingleGameToPDF = (game: GameSession, userName: string = 'User') => {
  try {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Game Report', 14, 20);

    // Add game details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(getGameTypeLabel(game.gameType), 14, 35);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = 45;

    if (game.caseTitle) {
      const titleLines = doc.splitTextToSize(`Case: ${game.caseTitle}`, 170);
      doc.text(titleLines, 14, yPos);
      yPos += titleLines.length * 6;
    }

    doc.text(`Status: ${game.caseSolved ? 'Solved' : 'Incomplete'}`, 14, yPos);
    yPos += 6;
    doc.text(`Date: ${formatDate(game.startedAt)}`, 14, yPos);
    yPos += 6;
    doc.text(`Duration: ${formatDuration(game.duration)}`, 14, yPos);
    yPos += 6;
    doc.text(`Hints Used: ${game.hints || 0}`, 14, yPos);
    yPos += 6;
    doc.text(`Overall Score: ${game.score || 0}`, 14, yPos);
    yPos += 12;

    // Add 3-parameter scores
    if (game.scoreBreakdown) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Breakdown', 14, yPos);
      yPos += 8;

      const scoreDetails: string[][] = [];

      if (game.scoreBreakdown.parameter1Name) {
        scoreDetails.push([
          game.scoreBreakdown.parameter1Name,
          `${game.scoreBreakdown.parameter1}/10`
        ]);
      }
      if (game.scoreBreakdown.parameter2Name) {
        scoreDetails.push([
          game.scoreBreakdown.parameter2Name,
          `${game.scoreBreakdown.parameter2}/10`
        ]);
      }
      if (game.scoreBreakdown.parameter3Name) {
        scoreDetails.push([
          game.scoreBreakdown.parameter3Name,
          `${game.scoreBreakdown.parameter3}/10`
        ]);
      }

      if (scoreDetails.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Parameter', 'Score']],
          body: scoreDetails,
          theme: 'grid',
          headStyles: {
            fillColor: [52, 152, 219],
            textColor: 255,
          },
          styles: {
            fontSize: 10,
          },
          columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 40 },
          },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Add summary
      if (game.scoreBreakdown.summary) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary:', 14, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(game.scoreBreakdown.summary, 170);
        doc.text(summaryLines, 14, yPos);
        yPos += summaryLines.length * 5 + 10;
      }
    }

    // Add analysis if available
    if (game.analysis) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Analysis:', 14, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const analysisLines = doc.splitTextToSize(game.analysis, 170);
      doc.text(analysisLines, 14, yPos);
    }

    // Add footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} for ${userName}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const gameType = game.gameType.replace(/-/g, '_');
    const filename = `${userName}_${gameType}_${timestamp}.pdf`;

    // Save PDF
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting single game to PDF:', error);
    return { success: false, error: 'Failed to export game report' };
  }
};
