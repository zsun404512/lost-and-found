import { useState } from 'react';
import { getItemImageUrl, formatDateTime } from '../utils/items';

export default function ItemsList({
  items,
  user,
  onEdit,
  onToggleResolve,
  onDelete,
  onMessageOwner,
}) {
  const [actionsOpenForId, setActionsOpenForId] = useState(null);

  return (
    <ul className="items-list">
      {items.map((item) => {
        const isOwner = user && user.userId === item.user;
        const isResolved = item.status === 'resolved';
        const imageUrl = getItemImageUrl(item);

        const metaPieces = [];

        if (item.location) {
          metaPieces.push({ text: item.location });
        }

        if (item.date) {
          const verb = item.type === 'found' ? 'Found on' : 'Lost on';
          metaPieces.push({ text: `${verb} ${item.date}` });
        }

        let posterLabel = null;
        if (item.userEmail) {
          posterLabel = user && user.userId === item.user ? 'you' : item.userEmail;
          metaPieces.push({
            text: `Posted by ${posterLabel}`,
            className: 'item-owner-email',
          });
        }

        const typeVerb = item.type === 'found' ? 'Found' : 'Lost';
        const subtitleAuthor = posterLabel || 'someone';
        const showSubtitleAuthor = subtitleAuthor !== 'you';
        const statusLabel = isResolved ? 'Resolved' : 'Open';
        const actionsOpen = actionsOpenForId === (item._id || item.id);

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
              <div>
                <h3>{item.title}</h3>
                <div className="item-header-subtitle">
                  <span
                    className={
                      item.type === 'found'
                        ? 'item-subtitle-type item-subtitle-type-found'
                        : 'item-subtitle-type item-subtitle-type-lost'
                    }
                  >
                    {typeVerb}
                  </span>
                  {showSubtitleAuthor && <span>{' '}by {subtitleAuthor}</span>}
                  <span
                    className={
                      isResolved
                        ? 'item-status-inline item-status-inline-resolved'
                        : 'item-status-inline item-status-inline-open'
                    }
                  >
                    {' '}· {statusLabel}
                  </span>
                </div>
              </div>

              <div className="item-owner-actions">
                {isOwner && (
                  <>
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => {
                        onEdit(item);
                        setActionsOpenForId(item._id || item.id);
                      }}
                    >
                      Edit
                    </button>
                    {actionsOpen && (
                      <>
                        <button
                          type="button"
                          className="btn-secondary status-action-button"
                          onClick={() => onToggleResolve(item._id || item.id)}
                        >
                          {isResolved ? 'Mark as open' : 'Mark as resolved'}
                        </button>
                        <button
                          className="btn-delete"
                          type="button"
                          onClick={() => onDelete(item._id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </>
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

            <details className="item-details">
              <summary className="item-details-summary">Show details</summary>

              <div className="item-details-body">
                {item.description && (
                  <div className="desc">{item.description}</div>
                )}

                {metaPieces.length > 0 && (
                  <div className="meta">
                    {metaPieces.map((piece, index) => (
                      <span
                        key={index}
                        className={piece.className}
                      >
                        {index > 0 && ' · '}
                        {piece.text}
                      </span>
                    ))}
                  </div>
                )}

                <div className="item-timestamps">
                  <div className="item-timestamp-primary">
                    Last updated: {formatDateTime(item.updatedAt || item.createdAt)}
                  </div>
                  <div className="item-timestamp-secondary">
                    Created: {formatDateTime(item.createdAt)}
                  </div>
                </div>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
