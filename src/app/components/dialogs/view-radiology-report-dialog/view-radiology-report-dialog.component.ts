import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  RadiologyReport,
  UploadedRadiologyImage,
} from '../../../models/radiology.models';

interface ViewRadiologyReportDialogData {
  report: RadiologyReport;
  images?: UploadedRadiologyImage[];
}

@Component({
  selector: 'app-view-radiology-report-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './view-radiology-report-dialog.component.html',
  styleUrl: './view-radiology-report-dialog.component.css',
})
export class ViewRadiologyReportDialogComponent {
  readonly data = inject<ViewRadiologyReportDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<ViewRadiologyReportDialogComponent>,
  );

  selectedImage: UploadedRadiologyImage | null = null;

  close() {
    this.dialogRef.close();
  }

  openPreview(image: UploadedRadiologyImage) {
    this.selectedImage = image;
  }

  closePreview() {
    this.selectedImage = null;
  }
}
