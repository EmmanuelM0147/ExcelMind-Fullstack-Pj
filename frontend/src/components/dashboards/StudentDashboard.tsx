import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { BookOpen, Clock, TrendingUp, Calendar } from 'lucide-react';

export function StudentDashboard() {
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses'),
  });

  const stats = [
    { name: 'Enrolled Courses', value: '4', icon: BookOpen, color: 'text-blue-600' },
    { name: 'Pending Assignments', value: '7', icon: Clock, color: 'text-orange-600' },
    { name: 'Average Grade', value: '87%', icon: TrendingUp, color: 'text-green-600' },
    { name: 'Next Deadline', value: '2 days', icon: Calendar, color: 'text-red-600' },
  ];

  const recentGrades = [
    { assignment: 'Programming Assignment 1', course: 'Computer Science', grade: 92, date: '2024-01-15' },
    { assignment: 'Calculus Problem Set', course: 'Advanced Mathematics', grade: 88, date: '2024-01-12' },
    { assignment: 'Midterm Exam', course: 'Computer Science', grade: 85, date: '2024-01-10' },
  ];

  const upcomingAssignments = [
    { title: 'Final Project', course: 'Computer Science', dueDate: '2024-01-20', priority: 'high' },
    { title: 'Linear Algebra Quiz', course: 'Advanced Mathematics', dueDate: '2024-01-18', priority: 'medium' },
    { title: 'Database Design', course: 'Database Systems', dueDate: '2024-01-25', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Courses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Courses</h2>
          {coursesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {courses?.data?.slice(0, 3).map((course: any) => (
                <div key={course.id} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.lecturer?.name}</p>
                  <p className="text-sm text-gray-500">{course.credits} credits</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Assignments</h2>
          <div className="space-y-4">
            {upcomingAssignments.map((assignment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                  <p className="text-sm text-gray-600">{assignment.course}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{assignment.dueDate}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    assignment.priority === 'high' ? 'bg-red-100 text-red-800' :
                    assignment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {assignment.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Grades */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Grades</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentGrades.map((grade, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {grade.assignment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grade.course}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      grade.grade >= 90 ? 'bg-green-100 text-green-800' :
                      grade.grade >= 80 ? 'bg-blue-100 text-blue-800' :
                      grade.grade >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {grade.grade}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grade.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}