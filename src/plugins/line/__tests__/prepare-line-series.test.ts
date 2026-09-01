import {resolveLabelPlacement} from '../prepare-line-series';

describe('resolveLabelPlacement', () => {
    it('defaults to a single top position', () => {
        expect(resolveLabelPlacement(undefined)).toEqual(['top']);
    });

    it('keeps "auto" as is', () => {
        expect(resolveLabelPlacement('auto')).toBe('auto');
    });

    it('keeps an explicit array as is', () => {
        expect(resolveLabelPlacement(['bottom', 'left'])).toEqual(['bottom', 'left']);
    });

    it('falls back to the default position for an empty array', () => {
        expect(resolveLabelPlacement([])).toEqual(['top']);
    });
});
