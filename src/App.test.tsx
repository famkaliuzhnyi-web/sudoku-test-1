import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders sudoku app title', () => {
  render(<App />);
  const titleElement = screen.getByText(/sudoku with web workers/i);
  expect(titleElement).toBeInTheDocument();
});

test('shows web worker initialization message', () => {
  render(<App />);
  const loadingElement = screen.getByText(/initializing web worker/i);
  expect(loadingElement).toBeInTheDocument();
});
