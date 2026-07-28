import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionTimeoutService } from './services/session-timeout.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly sessionTimeoutService = inject(SessionTimeoutService);
  title = 'afyoraHMS';

  ngOnInit(): void {
    this.sessionTimeoutService.startMonitoring();
  }
}
