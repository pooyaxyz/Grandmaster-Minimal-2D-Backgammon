import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface InMemRoom {
  roomId: string;
  hostName: string;
  hostAvatar: string;
  guestName?: string;
  guestAvatar?: string;
  hostColor: string;
  status: 'waiting' | 'playing' | 'completed';
  gameState: any;
  lastUpdated: number;
  chatMessages: any[];
}

const rooms = new Map<string, InMemRoom>();
const matchmakingQueue: { id: string; name: string; avatar: string; timestamp: number }[] = [];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size, queued: matchmakingQueue.length });
  });

  // Create room
  app.post('/api/rooms', (req, res) => {
    const room = req.body as InMemRoom;
    if (!room || !room.roomId) {
      return res.status(400).json({ error: 'Invalid room data' });
    }
    rooms.set(room.roomId, room);
    res.status(201).json(room);
  });

  // Get room
  app.get('/api/rooms/:id', (req, res) => {
    const room = rooms.get(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  });

  // Update room
  app.put('/api/rooms/:id', (req, res) => {
    const room = req.body as InMemRoom;
    if (!room) return res.status(400).json({ error: 'Missing room body' });
    rooms.set(req.params.id, room);
    res.json(room);
  });

  // Sync game state
  app.post('/api/rooms/:id/state', (req, res) => {
    const room = rooms.get(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const { gameState } = req.body;
    room.gameState = gameState;
    room.lastUpdated = Date.now();
    res.json({ success: true, lastUpdated: room.lastUpdated });
  });

  // Post chat message
  app.post('/api/rooms/:id/chat', (req, res) => {
    const room = rooms.get(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const message = req.body;
    room.chatMessages.push(message);
    room.lastUpdated = Date.now();
    res.json({ success: true });
  });

  // Matchmaking queue
  app.post('/api/matchmaking/join', (req, res) => {
    const { id, name, avatar } = req.body;
    const existingIdx = matchmakingQueue.findIndex((p) => p.id === id);
    if (existingIdx !== -1) {
      matchmakingQueue.splice(existingIdx, 1);
    }

    if (matchmakingQueue.length > 0) {
      const opponent = matchmakingQueue.shift()!;
      const roomId = 'MATCH-' + Math.floor(1000 + Math.random() * 9000);
      const room: InMemRoom = {
        roomId,
        hostName: opponent.name,
        hostAvatar: opponent.avatar,
        guestName: name,
        guestAvatar: avatar,
        hostColor: 'white',
        status: 'playing',
        gameState: null,
        lastUpdated: Date.now(),
        chatMessages: [
          {
            id: 'match_start',
            sender: 'Arena Matchmaker',
            text: `Matched ${opponent.name} vs ${name}! Prepare to roll.`,
            timestamp: Date.now(),
          },
        ],
      };
      rooms.set(roomId, room);
      return res.json({ matched: true, roomId, opponentName: opponent.name, color: 'black' });
    }

    matchmakingQueue.push({ id, name, avatar, timestamp: Date.now() });
    res.json({ matched: false, queuePosition: matchmakingQueue.length });
  });

  // Check matchmaking status
  app.get('/api/matchmaking/status/:id', (req, res) => {
    const playerId = req.params.id;
    // Check if any room was created with this player as host
    for (const room of rooms.values()) {
      if (room.status === 'playing' && (room.hostName === playerId || room.guestName === playerId)) {
        return res.json({
          matched: true,
          roomId: room.roomId,
          opponentName: room.hostName === playerId ? room.guestName : room.hostName,
          color: room.hostName === playerId ? 'white' : 'black',
        });
      }
    }
    const inQueue = matchmakingQueue.some((p) => p.id === playerId);
    res.json({ matched: false, inQueue });
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Grandmaster Backgammon Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
