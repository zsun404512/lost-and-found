import React from 'react';

export default function ConversationList({
  conversations,
  currentUserId,
  selectedConversationId,
  onSelect,
}) {
  const handleSelect = (id) => {
    if (typeof onSelect === 'function') {
      onSelect(id);
    }
  };

  const list = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="conversation-list">
      {list.map((conversation) => {
        const id = conversation._id;
        const isActive =
          selectedConversationId != null &&
          String(selectedConversationId) === String(id);

        const className = `conversation-list-item${
          isActive ? ' is-active' : ''
        }`;

        return (
          <button
            key={id}
            type="button"
            className={className}
            onClick={() => handleSelect(id)}
          >
            Conversation
          </button>
        );
      })}
    </div>
  );
}
