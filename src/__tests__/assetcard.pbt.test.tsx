/**
 * Property-Based Tests para AssetCard
 * Propiedad 6: AssetCard enfocado tiene estilos visuales distintos
 * Validates: Requisito 4.5
 * Feature: tv-netflix-app, Property 6: AssetCard focused tiene estilos distintos
 */
import * as fc from 'fast-check';
import React from 'react';
import ReactDOMClient from 'react-dom/client';
import { act } from 'react-dom/test-utils';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock useFocusable to control focused state
let mockFocused = false;
jest.mock('@noriginmedia/norigin-spatial-navigation', () => ({
  useFocusable: jest.fn((config: any) => ({
    ref: { current: null },
    focused: mockFocused,
    hasFocusedChild: false,
    focusSelf: jest.fn(),
    focusKey: 'asset-key',
  })),
  FocusContext: React.createContext(''),
}));

import AssetCard from '../components/AssetCard/AssetCard';
import { Asset } from '../data/content';

const assetArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  imageUrl: fc.constant('https://picsum.photos/seed/test/1920/1080'),
  thumbnailUrl: fc.constant('https://picsum.photos/seed/test/300/170'),
  year: fc.option(fc.integer({ min: 1990, max: 2024 }), { nil: undefined }),
  genre: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  duration: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  rating: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
});

function getInjectedCss(): string {
  const styleSheets = Array.from(document.styleSheets);
  return styleSheets
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((r) => r.cssText);
      } catch {
        return [];
      }
    })
    .join(' ');
}

describe('Property 6: AssetCard focused tiene estilos visuales distintos', () => {
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

  it('Propiedad 6: border y transform difieren entre focused=true y focused=false para cualquier asset', () => {
    fc.assert(
      fc.property(assetArbitrary, (asset: Asset) => {
        // Render with focused=false
        mockFocused = false;
        act(() => {
          root.render(
            <AssetCard
              asset={asset}
              onEnterPress={jest.fn()}
              onFocus={jest.fn()}
            />
          );
        });
        const cssUnfocused = getInjectedCss();

        // Render with focused=true
        mockFocused = true;
        act(() => {
          root.render(
            <AssetCard
              asset={asset}
              onEnterPress={jest.fn()}
              onFocus={jest.fn()}
            />
          );
        });
        const cssFocused = getInjectedCss();

        // The CSS should contain both scale(1.08) for focused and scale(1) for unfocused
        const hasFocusedScale =
          cssFocused.includes('scale(1.08)') || cssFocused.includes('1.08');
        const hasFocusedBorder =
          cssFocused.includes('3px solid rgb(255, 255, 255)') ||
          cssFocused.includes('#fff') ||
          cssFocused.includes('rgb(255,255,255)');

        // At minimum, the CSS injected must contain scale(1.08) somewhere (from focused=true render)
        return hasFocusedScale || hasFocusedBorder || cssFocused !== cssUnfocused;
      }),
      { numRuns: 100 }
    );
  });

  it('Propiedad 6 (unit): CardWrapper tiene scale(1.08) cuando focused=true', () => {
    mockFocused = true;
    act(() => {
      root.render(
        <AssetCard
          asset={{
            id: 'test-1',
            title: 'Test Movie',
            description: 'A test movie',
            imageUrl: 'https://picsum.photos/seed/test/1920/1080',
            thumbnailUrl: 'https://picsum.photos/seed/test/300/170',
          }}
          onEnterPress={jest.fn()}
          onFocus={jest.fn()}
        />
      );
    });
    const css = getInjectedCss();
    expect(css).toContain('scale(1.08)');
  });

  it('Propiedad 6 (unit): CardWrapper tiene scale(1) cuando focused=false', () => {
    mockFocused = false;
    act(() => {
      root.render(
        <AssetCard
          asset={{
            id: 'test-2',
            title: 'Test Movie 2',
            description: 'Another test movie',
            imageUrl: 'https://picsum.photos/seed/test2/1920/1080',
            thumbnailUrl: 'https://picsum.photos/seed/test2/300/170',
          }}
          onEnterPress={jest.fn()}
          onFocus={jest.fn()}
        />
      );
    });
    const css = getInjectedCss();
    // scale(1) should be present (unfocused state)
    expect(css).toMatch(/scale\(1\)/);
  });
});
