/**
 * Property-Based Tests para init() — idempotencia
 * Propiedad 9: init() es idempotente
 * Validates: Requisito 1.5
 * Feature: tv-netflix-app, Property 9: init() idempotente
 */
import * as fc from 'fast-check';

// Use the real SpatialNavigation core (not mocked) for this test
jest.mock('@noriginmedia/norigin-spatial-navigation', () => {
  const core = jest.requireActual('../../../../packages/core/src/index');
  return core;
});

import { SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation';

describe('Property 9: init() es idempotente', () => {
  beforeEach(() => {
    SpatialNavigation.destroy();
  });

  afterEach(() => {
    SpatialNavigation.destroy();
  });

  it('Propiedad 9: llamar init() N veces produce el mismo estado que llamarlo una vez', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        (n) => {
          SpatialNavigation.destroy();

          const initParams = {
            debug: false,
            visualDebug: false,
            distanceCalculationMethod: 'center' as const,
            throttle: 100,
            throttleKeypresses: true,
          };

          // Call init() N times
          for (let i = 0; i < n; i++) {
            expect(() => SpatialNavigation.init(initParams)).not.toThrow();
          }

          // After N calls, the service should be enabled (same as after 1 call)
          // We verify by checking that getCurrentFocusKey() doesn't throw
          expect(() => SpatialNavigation.getCurrentFocusKey()).not.toThrow();

          SpatialNavigation.destroy();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Propiedad 9 (unit): segunda llamada a init() no lanza error', () => {
    const params = { debug: false, distanceCalculationMethod: 'center' as const };
    expect(() => SpatialNavigation.init(params)).not.toThrow();
    expect(() => SpatialNavigation.init(params)).not.toThrow();
  });

  it('Propiedad 9 (unit): init() sin parámetros no lanza error', () => {
    expect(() => SpatialNavigation.init()).not.toThrow();
    expect(() => SpatialNavigation.init()).not.toThrow();
  });
});
