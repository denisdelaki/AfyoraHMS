import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  showSuccess(message: string, duration = 4000): void {
    this.openSnackBar(message, 'Dismiss', {
      duration,
      panelClass: ['app-snackbar-success'],
    });
  }

  showError(message: string, duration = 6000): void {
    this.openSnackBar(message, 'Close', {
      duration,
      panelClass: ['app-snackbar-error'],
    });
  }

  showWarning(message: string, duration = 5000): void {
    this.openSnackBar(message, 'Dismiss', {
      duration,
      panelClass: ['app-snackbar-warning'],
    });
  }

  showInfo(message: string, duration = 4000): void {
    this.openSnackBar(message, 'Dismiss', {
      duration,
      panelClass: ['app-snackbar-info'],
    });
  }

  handleHttpError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.showError((error as Error)?.message || 'An unexpected error occurred.');
      return;
    }

    if (error.status === 0) {
      this.showError('Unable to connect to server. Please check your internet connection.');
      return;
    }

    if (error.status === 429) {
      this.showError('Too many requests. Please slow down and try again in a minute.');
      return;
    }

    if (error.status === 403) {
      const detail =
        error.error?.detail ||
        error.error?.error ||
        'Access Denied: You do not have permission to perform this action.';
      this.showError(detail);
      return;
    }

    if (error.status === 401) {
      const detail =
        error.error?.detail ||
        error.error?.error ||
        'Authentication required. Please log in again.';
      this.showError(detail);
      return;
    }

    const parsedMessage = this.extractErrorMessage(error);
    this.showError(parsedMessage);
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const errBody = error.error;
    if (typeof errBody === 'string') {
      return errBody;
    }
    if (errBody?.detail && typeof errBody.detail === 'string') {
      return errBody.detail;
    }
    if (errBody?.error && typeof errBody.error === 'string') {
      return errBody.error;
    }
    if (errBody?.message && typeof errBody.message === 'string') {
      return errBody.message;
    }
    if (errBody?.details && typeof errBody.details === 'object') {
      return this.formatDictErrors(errBody.details as Record<string, unknown>);
    }
    if (typeof errBody === 'object' && errBody !== null) {
      return this.formatDictErrors(errBody as Record<string, unknown>);
    }
    return `Request failed with status code ${error.status}`;
  }

  private formatDictErrors(dict: Record<string, unknown>): string {
    const messages: string[] = [];
    for (const [key, val] of Object.entries(dict)) {
      if (Array.isArray(val)) {
        messages.push(`${key}: ${val.join(', ')}`);
      } else if (typeof val === 'string') {
        messages.push(`${key}: ${val}`);
      }
    }
    return messages.length > 0 ? messages.join(' | ') : 'Validation failed.';
  }

  private openSnackBar(
    message: string,
    action: string,
    config: MatSnackBarConfig,
  ): void {
    this.snackBar.open(message, action, {
      horizontalPosition: 'right',
      verticalPosition: 'top',
      ...config,
    });
  }
}
