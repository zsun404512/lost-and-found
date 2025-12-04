// Navigation button for the messaging section, hidden when logged out and
// showing an unread badge when there are pending messages.
export default function MessagesNavButton({ isLoggedIn, unreadCount, onClick }) {
  if (!isLoggedIn) {
    return null;
  }

  const hasUnread = typeof unreadCount === 'number' && unreadCount > 0;

  return (
    <button
      type="button"
      className="nav-messages-button"
      onClick={onClick}
    >
      Messages
      {hasUnread && (
        <span
          className="nav-messages-badge"
          data-testid="messages-badge"
        >
          {unreadCount}
        </span>
      )}
    </button>
  );
}
