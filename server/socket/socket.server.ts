import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { socketManager } from './socket.manager';
import { eventBus } from '../../services/event-bus';

export function initializeWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    // Assign a temporary ID until client identifies itself
    let userId = 'temp_' + Math.random().toString(36).substring(7);
    
    // Heartbeat setup
    (ws as any).isAlive = true;
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    socketManager.addConnection(userId, ws);

    ws.on('message', (message: string) => {
      try {
        const parsed = JSON.parse(message.toString());
        
        switch (parsed.type) {
          case 'identify':
            if (parsed.userId) {
              socketManager.removeConnection(userId);
              userId = parsed.userId;
              socketManager.addConnection(userId, ws);
            }
            break;
          case 'subscribe':
            if (parsed.marketId) {
              socketManager.subscribe(userId, parsed.marketId);
            }
            break;
          case 'unsubscribe':
            if (parsed.marketId) {
              socketManager.unsubscribe(userId, parsed.marketId);
            }
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (e) {
        console.error('Invalid WS message', e);
      }
    });

    ws.on('close', () => {
      socketManager.removeConnection(userId);
    });
  });

  // Heartbeat interval to remove dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        return ws.terminate();
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Wire up event bus to socket manager
  eventBus.on('trade_executed', (payload) => {
    socketManager.broadcastToMarket(payload.marketId, 'trade_executed', payload);
  });

  eventBus.on('price_updated', (payload) => {
    socketManager.broadcastToMarket(payload.marketId, 'price_updated', payload);
  });
}
