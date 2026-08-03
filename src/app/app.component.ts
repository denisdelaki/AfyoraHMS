import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionTimeoutService } from './services/session-timeout.service';
import { LoaderComponent } from './shared/components/loader/loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent],
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
