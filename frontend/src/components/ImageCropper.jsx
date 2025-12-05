// Modal image cropper that wraps react-easy-crop and uses an offscreen canvas
// to output a cropped JPEG File/preview back to the parent.
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = new Image();
  image.src = imageSrc;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  // Move canvas origin to center
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // Draw the cropped portion directly
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Canvas is empty'));
      else resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export default function ImageCropper({ imageSrc, onCancel, onApply, onDone, onRevert }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handlePreview = useCallback(async () => {
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
      onApply(file, URL.createObjectURL(blob));
    } catch (err) {
      console.error('Error cropping image', err);
      onCancel();
    }
  }, [croppedAreaPixels, imageSrc, onApply, onCancel]);

  const handleRevertClick = () => {
    // Reset crop UI back to initial state
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    // Reset image/file state in parent
    if (onRevert) {
      onRevert();
    }
  };

  return (
    <div className="image-cropper-backdrop">
      <div className="image-cropper-modal">
        <div className="image-cropper-header">
          <span>Adjust image</span>
        </div>
        <div className="image-cropper-body">
          <div className="image-cropper-crop-area">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              restrictPosition
              cropShape="rect"
              showGrid={false}
            />
          </div>
          <div className="image-cropper-controls">
            <label className="image-cropper-zoom-label" htmlFor="crop-zoom">
              Zoom
            </label>
            <input
              id="crop-zoom"
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </div>
          <p className="image-cropper-warning">
            Parts of the image outside the rectangle will be permanently removed for this upload.
            Make sure the image fills the rectangle to avoid empty borders.
          </p>
        </div>
        <div className="image-cropper-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRevertClick}
          >
            Revert
          </button>
          <button type="button" className="btn" onClick={handlePreview}>
            Preview
          </button>
          <button type="button" className="btn" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
