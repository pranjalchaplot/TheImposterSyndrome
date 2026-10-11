import { io, Socket } from 'socket.io-client';
import { GameSettings } from '../types';

const SERVER_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });
    }
    return this.socket;
  }

  public getSocket(): Socket {
    return this.connect();
  }

  public createRoom(hostName: string, avatarSeed: number): Promise<{ roomCode: string; sessionId: string; playerId: string }> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit('create_room', { hostName, avatarSeed }, (res: any) => {
        if (res?.success) {
          resolve({ roomCode: res.roomCode, sessionId: res.sessionId, playerId: res.playerId });
        } else {
          reject(new Error(res?.error || 'Failed to create room'));
        }
      });
    });
  }

  public joinRoom(roomCode: string, name: string, avatarSeed: number, sessionId?: string): Promise<{ roomCode: string; sessionId: string; playerId: string }> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit('join_room', { roomCode, name, avatarSeed, sessionId }, (res: any) => {
        if (res?.success) {
          resolve({ roomCode: res.roomCode, sessionId: res.sessionId, playerId: res.playerId });
        } else {
          reject(new Error(res?.error || 'Failed to join room'));
        }
      });
    });
  }

  public reconnectSession(roomCode: string, sessionId: string): Promise<{ roomCode: string; playerId: string }> {
    return new Promise((resolve, reject) => {
      const socket = this.getSocket();
      socket.emit('reconnect_session', { roomCode, sessionId }, (res: any) => {
        if (res?.success) {
          resolve({ roomCode: res.roomCode, playerId: res.playerId });
        } else {
          reject(new Error(res?.error || 'Failed to reconnect session'));
        }
      });
    });
  }

  public updateSettings(roomCode: string, playerId: string, settings: GameSettings) {
    this.getSocket().emit('update_settings', { roomCode, playerId, settings });
  }

  public startGame(roomCode: string, playerId: string, topicOverride?: any) {
    this.getSocket().emit('start_game', { roomCode, playerId, topicOverride });
  }

  public startPlay(roomCode: string) {
    this.getSocket().emit('start_play', { roomCode });
  }

  public initiateVote(roomCode: string) {
    this.getSocket().emit('initiate_vote', { roomCode });
  }

  public castVote(roomCode: string, playerId: string, targetPlayerId: string | 'SKIP') {
    this.getSocket().emit('cast_vote', { roomCode, playerId, targetPlayerId });
  }

  public nextRound(roomCode: string) {
    this.getSocket().emit('next_round', { roomCode });
  }

  public restartLobby(roomCode: string, playerId: string) {
    this.getSocket().emit('restart_lobby', { roomCode, playerId });
  }
}

export const socketService = new SocketService();
