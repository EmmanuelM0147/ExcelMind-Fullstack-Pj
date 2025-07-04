import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketConfig {
  url: string;
  namespace?: string;
  autoConnect?: boolean;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

interface NotificationData {
  type: 'gradeUpdate' | 'enrollmentUpdate';
  timestamp: string;
  [key: string]: any;
}

export function useWebSocket(config: WebSocketConfig) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
  });

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionState(prev => ({
        ...prev,
        error: 'No authentication token found',
        isConnecting: false,
      }));
      return;
    }

    setConnectionState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    // Use the namespace directly with io() instead of appending to URL
    const namespace = config.namespace || '/';
    
    socketRef.current = io(namespace, {
      forceNew: true,
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Specify the server URL separately
      ...(config.url && { 
        hostname: new URL(config.url).hostname,
        port: new URL(config.url).port,
        secure: new URL(config.url).protocol === 'https:'
      })
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
      }));
    });

    socketRef.current.on('connected', (data) => {
      console.log('✅ Authentication successful:', data);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: `Disconnected: ${reason}`,
      }));
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error.message,
        reconnectAttempts: prev.reconnectAttempts + 1,
      }));
    });

    socketRef.current.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionState(prev => ({
        ...prev,
        error: error.message || 'WebSocket error',
      }));
    });

    // Notification event handlers
    socketRef.current.on('gradeUpdate', (data: NotificationData) => {
      console.log('📊 Grade update received:', data);
      setNotifications(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 notifications
    });

    socketRef.current.on('enrollmentUpdate', (data: NotificationData) => {
      console.log('📚 Enrollment update received:', data);
      setNotifications(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 notifications
    });

    // Ping/pong for connection health
    socketRef.current.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setConnectionState({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0,
    });
  };

  const sendPing = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    }
  };

  const subscribe = (events: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', { events });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (config.autoConnect !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [config.url, config.namespace]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    connectionState,
    notifications,
    connect,
    disconnect,
    sendPing,
    subscribe,
    clearNotifications,
    removeNotification,
    socket: socketRef.current,
  };
}