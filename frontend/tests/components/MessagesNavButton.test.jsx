import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

import MessagesNavButton from '../../src/components/MessagesNavButton.jsx';

describe('MessagesNavButton', () => {
  it('does not render anything when user is not logged in', () => {
    const { container } = render(
      <MessagesNavButton isLoggedIn={false} unreadCount={0} onClick={() => {}} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders a Messages button when user is logged in', () => {
    render(
      <MessagesNavButton isLoggedIn={true} unreadCount={0} onClick={() => {}} />,
    );

    const button = screen.getByRole('button', { name: /messages/i });
    expect(button).toBeTruthy();
  });

  it('shows a badge when there are unread messages', () => {
    render(
      <MessagesNavButton isLoggedIn={true} unreadCount={3} onClick={() => {}} />,
    );

    const badge = screen.getByTestId('messages-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('3');
  });

  it('does not show a badge when there are no unread messages', () => {
    render(
      <MessagesNavButton isLoggedIn={true} unreadCount={0} onClick={() => {}} />,
    );

    const badge = screen.queryByTestId('messages-badge');
    expect(badge).toBeNull();
  });

  it('calls onClick when the button is clicked', () => {
    const handleClick = vi.fn();

    render(
      <MessagesNavButton isLoggedIn={true} unreadCount={0} onClick={handleClick} />,
    );

    const button = screen.getByRole('button', { name: /messages/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
