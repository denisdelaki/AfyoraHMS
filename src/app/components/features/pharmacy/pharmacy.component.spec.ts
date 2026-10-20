import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { PharmacyComponent } from './pharmacy.component';

describe('PharmacyComponent', () => {
  let component: PharmacyComponent;
  let fixture: ComponentFixture<PharmacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PharmacyComponent, HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                tab: 'prescriptions',
                ticketNumber: 'OP/42',
              }),
            },
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PharmacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the prescriptions tab and filters prescriptions by ticket number', () => {
    component.prescriptions = [
      {
        id: 'RX-42',
        patientId: 'PAT001',
        doctorId: 'EMP001',
        drugs: [],
        status: 'Pending',
        date: '2026-10-20',
        ticketNumber: 'OP/42',
      },
      {
        id: 'RX-43',
        patientId: 'PAT002',
        doctorId: 'EMP002',
        drugs: [],
        status: 'Pending',
        date: '2026-10-20',
        ticketNumber: 'OP/43',
      },
    ];

    expect(component.activeTab).toBe('prescriptions');
    expect(component.ticketNumberFilter).toBe('OP/42');
    expect(component.filteredPrescriptions.map((rx) => rx.id)).toEqual([
      'RX-42',
    ]);
  });
});
