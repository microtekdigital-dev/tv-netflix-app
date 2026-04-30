/**
 * Property-Based Tests para navegación espacial — elemento más cercano
 * Propiedad 2: Navegación mueve el foco al elemento más cercano
 * Validates: Requisito 2.1
 * Feature: tv-netflix-app, Property 2: foco se mueve al elemento más cercano
 */
import * as fc from 'fast-check';

jest.mock('@noriginmedia/norigin-spatial-navigation', () => {
  const core = jest.requireActual('../../../../packages/core/src/index');
  return core;
});

import { SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation';

function createMockNode(x: number, y: number, width: number, height: number): HTMLElement {
  const node = document.createElement('div');
  node.getBoundingClientRect = () => ({
    left: x, top: y, right: x + width, bottom: y + height,
    width, height, x, y, toJSON: () => {}
  });
  Object.defineProperty(node, 'offsetLeft', { value: x, configurable: true });
  Object.defineProperty(node, 'offsetTop', { value: y, configurable: true });
  Object.defineProperty(node, 'offsetWidth', { value: width, configurable: true });
  Object.defineProperty(node, 'offsetHeight', { value: height, configurable: true });
  return node;
}

describe('Property 2: Navegación mueve el foco al elemento más cercano', () => {
  beforeEach(() => {
    SpatialNavigation.destroy();
    SpatialNavigation.init({ debug: false, useGetBoundingClientRect: true });
  });

  afterEach(() => {
    SpatialNavigation.destroy();
  });

  it('Propiedad 2 (unit): navegar a la derecha desde comp-left mueve el foco a comp-right', () => {
    const focused: Record<string, boolean> = {};

    const nodeLeft = createMockNode(0, 0, 200, 100);
    const nodeRight = createMockNode(300, 0, 200, 100);

    ['comp-left', 'comp-right'].forEach((key, i) => {
      SpatialNavigation.addFocusable({
        focusKey: key,
        node: i === 0 ? nodeLeft : nodeRight,
        parentFocusKey: 'SN:ROOT',
        onEnterPress: () => {}, onEnterRelease: () => {},
        onArrowPress: () => true, onArrowRelease: () => {},
        onFocus: () => {}, onBlur: () => {},
        onUpdateFocus: (v) => { focused[key] = v ?? false; },
        onUpdateHasFocusedChild: () => {},
        saveLastFocusedChild: false, trackChildren: false,
        isFocusBoundary: false, autoRestoreFocus: false,
        forceFocus: false, focusable: true,
      });
    });

    SpatialNavigation.setFocus('comp-left');
    expect(focused['comp-left']).toBe(true);

    SpatialNavigation.navigateByDirection('right');
    expect(focused['comp-right']).toBe(true);
    expect(focused['comp-left']).toBe(false);
  });

  it('Propiedad 2 (unit): navegar en dirección sin vecino mantiene el foco actual', () => {
    const focused: Record<string, boolean> = {};

    const node = createMockNode(500, 500, 200, 100);
    SpatialNavigation.addFocusable({
      focusKey: 'solo-comp',
      node,
      parentFocusKey: 'SN:ROOT',
      onEnterPress: () => {}, onEnterRelease: () => {},
      onArrowPress: () => true, onArrowRelease: () => {},
      onFocus: () => {}, onBlur: () => {},
      onUpdateFocus: (v) => { focused['solo-comp'] = v ?? false; },
      onUpdateHasFocusedChild: () => {},
      saveLastFocusedChild: false, trackChildren: false,
      isFocusBoundary: false, autoRestoreFocus: false,
      forceFocus: false, focusable: true,
    });

    SpatialNavigation.setFocus('solo-comp');
    expect(focused['solo-comp']).toBe(true);

    // Navigate right — no neighbor, focus should stay
    SpatialNavigation.navigateByDirection('right');
    expect(focused['solo-comp']).toBe(true);
  });

  it('Propiedad 2 (PBT): navegar a la derecha siempre mueve el foco al componente más a la derecha', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 300 }),
        fc.integer({ min: 100, max: 400 }),
        (leftX, gap) => {
          // rightX is always clearly to the right of leftX + width(200) + gap
          const rightX = leftX + 200 + gap;

          SpatialNavigation.destroy();
          SpatialNavigation.init({ debug: false, useGetBoundingClientRect: true });

          const focused: Record<string, boolean> = {};
          const nodeLeft = createMockNode(leftX, 100, 200, 100);
          const nodeRight = createMockNode(rightX, 100, 200, 100);

          ['nav-left', 'nav-right'].forEach((key, i) => {
            SpatialNavigation.addFocusable({
              focusKey: key,
              node: i === 0 ? nodeLeft : nodeRight,
              parentFocusKey: 'SN:ROOT',
              onEnterPress: () => {}, onEnterRelease: () => {},
              onArrowPress: () => true, onArrowRelease: () => {},
              onFocus: () => {}, onBlur: () => {},
              onUpdateFocus: (v) => { focused[key] = v ?? false; },
              onUpdateHasFocusedChild: () => {},
              saveLastFocusedChild: false, trackChildren: false,
              isFocusBoundary: false, autoRestoreFocus: false,
              forceFocus: false, focusable: true,
            });
          });

          SpatialNavigation.setFocus('nav-left');
          SpatialNavigation.navigateByDirection('right');

          const result = focused['nav-right'] === true && focused['nav-left'] === false;
          SpatialNavigation.destroy();
          return result;
        }
      ),
      { numRuns: 50 }
    );
  });
});
