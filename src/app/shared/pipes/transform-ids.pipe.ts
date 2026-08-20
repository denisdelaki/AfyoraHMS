import { Pipe, PipeTransform } from '@angular/core';
import type { Drug, ImagingType, LabTest, Patient } from '../../models';
import type { Department, Employee } from '../../models/employee.model';

type IdentifiableRecord =
  | Patient
  | Employee
  | Department
  | Drug
  | LabTest
  | ImagingType;

type IdProperty =
  | 'patientId'
  | 'employeeId'
  | 'departmentId'
  | 'drugId'
  | 'labTestId'
  | 'testId'
  | 'imagingTypeId';

@Pipe({
  name: 'transformIds',
  standalone: true,
})
export class TransformIdsPipe implements PipeTransform {
  /**
   * Replaces an entity ID with its human-readable name.
   *
   * @example
   * {{ appointment.patientId | transformIds:'patientId':patients }}
   * {{ order.imagingTypeId | transformIds:'imagingTypeId':imagingTypes }}
   */
  transform(
    value: string | number | null | undefined,
    property: IdProperty | string,
    records: readonly IdentifiableRecord[] | null | undefined,
  ): string | number | null | undefined {
    console.log(
      'TransformIdsPipe: value:',
      value,
      'property:',
      property,
      'records:',
      records,
    );
    if (value === null || value === undefined || !Array.isArray(records)) {
      return value;
    }

    const record = records.find((item) => String(item.id) === String(value));

    if (!record) {
      return value;
    }

    return this.getDisplayName(record, property) ?? value;
  }

  private getDisplayName(
    record: IdentifiableRecord,
    property: IdProperty | string,
  ): string | undefined {
    const normalizedProperty = property.replace(/[_\s-]/g, '').toLowerCase();

    // Patient models have firstName and lastName rather than a single name
    // field. Resolve them even when the displayed property has a generic
    // label such as `item.title`.
    if (this.isPatient(record)) {
      return this.patientName(record);
    }

    if (
      [
        'employeeid',
        'departmentid',
        'drugid',
        'labtestid',
        'testid',
        'imagingtypeid',
      ].includes(normalizedProperty) &&
      'name' in record
    ) {
      return record.name;
    }

    return 'name' in record ? record.name : undefined;
  }

  private isPatient(record: IdentifiableRecord): record is Patient {
    return 'firstName' in record && 'lastName' in record;
  }

  private patientName(patient: Patient): string {
    return [patient.firstName, patient.lastName]
      .filter((name) => Boolean(name?.trim()))
      .join(' ');
  }
}
