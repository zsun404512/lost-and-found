import { useState } from 'react';

export default function MessageComposer({ onSend }) {
  const [value, setValue] = useState('');

  const trimmed = value.trim();
  const isDisabled = trimmed.length === 0;

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const text = value.trim();
    if (!text) {
      return;
    }

    // Enforce max length: 500 characters allowed, > 500 rejected
    if (text.length > 500) {
      return;
    }

    if (typeof onSend === 'function') {
      onSend(text);
    }

    setValue('');
  };

  return (
    <form className="message-composer" onSubmit={handleSubmit}>
      <input
        type="text"
        className="message-composer-input"
        value={value}
        onChange={handleChange}
        placeholder="Type a message..."
      />
      <button
        type="submit"
        className="message-composer-send"
        disabled={isDisabled}
      >
        Send
      </button>
    </form>
  );
}
