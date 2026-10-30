import {throttle} from '../throttle';

describe('throttle', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('runs the first call at once and the latest one at the end of the interval', () => {
        const fn = jest.fn();
        const throttled = throttle(fn, 100);

        throttled('a');
        expect(fn).toHaveBeenCalledWith('a');

        jest.advanceTimersByTime(50);
        throttled('b');
        jest.advanceTimersByTime(49);
        expect(fn).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenLastCalledWith('b');
    });

    test('runs once per interval during continuous calls', () => {
        const calls: Array<[number, string]> = [];
        const throttled = throttle((value: string) => calls.push([Date.now(), value]), 100);
        const start = Date.now();

        for (const [time, value] of [
            [0, 'a'],
            [30, 'b'],
            [60, 'c'],
            [90, 'd'],
            [120, 'e'],
            [150, 'f'],
            [240, 'g'],
        ] as const) {
            jest.advanceTimersByTime(start + time - Date.now());
            throttled(value);
        }
        jest.advanceTimersByTime(200);

        expect(calls.map(([time, value]) => [time - start, value])).toEqual([
            [0, 'a'],
            [100, 'd'],
            [200, 'f'],
            [300, 'g'],
        ]);
    });

    test('cancel drops the pending call, and the next call runs at once', () => {
        const fn = jest.fn();
        const throttled = throttle(fn, 100);

        throttled('a');
        throttled('b');
        throttled.cancel();
        jest.advanceTimersByTime(100);
        expect(fn.mock.calls).toEqual([['a']]);

        throttled('c');
        expect(fn).toHaveBeenLastCalledWith('c');
    });

    test('runs every call at once with a zero interval', () => {
        const fn = jest.fn();
        const throttled = throttle(fn, 0);

        throttled('a');
        throttled('b');

        expect(fn.mock.calls).toEqual([['a'], ['b']]);
    });
});
