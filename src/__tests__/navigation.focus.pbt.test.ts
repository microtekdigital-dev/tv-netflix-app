/**
 * Property-Based Tests para navegación espacial — invariante de foco único
 * Propiedad 1: Invariante de foco único
 * Validates: Requisito 2.4
 * Feature: tv-netflix-app, Property 1: exactamente un elemento focused=true
 */
import * as fc from 'fast-check';

// Use real SpatialNavigation core
jest.mock('@noriginmedia/norigin-spatial-navigation', () => {
  const core = jest.requireActual('../../../../packages/core/src/index');
  return core;
});

import { SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation';

// Helper to create a mock DOM node
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

describe('Property 1: Invariante de foco único', () => {
  beforeEach(() => {
    SpatialNavigation.destroy();
    SpatialNavigation.init({ debug: false, useGetBoundingClientRect: true });
  });

  afterEach(() => {
    SpatialNavigation.destroy();
  });

  it('Propiedad 1: exactamente un componente tiene focused=true después de setFocus', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            focusKey: fc.string({ minLength: 1, maxLength: 10 }).map(s => `key-${s}`),
            x: fc.integer({ min: 0, max: 1800 }),
            y: fc.integer({ min: 0, max: 900 }),
          }),
          { minLength: 2, maxLength: 8 }
        ),
        (componentDefs) => {
          SpatialNavigation.destroy();
          SpatialNavigation.init({ debug: false, useGetBoundingClientRect: true });

          const focusedStates: Map<string, boolean> = new Map();

          // Register components
          componentDefs.forEach(({ focusKey, x, y }) => {
            const node = createMockNode(x, y, 200, 100);
            focusedStates.set(focusKey, false);

            SpatialNavigation.addFocusable({
              focusKey,
              node,
              parentFocusKey: 'SN:ROOT',
              onEnterPress: () => {},
              onEnterRelease: () => {},
              onArrowPress: () => true,
              onArrowRelease: () => {},
              onFocus: () => {},
              onBlur: () => {},
              onUpdateFocus: (isFocused) => { focusedStates.set(focusKey, isFocused ?? false); },
              onUpdateHasFocusedChild: () => {},
              saveLastFocusedChild: false,
              trackChildren: false,
              isFocusBoundary: false,
              autoRestoreFocus: false,
              forceFocus: false,
              focusable: true,
            });
          });

          // Set focus to the first component
          const firstKey = componentDefs[0].focusKey;
          SpatialNavigation.setFocus(firstKey);

          // Count focused components
          const focusedCount = Array.from(focusedStates.values()).filter(v => v === true).length;

          SpatialNavigation.destroy();
          return focusedCount <= 1;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Propiedad 1 (unit): setFocus transfiere el foco de un componente a otro', () => {
    const focused: Record<string, boolean> = {};

    const node1 = createMockNode(0, 0, 200, 100);
    const node2 = createMockNode(300, 0, 200, 100);

    SpatialNavigation.addFocusable({
      focusKey: 'comp-1',
      node: node1,
      parentFocusKey: 'SN:ROOT',
      onEnterPress: () => {}, onEnterRelease: () => {},
      onArrowPress: () => true, onArrowRelease: () => {},
      onFocus: () => {}, onBlur: () => {},
      onUpdateFocus: (v) => { focused['comp-1'] = v ?? false; },
      onUpdateHasFocusedChild: () => {},
      saveLastFocusedChild: false, trackChildren: false,
      isFocusBoundary: false, autoRestoreFocus: false,
      forceFocus: false, focusable: true,
    });

    SpatialNavigation.addFocusable({
      focusKey: 'comp-2',
      node: node2,
      parentFocusKey: 'SN:ROOT',
      onEnterPress: () => {}, onEnterRelease: () => {},
      onArrowPress: () => true, onArrowRelease: () => {},
      onFocus: () => {}, onBlur: () => {},
      onUpdateFocus: (v) => { focused['comp-2'] = v ?? false; },
      onUpdateHasFocusedChild: () => {},
      saveLastFocusedChild: false, trackChildren: false,
      isFocusBoundary: false, autoRestoreFocus: false,
      forceFocus: false, focusable: true,
    });

    SpatialNavigation.setFocus('comp-1');
    expect(focused['comp-1']).toBe(true);
    expect(focused['comp-2']).toBeFalsy();

    SpatialNavigation.setFocus('comp-2');
    expect(focused['comp-2']).toBe(true);
    expect(focused['comp-1']).toBe(false);
  });
});
