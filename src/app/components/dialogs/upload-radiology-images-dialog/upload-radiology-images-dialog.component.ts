import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  RadiologyOrder,
  UploadRadiologyImagesPayload,
} from '../../../models/radiology.models';

interface UploadRadiologyImagesDialogData {
  order: RadiologyOrder;
}

interface SelectedRadiologyImage {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-upload-radiology-images-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './upload-radiology-images-dialog.component.html',
  styleUrl: './upload-radiology-images-dialog.component.css',
})
export class UploadRadiologyImagesDialogComponent implements OnDestroy {
  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;

  readonly data = inject<UploadRadiologyImagesDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<
      UploadRadiologyImagesDialogComponent,
      UploadRadiologyImagesPayload | undefined
    >,
  );

  private cameraStream: MediaStream | null = null;
  selectedImages: SelectedRadiologyImage[] = [];
  previewImage: SelectedRadiologyImage | null = null;
  cameraPermissionError: string | null = null;
  isCameraActive = false;

  get selectedFilesCount() {
    return this.selectedImages.length;
  }

  ngOnDestroy() {
    this.stopCameraStream();
    this.clearPreviewUrls();
  }

  close() {
    this.stopCameraStream();
    this.clearPreviewUrls();
    this.dialogRef.close();
  }

  triggerFileSelection(input: HTMLInputElement) {
    input.click();
  }

  async requestCameraPermissionAndCapture() {
    this.cameraPermissionError = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraPermissionError =
        'Camera access is not supported on this browser/device.';
      return;
    }

    try {
      this.stopCameraStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      this.cameraStream = stream;
      this.isCameraActive = true;

      setTimeout(() => {
        const video = this.cameraVideo?.nativeElement;
        if (!video || !this.cameraStream) {
          return;
        }

        video.srcObject = this.cameraStream;
        video.play().catch(() => {
          this.cameraPermissionError =
            'Unable to start camera preview. Please try again.';
        });
      });
    } catch {
      this.cameraPermissionError =
        'Camera permission denied. Please allow camera access and try again.';
    }
  }

  captureImageFromCamera() {
    const video = this.cameraVideo?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      this.cameraPermissionError =
        'Camera is not ready yet. Please wait a moment and try again.';
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      this.cameraPermissionError = 'Unable to capture image from camera.';
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          this.cameraPermissionError = 'Unable to capture image from camera.';
          return;
        }

        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        this.addFiles([file]);
        this.stopCameraStream();
      },
      'image/jpeg',
      0.92,
    );
  }

  stopCameraStream() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }

    const video = this.cameraVideo?.nativeElement;
    if (video) {
      video.srcObject = null;
    }

    this.isCameraActive = false;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length === 0) {
      return;
    }

    this.addFiles(files);
    input.value = '';
  }

  removeFile(index: number) {
    const image = this.selectedImages[index];
    if (!image) {
      return;
    }

    if (this.previewImage?.previewUrl === image.previewUrl) {
      this.closeImagePreview();
    }

    URL.revokeObjectURL(image.previewUrl);
    this.selectedImages = this.selectedImages.filter((_, i) => i !== index);
  }

  openImagePreview(image: SelectedRadiologyImage) {
    this.previewImage = image;
  }

  closeImagePreview() {
    this.previewImage = null;
  }

  submit() {
    if (this.selectedImages.length === 0) {
      return;
    }

    this.stopCameraStream();

    const files = this.selectedImages.map((image) => image.file);
    this.clearPreviewUrls();

    this.dialogRef.close({
      orderId: this.data.order.id,
      files,
    });
  }

  private addFiles(files: File[]) {
    const mappedFiles = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    this.selectedImages = [...this.selectedImages, ...mappedFiles];
  }

  private clearPreviewUrls() {
    this.selectedImages.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
    });
    this.closeImagePreview();
    this.selectedImages = [];
  }
}
