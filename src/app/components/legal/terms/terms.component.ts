import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LogoComponent } from '../../features/logo/logo.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LogoComponent,
  ],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css',
})
export class TermsComponent {
  lastUpdated = 'September 24, 2026';
  version = '1.1';

  printDocument() {
    window.print();
  }
}
