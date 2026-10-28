/**
 * @jest-environment jsdom
 */
import React from 'react';

import {act, waitFor} from '@testing-library/react';

import * as shapes from '../../hooks/useShapes';
import type {ChartData} from '../../types';
import * as xAxis from '../AxisX/prepare-axis-data';
import * as yAxis from '../AxisY/prepare-axis-data';
import {Chart} from '../index';
import type {ChartRef} from '../index';

import {renderChart} from './utils';

const data: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Test Series',
                data: [
                    {x: 0, y: 1},
                    {x: 1, y: 2},
                ],
            },
        ],
    },
};

declare const __triggerResizeObserver: (target: Element) => void;

describe('Chart/reflow', () => {
    afterEach(() => {
        document.body.innerHTML = '';
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test('reflow() triggers onResize after debounce delay', async () => {
        jest.useFakeTimers();
        const onResize = jest.fn();
        const ref = React.createRef<ChartRef>();

        renderChart(<Chart ref={ref} data={data} onResize={onResize} />);

        // wait for initial resize on mount
        await act(async () => {
            jest.runAllTimers();
        });
        onResize.mockClear();

        ref.current?.reflow();

        // not called yet — still within debounce window
        expect(onResize).not.toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(200);
        });

        expect(onResize).toHaveBeenCalledTimes(1);
    });

    test('reflow({ immediate: true }) triggers onResize without waiting for debounce', async () => {
        jest.useFakeTimers();
        const onResize = jest.fn();
        const ref = React.createRef<ChartRef>();

        renderChart(<Chart ref={ref} data={data} onResize={onResize} />);

        await act(async () => {
            jest.runAllTimers();
        });
        onResize.mockClear();

        await act(async () => {
            ref.current?.reflow({immediate: true});
        });

        // called without advancing timers
        expect(onResize).toHaveBeenCalledTimes(1);
    });

    test('reflow({ immediate: true }) does not call debounced pending resize', async () => {
        jest.useFakeTimers();
        const onResize = jest.fn();
        const ref = React.createRef<ChartRef>();

        renderChart(<Chart ref={ref} data={data} onResize={onResize} />);

        await act(async () => {
            jest.runAllTimers();
        });
        onResize.mockClear();

        // schedule a debounced call
        ref.current?.reflow();
        expect(onResize).not.toHaveBeenCalled();

        // immediate call fires right away
        await act(async () => {
            ref.current?.reflow({immediate: true});
        });
        expect(onResize).toHaveBeenCalledTimes(1);
    });

    test('container resize (without window.resize) triggers onResize via ResizeObserver', async () => {
        jest.useFakeTimers();
        const onResize = jest.fn();

        const {container} = renderChart(<Chart data={data} onResize={onResize} />);

        await act(async () => {
            jest.runAllTimers();
        });
        onResize.mockClear();

        // simulate container width change (e.g. drawer drag)
        Object.defineProperty(container, 'clientWidth', {value: 600, configurable: true});

        act(() => {
            __triggerResizeObserver(container);
        });

        // not called yet — within debounce window
        expect(onResize).not.toHaveBeenCalled();

        await act(async () => {
            jest.advanceTimersByTime(200);
        });

        expect(onResize).toHaveBeenCalledTimes(1);
        expect(onResize).toHaveBeenCalledWith({
            dimensions: {width: 600, height: 400},
        });
    });

    test('ResizeObserver does not trigger onResize when dimensions stay the same', async () => {
        jest.useFakeTimers();
        const onResize = jest.fn();

        const {container} = renderChart(<Chart data={data} onResize={onResize} />);

        await act(async () => {
            jest.runAllTimers();
        });
        onResize.mockClear();

        act(() => {
            __triggerResizeObserver(container);
        });

        await act(async () => {
            jest.advanceTimersByTime(200);
        });

        expect(onResize).not.toHaveBeenCalled();
    });
});

function deferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((success, failure) => {
        resolve = success;
        reject = failure;
    });
    return {promise, resolve, reject};
}

describe('Chart/reflow completion', () => {
    beforeEach(() => {
        jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            measureText: (text: string) => ({
                width: text.length * 6,
                fontBoundingBoxAscent: 10,
                fontBoundingBoxDescent: 2,
                actualBoundingBoxLeft: 0,
                actualBoundingBoxRight: text.length * 6,
            }),
        } as CanvasRenderingContext2D);
    });
    afterEach(() => jest.restoreAllMocks());

    async function readyChart() {
        const ref = React.createRef<ChartRef>();
        const onReady = jest.fn();
        const view = renderChart(<Chart ref={ref} data={data} onReady={onReady} />);
        await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
        onReady.mockClear();
        return {...view, ref, onReady};
    }

    test('same-size reflow completes without another onReady callback', async () => {
        const {ref, onReady} = await readyChart();
        await act(async () => {
            await ref.current?.reflow({immediate: true});
        });
        expect(onReady).not.toHaveBeenCalled();
    });

    test.each(['shapes', 'x-axis', 'y-axis'] as const)(
        'waits for committed %s before reporting resized geometry',
        async (stage) => {
            const {ref, container, onReady} = await readyChart();
            const gate = deferred<void>();
            let started = false;
            if (stage === 'shapes') {
                const original = shapes.getShapes;
                jest.spyOn(shapes, 'getShapes').mockImplementation(async (args) => {
                    started = true;
                    await gate.promise;
                    return original(args);
                });
            } else if (stage === 'x-axis') {
                const original = xAxis.prepareXAxisData;
                jest.spyOn(xAxis, 'prepareXAxisData').mockImplementation(async (args) => {
                    started = true;
                    await gate.promise;
                    return original(args);
                });
            } else {
                const original = yAxis.prepareYAxisData;
                jest.spyOn(yAxis, 'prepareYAxisData').mockImplementation(async (args) => {
                    started = true;
                    await gate.promise;
                    return original(args);
                });
            }
            Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
            let completed = false;
            let completion!: Promise<void>;
            act(() => {
                completion = ref.current!.reflow({immediate: true});
                completion.then(() => {
                    completed = true;
                });
            });
            await waitFor(() => expect(started).toBe(true));
            expect(completed).toBe(false);
            expect(onReady).not.toHaveBeenCalled();
            await act(async () => {
                gate.resolve();
            });
            await completion;
            expect(completed).toBe(true);
            expect(onReady).toHaveBeenLastCalledWith({dimensions: {width: 800, height: 472}});
            /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Completion must prove actual SVG and axis DOM have committed. */
            expect(container.querySelector('svg')?.getAttribute('height')).toBe('472');
            expect(
                container.querySelectorAll('svg .gcharts-x-axis .gcharts-x-axis__tick').length,
            ).toBeGreaterThan(0);
            expect(
                container.querySelectorAll('svg .gcharts-y-axis .gcharts-y-axis__tick').length,
            ).toBeGreaterThan(0);
            /* eslint-enable testing-library/no-container, testing-library/no-node-access */
        },
    );

    test('superseded async render cannot complete a newer reflow', async () => {
        const {ref, container, onReady} = await readyChart();
        const old = deferred<void>();
        const current = deferred<void>();
        const original = shapes.getShapes;
        let runs = 0;
        jest.spyOn(shapes, 'getShapes').mockImplementation(async (args) => {
            const run = ++runs;
            await (run === 1 ? old.promise : current.promise);
            return original(args);
        });
        Object.defineProperty(container, 'clientHeight', {value: 530, configurable: true});
        let first!: Promise<void>;
        act(() => {
            first = ref.current!.reflow({immediate: true});
        });
        await waitFor(() => expect(runs).toBe(1));
        Object.defineProperty(container, 'clientHeight', {value: 556, configurable: true});
        let second!: Promise<void>;
        let completed = false;
        act(() => {
            second = ref.current!.reflow({immediate: true});
            second.then(() => {
                completed = true;
            });
        });
        await waitFor(() => expect(runs).toBe(2));
        await act(async () => {
            old.resolve();
        });
        expect(completed).toBe(false);
        expect(onReady).not.toHaveBeenCalled();
        await act(async () => {
            current.resolve();
        });
        await Promise.all([first, second]);
        expect(onReady).toHaveBeenLastCalledWith({dimensions: {width: 800, height: 556}});
    });

    test('coalesced requests complete with latest measured size', async () => {
        const {ref, container, onReady} = await readyChart();
        let first!: Promise<void>;
        let second!: Promise<void>;
        act(() => {
            Object.defineProperty(container, 'clientHeight', {value: 530, configurable: true});
            first = ref.current!.reflow();
            Object.defineProperty(container, 'clientHeight', {value: 556, configurable: true});
            second = ref.current!.reflow();
        });
        await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
        await Promise.all([first, second]);
        expect(onReady).toHaveBeenCalledTimes(1);
        expect(onReady).toHaveBeenCalledWith({dimensions: {width: 800, height: 556}});
    });

    test('preparation failure rejects with original cause', async () => {
        const {ref, container} = await readyChart();
        const failure = new Error('shape preparation failed');
        jest.spyOn(shapes, 'getShapes').mockRejectedValue(failure);
        Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
        let completion!: Promise<void>;
        act(() => {
            completion = ref.current!.reflow({immediate: true});
        });
        await expect(completion).rejects.toBe(failure);
    });

    test.each([0, 'unavailable'] as const)('rejects unusable host: %s', async (size) => {
        const {ref, container} = await readyChart();
        if (size === 0) {
            Object.defineProperty(container, 'clientHeight', {value: 0, configurable: true});
        } else {
            /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Simulate an unavailable rendering host without breaking React cleanup. */
            Object.defineProperty(container.firstElementChild, 'parentElement', {
                value: null,
                configurable: true,
            });
            /* eslint-enable testing-library/no-container, testing-library/no-node-access */
        }
        let completion!: Promise<void>;
        act(() => {
            completion = ref.current!.reflow({immediate: true});
        });
        await expect(completion).rejects.toThrow(size === 0 ? 'zero size' : 'unavailable');
    });

    test('unmount rejects pending request and ignored calls stay handled', async () => {
        const {ref, unmount} = await readyChart();
        const api = ref.current!;
        const completion = api.reflow();
        api.reflow();
        unmount();
        await expect(completion).rejects.toThrow('unmounted');
        await expect(api.reflow()).rejects.toThrow('unmounted');
    });
});
