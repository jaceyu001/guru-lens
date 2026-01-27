/**
 * Scan Progress Event Emitter
 * 
 * Manages WebSocket connections and broadcasts scan progress updates
 * to all connected clients in real-time.
 */

import { EventEmitter } from 'events';

export interface ScanProgressUpdate {
  scanJobId: number;
  phase: 'screening' | 'ranking' | 'llm_analysis' | 'completed' | 'failed';
  processedStocks: number;
  opportunitiesFound: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: number;
  errorMessage?: string;
}

class ScanProgressEmitter extends EventEmitter {
  private static instance: ScanProgressEmitter;
  private clientConnections: Map<string, Set<number>> = new Map(); // clientId -> scanJobIds

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): ScanProgressEmitter {
    if (!ScanProgressEmitter.instance) {
      ScanProgressEmitter.instance = new ScanProgressEmitter();
    }
    return ScanProgressEmitter.instance;
  }

  /**
   * Emit progress update for a specific scan job
   */
  emitProgress(update: ScanProgressUpdate): void {
    console.log(`[ScanProgressEmitter] Emitting progress for scan ${update.scanJobId}:`, {
      phase: update.phase,
      processedStocks: update.processedStocks,
      opportunitiesFound: update.opportunitiesFound,
    });
    
    // Emit to all listeners subscribed to this scan job
    this.emit(`scan:${update.scanJobId}`, update);
    
    // Also emit to a global channel for monitoring
    this.emit('scan:progress', update);
  }

  /**
   * Subscribe to progress updates for a specific scan job
   */
  onProgress(scanJobId: number, callback: (update: ScanProgressUpdate) => void): () => void {
    const listener = callback;
    this.on(`scan:${scanJobId}`, listener);
    
    // Return unsubscribe function
    return () => {
      this.off(`scan:${scanJobId}`, listener);
    };
  }

  /**
   * Subscribe to all progress updates
   */
  onAnyProgress(callback: (update: ScanProgressUpdate) => void): () => void {
    const listener = callback;
    this.on('scan:progress', listener);
    
    return () => {
      this.off('scan:progress', listener);
    };
  }

  /**
   * Register a client connection for a scan job
   */
  registerClient(clientId: string, scanJobId: number): void {
    if (!this.clientConnections.has(clientId)) {
      this.clientConnections.set(clientId, new Set());
    }
    this.clientConnections.get(clientId)!.add(scanJobId);
    console.log(`[ScanProgressEmitter] Client ${clientId} registered for scan ${scanJobId}`);
  }

  /**
   * Unregister a client connection
   */
  unregisterClient(clientId: string, scanJobId?: number): void {
    if (scanJobId) {
      this.clientConnections.get(clientId)?.delete(scanJobId);
    } else {
      this.clientConnections.delete(clientId);
    }
    console.log(`[ScanProgressEmitter] Client ${clientId} unregistered`);
  }

  /**
   * Get all scan jobs for a client
   */
  getClientScans(clientId: string): number[] {
    return Array.from(this.clientConnections.get(clientId) || []);
  }
}

export const scanProgressEmitter = ScanProgressEmitter.getInstance();
