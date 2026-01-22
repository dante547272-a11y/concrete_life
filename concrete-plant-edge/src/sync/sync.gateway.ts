import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/edge',
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SyncGateway.name);
  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`客户端连接: ${client.id}`);
    this.connectedClients.set(client.id, client);
    
    // 发送连接确认
    client.emit('connected', {
      message: '边缘节点连接成功',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`客户端断开: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * 广播实时数据
   */
  broadcastRealTimeData(data: any) {
    this.server.emit('realtime-data', {
      type: 'realtime',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 广播告警信息
   */
  broadcastAlarm(alarm: any) {
    this.server.emit('alarm', {
      type: 'alarm',
      alarm,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 广播系统状态
   */
  broadcastSystemStatus(status: any) {
    this.server.emit('system-status', {
      type: 'system',
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 处理远程控制指令
   */
  @SubscribeMessage('control-command')
  handleControlCommand(
    @MessageBody() command: any,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`收到控制指令: ${command.type} from ${client.id}`);
    
    // 这里可以调用相应的控制服务
    // 返回执行结果
    return {
      success: true,
      message: `指令 ${command.type} 已接收`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 处理配置更新
   */
  @SubscribeMessage('config-update')
  handleConfigUpdate(
    @MessageBody() config: any,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`收到配置更新: ${client.id}`);
    
    // 广播配置更新给所有客户端
    this.server.emit('config-updated', {
      config,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: '配置更新成功',
    };
  }

  /**
   * 获取连接的客户端数量
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * 向特定客户端发送消息
   */
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
      return true;
    }
    return false;
  }
}