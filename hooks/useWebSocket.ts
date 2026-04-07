'use client';

import { useEffect, useRef, useCallback } from 'react';

type WSMessage = {
  type: string;
  data?: any;
  marketId?: string;
  userId?: string;
};

export function useWebSocket(userId?: string) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const subscriptions = useRef<Set<string>>(new Set());
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    const connect = () => {
      if (ws.current?.readyState === WebSocket.OPEN) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        
        if (userId) {
          ws.current?.send(JSON.stringify({ type: 'identify', userId }));
        }

        // Resubscribe to active markets
        subscriptions.current.forEach(marketId => {
          ws.current?.send(JSON.stringify({ type: 'subscribe', marketId }));
        });

        // Start ping interval
        const pingInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);

        (ws.current as any).pingInterval = pingInterval;
      };

      ws.current.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const handler = messageHandlers.current.get(parsed.type);
          if (handler) {
            handler(parsed.data);
          }
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        if ((ws.current as any)?.pingInterval) {
          clearInterval((ws.current as any).pingInterval);
        }
        
        // Auto reconnect
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error', error);
        ws.current?.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        if ((ws.current as any).pingInterval) {
          clearInterval((ws.current as any).pingInterval);
        }
        ws.current.close();
      }
    };
  }, [userId]);

  const subscribe = useCallback((marketId: string) => {
    subscriptions.current.add(marketId);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'subscribe', marketId }));
    }
  }, []);

  const unsubscribe = useCallback((marketId: string) => {
    subscriptions.current.delete(marketId);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'unsubscribe', marketId }));
    }
  }, []);

  const onMessage = useCallback((type: string, handler: (data: any) => void) => {
    messageHandlers.current.set(type, handler);
  }, []);

  return { subscribe, unsubscribe, onMessage };
}
