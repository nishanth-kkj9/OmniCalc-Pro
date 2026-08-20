import { describe, it, expect } from 'vitest';
import { APP_VERSION, APP_NAME } from '../constants/version';
import packageJson from '../../package.json';
import { render } from '@testing-library/react';
import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { DEFAULT_SETTINGS } from './settings';

describe('Canonical Application Version (BUG-01 Regression Tests)', () => {
  it('matches package.json release version', () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(APP_VERSION).toBe('2.1.0');
    expect(APP_NAME).toBe('OmniCalc Pro');
  });

  it('renders the canonical version in the Sidebar footer without hardcoded v3.0 stale string', () => {
    const { container } = render(
      React.createElement(Sidebar, {
        currentMode: 'basic',
        onSelectMode: () => {},
        isOpen: true,
        settings: DEFAULT_SETTINGS,
      })
    );

    // Verifies canonical version is displayed
    const expectedFooter = `${APP_NAME} v${APP_VERSION} • Multi-Engine Suite`;
    expect(container.textContent).toContain(expectedFooter);

    // Explicitly asserts that stale v3.0 string is not present
    expect(container.textContent).not.toContain('v3.0');
  });
});
