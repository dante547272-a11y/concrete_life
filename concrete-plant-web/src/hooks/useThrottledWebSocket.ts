/**
 * Throttled WebSocket hook for real-time data updates
 * Prevents UI from being overwhelmed by high-frequency updates
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { UpdateBatcher } from '../utils/performance';

export interface WebSocketConfig {
  url: string;
  token?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  throttleDelay?: number;
  batchDelay?: number;
}

export interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export interface ThrottledWebSocketReturn<T> {
  state: WebSocketState;
  data: T | null;
  subscribe: (event: string, handler: (data: unknown) => void) => void;
  unsubscribe: (event: string) => void;
  emit: (event: string, data: unknown) => void;
  disconnect: () => void;
  reconnect: () => void;
}

const DEFAULT_CONFIG: Required<Omit<WebSocketConfig, 'url' | 'token'>> = {
  reconnectAttempts: 10,
  reconnectDelay: 1000,
  throttleDelay: 100, // Throttle updates to max 10/second
  batchDelay: 50,     // Batch updates within 50ms window
};

/**
 * Hook for throttled WebSocket connections
 * Optimized for high-frequency industrial data streams
 */
export function useThrottledWebSocket<T = unknown>(
  config: WebSocketConfig
): ThrottledWebSocketReturn<T> {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, (data: unknown) => void>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const batcherRef = useRef<UpdateBatcher<{ event: string; data: unknown }> | null>(null);

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
  });

  // Data state for subscribers to use
  const [data, setData] = useState<T | null>(null);

  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // Initialize batcher for processing multiple updates
  useEffect(() => {
    batcherRef.current = new UpdateBatcher(
      (updates) => {
        // Process batched updates - use the latest data for each event type
        const latestByEvent = new Map<string, unknown>();
        updates.forEach(({ event, data: eventData }) => {
          latestByEvent.set(event, eventData);
        });

        // Trigger handlers with latest data
        latestByEvent.forEach((eventData, event) => {
          const handler = handlersRef.current.get(event);
          if (handler) {
            handler(eventData);
          }
          // Update data state for the main data event
          if (event === 'data' || event === 'plant:status') {
            setData(eventData as T);
          }
        });
      },
      fullConfig.batchDelay
    );

    return () => {
      batcherRef.current?.clear();
    };
  }, [fullConfig.batchDelay]);

  // Reconnection logic with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= fullConfig.reconnectAttempts) {
      setState(prev => ({
        ...prev,
        reconnecting: false,
        error: 'Max reconnection attempts reached',
      }));
      return;
    }

    setState(prev => ({ ...prev, reconnecting: true }));
    reconnectAttemptsRef.current++;

    const delay = Math.min(
      fullConfig.reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
      30000 // Max 30 seconds
    );

    setTimeout(() => {
      if (!socketRef.current?.connected) {
        socketRef.current?.connect();
      }
    }, delay);
  }, [fullConfig.reconnectAttempts, fullConfig.reconnectDelay]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(fullConfig.url, {
      auth: fullConfig.token ? { token: fullConfig.token } : undefined,
      transports: ['websocket'],
      reconnection: false, // We handle reconnection manually
    });

    socket.on('connect', () => {
      setState(prev => ({
        ...prev,
        connected: true,
        reconnecting: false,
        error: null,
      }));
      reconnectAttemptsRef.current = 0;
    });

    socket.on('disconnect', (reason) => {
      setState(prev => ({
        ...prev,
        connected: false,
        error: `Disconnected: ${reason}`,
      }));

      // Auto-reconnect if not intentional disconnect
      if (reason !== 'io client disconnect') {
        attemptReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      setState(prev => ({
        ...prev,
        connected: false,
        error: error.message,
      }));
      attemptReconnect();
    });

    // Set up catch-all listener for batching
    socket.onAny((event, eventData) => {
      batcherRef.current?.add({ event, data: eventData });
    });

    socketRef.current = socket;
  }, [fullConfig.url, fullConfig.token, attemptReconnect]);

  // Subscribe to specific events
  const subscribe = useCallback((event: string, handler: (data: unknown) => void) => {
    handlersRef.current.set(event, handler);
  }, []);

  // Unsubscribe from events
  const unsubscribe = useCallback((event: string) => {
    handlersRef.current.delete(event);
  }, []);

  // Emit events
  const emit = useCallback((event: string, eventData: unknown) => {
    socketRef.current?.emit(event, eventData);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setState({
      connected: false,
      reconnecting: false,
      error: null,
      lastUpdate: null,
    });
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    connect();
  }, [disconnect, connect]);

  // Initialize connection
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    state,
    data,
    subscribe,
    unsubscribe,
    emit,
    disconnect,
    reconnect,
  };
}

/**
 * Specialized hook for plant status updates
 * Pre-configured for equipment status data
 */
export interface PlantStatusData {
  aggregateBins?: unknown[];
  cementSilos?: unknown[];
  scales?: unknown[];
  mixer?: unknown;
  additiveTanks?: unknown[];
}

export function usePlantWebSocket(url: string, token?: string) {
  return useThrottledWebSocket<PlantStatusData>({
    url,
    token,
    throttleDelay: 100,  // Max 10 updates/second for plant status
    batchDelay: 50,
  });
}

export default useThrottledWebSocket;
