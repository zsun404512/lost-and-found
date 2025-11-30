import { useState } from 'react';
import ImageCropper from './ImageCropper.jsx';

export default function ItemForm({
  form,
  editingItem,
  uploading,
  previewImage,
  submitting,
  message,
  onChange,
  onSubmit,
  onCancelEdit,
  onFileChange,
  onImageCropped,
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <form className="form" onSubmit={onSubmit}>
      <div>
        {editingItem && (
          <div className="edit-banner">
            <span>
              Editing item:{' '}
              <strong>{editingItem.title || 'Untitled item'}</strong>
            </span>
            <button
              type="button"
              className="btn-edit-cancel"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Always-visible basics */}
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Item title (required)"
        />

        <div className="form-row" style={{ marginTop: '8px' }}>
  <div className="type-toggle">
    <button
      type="button"
      className={
        form.type === 'lost'
          ? 'type-toggle-button type-toggle-button--active type-toggle-lost'
          : 'type-toggle-button type-toggle-lost'
      }
      onClick={() =>
        onChange({ target: { name: 'type', value: 'lost' } })
      }
    >
      Lost item
    </button>

    <button
      type="button"
      className={
        form.type === 'found'
          ? 'type-toggle-button type-toggle-button--active type-toggle-found'
          : 'type-toggle-button type-toggle-found'
      }
      onClick={() =>
        onChange({ target: { name: 'type', value: 'found' } })
      }
    >
      Found item
    </button>
  </div>
</div>

        <div className="form-row" style={{ marginTop: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails
              ? 'Hide additional details'
              : 'Add more details (optional)'}
          </button>
        </div>

        {/* Collapsible details section */}
        <div
          className={
            showDetails
              ? 'item-form-details item-form-details--open'
              : 'item-form-details'
          }
        >
          <div className="form-row" style={{ marginTop: '8px' }}>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={onChange}
            />
          </div>

          <input
            name="location"
            value={form.location}
            onChange={onChange}
            placeholder="Location"
          />

          <div className="form-row">
            <input
              type="text"
              name="lat"
              value={form.lat}
              onChange={onChange}
              placeholder="Latitude (optional)"
            />
            <input
              type="text"
              name="lng"
              value={form.lng}
              onChange={onChange}
              placeholder="Longitude (optional)"
            />
          </div>

          <div className="form-row" style={{ marginTop: '8px' }}>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Description"
            />
          </div>

          <div
            className="form-row"
            style={{ marginTop: '8px', alignItems: 'center' }}
          >
            <input
              type="file"
              name="image"
              accept="image/png, image/jpeg, image/jpg"
              onChange={onFileChange}
              className="file-input"
            />
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="image-preview"
              />
            )}
          </div>
        </div>

        {previewImage && (
          <ImageCropper
            imageSrc={previewImage}
            onCancel={() => onImageCropped(null, null)}
            onApply={onImageCropped}
          />
        )}

        {/* Submit button */}
        <div className="form-row" style={{ marginTop: '8px' }}>
          <button className="btn" type="submit" disabled={submitting || uploading}>
            {uploading
              ? 'Uploading...'
              : submitting
              ? editingItem
                ? 'Saving...'
                : 'Submitting...'
              : editingItem
              ? 'Save Changes'
              : 'Submit Item'}
          </button>
        </div>

        {message && (
          <div className={message.type === 'error' ? 'error' : 'success'}>
            {message.text}
          </div>
        )}
      </div>
    </form>
  );
}