import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

import ConversationList from '../../src/components/ConversationList.jsx';

describe('ConversationList', () => {
  const conversations = [
    { _id: 'conv-1', participants: ['user-a', 'user-b'] },
    { _id: 'conv-2', participants: ['user-a', 'user-c'] },
  ];

  it('renders a button for each conversation', () => {
    render(
      <ConversationList
        conversations={conversations}
        currentUserId="user-a"
        selectedConversationId={null}
        onSelect={() => {}}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(conversations.length);
  });

  it('calls onSelect with the conversation id when a row is clicked', () => {
    const handleSelect = vi.fn();

    render(
      <ConversationList
        conversations={conversations}
        currentUserId="user-a"
        selectedConversationId={null}
        onSelect={handleSelect}
      />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith('conv-2');
  });

  it('applies an active class to the selected conversation', () => {
    render(
      <ConversationList
        conversations={conversations}
        currentUserId="user-a"
        selectedConversationId="conv-2"
        onSelect={() => {}}
      />,
    );

    const buttons = screen.getAllByRole('button');

    expect(buttons[1].className).toContain('is-active');
  });
});
