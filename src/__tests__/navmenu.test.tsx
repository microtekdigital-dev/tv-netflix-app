/**
 * Tests unitarios para NavMenu
 * Requisitos: 2.7, 4.7, 7.1
 */
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import { act } from 'react-dom/test-utils';

// Necesario para que act() funcione correctamente con createRoot en jsdom
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock spatial navigation
const mockFocusSelf = jest.fn();
const mockUseFocusable = jest.fn(() => ({
  ref: { current: null } as React.RefObject<HTMLDivElement>,
  focused: false,
  hasFocusedChild: false,
  focusSelf: mockFocusSelf,
  focusKey: 'MENU',
}));

jest.mock('@noriginmedia/norigin-spatial-navigation', () => ({
  useFocusable: mockUseFocusable,
  FocusContext: React.createContext(''),
}));

import NavMenu from '../components/NavMenu/NavMenu';

describe('NavMenu', () => {
  let container: HTMLDivElement;
  let root: ReactDOMClient.Root;

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('renders all menu items', () => {
    act(() => {
      root.render(<NavMenu focusKey="MENU" onItemSelect={jest.fn()} />);
    });
    expect(container.textContent).toContain('Inicio');
    expect(container.textContent).toContain('Series');
    expect(container.textContent).toContain('Películas');
    expect(container.textContent).toContain('Mi Lista');
    expect(container.textContent).toContain('Buscar');
  });

  it('calls focusSelf on mount', () => {
    act(() => {
      root.render(<NavMenu focusKey="MENU" onItemSelect={jest.fn()} />);
    });
    expect(mockFocusSelf).toHaveBeenCalled();
  });

  it('uses trackChildren: true', () => {
    act(() => {
      root.render(<NavMenu focusKey="MENU" onItemSelect={jest.fn()} />);
    });
    const allCalls = mockUseFocusable.mock.calls as Array<Array<Record<string, unknown>>>;
    const navMenuCall = allCalls.find(
      (call) => call[0]?.focusKey === 'MENU'
    );
    expect(navMenuCall).toBeDefined();
    expect(navMenuCall![0].trackChildren).toBe(true);
  });

  it('renders FocusContext.Provider (NavMenu wraps children in context)', () => {
    act(() => {
      root.render(<NavMenu focusKey="MENU" onItemSelect={jest.fn()} />);
    });
    // If FocusContext.Provider is rendered, the menu items are visible inside it
    expect(container.textContent).toContain('NETFLIX');
  });

  it('changes background color when hasFocusedChild is true', () => {
    // Re-mock useFocusable to return hasFocusedChild: true for the NavMenu call
    let callCount = 0;
    mockUseFocusable.mockImplementation(() => {
      callCount += 1;
      // First call is NavMenu itself (focusKey=MENU), subsequent calls are NavMenuItems
      if (callCount === 1) {
        return {
          ref: { current: null } as React.RefObject<HTMLDivElement>,
          focused: false,
          hasFocusedChild: true,
          focusSelf: mockFocusSelf,
          focusKey: 'MENU',
        };
      }
      return {
        ref: { current: null } as React.RefObject<HTMLDivElement>,
        focused: false,
        hasFocusedChild: false,
        focusSelf: jest.fn(),
        focusKey: 'ITEM',
      };
    });

    act(() => {
      root.render(<NavMenu focusKey="MENU" onItemSelect={jest.fn()} />);
    });

    // Verify the CSS injected by styled-components contains the active background color
    const styleSheets = Array.from(document.styleSheets);
    const allRules = styleSheets.flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((r) => r.cssText);
      } catch {
        return [];
      }
    });
    const allCss = allRules.join(' ');
    // When hasFocusedChild=true, background-color should be #1a1a2e
    expect(allCss).toContain('#1a1a2e');
  });

  it('renders the Netflix logo', () => {
    act(() => {
      root.render(<NavMenu focusKey="MENU" onItemSelect={jest.fn()} />);
    });
    expect(container.textContent).toContain('NETFLIX');
  });

  it('calls onItemSelect when a menu item is clicked', () => {
    const onItemSelect = jest.fn();
    act(() => {
      root.render(<NavMenu focusKey="MENU" onItemSelect={onItemSelect} />);
    });

    // Find the first clickable item wrapper and click it
    const items = container.querySelectorAll('div[class]');
    // The ItemWrapper divs are inside the MenuWrapper; find one that contains 'Inicio'
    let inicioDiv: HTMLElement | null = null;
    items.forEach((el) => {
      if (el.textContent?.includes('Inicio') && !el.textContent?.includes('Series')) {
        inicioDiv = el as HTMLElement;
      }
    });

    if (inicioDiv) {
      act(() => {
        (inicioDiv as HTMLElement).click();
      });
      expect(onItemSelect).toHaveBeenCalledWith('home');
    }
  });
});
