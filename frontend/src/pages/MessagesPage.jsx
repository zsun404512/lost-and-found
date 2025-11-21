import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import ConversationList from '../components/ConversationList.jsx';
import MessageComposer from '../components/MessageComposer.jsx';

export default function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  const currentUserId = user?.userId || null;
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!currentUserId || !token) {
      setLoadingConversations(false);
      return;
    }

    let cancelled = false;

    async function loadConversations() {
      setLoadingConversations(true);
      setError(null);

      try {
        const res = await fetch('/api/messages/conversations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load conversations');
        }

        if (!cancelled) {
          setConversations(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setConversations([]);
          setError(e.message || 'Failed to load conversations');
        }
      } finally {
        if (!cancelled) {
          setLoadingConversations(false);
        }
      }
    }

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, token]);

  useEffect(() => {
    if (!currentUserId || !token) return;

    const state = location.state;
    if (!state || !state.participantId) return;
    if (selectedConversationId) return;

    let cancelled = false;

    async function startConversation() {
      try {
        const res = await fetch('/api/messages/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ participantId: state.participantId }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to start conversation');
        }

        if (!cancelled) {
          setConversations((prev) => {
            const exists = prev.some(
              (c) => String(c._id) === String(data._id),
            );
            if (exists) return prev;
            return [data, ...prev];
          });
          setSelectedConversationId(data._id);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to start conversation');
        }
      }
    }

    startConversation();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, token, location.state, selectedConversationId]);

  const loadMessagesForConversation = async (conversationId) => {
    if (!token || !currentUserId || !conversationId) return;

    setLoadingMessages(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/messages/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load messages');
      }

      setMessages(Array.isArray(data) ? data : []);

      // Mark as read for the current user
      await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
    } catch (e) {
      setError(e.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = async (conversationId) => {
    setSelectedConversationId(conversationId);
    await loadMessagesForConversation(conversationId);
  };

  const handleSendMessage = async (body) => {
    if (!token || !currentUserId || !selectedConversationId) return;

    try {
      const res = await fetch(
        `/api/messages/conversations/${selectedConversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setMessages((prev) => [...prev, data]);
    } catch (e) {
      setError(e.message || 'Failed to send message');
    }
  };

  if (!user) {
    return (
      <div className="app messages-page">
        <h1 className="title">Messages</h1>
        <p className="lead">Please log in to view your messages.</p>
      </div>
    );
  }

  const activeConversation = conversations.find(
    (conv) =>
      conv &&
      conv._id != null &&
      selectedConversationId != null &&
      String(conv._id) === String(selectedConversationId),
  );

  const otherParticipantEmail =
    activeConversation && activeConversation.otherParticipantEmail
      ? activeConversation.otherParticipantEmail
      : null;

  return (
    <div className="app messages-page">
      <h1 className="title">Messages</h1>

      {error && <div className="error">{error}</div>}

      <div className="messages-layout">
        <aside className="messages-sidebar">
          {loadingConversations ? (
            <p className="loading">Loading conversations...</p>
          ) : (
            <ConversationList
              conversations={conversations}
              currentUserId={currentUserId}
              selectedConversationId={selectedConversationId}
              onSelect={handleSelectConversation}
            />
          )}
        </aside>

        <section className="messages-content">
          {selectedConversationId ? (
            <>
              {loadingMessages ? (
                <p className="loading">Loading messages...</p>
              ) : (
                <div className="messages-thread">
                  {messages.length === 0 ? (
                    <p className="empty">No messages yet.</p>
                  ) : (
                    <ul className="messages-list">
                      {messages.map((msg) => {
                        const isCurrentUser = String(msg.senderId) === String(currentUserId);
                        const authorLabel = isCurrentUser
                          ? 'You'
                          : otherParticipantEmail || 'Other user';

                        return (
                          <li
                            key={msg._id}
                            className={
                              isCurrentUser
                                ? 'message message-outgoing'
                                : 'message message-incoming'
                            }
                          >
                            <div className="message-author">{authorLabel}</div>
                            <div className="message-body">{msg.body}</div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              <MessageComposer onSend={handleSendMessage} />
            </>
          ) : (
            <p className="empty">Select a conversation to start chatting.</p>
          )}
        </section>
      </div>
    </div>
  );
}
