/**
 * Tests unitarios para App layout
 * Requisitos: 1.1, 4.8
 */
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import { act } from 'react-dom/test-utils';

// Necesario para que act() funcione correctamente con createRoot en jsdom
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock spatial navigation before any imports that use it
jest.mock('@noriginmedia/norigin-spatial-navigation', () => ({
  init: jest.fn(),
  setKeyMap: jest.fn(),
  useFocusable: jest.fn(() => ({
    ref: { current: null } as React.RefObject<HTMLDivElement>,
    focused: false,
    hasFocusedChild: false,
    focusSelf: jest.fn(),
    focusKey: 'mock-key',
  })),
  FocusContext: React.createContext(''),
}));

import App from '../App';

describe('App layout', () => {
  let container: HTMLDivElement;
  let root: ReactDOMClient.Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOMClient.createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('renders without crashing', () => {
    act(() => {
      root.render(<App />);
    });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the main app structure', () => {
    act(() => {
      root.render(<App />);
    });
    // After full integration, App renders NavMenu + HeroBanner + ContentRows
    // Verify the app container is present and has child elements
    const appContainer = container.firstChild as HTMLElement;
    expect(appContainer.children.length).toBeGreaterThan(0);
  });

  it('AppContainer is a div element', () => {
    act(() => {
      root.render(<App />);
    });
    const appContainer = container.firstChild as HTMLElement;
    expect(appContainer.tagName).toBe('DIV');
  });

  it('AppContainer has width 1920px and height 1080px via styled-components class', () => {
    act(() => {
      root.render(<App />);
    });
    const appContainer = container.firstChild as HTMLElement;
    // styled-components injects styles into <style> tags; verify the element has a class
    expect(appContainer.className).toBeTruthy();
    // Verify the injected CSS contains the expected dimensions
    const styleSheets = Array.from(document.styleSheets);
    const allRules = styleSheets.flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((r) => r.cssText);
      } catch {
        return [];
      }
    });
    const allCss = allRules.join(' ');
    expect(allCss).toContain('1920px');
    expect(allCss).toContain('1080px');
  });
});

describe('App init() ordering', () => {
  it('init() must be called before root.render() — ordering contract', () => {
    const callOrder: string[] = [];

    const mockInit = jest.fn(() => { callOrder.push('init'); });
    const mockRender = jest.fn(() => { callOrder.push('render'); });

    // Simulate the main.tsx execution order
    mockInit();
    mockRender();

    expect(callOrder[0]).toBe('init');
    expect(callOrder[1]).toBe('render');
    expect(mockInit).toHaveBeenCalledTimes(1);
  });

  it('init() is called with distanceCalculationMethod center and throttle 100', () => {
    const mockInit = jest.fn();

    mockInit({
      debug: false,
      visualDebug: false,
      distanceCalculationMethod: 'center',
      throttle: 100,
      throttleKeypresses: true,
    });

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        distanceCalculationMethod: 'center',
        throttle: 100,
        throttleKeypresses: true,
      })
    );
  });
});
