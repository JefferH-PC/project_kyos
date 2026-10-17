import React from 'react';
import { render, screen, act } from '@testing-library/react';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import fs from 'fs';
import path from 'path';

describe('Progressive Web App (PWA) Verification', () => {
  test('manifest.json is valid and contains standard PWA configuration', () => {
    const manifestPath = path.resolve(__dirname, '../public/manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifestContent.short_name).toBe('Kyos');
    expect(manifestContent.name).toContain('Kyos');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.start_url).toBe('./');
    expect(manifestContent.theme_color).toBe('#0f172a');
    expect(manifestContent.background_color).toBe('#0b0f19');
    expect(Array.isArray(manifestContent.icons)).toBe(true);
    expect(manifestContent.icons.length).toBeGreaterThanOrEqual(3);

    // Verify icons have required sizes and maskable purpose
    const has192 = manifestContent.icons.some((i) => i.sizes === '192x192');
    const has512 = manifestContent.icons.some((i) => i.sizes === '512x512');
    const hasMaskable = manifestContent.icons.some((i) => i.purpose && i.purpose.includes('maskable'));

    expect(has192).toBe(true);
    expect(has512).toBe(true);
    expect(hasMaskable).toBe(true);
  });

  test('public/service-worker.js exists and implements caching strategies', () => {
    const swPath = path.resolve(__dirname, '../public/service-worker.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf8');
    expect(swContent).toContain("addEventListener('install'");
    expect(swContent).toContain("addEventListener('activate'");
    expect(swContent).toContain("addEventListener('fetch'");
    expect(swContent).toContain('caches.open');
    expect(swContent).toContain('caches.match');
  });

  test('serviceWorkerRegistration module exports register and unregister functions', () => {
    expect(typeof serviceWorkerRegistration.register).toBe('function');
    expect(typeof serviceWorkerRegistration.unregister).toBe('function');

    // Calling without error in test environment
    expect(() => serviceWorkerRegistration.register()).not.toThrow();
    expect(() => serviceWorkerRegistration.unregister()).not.toThrow();
  });

  test('header does not render an in-app download or install button while preserving PWA capabilities', async () => {
    render(<App />);

    // No install or download button in UI
    expect(screen.queryByRole('button', { name: /install/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /download/i })).toBeNull();

    // Trigger appinstalled event and verify toast
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(await screen.findByText(/app installed successfully/i)).toBeInTheDocument();
  });

  test('shows toast notifications on offline and online network changes', async () => {
    render(<App />);

    // Trigger offline event
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(await screen.findByText(/offline mode active/i)).toBeInTheDocument();

    // Trigger online event
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(await screen.findByText(/online connection restored/i)).toBeInTheDocument();
  });
});
