import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { SessionTimeoutService } from './services/session-timeout.service';

@Component({ template: '' })
class WorkspaceTestComponent {}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: SessionTimeoutService,
          useValue: { startMonitoring: () => {} },
        },
        provideRouter([
          {
            path: 'workspace',
            data: {
              seo: {
                title: 'Workspace',
                description: 'Private workspace.',
                noIndex: true,
              },
            },
            children: [
              {
                path: 'consultation',
                component: WorkspaceTestComponent,
                data: { seo: { title: 'Consultation' } },
              },
            ],
          },
        ]),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'Afyora HMS' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Afyora HMS');
  });

  it('preserves parent noindex when a nested workspace overrides its title', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/workspace/consultation');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe(
      'noindex, nofollow, noarchive',
    );
    expect(TestBed.inject(Meta).getTag('name="description"')?.content).toBe(
      'Private workspace.',
    );
  });
});
