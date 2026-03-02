import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from '../../src/websocket/events.gateway';
import { WebsocketService } from '../../src/websocket/websocket.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let websocketService: WebsocketService;

  const mockWebsocketService = {
    handleConnection: jest.fn(),
    handleDisconnect: jest.fn(),
    subscribeToRoom: jest.fn(),
    unsubscribeFromRoom: jest.fn(),
    sendToRoom: jest.fn(),
    sendToUser: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
    },
  };

  const mockSocket = {
    id: 'socket-123',
    handshake: {
      auth: {
        token: 'valid-token',
      },
    },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        {
          provide: WebsocketService,
          useValue: mockWebsocketService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    websocketService = module.get<WebsocketService>(WebsocketService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should handle client connection with valid token', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 1,
        username: 'testuser',
      });

      await gateway.handleConnection(mockSocket as any);

      expect(mockWebsocketService.handleConnection).toHaveBeenCalledWith(
        mockSocket.id,
        1,
      );
    });

    it('should disconnect client with invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', () => {
      gateway.handleDisconnect(mockSocket as any);

      expect(mockWebsocketService.handleDisconnect).toHaveBeenCalledWith(
        mockSocket.id,
      );
    });
  });

  describe('handleSubscribe', () => {
    it('should subscribe client to room', async () => {
      const payload = { room: 'orders' };

      await gateway.handleSubscribe(mockSocket as any, payload);

      expect(mockSocket.join).toHaveBeenCalledWith('orders');
      expect(mockWebsocketService.subscribeToRoom).toHaveBeenCalledWith(
        mockSocket.id,
        'orders',
      );
    });
  });

  describe('handleUnsubscribe', () => {
    it('should unsubscribe client from room', async () => {
      const payload = { room: 'orders' };

      await gateway.handleUnsubscribe(mockSocket as any, payload);

      expect(mockSocket.leave).toHaveBeenCalledWith('orders');
      expect(mockWebsocketService.unsubscribeFromRoom).toHaveBeenCalledWith(
        mockSocket.id,
        'orders',
      );
    });
  });
});
