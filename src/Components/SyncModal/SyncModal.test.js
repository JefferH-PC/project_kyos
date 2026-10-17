import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

  test('renders dialog and starts counting from R$ 0,00 up to targetIncome', () => {
    const handleClose = jest.fn();
    render(
      <SyncModal
        isOpen={true}
        onClose={handleClose}
        targetIncome={20717.36}
        targetTotal={89966.36}
        initialPrincipal={69249}
        businessDays={594}
        referenceDate="2026-10-15"
        locale="pt"
        duration={1000}
      />
    );

    // Initial state: dialog is present
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sincronização CDI Bancária')).toBeInTheDocument();
    expect(screen.getByText(/594/)).toBeInTheDocument();
    expect(screen.getByText(/15\/10\/2026/)).toBeInTheDocument();

    // Fast-forward animation to completion
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    // Money display reaches target
    const display = screen.getByTestId('sync-money-display');
    expect(display).toHaveTextContent('20.717,36');

    // Portfolio balance reaches target
    const portfolio = screen.getByTestId('sync-portfolio-balance');
    expect(portfolio).toHaveTextContent('89.966,36');

    // Completion status
    expect(screen.getByText('✓ 100% Sincronizado e Reconciliado com o Banco!')).toBeInTheDocument();
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
