import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export interface GradeUpdateNotification {
  type: 'gradeUpdate';
  studentId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseName: string;
  grade: number;
  timestamp: string;
}

export interface EnrollmentUpdateNotification {
  type: 'enrollmentUpdate';
  studentId: string;
  courseId: string;
  courseName: string;
  action: 'enrolled' | 'unenrolled';
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userRole = payload.role;

      this.connectedUsers.set(client.userId, client);
      
      this.logger.log(`Client connected: ${client.id} (User: ${client.userId}, Role: ${client.userRole})`);
      
      // Send connection confirmation
      client.emit('connected', {
        message: 'Successfully connected to notifications',
        userId: client.userId,
        timestamp: new Date().toISOString(),
      });

      // Join user-specific room for targeted notifications
      client.join(`user:${client.userId}`);
      
      // Join role-specific rooms
      if (client.userRole) {
        client.join(`role:${client.userRole}`);
      }

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { events: string[] },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { events } = data;
    
    // Join specific event rooms
    events.forEach(event => {
      if (['gradeUpdate', 'enrollmentUpdate'].includes(event)) {
        client.join(`event:${event}`);
        this.logger.log(`Client ${client.id} subscribed to ${event}`);
      }
    });

    client.emit('subscribed', { events, timestamp: new Date().toISOString() });
  }

  // Method to emit grade update notifications
  emitGradeUpdate(notification: GradeUpdateNotification) {
    this.logger.log(`Emitting grade update for student ${notification.studentId}`);
    
    // Send to specific student
    this.server.to(`user:${notification.studentId}`).emit('gradeUpdate', notification);
    
    // Send to lecturers and admins
    this.server.to('role:lecturer').emit('gradeUpdate', notification);
    this.server.to('role:admin').emit('gradeUpdate', notification);
    
    // Log the emission
    this.logger.log(`Grade update notification sent: ${notification.assignmentTitle} - ${notification.grade}%`);
  }

  // Method to emit enrollment update notifications
  emitEnrollmentUpdate(notification: EnrollmentUpdateNotification) {
    this.logger.log(`Emitting enrollment update for student ${notification.studentId}`);
    
    // Send to specific student
    this.server.to(`user:${notification.studentId}`).emit('enrollmentUpdate', notification);
    
    // Send to lecturers and admins
    this.server.to('role:lecturer').emit('enrollmentUpdate', notification);
    this.server.to('role:admin').emit('enrollmentUpdate', notification);
    
    // Log the emission
    this.logger.log(`Enrollment update notification sent: ${notification.action} in ${notification.courseName}`);
  }

  // Method to get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Method to check if user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Method to send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
      this.logger.log(`Sent ${event} to user ${userId}`);
    } else {
      this.logger.warn(`User ${userId} not connected, cannot send ${event}`);
    }
  }

  // Method to broadcast to all connected users
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all connected users`);
  }
}