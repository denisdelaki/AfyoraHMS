import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  catchError,
  finalize,
  map,
  Observable,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';

const ACCESS_TOKEN_KEY = 'afyora.accessToken';
const REFRESH_TOKEN_KEY = 'afyora.refreshToken';
const TOKEN_EXPIRY_SKEW_SECONDS = 30;
const HAS_RETRIED_CONTEXT = new HttpContextToken<boolean>(() => false);

let refreshInFlight$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (isAuthBypassRequest(req.url)) {
    return next(req);
  }

  const accessToken = getStoredToken(ACCESS_TOKEN_KEY);
  const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);

  if (!accessToken) {
    return next(req);
  }

  if (isTokenExpired(accessToken)) {
    if (!refreshToken || isTokenExpired(refreshToken)) {
      return forceLogout(
        authService,
        router,
        'Session expired. Please log in again.',
      );
    }

    return refreshAccessToken(authService).pipe(
      switchMap((newAccessToken) => next(withAuthHeader(req, newAccessToken))),
      catchError(() =>
        forceLogout(
          authService,
          router,
          'Session expired. Please log in again.',
        ),
      ),
    );
  }

  return next(withAuthHeader(req, accessToken)).pipe(
    catchError((error: unknown) => {
      const httpError = error as HttpErrorResponse;
      const alreadyRetried = req.context.get(HAS_RETRIED_CONTEXT);

      if (
        httpError?.status !== 401 ||
        alreadyRetried ||
        !refreshToken ||
        isTokenExpired(refreshToken)
      ) {
        if (httpError?.status === 401) {
          return forceLogout(
            authService,
            router,
            'Authentication failed. Please log in again.',
          );
        }

        return throwError(() => error);
      }

      return refreshAccessToken(authService).pipe(
        switchMap((newAccessToken) => {
          const retriedReq = withAuthHeader(req, newAccessToken).clone({
            context: req.context.set(HAS_RETRIED_CONTEXT, true),
          });

          return next(retriedReq);
        }),
        catchError(() =>
          forceLogout(
            authService,
            router,
            'Authentication failed. Please log in again.',
          ),
        ),
      );
    }),
  );
};

function withAuthHeader<T extends { clone: (update: unknown) => T }>(
  req: T,
  token: string,
): T {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function getStoredToken(key: string): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(key);
}

function isAuthBypassRequest(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh')
  );
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  const exp = payload?.exp;

  if (typeof exp !== 'number') {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowInSeconds + TOKEN_EXPIRY_SKEW_SECONDS;
}

function parseJwtPayload(token: string): { exp?: number } | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(normalized)) as { exp?: number };
  } catch {
    return null;
  }
}

function refreshAccessToken(authService: AuthService): Observable<string> {
  if (refreshInFlight$) {
    return refreshInFlight$;
  }

  const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return throwError(() => new Error('Refresh token is missing.'));
  }

  refreshInFlight$ = authService.refreshToken(refreshToken).pipe(
    map((response) => {
      const sessionPayload = (response as { data?: unknown })?.data ?? response;
      const session = sessionPayload as {
        accessToken?: string;
        access_token?: string;
        refreshToken?: string;
        refresh_token?: string;
      };

      const newAccessToken = session.accessToken ?? session.access_token;
      const newRefreshToken = session.refreshToken ?? session.refresh_token;

      if (!newAccessToken || typeof localStorage === 'undefined') {
        throw new Error('Invalid refresh response.');
      }

      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }

      return newAccessToken;
    }),
    finalize(() => {
      refreshInFlight$ = null;
    }),
    shareReplay(1),
  );

  return refreshInFlight$;
}

function forceLogout(
  authService: AuthService,
  router: Router,
  message: string,
): Observable<never> {
  authService.clearAuthData();
  router.navigate(['/login']);

  return throwError(() => new Error(message));
}
