import crypto from 'crypto';

// In-memory WORD_BANK fallback
const WORD_BANK = {
  "Kitchen": ["Toaster", "Blender", "Refrigerator", "Microwave", "Dishwasher", "Oven", "Kettle", "Spatula", "Frying Pan", "Knife Block", "Cutting Board", "Coffee Maker", "Mixer", "Whisk"],
  "School": ["Blackboard", "Chalk", "Desk", "Textbook", "Backpack", "Pencil Case", "Teacher", "Principal", "Homework", "Library", "Cafeteria", "Ruler", "Notebook"],
  "Beach": ["Sandcastle", "Sunscreen", "Surfboard", "Towel", "Umbrella", "Seagull", "Crab", "Ocean", "Lifeguard", "Ice Cream", "Flip Flops", "Shell"],
  "Space": ["Astronaut", "Rocket", "Moon", "Sun", "Black Hole", "Satellite", "Meteor", "Alien", "Spacesuit", "Telescope", "Galaxy", "Mars", "Star"],
  "Hospital": ["Doctor", "Nurse", "Stethoscope", "Wheelchair", "Ambulance", "Bandage", "Syringe", "X-Ray", "Patient", "Thermometer", "Medicine"],
  "Cinema": ["Popcorn", "Ticket", "Screen", "Projector", "3D Glasses", "Seat", "Trailer", "Actor", "Director", "Red Carpet"],
  "Supermarket": ["Trolley", "Cashier", "Barcode Scanner", "Vegetables", "Freezer", "Receipt", "Basket", "Checkout", "Discount"],
  "Pirate Ship": ["Captain", "Parrot", "Treasure Chest", "Map", "Cannon", "Anchor", "Sail", "Eye Patch", "Peg Leg", "Sword", "Compass"],
  "Zoo": ["Lion", "Tiger", "Elephant", "Giraffe", "Zebra", "Monkey", "Penguin", "Panda", "Bear", "Kangaroo", "Gorilla"]
};

// Store rooms in memory
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'IMPS-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getRoom(roomCode) {
  return rooms.get(roomCode?.toUpperCase());
}

export function createRoom(hostName, avatarSeed) {
  let roomCode = generateRoomCode();
  while (rooms.has(roomCode)) {
    roomCode = generateRoomCode();
  }

  const hostId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();

  const hostPlayer = {
    id: hostId,
    sessionId,
    socketId: null,
    name: hostName || 'Host',
    avatarSeed: avatarSeed || Math.floor(Math.random() * 1000),
    isHost: true,
    isConnected: true,
    isDead: false,
    role: 'CREW',
    votedFor: null
  };

  const room = {
    roomCode,
    phase: 'LOBBY',
    hostPlayerId: hostId,
    players: {
      [hostId]: hostPlayer
    },
    settings: {
      timerDuration: 0,
      imposterCount: 1,
      revealRoleOnDeath: true,
      imposterTeaming: false,
      targetCategory: 'LOCAL_RANDOM',
      extraRoles: { jesterEnabled: false },
      enableAdultMode: false
    },
    gameData: null,
    timerRemaining: 0,
    timerInterval: null,
    winner: null,
    ejectedPlayer: null,
    voteSummary: null,
    disconnectTimers: new Map()
  };

  rooms.set(roomCode, room);

  return { roomCode, player: hostPlayer };
}

export function joinRoom(roomCode, name, avatarSeed, existingSessionId = null) {
  const formattedCode = roomCode?.toUpperCase();
  const room = rooms.get(formattedCode);
  if (!room) {
    throw new Error('Room not found. Please check the room code.');
  }

  if (room.phase !== 'LOBBY' && !existingSessionId) {
    throw new Error('Game already in progress.');
  }

  // Check if player is reconnecting via sessionId
  if (existingSessionId) {
    const existingPlayer = Object.values(room.players).find(p => p.sessionId === existingSessionId);
    if (existingPlayer) {
      existingPlayer.isConnected = true;
      if (room.disconnectTimers.has(existingPlayer.id)) {
        clearTimeout(room.disconnectTimers.get(existingPlayer.id));
        room.disconnectTimers.delete(existingPlayer.id);
      }
      return { roomCode: formattedCode, player: existingPlayer, isReconnect: true };
    }
  }

  if (Object.keys(room.players).length >= 15) {
    throw new Error('Room is full (max 15 players).');
  }

  const playerId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();

  const newPlayer = {
    id: playerId,
    sessionId,
    socketId: null,
    name: name || `Player ${Object.keys(room.players).length + 1}`,
    avatarSeed: avatarSeed || Math.floor(Math.random() * 1000),
    isHost: false,
    isConnected: true,
    isDead: false,
    role: 'CREW',
    votedFor: null
  };

  room.players[playerId] = newPlayer;

  return { roomCode: formattedCode, player: newPlayer, isReconnect: false };
}

export function handleDisconnect(socketId) {
  for (const [roomCode, room] of rooms.entries()) {
    const player = Object.values(room.players).find(p => p.socketId === socketId);
    if (!player) continue;

    player.isConnected = false;

    // Grace period for reconnection (60 seconds)
    const timeout = setTimeout(() => {
      if (!player.isConnected && room.players[player.id]) {
        delete room.players[player.id];

        // Host migration if host left permanently
        if (player.isHost && Object.keys(room.players).length > 0) {
          const remainingPlayers = Object.values(room.players);
          const activePlayer = remainingPlayers.find(p => p.isConnected) || remainingPlayers[0];
          if (activePlayer) {
            activePlayer.isHost = true;
            room.hostPlayerId = activePlayer.id;
          }
        }

        // Clean up empty room
        if (Object.keys(room.players).length === 0) {
          if (room.timerInterval) clearInterval(room.timerInterval);
          rooms.delete(roomCode);
        }
      }
    }, 60000);

    room.disconnectTimers.set(player.id, timeout);
    return { roomCode, player };
  }
  return null;
}

export function updateSettings(roomCode, playerId, newSettings) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Room not found');
  if (room.hostPlayerId !== playerId) throw new Error('Only the host can update settings');

  room.settings = { ...room.settings, ...newSettings };
  return room;
}

export function startGame(roomCode, playerId, topicOverride = null) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Room not found');
  if (room.hostPlayerId !== playerId) throw new Error('Only the host can start the game');

  const playerList = Object.values(room.players);
  if (playerList.length < 3) {
    throw new Error('Minimum 3 players required to start.');
  }

  room.phase = 'LOADING';

  // Topic generation
  let gameData = topicOverride;
  if (!gameData) {
    const categories = Object.keys(WORD_BANK);
    let category = room.settings.targetCategory;
    if (category === 'LOCAL_RANDOM' || !WORD_BANK[category]) {
      category = categories[Math.floor(Math.random() * categories.length)];
    }
    const words = WORD_BANK[category];
    const word = words[Math.floor(Math.random() * words.length)];
    gameData = { category, word };
  }

  room.gameData = gameData;
  room.winner = null;
  room.ejectedPlayer = null;
  room.voteSummary = null;

  // Reset player round states & assign secret roles
  const playerIds = Object.keys(room.players);

  // Fisher-Yates shuffle
  for (let i = playerIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
  }

  const imposterCount = Math.min(room.settings.imposterCount, Math.floor(playerIds.length / 2));
  const imposterSet = new Set(playerIds.slice(0, imposterCount));

  let jesterId = null;
  if (room.settings.extraRoles.jesterEnabled) {
    const nonImposters = playerIds.filter(id => !imposterSet.has(id));
    if (nonImposters.length > 0) {
      jesterId = nonImposters[Math.floor(Math.random() * nonImposters.length)];
    }
  }

  Object.values(room.players).forEach(p => {
    p.isDead = false;
    p.votedFor = null;
    if (imposterSet.has(p.id)) {
      p.role = 'IMPOSTER';
    } else if (p.id === jesterId) {
      p.role = 'JESTER';
    } else {
      p.role = 'CREW';
    }
  });

  room.phase = 'REVEAL';
  return room;
}

export function startPlayPhase(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.phase = 'PLAY';
  if (room.settings.timerDuration > 0) {
    room.timerRemaining = room.settings.timerDuration;
  }
}

export function initiateVote(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.phase = 'VOTING';
  Object.values(room.players).forEach(p => {
    p.votedFor = null;
  });
}

export function castVote(roomCode, playerId, targetPlayerId) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'VOTING') throw new Error('Not in voting phase');

  const player = room.players[playerId];
  if (!player || player.isDead) throw new Error('Dead players cannot vote');

  player.votedFor = targetPlayerId; // string (player ID) or 'SKIP'

  // Check if all active living players have voted
  const activeLiving = Object.values(room.players).filter(p => !p.isDead && p.isConnected);
  const totalVotes = activeLiving.filter(p => p.votedFor !== null).length;

  if (totalVotes >= activeLiving.length) {
    resolveVotes(room);
  }

  return room;
}

export function resolveVotes(room) {
  const activeLiving = Object.values(room.players).filter(p => !p.isDead);
  const voteCounts = { SKIP: 0 };
  activeLiving.forEach(p => {
    if (p.votedFor) {
      voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
    }
  });

  let topTarget = null;
  let maxVotes = 0;
  let isTie = false;

  for (const [target, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      topTarget = target;
      isTie = false;
    } else if (count === maxVotes && count > 0) {
      isTie = true;
    }
  }

  let outcomeText = '';
  let ejectedPlayer = null;

  if (isTie || topTarget === 'SKIP' || maxVotes === 0) {
    outcomeText = isTie ? 'The vote resulted in a tie! No one was ejected.' : 'The crew skipped ejection this round.';
  } else if (topTarget && room.players[topTarget]) {
    const p = room.players[topTarget];
    p.isDead = true;
    ejectedPlayer = {
      id: p.id,
      name: p.name,
      isImposter: room.settings.revealRoleOnDeath ? (p.role === 'IMPOSTER') : undefined,
      extraRole: room.settings.revealRoleOnDeath ? (p.role === 'JESTER' ? 'JESTER' : null) : undefined
    };
    outcomeText = `${p.name} was ejected!`;
  }

  room.ejectedPlayer = ejectedPlayer;
  room.voteSummary = {
    votes: voteCounts,
    totalVotesCast: activeLiving.filter(p => p.votedFor !== null).length,
    totalActivePlayers: activeLiving.length,
    ejectedPlayerId: isTie ? 'TIE' : (topTarget || 'SKIP'),
    ejectedPlayerName: ejectedPlayer?.name,
    outcomeText
  };

  room.phase = 'ROUND_RESULT';

  // Check Win Conditions
  checkWinCondition(room);
}

function checkWinCondition(room) {
  if (room.ejectedPlayer) {
    const ejected = Object.values(room.players).find(p => p.id === room.ejectedPlayer.id);
    if (ejected?.role === 'JESTER') {
      room.winner = 'JESTER';
      room.phase = 'GAME_OVER';
      return;
    }
  }

  const activePlayers = Object.values(room.players).filter(p => !p.isDead);
  const activeImposters = activePlayers.filter(p => p.role === 'IMPOSTER').length;
  const activeCrew = activePlayers.filter(p => p.role !== 'IMPOSTER').length;

  if (activeImposters === 0) {
    room.winner = 'CREW';
    room.phase = 'GAME_OVER';
  } else if (activeImposters >= activeCrew) {
    room.winner = 'IMPOSTER';
    room.phase = 'GAME_OVER';
  }
}

export function restartLobby(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Room not found');
  if (room.hostPlayerId !== playerId) throw new Error('Only host can restart lobby');

  room.phase = 'LOBBY';
  room.gameData = null;
  room.winner = null;
  room.ejectedPlayer = null;
  room.voteSummary = null;

  Object.values(room.players).forEach(p => {
    p.isDead = false;
    p.votedFor = null;
  });

  return room;
}

// Strictly sanitized output per target player for zero data leakage
export function getSanitizedState(room, targetPlayerId) {
  const targetPlayer = room.players[targetPlayerId];
  const isImposter = targetPlayer?.role === 'IMPOSTER';
  const isGameOver = room.phase === 'GAME_OVER';

  // Secret word: strictly null unless player is CREW or game is over
  const secretWord = (targetPlayer?.role === 'CREW' || isGameOver) ? room.gameData?.word : null;
  const category = room.gameData?.category || null;

  let teammates = [];
  if (isImposter && room.settings.imposterTeaming) {
    teammates = Object.values(room.players)
      .filter(p => p.role === 'IMPOSTER' && p.id !== targetPlayerId)
      .map(p => p.name);
  }

  const sanitizedPlayers = Object.values(room.players).map(p => {
    let role;
    if (isGameOver) {
      role = p.role;
    } else if (p.id === targetPlayerId) {
      role = p.role;
    } else if (isImposter && room.settings.imposterTeaming && p.role === 'IMPOSTER') {
      role = 'IMPOSTER';
    }

    return {
      id: p.id,
      name: p.name,
      avatarSeed: p.avatarSeed,
      isHost: p.isHost,
      isConnected: p.isConnected,
      isDead: p.isDead,
      hasVoted: p.votedFor !== null,
      role
    };
  });

  return {
    roomCode: room.roomCode,
    phase: room.phase,
    myPlayerId: targetPlayerId,
    players: sanitizedPlayers,
    settings: room.settings,
    category,
    secretWord, // Null for Imposter/Jester!
    myRole: targetPlayer?.role || null,
    teammates,
    timerRemaining: room.timerRemaining,
    winner: room.winner,
    ejectedPlayer: room.ejectedPlayer,
    voteSummary: room.voteSummary,
    trueGameData: isGameOver ? room.gameData : null
  };
}
