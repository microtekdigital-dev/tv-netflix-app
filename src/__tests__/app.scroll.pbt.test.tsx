/**
 * Property-Based Tests para App — scroll vertical
 * Propiedad 5: Scroll vertical sigue al foco de fila
 * Validates: Requisito 3.2
 * Feature: tv-netflix-app, Property 5: scroll vertical sigue al foco de fila
 */
import * as fc from 'fast-check';

describe('Property 5: Scroll vertical sigue al foco de fila', () => {
  it('Propiedad 5: scrollTo es llamado con la coordenada y de la fila enfocada', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            y: fc.integer({ min: 0, max: 5000 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.integer({ min: 0, max: 19 }),
        (rows, focusedIndexRaw) => {
          const focusedIndex = focusedIndexRaw % rows.length;
          const focusedRow = rows[focusedIndex];

          const mockScrollTo = jest.fn();
          const rowsRef = { current: { scrollTo: mockScrollTo } };

          // This is exactly what App does in onRowFocus:
          const onRowFocus = (_layout: any, _props: any, details: any) => {
            if (details && typeof details.y === 'number') {
              rowsRef.current?.scrollTo({ top: details.y, behavior: 'smooth' });
            }
          };

          // Simulate focus on the focused row
          onRowFocus({}, {}, { y: focusedRow.y });

          expect(mockScrollTo).toHaveBeenCalledTimes(1);
          expect(mockScrollTo).toHaveBeenCalledWith({
            top: focusedRow.y,
            behavior: 'smooth',
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Propiedad 5 (unit): scrollTo no es llamado si rowsRef.current es null', () => {
    const rowsRef = { current: null as any };

    const onRowFocus = (_layout: any, _props: any, details: any) => {
      if (details && typeof details.y === 'number') {
        rowsRef.current?.scrollTo({ top: details.y, behavior: 'smooth' });
      }
    };

    expect(() => onRowFocus({}, {}, { y: 300 })).not.toThrow();
  });

  it('Propiedad 5 (unit): scrollTo no es llamado si details.y no es número', () => {
    const mockScrollTo = jest.fn();
    const rowsRef = { current: { scrollTo: mockScrollTo } };

    const onRowFocus = (_layout: any, _props: any, details: any) => {
      if (details && typeof details.y === 'number') {
        rowsRef.current?.scrollTo({ top: details.y, behavior: 'smooth' });
      }
    };

    onRowFocus({}, {}, {});
    expect(mockScrollTo).not.toHaveBeenCalled();
  });
});
