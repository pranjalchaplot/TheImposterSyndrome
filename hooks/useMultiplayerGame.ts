import { useState, useEffect, useCallback } from 'react';
import { SanitizedClientState, GameSettings } from '../types';
import { socketService } from '../services/socketService';

interface StoredSession {
  roomCode: string;
  sessionId: string;
  playerId: string;
  playerName: string;
}

export function useMultiplayerGame() {
  const [clientState, setClientState] = useState<SanitizedClientState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCodeFromUrl, setRoomCodeFromUrl] = useState<string | null>(null);

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCodeFromUrl(roomParam.toUpperCase());
    }
  }, []);

  // Connect socket and listen to events
  useEffect(() => {
    const socket = socketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);

      // Attempt auto-reconnect if session exists
      try {
        const saved = sessionStorage.getItem('imposter_multiplayer_session');
        if (saved) {
          const session: StoredSession = JSON.parse(saved);
          socketService.reconnectSession(session.roomCode, session.sessionId).catch(() => {
            sessionStorage.removeItem('imposter_multiplayer_session');
          });
        }
      } catch {
        sessionStorage.removeItem('imposter_multiplayer_session');
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleStateUpdate = (newState: SanitizedClientState) => {
      setClientState(newState);
    };

    const handleErrorMessage = (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('state_update', handleStateUpdate);
    socket.on('error_message', handleErrorMessage);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('state_update', handleStateUpdate);
      socket.off('error_message', handleErrorMessage);
    };
  }, []);

  const createRoom = useCallback(async (hostName: string, avatarSeed: number) => {
    try {
      setError(null);
      const res = await socketService.createRoom(hostName, avatarSeed);
      const sessionData: StoredSession = {
        roomCode: res.roomCode,
        sessionId: res.sessionId,
        playerId: res.playerId,
        playerName: hostName
      };
      sessionStorage.setItem('imposter_multiplayer_session', JSON.stringify(sessionData));
      
      // Update URL with room code
      const url = new URL(window.location.href);
      url.searchParams.set('room', res.roomCode);
      window.history.pushState({}, '', url.toString());

      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
      throw err;
    }
  }, []);

  const joinRoom = useCallback(async (roomCode: string, name: string, avatarSeed: number) => {
    try {
      setError(null);
      const savedSession = sessionStorage.getItem('imposter_multiplayer_session');
      let sessionId: string | undefined;
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed.roomCode === roomCode.toUpperCase()) {
            sessionId = parsed.sessionId;
          }
        } catch {}
      }

      const res = await socketService.joinRoom(roomCode, name, avatarSeed, sessionId);
      const sessionData: StoredSession = {
        roomCode: res.roomCode,
        sessionId: res.sessionId,
        playerId: res.playerId,
        playerName: name
      };
      sessionStorage.setItem('imposter_multiplayer_session', JSON.stringify(sessionData));

      // Update URL with room code
      const url = new URL(window.location.href);
      url.searchParams.set('room', res.roomCode);
      window.history.pushState({}, '', url.toString());

      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
      throw err;
    }
  }, []);

  const updateSettings = useCallback((settings: GameSettings) => {
    if (clientState?.roomCode && clientState?.myPlayerId) {
      socketService.updateSettings(clientState.roomCode, clientState.myPlayerId, settings);
    }
  }, [clientState]);

  const startGame = useCallback((topicOverride?: any) => {
    if (clientState?.roomCode && clientState?.myPlayerId) {
      socketService.startGame(clientState.roomCode, clientState.myPlayerId, topicOverride);
    }
  }, [clientState]);

  const startPlay = useCallback(() => {
    if (clientState?.roomCode) {
      socketService.startPlay(clientState.roomCode);
    }
  }, [clientState]);

  const initiateVote = useCallback(() => {
    if (clientState?.roomCode) {
      socketService.initiateVote(clientState.roomCode);
    }
  }, [clientState]);

  const castVote = useCallback((targetPlayerId: string | 'SKIP') => {
    if (clientState?.roomCode && clientState?.myPlayerId) {
      socketService.castVote(clientState.roomCode, clientState.myPlayerId, targetPlayerId);
    }
  }, [clientState]);

  const nextRound = useCallback(() => {
    if (clientState?.roomCode) {
      socketService.nextRound(clientState.roomCode);
    }
  }, [clientState]);

  const restartLobby = useCallback(() => {
    if (clientState?.roomCode && clientState?.myPlayerId) {
      socketService.restartLobby(clientState.roomCode, clientState.myPlayerId);
    }
  }, [clientState]);

  const leaveRoom = useCallback(() => {
    sessionStorage.removeItem('imposter_multiplayer_session');
    setClientState(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  }, []);

  return {
    clientState,
    isConnected,
    error,
    roomCodeFromUrl,
    createRoom,
    joinRoom,
    updateSettings,
    startGame,
    startPlay,
    initiateVote,
    castVote,
    nextRound,
    restartLobby,
    leaveRoom
  };
}
