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
  const currentIdStr = currentUserId != null ? String(currentUserId) : '';

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

        const participants = Array.isArray(conversation.participants)
          ? conversation.participants.map(String)
          : [];

        const explicitOtherEmail = conversation.otherParticipantEmail;
        const otherIdFromField = conversation.otherParticipantId
          ? String(conversation.otherParticipantId)
          : null;

        const derivedOtherId =
          otherIdFromField || participants.find((pid) => pid !== currentIdStr) || null;

        const label =
          explicitOtherEmail ||
          (derivedOtherId && derivedOtherId !== currentIdStr
            ? derivedOtherId
            : 'Conversation');

        return (
          <button
            key={id}
            type="button"
            className={className}
            onClick={() => handleSelect(id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
