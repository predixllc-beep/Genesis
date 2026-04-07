import { WebSocket } from 'ws';

class SocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();

  addConnection(userId: string, ws: WebSocket) {
    this.connections.set(userId, ws);
  }

  removeConnection(userId: string) {
    this.connections.delete(userId);
    // Remove user from all subscriptions
    for (const [marketId, users] of this.subscriptions.entries()) {
      users.delete(userId);
      if (users.size === 0) {
        this.subscriptions.delete(marketId);
      }
    }
  }

  subscribe(userId: string, marketId: string) {
    if (!this.subscriptions.has(marketId)) {
      this.subscriptions.set(marketId, new Set());
    }
    this.subscriptions.get(marketId)!.add(userId);
  }

  unsubscribe(userId: string, marketId: string) {
    const users = this.subscriptions.get(marketId);
    if (users) {
      users.delete(userId);
      if (users.size === 0) {
        this.subscriptions.delete(marketId);
      }
    }
  }

  broadcastToMarket(marketId: string, type: string, data: any) {
    const users = this.subscriptions.get(marketId);
    if (users) {
      const message = JSON.stringify({ type, data });
      users.forEach(userId => {
        const ws = this.connections.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  sendToUser(userId: string, type: string, data: any) {
    const ws = this.connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data }));
    }
  }
}

export const socketManager = new SocketManager();
