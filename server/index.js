import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  createRoom,
  joinRoom,
  getRoom,
  handleDisconnect,
  updateSettings,
  startGame,
  startPlayPhase,
  initiateVote,
  castVote,
  restartLobby,
  getSanitizedState
} from './gameEngine.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

function broadcastRoomState(room) {
  if (!room) return;
  Object.values(room.players).forEach(player => {
    if (player.socketId) {
      const sanitized = getSanitizedState(room, player.id);
      io.to(player.socketId).emit('state_update', sanitized);
    }
  });
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', ({ hostName, avatarSeed }, callback) => {
    try {
      const { roomCode, player } = createRoom(hostName, avatarSeed);
      player.socketId = socket.id;
      socket.join(roomCode);
      const room = getRoom(roomCode);
      broadcastRoomState(room);
      callback?.({ success: true, roomCode, sessionId: player.sessionId, playerId: player.id });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  // Join Room
  socket.on('join_room', ({ roomCode, name, avatarSeed, sessionId }, callback) => {
    try {
      const { roomCode: formattedCode, player, isReconnect } = joinRoom(roomCode, name, avatarSeed, sessionId);
      player.socketId = socket.id;
      socket.join(formattedCode);
      const room = getRoom(formattedCode);
      broadcastRoomState(room);
      callback?.({
        success: true,
        roomCode: formattedCode,
        sessionId: player.sessionId,
        playerId: player.id,
        isReconnect
      });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  // Reconnect Session
  socket.on('reconnect_session', ({ roomCode, sessionId }, callback) => {
    try {
      const room = getRoom(roomCode);
      if (!room) throw new Error('Room expired or not found.');

      const player = Object.values(room.players).find(p => p.sessionId === sessionId);
      if (!player) throw new Error('Session invalid.');

      player.socketId = socket.id;
      player.isConnected = true;
      socket.join(room.roomCode);

      broadcastRoomState(room);
      callback?.({ success: true, roomCode: room.roomCode, playerId: player.id });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  // Update Settings
  socket.on('update_settings', ({ roomCode, playerId, settings }) => {
    try {
      const room = updateSettings(roomCode, playerId, settings);
      broadcastRoomState(room);
    } catch (err) {
      socket.emit('error_message', err.message);
    }
  });

  // Start Game
  socket.on('start_game', ({ roomCode, playerId, topicOverride }) => {
    try {
      const room = startGame(roomCode, playerId, topicOverride);
      broadcastRoomState(room);
    } catch (err) {
      socket.emit('error_message', err.message);
    }
  });

  // Start Play Phase from Reveal
  socket.on('start_play', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (room) {
      startPlayPhase(roomCode);
      broadcastRoomState(room);
    }
  });

  // Initiate Vote
  socket.on('initiate_vote', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (room) {
      initiateVote(roomCode);
      broadcastRoomState(room);
    }
  });

  // Cast Vote
  socket.on('cast_vote', ({ roomCode, playerId, targetPlayerId }) => {
    try {
      const room = castVote(roomCode, playerId, targetPlayerId);
      broadcastRoomState(room);
    } catch (err) {
      socket.emit('error_message', err.message);
    }
  });

  // Next Round from Round Result
  socket.on('next_round', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (room) {
      room.phase = 'PLAY';
      room.voteSummary = null;
      room.ejectedPlayer = null;
      broadcastRoomState(room);
    }
  });

  // Restart Lobby
  socket.on('restart_lobby', ({ roomCode, playerId }) => {
    try {
      const room = restartLobby(roomCode, playerId);
      broadcastRoomState(room);
    } catch (err) {
      socket.emit('error_message', err.message);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const result = handleDisconnect(socket.id);
    if (result) {
      const room = getRoom(result.roomCode);
      if (room) {
        broadcastRoomState(room);
      }
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
