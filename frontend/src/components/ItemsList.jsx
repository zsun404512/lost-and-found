import { getItemImageUrl, formatDateTime } from '../utils/items';

export default function ItemsList({
  items,
  user,
  onEdit,
  onToggleResolve,
  onDelete,
  onMessageOwner,
}) {
  return (
    <ul className="items-list">
      {items.map((item) => {
        const isOwner = user && user.userId === item.user;
        const isResolved = item.status === 'resolved';
        const imageUrl = getItemImageUrl(item);

        return (
          <li key={item._id || item.id} className="item">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={item.title}
                className="item-image"
              />
            )}

            <div className="item-header">
              <h3>
                {item.title}{' '}
                <small style={{ color: '#374151' }}>({item.type})</small>
              </h3>

              <div className="item-owner-actions">
                {isOwner && (
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </button>
                )}

                <button
                  className={
                    `status-button ${
                      isResolved ? 'status-resolved' : 'status-open'
                    } ` +
                    (isOwner ? 'status-clickable' : 'status-readonly')
                  }
                  onClick={
                    isOwner
                      ? () => onToggleResolve(item._id || item.id)
                      : undefined
                  }
                  disabled={!isOwner}
                  type="button"
                >
                  {isResolved ? 'Resolved' : 'Open'}
                </button>

                {isOwner && (
                  <button
                    className="btn-delete"
                    type="button"
                    onClick={() => onDelete(item._id)}
                  >
                    Delete
                  </button>
                )}

                {!isOwner && user && (
                  <button
                    className="btn-message-owner"
                    type="button"
                    onClick={() => onMessageOwner(item)}
                  >
                    Message owner
                  </button>
                )}
              </div>
            </div>

            <div className="desc">{item.description}</div>
            <div className="meta">
              {item.location} · {item.date}
            </div>

            <div className="item-timestamps">
              <div className="item-timestamp-primary">
                Last updated: {formatDateTime(item.updatedAt || item.createdAt)}
              </div>
              <div className="item-timestamp-secondary">
                Created: {formatDateTime(item.createdAt)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
