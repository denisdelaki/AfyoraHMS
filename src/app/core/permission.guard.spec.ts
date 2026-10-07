import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { PermissionsService } from './permissions.service';
import { permissionGuard } from './permission.guard';
import { ToastService } from './toast.service';

describe('permissionGuard action requirements', () => {
  let permissions: any;
  let toastService: any;

  beforeEach(() => {
    permissions = {
      hasPermission: jasmine.createSpy('hasPermission'),
      isFacilityAdmin: false,
    } as unknown as PermissionsService;
    toastService = {
      showWarning: jasmine.createSpy('showWarning'),
    } as unknown as ToastService;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PermissionsService, useValue: permissions },
        { provide: ToastService, useValue: toastService },
      ],
    });
  });

  it('denies the Clinical AI route when the user can create but cannot read', () => {
    permissions.hasPermission.and.callFake(
      (_module: string, action: string) => action === 'create',
    );
    const route = {
      data: { permission: 'clinical_ai', permissionAction: 'read' },
    } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(route, {} as RouterStateSnapshot),
    );

    expect(permissions.hasPermission).toHaveBeenCalledWith(
      'clinical_ai',
      'read',
    );
    expect(result instanceof UrlTree).toBeTruthy();
    expect(toastService.showWarning).toHaveBeenCalled();
  });
});
