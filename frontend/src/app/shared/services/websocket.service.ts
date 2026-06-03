import { Injectable, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

export interface WsEvent {
  event: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private ws: WebSocket | null = null;
  private reconnectTimer: any;
  private reconnectAttempts = 0;

  readonly connected = signal(false);
  readonly events$ = new Subject<WsEvent>();

  constructor(private auth: AuthService) {}

  connect(): void {
    const token = this.auth.getToken();
    if (!token || this.ws?.readyState === WebSocket.OPEN) return;

    const url = `${environment.wsUrl}?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connected.set(true);
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsEvent;
        this.events$.next(data);
      } catch {}
    };

    this.ws.onclose = () => {
      this.connected.set(false);
      if (this.auth.isAuthenticated()) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= 5) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
