import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedClients: Map<string, { socket: Socket; userId: number; siteId?: number }> = new Map();

  /**
   * 客户端连接
   */
  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    
    // 从查询参数中获取token
    const token = client.handshake.auth.token || client.handshake.query.token;
    
    if (!token) {
      console.log('No token provided, disconnecting client');
      client.disconnect();
      return;
    }

    try {
      // TODO: 验证token并获取用户信息
      // const user = await this.validateToken(token);
      // this.connectedClients.set(client.id, { socket: client, userId: user.id, siteId: user.siteId });
      
      // 临时处理：直接存储
      this.connectedClients.set(client.id, { socket: client, userId: 0 });
      
      client.emit('connected', { message: '连接成功', clientId: client.id });
    } catch (error) {
      console.error('Token validation failed:', error);
      client.disconnect();
    }
  }

  /**
   * 客户端断开连接
   */
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * 订阅站点数据
   */
  @SubscribeMessage('subscribe:site')
  handleSubscribeSite(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { siteId: number },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.siteId = data.siteId;
      client.join(`site:${data.siteId}`);
      client.emit('subscribed', { siteId: data.siteId, message: '订阅成功' });
    }
  }

  /**
   * 取消订阅站点数据
   */
  @SubscribeMessage('unsubscribe:site')
  handleUnsubscribeSite(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { siteId: number },
  ) {
    client.leave(`site:${data.siteId}`);
    client.emit('unsubscribed', { siteId: data.siteId, message: '取消订阅成功' });
  }

  /**
   * 订阅告警
   */
  @SubscribeMessage('subscribe:alarms')
  handleSubscribeAlarms(@ConnectedSocket() client: Socket) {
    client.join('alarms');
    client.emit('subscribed', { channel: 'alarms', message: '订阅告警成功' });
  }

  /**
   * 订阅通知
   */
  @SubscribeMessage('subscribe:notifications')
  handleSubscribeNotifications(@ConnectedSocket() client: Socket) {
    client.join('notifications');
    client.emit('subscribed', { channel: 'notifications', message: '订阅通知成功' });
  }

  /**
   * 心跳检测
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  // ==================== 服务端推送方法 ====================

  /**
   * 推送告警到所有订阅的客户端
   */
  sendAlarm(alarm: any) {
    this.server.to('alarms').emit('alarm:new', alarm);
    
    // 如果告警关联了站点，也推送到站点频道
    if (alarm.siteId) {
      this.server.to(`site:${alarm.siteId}`).emit('alarm:new', alarm);
    }
  }

  /**
   * 推送告警更新
   */
  sendAlarmUpdate(alarm: any) {
    this.server.to('alarms').emit('alarm:update', alarm);
    
    if (alarm.siteId) {
      this.server.to(`site:${alarm.siteId}`).emit('alarm:update', alarm);
    }
  }

  /**
   * 推送通知到指定用户
   */
  sendNotificationToUser(userId: number, notification: any) {
    // 查找该用户的所有连接
    this.connectedClients.forEach((clientInfo) => {
      if (clientInfo.userId === userId) {
        clientInfo.socket.emit('notification:new', notification);
      }
    });
  }

  /**
   * 推送通知到所有用户
   */
  sendNotificationToAll(notification: any) {
    this.server.to('notifications').emit('notification:new', notification);
  }

  /**
   * 推送生产数据更新
   */
  sendProductionUpdate(siteId: number, data: any) {
    this.server.to(`site:${siteId}`).emit('production:update', data);
  }

  /**
   * 推送任务状态更新
   */
  sendTaskUpdate(siteId: number, task: any) {
    this.server.to(`site:${siteId}`).emit('task:update', task);
  }

  /**
   * 推送订单状态更新
   */
  sendOrderUpdate(siteId: number, order: any) {
    this.server.to(`site:${siteId}`).emit('order:update', order);
  }

  /**
   * 推送车辆状态更新
   */
  sendVehicleUpdate(siteId: number, vehicle: any) {
    this.server.to(`site:${siteId}`).emit('vehicle:update', vehicle);
  }

  /**
   * 推送库存变动
   */
  sendInventoryUpdate(siteId: number, inventory: any) {
    this.server.to(`site:${siteId}`).emit('inventory:update', inventory);
  }

  /**
   * 推送仪表盘数据更新
   */
  sendDashboardUpdate(siteId: number, data: any) {
    this.server.to(`site:${siteId}`).emit('dashboard:update', data);
  }

  /**
   * 获取在线用户数
   */
  getOnlineUsersCount(): number {
    return this.connectedClients.size;
  }

  /**
   * 获取站点在线用户数
   */
  getSiteOnlineUsersCount(siteId: number): number {
    let count = 0;
    this.connectedClients.forEach((clientInfo) => {
      if (clientInfo.siteId === siteId) {
        count++;
      }
    });
    return count;
  }

  /**
   * 广播系统消息
   */
  broadcastSystemMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    this.server.emit('system:message', {
      message,
      level,
      timestamp: new Date().toISOString(),
    });
  }
}
