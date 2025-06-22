'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import Link from 'next/link';
import { 
  UserIcon, 
  GamepadIcon, 
  TrophyIcon, 
  ClockIcon,
  TrendingUpIcon,
  ActivityIcon,
  HomeIcon,
  PlayIcon,
  BookOpenIcon,
  ShieldIcon,
  AlertTriangleIcon,
  NewspaperIcon,
  LinkIcon
} from 'lucide-react';

export default function DashboardPage() {
  const { userData } = useAuth();

  const stats = [
    {
      name: 'Games Played',
      value: '12',
      icon: GamepadIcon,
      color: 'bg-blue-500',
      change: '+2.1%',
      changeType: 'increase',
    },
    {
      name: 'Cases Solved',
      value: '8',
      icon: TrophyIcon,
      color: 'bg-green-500',
      change: '+4.5%',
      changeType: 'increase',
    },
    {
      name: 'Total Playtime',
      value: '24h 30m',
      icon: ClockIcon,
      color: 'bg-yellow-500',
      change: '+1.2h',
      changeType: 'increase',
    },
    {
      name: 'Success Rate',
      value: '67%',
      icon: TrendingUpIcon,
      color: 'bg-purple-500',
      change: '+12%',
      changeType: 'increase',
    },
  ];

  const games = [
    {
      id: 1,
      name: 'Quick Investigation',
      description: 'Fast-paced detective cases for critical reading skills',
      duration: '5-8 minutes',
      difficulty: 'Beginner',
      icon: BookOpenIcon,
      color: 'bg-blue-500',
      href: '/game?mode=quick',
      category: 'Critical Reading'
    },
    {
      id: 2,
      name: 'Complex Investigation',
      description: 'In-depth investigation scenarios with multiple clues',
      duration: '15-30 minutes',
      difficulty: 'Intermediate',
      icon: GamepadIcon,
      color: 'bg-green-500',
      href: '/simulation',
      category: 'Critical Investigation'
    },
    {
      id: 3,
      name: 'Crisis Response',
      description: 'Emergency management and decision-making scenarios',
      duration: '10-20 minutes',
      difficulty: 'Advanced',
      icon: AlertTriangleIcon,
      color: 'bg-red-500',
      href: '/hospital-simulation',
      category: 'Crisis Management'
    },
    {
      id: 4,
      name: 'Information Scrutiny',
      description: 'Detect and analyze misinformation in news and social media',
      duration: '8-15 minutes',
      difficulty: 'Intermediate',
      icon: NewspaperIcon,
      color: 'bg-orange-500',
      href: '/fake-news-simulation',
      category: 'Critical Misinformation'
    },
    {
      id: 5,
      name: 'Chain Analysis',
      description: 'Investigate complex failure chains and industrial accidents',
      duration: '12-25 minutes',
      difficulty: 'Advanced',
      icon: LinkIcon,
      color: 'bg-purple-500',
      href: '/chainfail-simulation',
      category: 'Critical ChainFail'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'game_completed',
      title: 'Completed "The Missing Diamond" case',
      time: '2 hours ago',
      result: 'Solved',
    },
    {
      id: 2,
      type: 'simulation_started',
      title: 'Started Hospital Simulation',
      time: '1 day ago',
      result: 'In Progress',
    },
    {
      id: 3,
      type: 'game_completed',
      title: 'Completed "Chain Fail Investigation"',
      time: '3 days ago',
      result: 'Solved',
    },
    {
      id: 4,
      type: 'profile_updated',
      title: 'Updated profile information',
      time: '1 week ago',
      result: 'Completed',
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Dashboard">
        <div className="space-y-8">
          {/* Welcome Section with Home Button */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    Welcome, {userData?.displayName}!
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Ready to solve some mysteries? Check out your progress below.
                  </p>
                </div>
              </div>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                <HomeIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">Go to Homepage</span>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-400 ml-2">from last week</span>
                </div>
              </div>
            ))}
          </div>

          {/* Available Games Section */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GamepadIcon className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-white">Available Games & Simulations</h2>
                </div>
                <span className="text-sm text-gray-400">{games.length} games available</span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game) => (
                  <Link
                    key={game.id}
                    href={game.href}
                    className="group block p-6 border border-gray-600 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 bg-gray-700"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`${game.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                        <game.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {game.name}
                        </h3>
                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                          {game.description}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                              {game.difficulty}
                            </span>
                            <span className="text-xs text-gray-400">{game.duration}</span>
                          </div>
                          <PlayIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-medium">{game.category}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <ActivityIcon className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.result === 'Solved' || activity.result === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <Link
                    href="/game"
                    className="flex items-center p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <GamepadIcon className="w-8 h-8 text-blue-500 mr-4" />
                    <div>
                      <h3 className="font-medium text-white">Start New Game</h3>
                      <p className="text-sm text-gray-400">Begin a new detective case</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/simulation"
                    className="flex items-center p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <ActivityIcon className="w-8 h-8 text-green-500 mr-4" />
                    <div>
                      <h3 className="font-medium text-white">Practice Simulation</h3>
                      <p className="text-sm text-gray-400">Hone your skills in various scenarios</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <UserIcon className="w-8 h-8 text-purple-500 mr-4" />
                    <div>
                      <h3 className="font-medium text-white">Edit Profile</h3>
                      <p className="text-sm text-gray-400">Update your information</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 