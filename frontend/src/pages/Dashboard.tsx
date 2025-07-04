import { useAuth } from '../contexts/AuthContext';
import { StudentDashboard } from '../components/dashboards/StudentDashboard';
import { LecturerDashboard } from '../components/dashboards/LecturerDashboard';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';

export function Dashboard() {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'student':
        return <StudentDashboard />;
      case 'lecturer':
        return <LecturerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-1">Here's what's happening in your courses today.</p>
      </div>
      {renderDashboard()}
    </div>
  );
}