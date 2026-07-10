import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

type RenderWithProvidersOptions = {
  route?: string;
  withAuthProvider?: boolean;
};

export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', withAuthProvider = false }: RenderWithProvidersOptions = {},
) {
  window.history.pushState({}, 'Test page', route);

  const tree = (
    <MemoryRouter initialEntries={[route]}>
      {withAuthProvider ? <AuthProvider>{ui}</AuthProvider> : ui}
    </MemoryRouter>
  );

  return render(tree);
}
