import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('switches built-in labels to Portuguese without changing user data', async () => {
  render(<App />);

  const localeSelect = screen.getByRole('combobox', { name: /select language/i });
  expect(localeSelect).toHaveValue('en');

  await userEvent.selectOptions(localeSelect, 'pt');

  expect(screen.getByRole('combobox', { name: /selecionar idioma/i })).toHaveValue('pt');
  expect(screen.getByText('Patrimônio')).toBeInTheDocument();
});
