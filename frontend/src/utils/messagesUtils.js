export function getOtherParticipantId(conversation, currentUserId) {
  if (!conversation || !Array.isArray(conversation.participants)) {
    return null;
  }

  const current = String(currentUserId);
  const participants = conversation.participants.map(String);

  if (!participants.includes(current)) {
    return null;
  }

  const other = participants.find((id) => id !== current);
  return other || null;
}

export function countUnreadMessages(messages, currentUserId) {
  if (!Array.isArray(messages) || !currentUserId) {
    return 0;
  }

  const current = String(currentUserId);

  return messages.reduce((count, msg) => {
    if (!msg) return count;

    const senderId = msg.senderId != null ? String(msg.senderId) : '';
    if (senderId === current) {
      // Messages sent by the current user are not considered unread for them.
      return count;
    }

    const readBy = Array.isArray(msg.readBy)
      ? msg.readBy.map(String)
      : [];

    if (readBy.includes(current)) {
      return count;
    }

    return count + 1;
  }, 0);
}

export function hasAnyUnread(conversations, currentUserId) {
  if (!Array.isArray(conversations) || !currentUserId) {
    return false;
  }

  return conversations.some((conversation) => {
    const msgs = Array.isArray(conversation.messages)
      ? conversation.messages
      : [];
    return countUnreadMessages(msgs, currentUserId) > 0;
  });
}
