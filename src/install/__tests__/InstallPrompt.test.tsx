import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import InstallPrompt from '../InstallPrompt';

const SEEN_KEY = 'emoms.installPromptSeen.v1';

describe('InstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('asks whether the visitor is on an iPhone on a clean slate', () => {
    render(<InstallPrompt />);
    // getByRole throws if absent, so these are assertions in themselves.
    screen.getByRole('heading', { name: /are you on an iphone/i });
    screen.getByRole('button', { name: /^yes$/i });
    screen.getByRole('button', { name: /^no$/i });
  });

  it('reveals Safari-specific Add-to-Home-Screen steps on Yes', () => {
    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: /^yes$/i }));

    screen.getByRole('heading', { name: /add emoms to your home screen/i });
    // The guide must name Safari — Add to Home Screen only works there on iOS.
    expect(screen.getAllByText(/safari/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/add to home screen/i).length).toBeGreaterThan(
      0,
    );
    // Answering Yes alone should not yet mark the prompt as seen.
    expect(localStorage.getItem(SEEN_KEY)).toBeNull();
  });

  it('dismisses and records "seen" when No is tapped', () => {
    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: /^no$/i }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem(SEEN_KEY)).not.toBeNull();
  });

  it('records "seen" after completing the guide with Got it', () => {
    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: /^yes$/i }));
    fireEvent.click(screen.getByRole('button', { name: /got it/i }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem(SEEN_KEY)).not.toBeNull();
  });

  it('renders nothing when the seen key is already present', () => {
    localStorage.setItem(SEEN_KEY, '1');
    render(<InstallPrompt />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.queryByRole('heading', { name: /are you on an iphone/i }),
    ).toBeNull();
  });

  it('stays dismissed on a fresh mount after being seen', () => {
    const first = render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: /^no$/i }));
    first.unmount();

    render(<InstallPrompt />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
