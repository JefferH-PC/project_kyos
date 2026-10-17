import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MoneyBalanceChart from './MoneyBalanceChart';

const mockDb = {
  simulatedDate: '2026-10-17',
  recoverySpentTotal: 500,
  purchasedTotal: 1500,
  assets: [
    {
      id: 'a1',
      name: 'Tesouro Selic',
      investedAmount: 25000,
      initialInvestedAmount: 24000,
      incomeHistory: {
        '2026-10-15': 15,
        '2026-10-16': 15,
        '2026-10-17': 15
      }
    }
  ]
};

describe('MoneyBalanceChart Component', () => {
  test('renders ascending/descending balance line chart with headers and series controls', () => {
    render(
      <MoneyBalanceChart
        database={mockDb}
        investedTotal={25000}
        spentTotal={2000}
        locale="pt"
      />
    );

    expect(screen.getByText('Trajetória do Balanço Financeiro')).toBeInTheDocument();
    expect(screen.getByText('Ambas as Linhas')).toBeInTheDocument();
    expect(screen.getByText('Ascendente (Investido)')).toBeInTheDocument();
    expect(screen.getByText('Saídas (Gastos)')).toBeInTheDocument();
    expect(screen.getByText('R$ 25.000,00')).toBeInTheDocument();
  });

  test('toggles time range filters', () => {
    render(
      <MoneyBalanceChart
        database={mockDb}
        investedTotal={25000}
        spentTotal={2000}
        locale="pt"
      />
    );

    const sevenDaysBtn = screen.getByText('7D');
    fireEvent.click(sevenDaysBtn);
    expect(sevenDaysBtn).toHaveClass('active');

    const ytdBtn = screen.getByText('Ano');
    fireEvent.click(ytdBtn);
    expect(ytdBtn).toHaveClass('active');
  });

  test('toggles active series filter to Ascending or Spent', () => {
    render(
      <MoneyBalanceChart
        database={mockDb}
        investedTotal={25000}
        spentTotal={2000}
        locale="en"
      />
    );

    expect(screen.getByText('Financial Balance Trajectory')).toBeInTheDocument();

    const investedOnlyBtn = screen.getByText('Ascending (Invested)');
    fireEvent.click(investedOnlyBtn);
    expect(investedOnlyBtn).toHaveClass('active');
  });
});
