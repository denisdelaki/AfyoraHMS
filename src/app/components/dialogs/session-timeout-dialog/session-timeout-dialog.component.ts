import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export type SessionTimeoutDialogResult = 'stay' | 'logout';

export type SessionTimeoutDialogData = {
  countdownSeconds: number;
};

@Component({
  selector: 'app-session-timeout-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './session-timeout-dialog.component.html',
  styleUrl: './session-timeout-dialog.component.css',
})
export class SessionTimeoutDialogComponent implements OnInit, OnDestroy {
  remainingSeconds: number;
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SessionTimeoutDialogData,
    private readonly dialogRef: MatDialogRef<
      SessionTimeoutDialogComponent,
      SessionTimeoutDialogResult
    >,
  ) {
    this.remainingSeconds = data.countdownSeconds;
  }

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      this.remainingSeconds -= 1;

      if (this.remainingSeconds <= 0) {
        this.logoutNow();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  stayLoggedIn(): void {
    this.dialogRef.close('stay');
  }

  logoutNow(): void {
    this.dialogRef.close('logout');
  }
}
