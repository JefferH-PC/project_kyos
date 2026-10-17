import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TigerMascot from './TigerMascot';

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('TigerMascot Living Companion', () => {
  test('renders tiger mascot with name, role and avatar in Portuguese and English', () => {
    const { rerender } = render(<TigerMascot locale="pt" />);
    expect(screen.getByText('Herby, o Tigre do Kyos')).toBeInTheDocument();
    expect(screen.getByText('Guardião do Patrimônio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /alimentar/i })).toBeInTheDocument();

    rerender(<TigerMascot locale="en" />);
    expect(screen.getByText('Herby, the Kyos Tiger')).toBeInTheDocument();
    expect(screen.getByText('Wealth Guardian')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /feed/i })).toBeInTheDocument();
  });

  test('clicking on tiger card triggers happy interaction and speech bubble', () => {
    render(<TigerMascot locale="pt" />);

    const card = screen.getByTestId('tiger-interactive-card');
    fireEvent.click(card);

    const bubble = screen.getByTestId('tiger-speech-bubble');
    expect(bubble).toBeInTheDocument();

    // Clicking bubble dismisses it
    fireEvent.click(bubble);
    expect(screen.queryByTestId('tiger-speech-bubble')).not.toBeInTheDocument();
  });

  test('feeding a coin increments counter and vaults coin in localStorage', () => {
    render(<TigerMascot locale="pt" />);

    expect(screen.getByText('🪙 0')).toBeInTheDocument();

    const feedBtn = screen.getByTestId('tiger-feed-btn');
    fireEvent.click(feedBtn);

    expect(screen.getByText('🪙 1')).toBeInTheDocument();
    expect(window.localStorage.getItem('kyos-tiger-coins')).toBe('1');
    expect(screen.getByTestId('tiger-speech-bubble')).toBeInTheDocument();
  });

  test('minimizes to floating paw icon and expands back', () => {
    render(<TigerMascot locale="pt" />);

    const minimizeBtn = screen.getByTestId('tiger-minimize-btn');
    fireEvent.click(minimizeBtn);

    // Living card should be hidden, paw button visible
    expect(screen.queryByTestId('tiger-interactive-card')).not.toBeInTheDocument();
    const expandBtn = screen.getByTestId('tiger-expand-btn');
    expect(expandBtn).toBeInTheDocument();

    // Clicking expand brings back living card
    fireEvent.click(expandBtn);
    expect(screen.getByTestId('tiger-interactive-card')).toBeInTheDocument();
  });

  test('renders sleeping zZz state when market is closed on weekend or holiday', () => {
    render(<TigerMascot isWeekendOrHoliday={true} locale="pt" />);
    expect(screen.getByTestId('tiger-sleeping-particles')).toBeInTheDocument();
    expect(screen.getByTestId('tiger-eyes-sleeping')).toBeInTheDocument();
  });

  test('renders accessories for recovery, milestone, and ready states', () => {
    const { rerender } = render(<TigerMascot hasRecovery={true} locale="pt" />);
    expect(screen.getByTestId('accessory-shield')).toBeInTheDocument();

    rerender(<TigerMascot isMilestoneClose={true} locale="pt" />);
    expect(screen.getByTestId('accessory-crown')).toBeInTheDocument();

    rerender(<TigerMascot hasReadyWishlist={true} locale="pt" />);
    expect(screen.getByTestId('accessory-gift')).toBeInTheDocument();

    rerender(<TigerMascot isSyncing={true} locale="pt" />);
    expect(screen.getByTestId('accessory-stopwatch')).toBeInTheDocument();
  });
});
