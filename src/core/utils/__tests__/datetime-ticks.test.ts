import {DAY} from '../../constants';
import {getDateTimeTicks} from '../ticks/datetime';

describe('getDateTimeTicks', () => {
    it('produces evenly-spaced ticks across a month boundary with 2-day step', () => {
        // Jan 24 – Feb 10 2024: triggers 2-day auto step (≈ 17 days / ~8 ticks)
        const start = new Date('2024-01-24T00:00:00.000Z');
        const stop = new Date('2024-02-10T00:00:00.000Z');
        const ticks = getDateTimeTicks(start, stop);

        expect(ticks.length).toBeGreaterThan(1);

        const gaps = ticks.slice(1).map((t, i) => t.getTime() - ticks[i].getTime());

        const expectedGap = 2 * DAY;
        gaps.forEach((gap) => {
            expect(gap).toBe(expectedGap);
        });
    });

    it('produces evenly-spaced ticks across Jan 31 → Feb 1 boundary specifically', () => {
        // Narrow window that forces the tick sequence through the exact Jan 31 / Feb 1 boundary
        const start = new Date('2024-01-27T00:00:00.000Z');
        const stop = new Date('2024-02-06T00:00:00.000Z');
        const ticks = getDateTimeTicks(start, stop, 5);

        const gaps = ticks.slice(1).map((t, i) => t.getTime() - ticks[i].getTime());

        const uniqueGaps = [...new Set(gaps)];
        expect(uniqueGaps).toHaveLength(1);
    });
});
