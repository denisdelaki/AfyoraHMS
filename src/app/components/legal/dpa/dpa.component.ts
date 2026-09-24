import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LogoComponent } from '../../features/logo/logo.component';

@Component({
  selector: 'app-dpa',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LogoComponent,
  ],
  templateUrl: './dpa.component.html',
  styleUrl: './dpa.component.css',
})
export class DpaComponent {
  lastUpdated = 'September 24, 2026';
  version = '1.1';

  printDocument() {
    window.print();
  }
}
