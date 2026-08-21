import { Injectable } from '@angular/core';
import { EMPTY, Observable, catchError, concat, defer, exhaustMap, finalize, of, shareReplay, tap, timer } from 'rxjs';

export type DataQueryOptions = { maxAgeMs?: number; force?: boolean };
type CacheEntry<T> = { value: T; updatedAt: number };

/** Shared cache, request-deduplication, streaming and polling behaviour for API reads. */
@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Observable<unknown>>();
  private readonly defaultMaxAgeMs = 30_000;

  query<T>(key: string, request: () => Observable<T>, options: DataQueryOptions = {}): Observable<T> {
    return defer(() => {
      const cached = this.cache.get(key) as CacheEntry<T> | undefined;
      const fresh = cached && !options.force && Date.now() - cached.updatedAt < (options.maxAgeMs ?? this.defaultMaxAgeMs);
      if (fresh) return of(cached.value);
      const revalidation = this.getOrCreateRequest(key, request);
      return cached ? concat(of(cached.value), revalidation.pipe(catchError(() => EMPTY))) : revalidation;
    });
  }

  /** Applies a local change now and returns a rollback function for failed mutations. */
  optimisticUpdate<T>(key: string, update: (current: T) => T): () => void {
    const previous = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!previous) return () => undefined;
    this.cache.set(key, { value: update(previous.value), updatedAt: Date.now() });
    return () => this.cache.set(key, previous);
  }

  invalidate(keyOrPrefix: string): void {
    for (const key of this.cache.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) this.cache.delete(key);
    }
  }

  /** Visible, online-only polling with non-overlapping requests and error recovery. */
  smartPoll<T>(key: string, request: () => Observable<T>, intervalMs = 30_000): Observable<T> {
    return timer(0, intervalMs).pipe(exhaustMap(() => {
      if (!this.canPoll()) return EMPTY;
      return this.query(key, request, { force: true }).pipe(catchError(() => EMPTY));
    }));
  }

  private getOrCreateRequest<T>(key: string, request: () => Observable<T>): Observable<T> {
    const active = this.inFlight.get(key) as Observable<T> | undefined;
    if (active) return active;
    const revalidation = request().pipe(
      tap((value) => this.cache.set(key, { value, updatedAt: Date.now() })),
      finalize(() => this.inFlight.delete(key)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.inFlight.set(key, revalidation);
    return revalidation;
  }

  private canPoll(): boolean {
    return typeof document === 'undefined' || typeof navigator === 'undefined' ||
      (document.visibilityState === 'visible' && navigator.onLine);
  }
}
