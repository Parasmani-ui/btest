import { GameSession, UserStats, GroupStats, DashboardStats } from '@/types/user';

export const chartColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  quaternary: '#EF4444',
  accent: '#8B5CF6'
};

export const getGameTypeChartData = (gameTypeBreakdown: { [key: string]: { sessions: number; playtime: number; averageScore: number } }) => {
  const labels = Object.keys(gameTypeBreakdown).map(type => 
    type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
  );
  
  return {
    labels,
    datasets: [
      {
        label: 'Sessions',
        data: Object.values(gameTypeBreakdown).map(data => data.sessions),
        backgroundColor: [
          chartColors.primary,
          chartColors.secondary,
          chartColors.tertiary,
          chartColors.quaternary,
          chartColors.accent
        ],
        borderWidth: 0,
      }
    ]
  };
};

export const getPlaytimeChartData = (gameTypeBreakdown: { [key: string]: { sessions: number; playtime: number; averageScore: number } }) => {
  const labels = Object.keys(gameTypeBreakdown).map(type => 
    type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
  );
  
  return {
    labels,
    datasets: [
      {
        label: 'Playtime (minutes)',
        data: Object.values(gameTypeBreakdown).map(data => data.playtime),
        backgroundColor: chartColors.secondary,
        borderColor: chartColors.secondary,
        borderWidth: 2,
        fill: false,
      }
    ]
  };
};

export const getScoreChartData = (gameTypeBreakdown: { [key: string]: { sessions: number; playtime: number; averageScore: number } }) => {
  const labels = Object.keys(gameTypeBreakdown).map(type => 
    type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
  );
  
  return {
    labels,
    datasets: [
      {
        label: 'Average Score (%)',
        data: Object.values(gameTypeBreakdown).map(data => data.averageScore),
        backgroundColor: chartColors.tertiary,
        borderColor: chartColors.tertiary,
        borderWidth: 2,
        fill: true,
        fillColor: `${chartColors.tertiary}20`,
      }
    ]
  };
};

export const getWeeklyActivityData = (sessions: GameSession[]) => {
  // Get last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const dailyActivity = last7Days.map(date => {
    const sessionsForDay = sessions.filter(session => 
      session.startedAt.split('T')[0] === date
    );
    return {
      date,
      sessions: sessionsForDay.length,
      playtime: sessionsForDay.reduce((sum, s) => sum + s.duration, 0)
    };
  });

  return {
    labels: dailyActivity.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [
      {
        label: 'Sessions',
        data: dailyActivity.map(day => day.sessions),
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Playtime (min)',
        data: dailyActivity.map(day => day.playtime),
        backgroundColor: chartColors.secondary,
        borderColor: chartColors.secondary,
        borderWidth: 2,
        yAxisID: 'y1',
      }
    ]
  };
};

export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#E5E7EB',
      }
    },
    tooltip: {
      backgroundColor: '#374151',
      titleColor: '#F9FAFB',
      bodyColor: '#E5E7EB',
      borderColor: '#6B7280',
      borderWidth: 1,
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#9CA3AF',
      },
      grid: {
        color: '#374151',
      }
    },
    y: {
      ticks: {
        color: '#9CA3AF',
      },
      grid: {
        color: '#374151',
      }
    }
  }
};

export const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: '#E5E7EB',
        padding: 20,
      }
    },
    tooltip: {
      backgroundColor: '#374151',
      titleColor: '#F9FAFB',
      bodyColor: '#E5E7EB',
      borderColor: '#6B7280',
      borderWidth: 1,
    }
  }
};

export const lineOptions = {
  ...defaultChartOptions,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    ...defaultChartOptions.scales,
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      ticks: {
        color: '#9CA3AF',
      },
      grid: {
        drawOnChartArea: false,
      },
    },
  },
}; 