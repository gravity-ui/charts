import {createIsOutsideBounds} from '../utils';

describe('createIsOutsideBounds', () => {
    const isOutsideBounds = createIsOutsideBounds({boundsWidth: 590, boundsHeight: 200});

    test('accepts points inside the plot area', () => {
        expect(isOutsideBounds(0, 0)).toBe(false);
        expect(isOutsideBounds(295, 100)).toBe(false);
        expect(isOutsideBounds(590, 200)).toBe(false);
    });

    test('accepts points that miss an edge by less than half a pixel', () => {
        expect(isOutsideBounds(295, -5.3e-15)).toBe(false);
        expect(isOutsideBounds(295, -0.49)).toBe(false);
        expect(isOutsideBounds(295, 200.49)).toBe(false);
        expect(isOutsideBounds(-0.49, 100)).toBe(false);
        expect(isOutsideBounds(590.49, 100)).toBe(false);
    });

    test('rejects points further than half a pixel away from the plot area', () => {
        expect(isOutsideBounds(295, -0.51)).toBe(true);
        expect(isOutsideBounds(295, 200.51)).toBe(true);
        expect(isOutsideBounds(-0.51, 100)).toBe(true);
        expect(isOutsideBounds(590.51, 100)).toBe(true);
    });
});
