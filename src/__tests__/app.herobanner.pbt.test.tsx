/**
 * Property-Based Tests para App — actualización del HeroBanner
 * Propiedad 7: Selección actualiza el HeroBanner
 * Validates: Requisitos 6.1, 6.2
 * Feature: tv-netflix-app, Property 7: selección actualiza HeroBanner
 */
import * as fc from 'fast-check';
import React, { useState } from 'react';
import ReactDOMClient from 'react-dom/client';
import { act } from 'react-dom/test-utils';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@noriginmedia/norigin-spatial-navigation', () => ({
  useFocusable: jest.fn(() => ({
    ref: { current: null },
    focused: false,
    hasFocusedChild: false,
    focusSelf: jest.fn(),
    focusKey: 'mock-key',
  })),
  FocusContext: React.createContext(''),
}));

import HeroBanner from '../components/HeroBanner/HeroBanner';
import { Asset } from '../data/content';

const assetArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  imageUrl: fc.constant('https://picsum.photos/seed/test/1920/1080'),
  thumbnailUrl: fc.constant('https://picsum.photos/seed/test/300/170'),
});

// Simple test component that simulates App's selectedAsset state
function TestApp({ initialAsset }: { initialAsset: Asset | null }) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(initialAsset);
  return (
    <div>
      <HeroBanner asset={selectedAsset} onPlayPress={setSelectedAsset} />
      <button
        data-testid="select-asset"
        onClick={() => setSelectedAsset({
          id: 'new-asset',
          title: 'Nuevo Asset Seleccionado',
          description: 'Descripción del nuevo asset',
          imageUrl: 'https://picsum.photos/seed/new/1920/1080',
          thumbnailUrl: 'https://picsum.photos/seed/new/300/170',
        })}
      >
        Select Asset
      </button>
    </div>
  );
}

describe('Property 7: Selección actualiza el HeroBanner', () => {
  let container: HTMLDivElement;
  let root: ReactDOMClient.Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOMClient.createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  it('Propiedad 7: HeroBanner refleja el asset seleccionado para cualquier asset arbitrario', () => {
    fc.assert(
      fc.property(assetArbitrary, (asset: Asset) => {
        act(() => {
          root.render(<HeroBanner asset={asset} />);
        });

        const titleVisible = container.textContent?.includes(asset.title) ?? false;
        const descriptionVisible = container.textContent?.includes(asset.description) ?? false;

        return titleVisible && descriptionVisible;
      }),
      { numRuns: 100 }
    );
  });

  it('Propiedad 7 (unit): HeroBanner muestra contenido por defecto cuando selectedAsset es null', () => {
    act(() => {
      root.render(<HeroBanner asset={null} />);
    });
    expect(container.textContent).toContain('Bienvenido');
  });

  it('Propiedad 7 (unit): HeroBanner actualiza cuando cambia selectedAsset', () => {
    const asset1: Asset = {
      id: 'asset-1',
      title: 'Primera Película',
      description: 'Descripción primera',
      imageUrl: 'https://picsum.photos/seed/1/1920/1080',
      thumbnailUrl: 'https://picsum.photos/seed/1/300/170',
    };
    const asset2: Asset = {
      id: 'asset-2',
      title: 'Segunda Película',
      description: 'Descripción segunda',
      imageUrl: 'https://picsum.photos/seed/2/1920/1080',
      thumbnailUrl: 'https://picsum.photos/seed/2/300/170',
    };

    act(() => { root.render(<HeroBanner asset={asset1} />); });
    expect(container.textContent).toContain('Primera Película');

    act(() => { root.render(<HeroBanner asset={asset2} />); });
    expect(container.textContent).toContain('Segunda Película');
    expect(container.textContent).not.toContain('Primera Película');
  });
});
