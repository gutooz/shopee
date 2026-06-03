import { Component, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { WebSocketService } from './shared/services/websocket.service';
import { NotificationToastService } from './shared/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private ws: WebSocketService,
    private toast: NotificationToastService,
  ) {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.ws.connect();
      } else {
        this.ws.disconnect();
      }
    });
  }

  ngOnInit(): void {
    this.ws.events$.subscribe(event => {
      switch (event['event']) {
        case 'new_order':
          this.toast.info(`Novo pedido: #${event['order_id']}`);
          break;
        case 'order_status_updated':
          this.toast.info(`Pedido atualizado: ${event['status']}`);
          break;
        case 'tracking_updated':
          this.toast.success(`Rastreio adicionado: ${event['tracking_code']}`);
          break;
      }
    });
  }
}
