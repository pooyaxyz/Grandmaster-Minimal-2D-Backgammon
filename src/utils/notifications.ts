// Web Push Notifications & In-App Alerts for Game Invitations & Daily Rewards

export interface GameAlert {
  id: string;
  title: string;
  body: string;
  type: 'invite' | 'reward' | 'turn' | 'achievement';
  timestamp: number;
  actionText?: string;
  onAction?: () => void;
}

class NotificationService {
  private permissionGranted: boolean = false;
  private alertListeners: ((alert: GameAlert) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  public async requestPushPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      this.permissionGranted = res === 'granted';
      return this.permissionGranted;
    } catch {
      return false;
    }
  }

  public isPushEnabled(): boolean {
    return this.permissionGranted;
  }

  public onAlert(cb: (alert: GameAlert) => void) {
    this.alertListeners.push(cb);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== cb);
    };
  }

  public triggerAlert(alert: Omit<GameAlert, 'id' | 'timestamp'>) {
    const fullAlert: GameAlert = {
      ...alert,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };

    // 1. Deliver to UI listeners (in-app toast)
    this.alertListeners.forEach((listener) => {
      try {
        listener(fullAlert);
      } catch (e) {
        console.error(e);
      }
    });

    // 2. Deliver via browser Web Notification API if permitted and document is hidden
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(fullAlert.title, {
          body: fullAlert.body,
          icon: '/favicon.ico',
        });
      } catch {
        // Fallback silently
      }
    }
  }

  public notifyGameInvite(inviterName: string, roomCode: string, onAccept?: () => void) {
    this.triggerAlert({
      title: '⚔️ Backgammon Invitation',
      body: `${inviterName} challenged you to a match in room ${roomCode}!`,
      type: 'invite',
      actionText: 'Join Match',
      onAction: onAccept,
    });
  }

  public notifyDailyRewardReady() {
    this.triggerAlert({
      title: '🎁 Daily Reward Unlocked!',
      body: 'Your daily gold bonus is waiting in the vault. Claim your streak reward now!',
      type: 'reward',
      actionText: 'Claim Bonus',
    });
  }

  public notifyOpponentTurn(opponentName: string) {
    this.triggerAlert({
      title: '🎲 It\'s Your Turn!',
      body: `${opponentName} has finished their roll. Your dice are ready.`,
      type: 'turn',
    });
  }
}

export const notificationService = new NotificationService();
