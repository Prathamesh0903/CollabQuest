import React from 'react';
import { render } from '@testing-library/react';

// Simple test that doesn't require complex dependencies
test('basic test setup works', () => {
  const TestComponent = () => <div>Test</div>;
  const { getByText } = render(<TestComponent />);
  expect(getByText('Test')).toBeInTheDocument();
});
