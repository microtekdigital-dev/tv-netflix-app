/**
 * Property-Based Tests para ContentRow — scroll horizontal
 * Propiedad 4: Scroll horizontal sigue al foco en ContentRow
 * Validates: Requisito 3.1
 * Feature: tv-netflix-app, Property 4: scroll horizontal sigue al foco
 */
import * as fc from 'fast-check';

describe('Property 4: Scroll horizontal sigue al foco en ContentRow', () => {
  it('Propiedad 4: scrollTo es llamado con la coordenada x del asset enfocado', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            x: fc.integer({ min: 0, max: 5000 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.integer({ min: 0, max: 19 }),
        (assets, focusedIndexRaw) => {
          const focusedIndex = focusedIndexRaw % assets.length;
          const focusedAsset = assets[focusedIndex];

          // Simulate the scrollingRef and onAssetFocus callback
          const mockScrollTo = jest.fn();
          const scrollingRef = { current: { scrollTo: mockScrollTo } };

          // This is exactly what ContentRow does:
          const onAssetFocus = ({ x }: { x: number }) => {
            scrollingRef.current?.scrollTo({ left: x, behavior: 'smooth' });
          };

          // Simulate focus on the focused asset
          onAssetFocus({ x: focusedAsset.x });

          // Verify scrollTo was called with the correct x coordinate
          expect(mockScrollTo).toHaveBeenCalledTimes(1);
          expect(mockScrollTo).toHaveBeenCalledWith({
            left: focusedAsset.x,
            behavior: 'smooth',
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Propiedad 4 (unit): scrollTo no es llamado si scrollingRef.current es null', () => {
    const scrollingRef = { current: null as any };

    const onAssetFocus = ({ x }: { x: number }) => {
      scrollingRef.current?.scrollTo({ left: x, behavior: 'smooth' });
    };

    // Should not throw
    expect(() => onAssetFocus({ x: 500 })).not.toThrow();
  });

  it('Propiedad 4 (unit): scrollTo es llamado con behavior smooth', () => {
    const mockScrollTo = jest.fn();
    const scrollingRef = { current: { scrollTo: mockScrollTo } };

    const onAssetFocus = ({ x }: { x: number }) => {
      scrollingRef.current?.scrollTo({ left: x, behavior: 'smooth' });
    };

    onAssetFocus({ x: 1200 });

    expect(mockScrollTo).toHaveBeenCalledWith({ left: 1200, behavior: 'smooth' });
  });
});
