import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

import MessageComposer from '../../src/components/MessageComposer.jsx';

describe('MessageComposer', () => {
  it('disables the send button when the input is empty or whitespace', () => {
    render(<MessageComposer onSend={() => {}} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /send/i });

    expect(button.disabled).toBe(true);

    fireEvent.change(input, { target: { value: '   ' } });
    expect(button.disabled).toBe(true);
  });

  it('calls onSend with trimmed text and clears the input when a valid message is submitted', () => {
    const handleSend = vi.fn();

    render(<MessageComposer onSend={handleSend} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: '  hello there  ' } });
    expect(button.disabled).toBe(false);

    fireEvent.click(button);

    expect(handleSend).toHaveBeenCalledTimes(1);
    expect(handleSend).toHaveBeenCalledWith('hello there');
    expect(input.value).toBe('');
    expect(button.disabled).toBe(true);
  });

  it('does not call onSend when the message is longer than 500 characters', () => {
    const handleSend = vi.fn();

    render(<MessageComposer onSend={handleSend} />);

    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /send/i });

    const longText = 'x'.repeat(501);
    fireEvent.change(input, { target: { value: longText } });

    expect(button.disabled).toBe(false);

    fireEvent.click(button);

    expect(handleSend).not.toHaveBeenCalled();
  });
});
