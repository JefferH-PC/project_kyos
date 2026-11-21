import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SyncModal from './SyncModal';

describe('SyncModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('does not render when isOpen is false', () => {
    render(<SyncModal isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders dialog with reconciled targetIncome and portfolio balance', () => {
    const handleClose = jest.fn();
    render(
      <SyncModal
        isOpen={true}
        onClose={handleClose}
        targetIncome={20797.80}
        targetTotal={90046.80}
        initialPrincipal={69249}
        businessDays={596}
        referenceDate="2026-10-19"
        locale="pt"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sincronização CDI Bancária')).toBeInTheDocument();
    expect(screen.getByText(/596/)).toBeInTheDocument();
    expect(screen.getByText(/19\/10\/2026/)).toBeInTheDocument();

    const display = screen.getByTestId('sync-money-display');
    expect(display).toHaveTextContent('20.797,80');

    const portfolio = screen.getByTestId('sync-portfolio-balance');
    expect(portfolio).toHaveTextContent('90.046,80');
  });

  test('clicking Done button calls onClose callback', () => {
    const handleClose = jest.fn();
    render(
      <SyncModal
        isOpen={true}
        onClose={handleClose}
        targetIncome={1000}
        targetTotal={11000}
        locale="en"
      />
    );

    const doneBtn = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('pressing Escape key calls onClose callback', () => {
    const handleClose = jest.fn();
    render(
      <SyncModal
        isOpen={true}
        onClose={handleClose}
        targetIncome={1000}
        targetTotal={11000}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('clicking hero card jumps animation directly to target value', () => {
    render(
      <SyncModal
        isOpen={true}
        onClose={jest.fn()}
        targetIncome={5000}
        targetTotal={15000}
        duration={3000}
        locale="pt"
      />
    );

    const heroCard = screen.getByRole('region');
    fireEvent.click(heroCard);

    const display = screen.getByTestId('sync-money-display');
    expect(display).toHaveTextContent('5.000,00');
  });
});
