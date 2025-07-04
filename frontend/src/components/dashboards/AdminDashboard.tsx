import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Users, BookOpen, GraduationCap, TrendingUp, UserPlus, Plus } from 'lucide-react';

export function AdminDashboard() {
  const { data: _courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses'),
  });

  const stats = [
    { name: 'Total Users', value: '1,247', icon: Users, color: 'text-blue-600', change: '+12%' },
    { name: 'Active Courses', value: '45', icon: BookOpen, color: 'text-green-600', change: '+8%' },
    { name: 'Students', value: '1,156', icon: GraduationCap, color: 'text-purple-600', change: '+15%' },
    { name: 'System Usage', value: '94%', icon: TrendingUp, color: 'text-orange-600', change: '+3%' },
  ];

  const recentActivity = [
    { action: 'New student registered', user: 'John Doe', time: '2 minutes ago', type: 'user' },
    { action: 'Course created', user: 'Dr. Smith', time: '15 minutes ago', type: 'course' },
    { action: 'Assignment submitted', user: 'Jane Smith', time: '1 hour ago', type: 'assignment' },
    { action: 'Grade updated', user: 'Prof. Johnson', time: '2 hours ago', type: 'grade' },
    { action: 'New enrollment', user: 'Mike Wilson', time: '3 hours ago', type: 'enrollment' },
  ];

  const userStats = [
    { role: 'Students', count: 1156, percentage: 85 },
    { role: 'Lecturers', count: 89, percentage: 12 },
    { role: 'Admins', count: 12, percentage: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <span className="font-medium text-blue-900">Add New User</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <Plus className="h-6 w-6 text-green-600" />
            <span className="font-medium text-green-900">Create Course</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            <span className="font-medium text-purple-900">View Analytics</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Distribution</h2>
          <div className="space-y-4">
            {userStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 'bg-purple-500'
                  }`}></div>
                  <span className="font-medium text-gray-900">{stat.role}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{stat.count}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{stat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'user' ? 'bg-blue-500' :
                  activity.type === 'course' ? 'bg-green-500' :
                  activity.type === 'assignment' ? 'bg-yellow-500' :
                  activity.type === 'grade' ? 'bg-purple-500' :
                  'bg-orange-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
            <div className="text-sm text-gray-600">System Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">2.3s</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">15.2GB</div>
            <div className="text-sm text-gray-600">Storage Used</div>
          </div>
        </div>
      </div>
    </div>
  );
}