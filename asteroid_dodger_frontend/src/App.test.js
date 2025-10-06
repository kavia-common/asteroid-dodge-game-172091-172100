import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Asteroid Dodger title', () => {
  render(<App />);
  const title = screen.getByText(/Asteroid Dodger/i);
  expect(title).toBeInTheDocument();
});
