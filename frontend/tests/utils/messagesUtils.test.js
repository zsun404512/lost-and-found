import { describe, it, expect } from 'vitest';

import {
  getOtherParticipantId,
  countUnreadMessages,
  hasAnyUnread,
} from '../../src/utils/messagesUtils.js';

describe('getOtherParticipantId', () => {
  it('returns the other participant when currentUserId is first', () => {
    const conversation = {
      participants: ['user-a', 'user-b'],
    };

    const other = getOtherParticipantId(conversation, 'user-a');

    expect(other).toBe('user-b');
  });

  it('returns the other participant when currentUserId is second', () => {
    const conversation = {
      participants: ['user-a', 'user-b'],
    };

    const other = getOtherParticipantId(conversation, 'user-b');

    expect(other).toBe('user-a');
  });

  it('returns null when currentUserId is not a participant', () => {
    const conversation = {
      participants: ['user-a', 'user-b'],
    };

    const other = getOtherParticipantId(conversation, 'someone-else');

    expect(other).toBeNull();
  });
});

describe('countUnreadMessages', () => {
  it('returns 0 when there are no messages', () => {
    const count = countUnreadMessages([], 'user-a');
    expect(count).toBe(0);
  });

  it('ignores messages sent by the current user', () => {
    const messages = [
      { senderId: 'user-a', readBy: [] },
      { senderId: 'user-a', readBy: ['user-b'] },
    ];

    const count = countUnreadMessages(messages, 'user-a');
    expect(count).toBe(0);
  });

  it('counts messages from others that are not yet read by the current user', () => {
    const messages = [
      { senderId: 'user-b', readBy: [] },
      { senderId: 'user-b', readBy: ['user-c'] },
      { senderId: 'user-b', readBy: ['user-a'] },
      { senderId: 'user-a', readBy: [] },
    ];

    const count = countUnreadMessages(messages, 'user-a');
    expect(count).toBe(2);
  });
});

describe('hasAnyUnread', () => {
  it('returns false when there are no conversations', () => {
    const result = hasAnyUnread([], 'user-a');
    expect(result).toBe(false);
  });

  it('returns false when all messages in all conversations are read by the user', () => {
    const conversations = [
      {
        _id: 'conv-1',
        messages: [
          { senderId: 'user-b', readBy: ['user-a'] },
          { senderId: 'user-a', readBy: [] },
        ],
      },
      {
        _id: 'conv-2',
        messages: [
          { senderId: 'user-c', readBy: ['user-a'] },
        ],
      },
    ];

    const result = hasAnyUnread(conversations, 'user-a');
    expect(result).toBe(false);
  });

  it('returns true when at least one conversation has unread messages for the user', () => {
    const conversations = [
      {
        _id: 'conv-1',
        messages: [
          { senderId: 'user-b', readBy: ['user-a'] },
        ],
      },
      {
        _id: 'conv-2',
        messages: [
          { senderId: 'user-c', readBy: [] },
        ],
      },
    ];

    const result = hasAnyUnread(conversations, 'user-a');
    expect(result).toBe(true);
  });
});
