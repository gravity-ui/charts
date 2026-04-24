import {buildThresholdArcs, valueToAngle} from '../utils';

describe('valueToAngle', () => {
    it('returns startDeg for value === min', () => {
        expect(valueToAngle(0, 0, 100, -120, 120)).toBe(-120);
    });

    it('returns endDeg for value === max', () => {
        expect(valueToAngle(100, 0, 100, -120, 120)).toBe(120);
    });

    it('returns midpoint for value at 50% of range', () => {
        expect(valueToAngle(50, 0, 100, -120, 120)).toBe(0);
    });

    it('clamps value below min to startDeg', () => {
        expect(valueToAngle(-10, 0, 100, -120, 120)).toBe(-120);
    });

    it('clamps value above max to endDeg', () => {
        expect(valueToAngle(110, 0, 100, -120, 120)).toBe(120);
    });

    it('handles non-zero min correctly', () => {
        // value=15 in range [10,20] → ratio=0.5 → midpoint of [-60,60] = 0
        expect(valueToAngle(15, 10, 20, -60, 60)).toBe(0);
    });

    it('handles 180-degree sweep', () => {
        expect(valueToAngle(25, 0, 100, -90, 90)).toBeCloseTo(-45);
    });
});

describe('buildThresholdArcs', () => {
    const min = 0;
    const max = 100;
    const startDeg = -120;
    const endDeg = 120;
    const fallback = '#ccc';

    it('produces correct number of zones', () => {
        const stops = [
            {value: 30, color: 'green', label: 'Good'},
            {value: 70, color: 'yellow', label: 'Warning'},
            {value: 100, color: 'red', label: 'Critical'},
        ];
        const arcs = buildThresholdArcs(stops, min, max, startDeg, endDeg, fallback);
        expect(arcs).toHaveLength(3);
    });

    it('first arc starts at startDeg', () => {
        const stops = [{value: 100, color: 'green'}];
        const arcs = buildThresholdArcs(stops, min, max, startDeg, endDeg, fallback);
        expect(arcs[0].startDeg).toBe(startDeg);
    });

    it('last arc ends at endDeg', () => {
        const stops = [{value: 100, color: 'green'}];
        const arcs = buildThresholdArcs(stops, min, max, startDeg, endDeg, fallback);
        expect(arcs[arcs.length - 1].endDeg).toBe(endDeg);
    });

    it('uses fallback color when stop has no color', () => {
        const stops = [{value: 100}];
        const arcs = buildThresholdArcs(stops, min, max, startDeg, endDeg, fallback);
        expect(arcs[0].color).toBe(fallback);
    });

    it('uses stop color when provided', () => {
        const stops = [{value: 100, color: '#0f0'}];
        const arcs = buildThresholdArcs(stops, min, max, startDeg, endDeg, fallback);
        expect(arcs[0].color).toBe('#0f0');
    });

    it('correctly assigns zoneMin and zoneMax', () => {
        const stops = [
            {value: 50, color: 'green'},
            {value: 100, color: 'red'},
        ];
        const arcs = buildThresholdArcs(stops, min, max, startDeg, endDeg, fallback);
        expect(arcs[0].zoneMin).toBe(0);
        expect(arcs[0].zoneMax).toBe(50);
        expect(arcs[1].zoneMin).toBe(50);
        expect(arcs[1].zoneMax).toBe(100);
    });

    it('carries the label from each stop', () => {
        const stops = [{value: 100, label: 'Zone A'}];
        const arcs = buildThresholdArcs(stops, min, max, startDeg, endDeg, fallback);
        expect(arcs[0].label).toBe('Zone A');
    });

    it('arcs are contiguous (endDeg of one equals startDeg of next)', () => {
        const stops = [
            {value: 33, color: 'green'},
            {value: 66, color: 'yellow'},
            {value: 100, color: 'red'},
        ];
        const arcs = buildThresholdArcs(stops, min, max, startDeg, endDeg, fallback);
        expect(arcs[0].endDeg).toBeCloseTo(arcs[1].startDeg);
        expect(arcs[1].endDeg).toBeCloseTo(arcs[2].startDeg);
    });
});
