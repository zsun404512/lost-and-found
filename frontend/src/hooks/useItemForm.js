import { useState } from 'react';
import { getItemImageUrl } from '../utils/items';

const EMPTY_FORM = {
  title: '',
  type: 'lost',
  description: '',
  location: '',
  date: '',
  lat: '',
  lng: '',
  image: null,
};

function isLatOrLngField(name) {
  return name === 'lat' || name === 'lng';
}

function isCoordinatePatternValid(value) {
  const pattern = /^-?\d*\.?\d*$/;
  return pattern.test(value);
}

function isIntermediateCoordinateValue(value) {
  return value === '' || value === '-' || value === '.' || value === '-.';
}

function isCoordinateWithinRange(name, num) {
  const isLat = name === 'lat';
  const min = isLat ? -90 : -180;
  const max = isLat ? 90 : 180;
  return !Number.isNaN(num) && num >= min && num <= max;
}

function getItemRequestConfig(editingItem) {
  if (editingItem && editingItem._id) {
    return {
      url: `/api/items/${editingItem._id}`,
      method: 'PUT',
    };
  }

  return {
    url: '/api/items',
    method: 'POST',
  };
}

export function useItemForm({ itemsState, message, setMessage, user, logout, navigate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editedFile, setEditedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [originalPreviewImage, setOriginalPreviewImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { setItems, setSearchQuery, setFilterType } = itemsState;

  function resetImageState() {
    setSelectedFile(null);
    setEditedFile(null);
    setPreviewImage(null);
    setOriginalPreviewImage(null);
    setShowCropper(false);
  }
  
  function validateCoordinateChange(name, value) {
    if (!isCoordinatePatternValid(value)) {
      return null;
    }

    if (!isIntermediateCoordinateValue(value)) {
      const num = parseFloat(value);
      if (!isCoordinateWithinRange(name, num)) {
        return null;
      }
    }

    return value;
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (isLatOrLngField(name)) {
      const next = validateCoordinateChange(name, value);

      if (next == null) {
        return;
      }

      setForm((prev) => ({ ...prev, [name]: value }));
      setMessage(null);
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage(null);
  }

  function handleSetCoordinatesFromMap(lat, lng) {
    if (!isCoordinateWithinRange('lat', lat) || !isCoordinateWithinRange('lng', lng)) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      lat: String(lat),
      lng: String(lng),
    }));
    setMessage(null);
  }

  function handleStartEdit(item) {
    setEditingItem(item);
    setForm({
      title: item.title || '',
      type: item.type || 'lost',
      description: item.description || '',
      location: item.location || '',
      date: item.date || '',
      lat:
        item.lat !== undefined && item.lat !== null
          ? String(item.lat)
          : '',
      lng:
        item.lng !== undefined && item.lng !== null
          ? String(item.lng)
          : '',
      image: null,
    });

    const existingImage = getItemImageUrl(item);

    setPreviewImage(existingImage);
    setOriginalPreviewImage(existingImage);
    setSelectedFile(null);
    setMessage(null);

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleCancelEdit() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    resetImageState();
    setMessage(null);
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png'];
      const allowedExtensions = ['jpg', 'jpeg', 'png'];
      const name = file.name || '';
      const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';

      const isMimeOk = allowedMimeTypes.includes(file.type);
      const isExtOk = allowedExtensions.includes(ext);

      // Reject if neither the MIME type nor the extension looks like a
      // supported image. This makes sure PDFs of any size never get uploaded.
      if (!isMimeOk && !isExtOk) {
        resetImageState();
        setMessage({ type: 'error', text: 'Images only! (jpg, jpeg, png)' });
        if (e.target && typeof e.target.value !== 'undefined') {
          e.target.value = null;
        }
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File is too large (Max 5MB)' });
        return;
      }
      setSelectedFile(file);
      setEditedFile(null);
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
      setOriginalPreviewImage(url);
      setShowCropper(true);
    } else {
      resetImageState();
    }
  };

  const handleImageCropped = (file, previewUrl) => {
    setEditedFile(file);
    setPreviewImage(previewUrl);
  };

  const handleDoneCrop = () => {
    setShowCropper(false);
  };

  const handleRevertCrop = () => {
    if (!selectedFile && !originalPreviewImage) {
      return;
    }
    setEditedFile(null);
    if (originalPreviewImage) {
      setPreviewImage(originalPreviewImage);
    } else if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewImage(url);
      setOriginalPreviewImage(url);
    }
  };

  async function uploadImageIfNeeded(fileToUpload, token, editingItem) {
    if (!fileToUpload) {
      return '';
    }

    setUploading(true);
    setMessage({ type: 'success', text: 'Uploading image...' });

    const formData = new FormData();
    formData.append('image', fileToUpload);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Image upload failed');
      }

      setMessage({
        type: 'success',
        text: editingItem
          ? 'Image uploaded! Saving changes...'
          : 'Image uploaded! Submitting post...',
      });

      return data.imageId;
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setSubmitting(false);
      setUploading(false);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!form.title) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'You must be logged in to post.' });
      setSubmitting(false);
      return;
    }

    let imageUrl = '';

    const fileToUpload = editedFile || selectedFile;

    if (fileToUpload) {
      const uploadedId = await uploadImageIfNeeded(fileToUpload, token, editingItem);
      if (uploadedId === null) {
        return;
      }
      imageUrl = uploadedId;
    }

    if (!fileToUpload && editingItem && editingItem.image && !imageUrl) {
      imageUrl = editingItem.image;
    }

    try {
      const postData = { ...form, image: imageUrl };

      const { url, method } = getItemRequestConfig(editingItem);

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        logout();
        setMessage({
          type: 'error',
          text: data.message || 'Session expired. Please log in again.',
        });
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(
          err.message ||
            (editingItem ? 'Failed to update item' : 'Failed to submit post'),
        );
      }

      const created = await res.json();
      setSearchQuery('');
      setFilterType('all');

      setItems((prevItems) => {
        const enriched = {
          ...created,
          // make sure the user field is a string id that matches the logged-in user
          user: created.user || (user && user.userId) || created.user,
          // ensure userEmail is present so UI can show "Posted by you" immediately
          userEmail: created.userEmail || (user && user.email) || created.userEmail,
        };

        if (editingItem && editingItem._id) {
          return prevItems.map((item) =>
            (item._id || item.id) === (created._id || created.id)
              ? enriched
              : item,
          );
        }
        return [enriched, ...prevItems];
      });

      if (editingItem && editingItem._id) {
        setEditingItem(null);
        setMessage({ type: 'success', text: 'Item updated.' });
      } else {
        setMessage({ type: 'success', text: 'Item submitted.' });
      }

      setForm(EMPTY_FORM);
      setSelectedFile(null);
      setEditedFile(null);
      setPreviewImage(null);
      if (e.target.elements.image) {
        e.target.elements.image.value = null;
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || (editingItem ? 'Update failed' : 'Submission failed'),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(itemId) {
    const confirmedDelete = window.confirm('Are you sure you want to delete this item?');
    if (!confirmedDelete) {
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'You must be logged in.' });
      return;
    }
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.status === 401) {
        logout();
        setMessage({
          type: 'error',
          text: data.message || 'Session expired. Please log in again.',
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete');
      }
      setItems((prevItems) => prevItems.filter((item) => item._id !== itemId));
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function handleToggleResolve(itemId) {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'You must be logged in.' });
      return;
    }

    try {
      const res = await fetch(`/api/items/${itemId}/toggle-resolve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedItem = await res.json();

      if (res.status === 401) {
        logout();
        setMessage({
          type: 'error',
          text: updatedItem.message || 'Session expired. Please log in again.',
        });
        return;
      }

      if (!res.ok) {
        throw new Error(updatedItem.message || 'Failed to update status');
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          (item._id || item.id) === (updatedItem._id || updatedItem.id)
            ? updatedItem
            : item,
        ),
      );

      const statusText =
        updatedItem.status === 'resolved'
          ? 'Item marked as resolved.'
          : 'Item reopened.';
      setMessage({ type: 'success', text: statusText });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  const handleMessageOwner = (item) => {
    if (!user) return;
    navigate('/messages', {
      state: { participantId: item.user },
    });
  };

  return {
    form,
    editingItem,
    uploading,
    selectedFile,
    previewImage,
    showCropper,
    originalPreviewImage,
    submitting,
    message,
    handleChange,
    handleSetCoordinatesFromMap,
    handleStartEdit,
    handleCancelEdit,
    handleFileChange,
    handleImageCropped,
    handleDoneCrop,
    handleRevertCrop,
    handleSubmit,
    handleDelete,
    handleToggleResolve,
    handleMessageOwner,
  };
}
