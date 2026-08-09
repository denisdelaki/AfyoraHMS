import { inject } from '@angular/core';
import {
  CanActivateChildFn,
  CanActivateFn,
  Router,
  UrlTree,
} from '@angular/router';

const ACCESS_TOKEN_KEY = 'afyora.accessToken';
const REFRESH_TOKEN_KEY = 'afyora.refreshToken';
const TOKEN_EXPIRY_SKEW_SECONDS = 30;

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  return isAuthenticated() ? true : redirectToLogin();
};

export const authChildGuard: CanActivateChildFn = (): boolean | UrlTree => {
  return isAuthenticated() ? true : redirectToLogin();
};

function redirectToLogin(): UrlTree {
  return inject(Router).createUrlTree(['/login']);
}

function isAuthenticated(): boolean {
  const accessToken = getStoredToken(ACCESS_TOKEN_KEY);
  if (accessToken && !isTokenExpired(accessToken)) {
    return true;
  }

  const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
  return !!refreshToken && !isTokenExpired(refreshToken);
}

function getStoredToken(key: string): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(key);
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
