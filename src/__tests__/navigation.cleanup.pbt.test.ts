/**
 * Property-Based Tests para navegación espacial — cleanup al desmontar
 * Propiedad 8: Cleanup al desmontar componentes focusables
 * Validates: Requisito 7.5
 * Feature: tv-netflix-app, Property 8: cleanup al desmontar
 */
import * as fc from 'fast-check';

jest.mock('@noriginmedia/norigin-spatial-navigation', () => {
  const core = jest.requireActual('../../../../packages/core/src/index');
  return core;
});

import { SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation';

function createMockNode(): HTMLElement {
  const node = document.createElement('div');
  node.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 100, bottom: 50,
    width: 100, height: 50, x: 0, y: 0, toJSON: () => {}
  });
  return node;
}

describe('Property 8: Cleanup al desmontar componentes focusables', () => {
  beforeEach(() => {
    SpatialNavigation.destroy();
    SpatialNavigation.init({ debug: false });
  });

  afterEach(() => {
    SpatialNavigation.destroy();
  });

  it('Propiedad 8: removeFocusable elimina el componente del registro', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 10 }).map(s => `cleanup-${s}`),
          { minLength: 1, maxLength: 10 }
        ),
        (focusKeys) => {
          SpatialNavigation.destroy();
          SpatialNavigation.init({ debug: false });

          // Register all components
          focusKeys.forEach((focusKey) => {
            SpatialNavigation.addFocusable({
              focusKey,
              node: createMockNode(),
              parentFocusKey: 'SN:ROOT',
              onEnterPress: () => {}, onEnterRelease: () => {},
              onArrowPress: () => true, onArrowRelease: () => {},
              onFocus: () => {}, onBlur: () => {},
              onUpdateFocus: () => {}, onUpdateHasFocusedChild: () => {},
              saveLastFocusedChild: false, trackChildren: false,
              isFocusBoundary: false, autoRestoreFocus: false,
              forceFocus: false, focusable: true,
            });
          });

          // Verify all are registered
          focusKeys.forEach((focusKey) => {
            expect(SpatialNavigation.doesFocusableExist(focusKey)).toBe(true);
          });

          // Remove all components
          focusKeys.forEach((focusKey) => {
            SpatialNavigation.removeFocusable({ focusKey });
          });

          // Verify all are removed
          const allRemoved = focusKeys.every(
            (focusKey) => !SpatialNavigation.doesFocusableExist(focusKey)
          );

          SpatialNavigation.destroy();
          return allRemoved;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Propiedad 8 (unit): doesFocusableExist retorna false después de removeFocusable', () => {
    SpatialNavigation.addFocusable({
      focusKey: 'test-cleanup',
      node: createMockNode(),
      parentFocusKey: 'SN:ROOT',
      onEnterPress: () => {}, onEnterRelease: () => {},
      onArrowPress: () => true, onArrowRelease: () => {},
      onFocus: () => {}, onBlur: () => {},
      onUpdateFocus: () => {}, onUpdateHasFocusedChild: () => {},
      saveLastFocusedChild: false, trackChildren: false,
      isFocusBoundary: false, autoRestoreFocus: false,
      forceFocus: false, focusable: true,
    });

    expect(SpatialNavigation.doesFocusableExist('test-cleanup')).toBe(true);
    SpatialNavigation.removeFocusable({ focusKey: 'test-cleanup' });
    expect(SpatialNavigation.doesFocusableExist('test-cleanup')).toBe(false);
  });
});
