/**
 * WebSocket Server for Real-Time Scan Progress
 * 
 * Handles WebSocket connections and broadcasts scan progress updates
 * to connected clients in real-time.
 */

import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { scanProgressEmitter, ScanProgressUpdate } from './services/scanProgressEmitter';

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  scanJobId?: number;
  clientId?: string;
}

let wss: WebSocketServer | null = null;
const connectedClients = new Map<string, WebSocket>();

export function initializeWebSocket(server: Server): void {
  if (wss) {
    console.log('[WebSocket] WebSocket server already initialized');
    return;
  }

  wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const clientId = generateClientId();
    connectedClients.set(clientId, ws);
    
    console.log(`[WebSocket] Client ${clientId} connected. Total clients: ${connectedClients.size}`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: Date.now(),
    }));

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        if (message.type === 'subscribe' && message.scanJobId) {
          scanProgressEmitter.registerClient(clientId, message.scanJobId);
          ws.send(JSON.stringify({
            type: 'subscribed',
            scanJobId: message.scanJobId,
            timestamp: Date.now(),
          }));
          console.log(`[WebSocket] Client ${clientId} subscribed to scan ${message.scanJobId}`);
        } else if (message.type === 'unsubscribe' && message.scanJobId) {
          scanProgressEmitter.unregisterClient(clientId, message.scanJobId);
          ws.send(JSON.stringify({
            type: 'unsubscribed',
            scanJobId: message.scanJobId,
            timestamp: Date.now(),
          }));
        } else if (message.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now(),
          }));
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      connectedClients.delete(clientId);
      scanProgressEmitter.unregisterClient(clientId);
      console.log(`[WebSocket] Client ${clientId} disconnected. Total clients: ${connectedClients.size}`);
    });

    // Handle errors
    ws.on('error', (error: Error) => {
      console.error(`[WebSocket] Client ${clientId} error:`, error);
    });
  });

  // Subscribe to all progress updates and broadcast to connected clients
  scanProgressEmitter.onAnyProgress((update: ScanProgressUpdate) => {
    const message = JSON.stringify({
      type: 'progress',
      data: update,
      timestamp: Date.now(),
    });

    // Broadcast to all connected clients
    connectedClients.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        const subscribedScans = scanProgressEmitter.getClientScans(clientId);
        if (subscribedScans.includes(update.scanJobId)) {
          ws.send(message);
        }
      }
    });
  });

  console.log('[WebSocket] WebSocket server initialized on /api/ws');
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

export function broadcastProgress(update: ScanProgressUpdate): void {
  scanProgressEmitter.emitProgress(update);
}

function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
