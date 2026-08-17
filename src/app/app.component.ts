import { Component, OnInit, inject } from '@angular/core';
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
  title = 'Afyora HMS';

  ngOnInit(): void {
    this.sessionTimeoutService.startMonitoring();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateSeo(event.urlAfterRedirects));
  }

  private updateSeo(url: string): void {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;

    const seo = route.snapshot.data['seo'] as SeoConfig | undefined;
    this.seoService.update(
      seo ?? {
        title: 'Healthcare Management Software',
        description:
          'Afyora HMS helps clinics and hospitals manage healthcare operations in one secure workspace.',
        noIndex: true,
      },
      url,
    );
  }
}
