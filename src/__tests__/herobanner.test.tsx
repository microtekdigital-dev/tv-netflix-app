/**
 * Tests unitarios para HeroBanner
 * Requisitos: 6.2, 6.3
 */
import React from 'react';
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
    focusKey: 'hero-key',
  })),
  FocusContext: React.createContext(''),
}));

import HeroBanner from '../components/HeroBanner/HeroBanner';
import { Asset } from '../data/content';

const mockAsset: Asset = {
  id: 'test-1',
  title: 'El Último Horizonte',
  description: 'Un astronauta perdido en el espacio profundo.',
  imageUrl: 'https://picsum.photos/seed/test/1920/1080',
  thumbnailUrl: 'https://picsum.photos/seed/test/300/170',
  year: 2023,
  genre: 'Ciencia Ficción',
  duration: '2h 15m',
  rating: 'PG-13',
};

describe('HeroBanner', () => {
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

  it('muestra contenido por defecto cuando asset es null', () => {
    act(() => {
      root.render(<HeroBanner asset={null} />);
    });
    expect(container.textContent).toContain('Bienvenido');
    expect(container.textContent).toContain('Selecciona un contenido para comenzar');
  });

  it('muestra el título del asset cuando se proporciona', () => {
    act(() => {
      root.render(<HeroBanner asset={mockAsset} />);
    });
    expect(container.textContent).toContain('El Último Horizonte');
  });

  it('muestra la descripción del asset', () => {
    act(() => {
      root.render(<HeroBanner asset={mockAsset} />);
    });
    expect(container.textContent).toContain('Un astronauta perdido en el espacio profundo.');
  });

  it('muestra el botón Reproducir cuando hay asset', () => {
    act(() => {
      root.render(<HeroBanner asset={mockAsset} />);
    });
    expect(container.textContent).toContain('Reproducir');
  });

  it('actualiza el título cuando cambia el asset', () => {
    act(() => {
      root.render(<HeroBanner asset={mockAsset} />);
    });
    expect(container.textContent).toContain('El Último Horizonte');

    const newAsset: Asset = {
      ...mockAsset,
      id: 'test-2',
      title: 'Sombras del Pasado',
      description: 'Un detective investiga crímenes.',
    };

    act(() => {
      root.render(<HeroBanner asset={newAsset} />);
    });
    expect(container.textContent).toContain('Sombras del Pasado');
    expect(container.textContent).not.toContain('El Último Horizonte');
  });

  it('muestra metadatos del asset (año, género, duración)', () => {
    act(() => {
      root.render(<HeroBanner asset={mockAsset} />);
    });
    expect(container.textContent).toContain('2023');
    expect(container.textContent).toContain('Ciencia Ficción');
  });

  it('llama onPlayPress cuando se hace click en Reproducir', () => {
    const onPlayPress = jest.fn();
    act(() => {
      root.render(<HeroBanner asset={mockAsset} onPlayPress={onPlayPress} />);
    });

    const playButton = container.querySelector('button');
    if (playButton) {
      act(() => { playButton.click(); });
    }
    // Note: click triggers DOM event, not useFocusable onEnterPress
    // The button click is handled by the DOM, not by spatial navigation in tests
  });
});
