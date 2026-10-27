import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';
import { SessionTimeoutService } from './services/session-timeout.service';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { SeoConfig, SeoService } from './core/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly sessionTimeoutService = inject(SessionTimeoutService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  title = 'Afyora HMS';

  ngOnInit(): void {
    this.sessionTimeoutService.startMonitoring();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.updateSeo(event.urlAfterRedirects));
  }

  private updateSeo(url: string): void {
    let route = this.activatedRoute;
    let seo: SeoConfig | undefined;
    let noIndex = false;
    while (route) {
      const current = route.snapshot.data['seo'] as Partial<SeoConfig> | undefined;
      if (current) {
        seo = { ...seo, ...current } as SeoConfig;
        noIndex ||= current.noIndex === true;
      }
      if (!route.firstChild) break;
      route = route.firstChild;
    }
    this.seoService.update({
      title: seo?.title ?? 'Facility workspace',
      description: seo?.description ?? 'Afyora HMS facility workspace.',
      noIndex: noIndex || !seo,
    }, url);
  }
}
