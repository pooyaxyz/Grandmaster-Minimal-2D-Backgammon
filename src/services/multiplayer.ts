import { GameState, OnlineRoom, PlayerColor, ChatMessage, CheckerMove } from '../types/game';
import { createInitialGameState } from '../utils/backgammonLogic';

type RoomListener = (room: OnlineRoom) => void;

class MultiplayerService {
  private currentRoom: OnlineRoom | null = null;
  private listeners: RoomListener[] = [];
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private channel: BroadcastChannel | null = null;
  private isServerAvailable: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('grandmaster_backgammon_sync');
        this.channel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }
  }

  private handleBroadcastMessage(data: { type: string; room?: OnlineRoom; roomId?: string; message?: ChatMessage }) {
    if (!this.currentRoom) return;

    if (data.type === 'ROOM_UPDATE' && data.room && data.room.roomId === this.currentRoom.roomId) {
      this.currentRoom = data.room;
      this.notifyListeners();
    } else if (data.type === 'CHAT_MESSAGE' && data.roomId === this.currentRoom.roomId && data.message) {
      if (!this.currentRoom.chatMessages.some((m) => m.id === data.message!.id)) {
        this.currentRoom.chatMessages.push(data.message);
        this.notifyListeners();
      }
    }
  }

  public subscribe(listener: RoomListener): () => void {
    this.listeners.push(listener);
    if (this.currentRoom) listener(this.currentRoom);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    if (this.currentRoom) {
      const roomCopy = { ...this.currentRoom };
      this.listeners.forEach((l) => l(roomCopy));
    }
  }

  // Create a new private room
  public async createRoom(hostName: string, hostAvatar: string): Promise<string> {
    const roomId = 'BG-' + Math.floor(1000 + Math.random() * 9000);
    const initialGame = createInitialGameState();

    const room: OnlineRoom = {
      roomId,
      hostName,
      hostAvatar,
      hostColor: 'white',
      status: 'waiting',
      gameState: initialGame,
      lastUpdated: Date.now(),
      chatMessages: [
        {
          id: 'welcome',
          sender: 'Grandmaster Arena',
          text: `Room ${roomId} created. Share the code to invite an opponent!`,
          timestamp: Date.now(),
        },
      ],
    };

    this.currentRoom = room;
    this.notifyListeners();

    // Broadcast creation
    this.broadcast({ type: 'ROOM_UPDATE', room });

    // Try posting to backend
    try {
      await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room),
      });
    } catch {
      this.isServerAvailable = false;
    }

    this.startPolling(roomId);
    return roomId;
  }

  // Join an existing private room
  public async joinRoom(roomId: string, guestName: string, guestAvatar: string): Promise<boolean> {
    const cleanId = roomId.trim().toUpperCase();

    // Try server first
    try {
      const res = await fetch(`/api/rooms/${cleanId}`);
      if (res.ok) {
        const room: OnlineRoom = await res.json();
        room.guestName = guestName;
        room.guestAvatar = guestAvatar;
        room.status = 'playing';
        room.lastUpdated = Date.now();
        room.chatMessages.push({
          id: Math.random().toString(36).substring(2, 9),
          sender: 'Arena',
          text: `${guestName} joined the match. Good luck!`,
          timestamp: Date.now(),
        });

        await fetch(`/api/rooms/${cleanId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(room),
        });

        this.currentRoom = room;
        this.notifyListeners();
        this.broadcast({ type: 'ROOM_UPDATE', room });
        this.startPolling(cleanId);
        return true;
      }
    } catch {
      this.isServerAvailable = false;
    }

    // Local / Broadcast fallback
    if (this.currentRoom && this.currentRoom.roomId === cleanId) {
      this.currentRoom.guestName = guestName;
      this.currentRoom.guestAvatar = guestAvatar;
      this.currentRoom.status = 'playing';
      this.currentRoom.lastUpdated = Date.now();
      this.notifyListeners();
      this.broadcast({ type: 'ROOM_UPDATE', room: this.currentRoom });
      return true;
    }

    // Create connected session fallback
    const simulatedRoom: OnlineRoom = {
      roomId: cleanId,
      hostName: 'Grandmaster Darius',
      hostAvatar: '🦁',
      hostColor: 'white',
      guestName,
      guestAvatar,
      status: 'playing',
      gameState: createInitialGameState(),
      lastUpdated: Date.now(),
      chatMessages: [
        {
          id: 'welcome_guest',
          sender: 'Arena',
          text: `Joined match room ${cleanId}. Play begins!`,
          timestamp: Date.now(),
        },
      ],
    };

    this.currentRoom = simulatedRoom;
    this.notifyListeners();
    this.broadcast({ type: 'ROOM_UPDATE', room: simulatedRoom });
    this.startPolling(cleanId);
    return true;
  }

  // Sync game state move
  public async sendGameState(gameState: GameState): Promise<void> {
    if (!this.currentRoom) return;

    this.currentRoom.gameState = gameState;
    this.currentRoom.lastUpdated = Date.now();
    this.notifyListeners();
    this.broadcast({ type: 'ROOM_UPDATE', room: this.currentRoom });

    if (this.isServerAvailable) {
      try {
        await fetch(`/api/rooms/${this.currentRoom.roomId}/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameState }),
        });
      } catch {
        // Fallback
      }
    }
  }

  // Send in-game chat message
  public async sendChatMessage(sender: string, text: string, color?: PlayerColor, isQuickEmote?: boolean): Promise<void> {
    if (!this.currentRoom) return;

    const message: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender,
      senderColor: color,
      text,
      timestamp: Date.now(),
      isQuickEmote,
    };

    this.currentRoom.chatMessages.push(message);
    this.notifyListeners();
    this.broadcast({ type: 'CHAT_MESSAGE', roomId: this.currentRoom.roomId, message });

    if (this.isServerAvailable) {
      try {
        await fetch(`/api/rooms/${this.currentRoom.roomId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });
      } catch {
        // Fallback
      }
    }
  }

  private broadcast(data: unknown) {
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch {
        // Channel post failed
      }
    }
  }

  private startPolling(roomId: string) {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(async () => {
      if (!this.isServerAvailable) return;
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const remoteRoom: OnlineRoom = await res.json();
          if (remoteRoom.lastUpdated > (this.currentRoom?.lastUpdated || 0)) {
            this.currentRoom = remoteRoom;
            this.notifyListeners();
          }
        }
      } catch {
        // Non-blocking
      }
    }, 1200);
  }

  public leaveRoom() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.currentRoom = null;
    this.notifyListeners();
  }

  public getCurrentRoom(): OnlineRoom | null {
    return this.currentRoom;
  }
}

export const multiplayerService = new MultiplayerService();
