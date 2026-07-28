import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationEnd, Router } from '@angular/router';
import {
  filter,
  fromEvent,
  merge,
  Subscription,
  take,
  throttleTime,
} from 'rxjs';
import { AuthService } from './auth.service';
import {
  SessionTimeoutDialogComponent,
  SessionTimeoutDialogResult,
} from '../components/dialogs/session-timeout-dialog/session-timeout-dialog.component';

const ACCESS_TOKEN_KEY = 'afyora.accessToken';
const IDLE_TIMEOUT_MS = 1 * 60 * 1000;
const DIALOG_COUNTDOWN_SECONDS = 30;

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService implements OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  private activitySubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;
  private idleTimerId: ReturnType<typeof setTimeout> | null = null;
  private dialogRef: MatDialogRef<
    SessionTimeoutDialogComponent,
    SessionTimeoutDialogResult
  > | null = null;
  private isMonitoring = false;

  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') {
      return;
    }

    const activityEvents = [
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'keydown'),
      fromEvent(window, 'click'),
      fromEvent(window, 'scroll'),
      fromEvent(window, 'touchstart'),
    ];

    this.activitySubscription = merge(...activityEvents)
      .pipe(throttleTime(1000, undefined, { leading: true, trailing: true }))
      .subscribe(() => {
        if (this.dialogRef) {
          return;
        }

        this.resetIdleTimer();
      });

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.dialogRef) {
          return;
        }

        this.resetIdleTimer();
      });

    this.isMonitoring = true;
    this.resetIdleTimer();
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  private stopMonitoring(): void {
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = null;
    }

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      this.routerSubscription = null;
    }

    this.clearIdleTimer();
    this.isMonitoring = false;
  }

  private resetIdleTimer(): void {
    this.clearIdleTimer();

    if (!this.hasAccessToken()) {
      return;
    }

    this.idleTimerId = setTimeout(() => {
      this.openSessionTimeoutDialog();
    }, IDLE_TIMEOUT_MS);
  }

  private clearIdleTimer(): void {
    if (this.idleTimerId) {
      clearTimeout(this.idleTimerId);
      this.idleTimerId = null;
    }
  }

  private openSessionTimeoutDialog(): void {
    if (this.dialogRef || !this.hasAccessToken()) {
      return;
    }

    this.dialogRef = this.dialog.open(SessionTimeoutDialogComponent, {
      disableClose: true,
      width: '420px',
      data: { countdownSeconds: DIALOG_COUNTDOWN_SECONDS },
    });

    this.dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        this.dialogRef = null;

        if (result === 'stay') {
          this.keepSessionAlive();
          return;
        }

        this.logoutForInactivity();
      });
  }

  private keepSessionAlive(): void {
    this.authService.refreshSession().subscribe({
      next: () => {
        this.resetIdleTimer();
      },
      error: () => {
        this.logoutForInactivity();
      },
    });
  }

  private logoutForInactivity(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.showInactivityLogoutMessage();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.clearAuthData();
        this.showInactivityLogoutMessage();
        this.router.navigate(['/login']);
      },
    });
  }

  private showInactivityLogoutMessage(): void {
    this.snackBar.open('Logged out due to inactivity.', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private hasAccessToken(): boolean {
    return !!this.document.defaultView?.localStorage?.getItem(ACCESS_TOKEN_KEY);
  }
}
