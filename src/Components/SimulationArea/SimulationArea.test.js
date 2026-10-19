import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SimulationArea from './SimulationArea';

const mockDatabase = {
  simulatedDate: '2026-10-15',
  assets: [
    {
      id: 'asset-1',
      name: 'CDB Banco Inter',
      investedAmount: 50000,
      initialInvestedAmount: 50000,
      yieldRate: 100,
      creationDate: '2026-10-01',
      applyTax: false,
      totalIncome: 120
    }
  ],
  wishlistSlots: [
    {
      id: 'wish-1',
      expenseName: 'Monitor 4K',
      price: 2000,
      originalPrice: 2000,
      isProcessing: true,
      type: 'wishlist'
    }
  ],
  recoverySlots: []
};

describe('SimulationArea Component', () => {
  test('renders simulation area with baseline and controls', () => {
    render(
      <SimulationArea
        mainDatabase={mockDatabase}
        liveCdiRate={0.040188}
        holidaysList={[]}
        locale="pt"
      />
    );

    expect(screen.getByText('Ambiente Dedicado de Simulação')).toBeInTheDocument();
    expect(screen.getByText('Restaurar Dados Reais')).toBeInTheDocument();
    expect(screen.getByText('Limpar Tudo')).toBeInTheDocument();
    expect(screen.getByText('+ Adicionar Ativo na Simulação')).toBeInTheDocument();
  });

  test('toggles add asset form and adds new simulated asset', () => {
    render(
      <SimulationArea
        mainDatabase={mockDatabase}
        liveCdiRate={0.040188}
        holidaysList={[]}
        locale="pt"
      />
    );

    const addBtn = screen.getByText('+ Adicionar Ativo na Simulação');
    fireEvent.click(addBtn);

    expect(screen.getByText('Nome do Ativo')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('Ex: CDB 110% CDI');
    const amountInput = screen.getByPlaceholderText('0.00');
    const saveBtn = screen.getByText('Adicionar à Simulação');

    fireEvent.change(nameInput, { target: { value: 'LCI 95%' } });
    fireEvent.change(amountInput, { target: { value: '15000' } });
    fireEvent.click(saveBtn);

    expect(screen.getByText('LCI 95%')).toBeInTheDocument();
    expect(screen.getByText(/15.000,00/)).toBeInTheDocument();
  });

  test('toggles inflation control and updates input', () => {
    render(
      <SimulationArea
        mainDatabase={mockDatabase}
        liveCdiRate={0.040188}
        holidaysList={[]}
        locale="pt"
      />
    );

    const toggle = screen.getByLabelText('Descontar Inflação (IPCA)');
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);
    expect(toggle).toBeChecked();

    const ipcaInput = screen.getByLabelText('IPCA Anual (% a.a.):');
    expect(ipcaInput).toBeInTheDocument();
    expect(ipcaInput.value).toBe('4.5');
  });

  test('selecting a target date calculates projection and real metrics', () => {
    render(
      <SimulationArea
        mainDatabase={mockDatabase}
        liveCdiRate={0.040188}
        holidaysList={[]}
        locale="pt"
      />
    );

    // Click on target date 20 (future business day in October 2026)
    const dayCell = screen.getByText('20');
    fireEvent.click(dayCell);

    expect(screen.getByText('Dias Corridos')).toBeInTheDocument();
    expect(screen.getByText('Dias Úteis')).toBeInTheDocument();
    expect(screen.getByText('Rendimento Projetado')).toBeInTheDocument();
  });

  test('reset button removes simulated assets and restores baseline', () => {
    render(
      <SimulationArea
        mainDatabase={mockDatabase}
        liveCdiRate={0.040188}
        holidaysList={[]}
        locale="pt"
      />
    );

    // Add simulated asset
    fireEvent.click(screen.getByText('+ Adicionar Ativo na Simulação'));
    fireEvent.change(screen.getByPlaceholderText('Ex: CDB 110% CDI'), { target: { value: 'Mock CDB' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '5000' } });
    fireEvent.click(screen.getByText('Adicionar à Simulação'));

    expect(screen.getByText('Mock CDB')).toBeInTheDocument();

    // Click Reset
    fireEvent.click(screen.getByText('Restaurar Dados Reais'));

    expect(screen.queryByText('Mock CDB')).not.toBeInTheDocument();
    expect(screen.getByText('CDB Banco Inter')).toBeInTheDocument();
  });

  test('custom simulated asset follows B3 holding-day schedule (Day 0 yields 0, first yield on Day D+1)', () => {
    const emptyDatabase = {
      simulatedDate: '2026-10-15',
      assets: [],
      wishlistSlots: [],
      recoverySlots: []
    };

    render(
      <SimulationArea
        mainDatabase={emptyDatabase}
        liveCdiRate={0.040188}
        holidaysList={[]}
        locale="pt"
      />
    );

    // Add asset starting on 2026-10-19
    fireEvent.click(screen.getByText('+ Adicionar Ativo na Simulação'));
    fireEvent.change(screen.getByPlaceholderText('Ex: CDB 110% CDI'), { target: { value: 'New Test Asset' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100000' } });
    // set start date input to 2026-10-19
    const dateInput = document.querySelector('.sim-add-asset-form input[type="date"]');
    expect(dateInput).toBeInTheDocument();
    fireEvent.change(dateInput, { target: { value: '2026-10-19' } });
    fireEvent.click(screen.getByText('Adicionar à Simulação'));

    // Select 2026-10-19 as target: Day 0 of this asset -> yields 0
    // Click on target date 19
    const dayCell19 = screen.getByText('19');
    fireEvent.click(dayCell19);

    // With 0 yield for this asset, projected income is R$ 0,00
    expect(screen.getByText(/R\$\s*0,00/)).toBeInTheDocument();

    // Now select target date 20: Day 1 of this asset -> yields 1 business day
    const dayCell20 = screen.getByText('20');
    fireEvent.click(dayCell20);

    // Yield should now be strictly greater than 0
    expect(screen.queryByText(/R\$\s*0,00/)).toBeNull();
  });
});
