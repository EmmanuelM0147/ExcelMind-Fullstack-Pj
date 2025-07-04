import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { BookOpen, Users, FileText, Clock } from 'lucide-react';

export function LecturerDashboard() {
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses'),
  });

  const stats = [
    { name: 'Courses Teaching', value: '3', icon: BookOpen, color: 'text-blue-600' },
    { name: 'Total Students', value: '127', icon: Users, color: 'text-green-600' },
    { name: 'Pending Grades', value: '15', icon: FileText, color: 'text-orange-600' },
    { name: 'Upcoming Deadlines', value: '4', icon: Clock, color: 'text-red-600' },
  ];

  const pendingAssignments = [
    { title: 'Programming Assignment 1', course: 'Computer Science', submissions: 23, total: 25 },
    { title: 'Database Design Project', course: 'Database Systems', submissions: 18, total: 20 },
    { title: 'Final Project', course: 'Computer Science', submissions: 20, total: 25 },
  ];

  const courseStats = [
    { course: 'Introduction to Computer Science', students: 25, avgGrade: 87, completion: 92 },
    { course: 'Database Systems', students: 20, avgGrade: 84, completion: 88 },
    { course: 'Advanced Programming', students: 18, avgGrade: 91, completion: 95 },
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
        {/* Pending Assignments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignments to Grade</h2>
          <div className="space-y-4">
            {pendingAssignments.map((assignment, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                    <p className="text-sm text-gray-600">{assignment.course}</p>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {assignment.submissions}/{assignment.total} submitted
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(assignment.submissions / assignment.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Course Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Performance</h2>
          <div className="space-y-4">
            {courseStats.map((course, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{course.course}</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Students</p>
                    <p className="font-semibold">{course.students}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Grade</p>
                    <p className="font-semibold">{course.avgGrade}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Completion</p>
                    <p className="font-semibold">{course.completion}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teaching Courses */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Courses</h2>
        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses?.data?.slice(0, 3).map((course: any) => (
              <div key={course.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-medium text-gray-900 mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{course.credits} credits</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {course.enrollments?.length || 0} students
                  </span>
                  <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                    Manage →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}