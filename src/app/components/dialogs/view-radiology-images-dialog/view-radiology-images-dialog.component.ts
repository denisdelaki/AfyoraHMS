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

interface ViewRadiologyImagesDialogData {
  report: RadiologyReport;
  images: UploadedRadiologyImage[];
}

@Component({
  selector: 'app-view-radiology-images-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './view-radiology-images-dialog.component.html',
  styleUrl: './view-radiology-images-dialog.component.css',
})
export class ViewRadiologyImagesDialogComponent {
  readonly data = inject<ViewRadiologyImagesDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<ViewRadiologyImagesDialogComponent>,
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

  trackByImage(index: number, image: UploadedRadiologyImage) {
    return image.id;
  }
}
