import { TransformIdsPipe } from './transform-ids.pipe';
import type {
  Drug,
  LabTest,
  Patient,
} from '../../models';
import type { Department, Employee } from '../../models/employee.model';

describe('TransformIdsPipe', () => {
  it('create an instance', () => {
    const pipe = new TransformIdsPipe();
    expect(pipe).toBeTruthy();
  });

  it('returns the full name for a patient ID', () => {
    const patients: Patient[] = [
      {
        id: 'P001',
        firstName: 'Jane',
        lastName: 'Doe',
        age: 30,
        gender: 'Female',
        phone: '0700000000',
        email: 'jane@example.com',
        bloodGroup: 'O+',
        lastVisit: '2026-08-20',
        status: 'Active',
      },
    ];

    expect(pipe.transform('P001', 'patientId', patients)).toBe('Jane Doe');
    expect(pipe.transform('P001', 'item.title', patients)).toBe('Jane Doe');
  });

  it('returns names for employee, department, drug, and lab-test IDs', () => {
    const employee: Employee = {
      id: 'E001',
      name: 'Dr. John Smith',
      role: 'Doctor',
      department: 'Outpatient',
      email: 'john@example.com',
      phone: '0700000001',
      joinDate: '2026-01-01',
      salary: 100000,
      status: 'Active',
      shift: 'Morning',
    };
    const department: Department = { id: 'D001', name: 'Outpatient' };
    const drug: Drug = {
      id: 'DR001',
      name: 'Paracetamol',
      category: 'Analgesic',
      stock: 20,
      minStock: 5,
      price: 10,
      expiryDate: '2027-01-01',
      manufacturer: 'Acme',
    };
    const labTest: LabTest = {
      id: 'LT001',
      name: 'Full Blood Count',
      category: 'Hematology',
      duration: '1 hour',
      price: 1000,
    };

    expect(pipe.transform('E001', 'employeeId', [employee])).toBe(
      'Dr. John Smith',
    );
    expect(pipe.transform('D001', 'departmentId', [department])).toBe(
      'Outpatient',
    );
    expect(pipe.transform('DR001', 'drugId', [drug])).toBe('Paracetamol');
    expect(pipe.transform('LT001', 'lab_test_id', [labTest])).toBe(
      'Full Blood Count',
    );
  });

  it('leaves an unknown or empty ID unchanged', () => {
    const pipe = new TransformIdsPipe();

    expect(pipe.transform('missing', 'patientId', [])).toBe('missing');
    expect(pipe.transform(null, 'patientId', [])).toBeNull();
  });
});
