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
  const ctx = canvas.getContext('2d');

  const safeArea = Math.max(image.width, image.height) * 2;

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - (safeArea / 2 - image.width / 2) - pixelCrop.x),
    Math.round(0 - (safeArea / 2 - image.height / 2) - pixelCrop.y),
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export default function ImageCropper({ imageSrc, onCancel, onApply }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApply = useCallback(async () => {
    if (!croppedAreaPixels) {
      return;
    }
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
      onApply(file, URL.createObjectURL(blob));
    } catch (err) {
      console.error('Error cropping image', err);
      onCancel();
    }
  }, [croppedAreaPixels, imageSrc, onApply, onCancel]);

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
              restrictPosition={false}
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
        </div>
        <div className="image-cropper-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={handleApply}>
            Use this image
          </button>
        </div>
      </div>
    </div>
  );
}
