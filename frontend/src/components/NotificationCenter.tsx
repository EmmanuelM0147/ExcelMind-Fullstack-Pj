import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  Bell, 
  BellRing, 
  X, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle,
  GraduationCap,
  BookOpen,
  Clock,
  Trash2
} from 'lucide-react';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState<any>(null);

  const { 
    connectionState, 
    notifications, 
    connect, 
    disconnect: _disconnect, 
    sendPing,
    subscribe,
    clearNotifications,
    removeNotification 
  } = useWebSocket({
    url: import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000',
    namespace: '/notifications',
    autoConnect: true,
  });

  // Subscribe to events when connected
  useEffect(() => {
    if (connectionState.isConnected) {
      subscribe(['gradeUpdate', 'enrollmentUpdate']);
    }
  }, [connectionState.isConnected, subscribe]);

  // Show toast for new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (latest !== latestNotification) {
        setLatestNotification(latest);
        setShowToast(true);
        
        // Auto-hide toast after 5 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
    }
  }, [notifications, latestNotification]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'gradeUpdate':
        return <GraduationCap className="h-4 w-4 text-blue-600" />;
      case 'enrollmentUpdate':
        return <BookOpen className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationMessage = (notification: any) => {
    switch (notification.type) {
      case 'gradeUpdate':
        return `New grade: ${notification.grade}% for "${notification.assignmentTitle}" in ${notification.courseName}`;
      case 'enrollmentUpdate':
        return `You have been ${notification.action} in "${notification.courseName}"`;
      default:
        return 'New notification received';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.length;

  return (
    <>
      {/* Notification Bell Button */}
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-6 w-6" />
          ) : (
            <Bell className="h-6 w-6" />
          )}
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Connection status indicator */}
          <div className="absolute -bottom-1 -right-1">
            {connectionState.isConnected ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
          </div>
        </button>

        {/* Notification Panel */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {/* Connection status */}
                  <div className="flex items-center space-x-1">
                    {connectionState.isConnected ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : connectionState.isConnecting ? (
                      <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {connectionState.isConnected ? 'Connected' : 
                       connectionState.isConnecting ? 'Connecting...' : 'Disconnected'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Connection controls */}
              <div className="mt-2 flex items-center space-x-2">
                {!connectionState.isConnected && (
                  <button
                    onClick={connect}
                    disabled={connectionState.isConnecting}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {connectionState.isConnecting ? 'Connecting...' : 'Reconnect'}
                  </button>
                )}
                
                <button
                  onClick={sendPing}
                  disabled={!connectionState.isConnected}
                  className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  Ping
                </button>

                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Error message */}
              {connectionState.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                  {connectionState.error}
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            {getNotificationMessage(notification)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeNotification(index)}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && latestNotification && (
        <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getNotificationIcon(latestNotification.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New Notification</p>
              <p className="text-sm text-gray-600 mt-1">
                {getNotificationMessage(latestNotification)}
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}