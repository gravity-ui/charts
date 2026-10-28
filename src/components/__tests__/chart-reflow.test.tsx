/**
 * @jest-environment jsdom
 */
import React from 'react';

import {act, fireEvent, screen, waitFor} from '@testing-library/react';

import * as shapes from '../../hooks/useShapes';
import type {ChartData, PieSeries} from '../../types';
import * as xAxis from '../AxisX/prepare-axis-data';
import * as yAxis from '../AxisY/prepare-axis-data';
import * as asyncState from '../ChartInner/utils/common';
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

    async function readyChart(chartData: ChartData = data) {
        const ref = React.createRef<ChartRef>();
        const onReady = jest.fn();
        const view = renderChart(<Chart ref={ref} data={chartData} onReady={onReady} />);
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

    test.each(['x-axis', 'y-axis'] as const)(
        'handles later sibling failures after %s rejects the request',
        async (firstAxis) => {
            const {ref, container, onReady} = await readyChart();
            const x = deferred<Awaited<ReturnType<typeof xAxis.prepareXAxisData>>>();
            const y = deferred<Awaited<ReturnType<typeof yAxis.prepareYAxisData>>>();
            const xPreparation = jest.spyOn(xAxis, 'prepareXAxisData').mockReturnValue(x.promise);
            const yPreparation = jest.spyOn(yAxis, 'prepareYAxisData').mockReturnValue(y.promise);
            Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
            let completion!: Promise<void>;
            act(() => {
                completion = ref.current!.reflow({immediate: true});
            });
            await waitFor(() => expect(xPreparation).toHaveBeenCalled());
            await waitFor(() => expect(yPreparation).toHaveBeenCalled());
            const failure = new Error('first axis failed');
            await act(async () => {
                (firstAxis === 'x-axis' ? x : y).reject(failure);
                await expect(completion).rejects.toBe(failure);
            });
            await act(async () => {
                (firstAxis === 'x-axis' ? y : x).reject(new Error('sibling axis failed'));
            });
            expect(onReady).not.toHaveBeenCalled();
            xPreparation.mockRestore();
            yPreparation.mockRestore();
            act(() => {
                completion = ref.current!.reflow({immediate: true});
            });
            await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
            await completion;
        },
    );

    test.each(['data', 'dimensions', 'legend'] as const)(
        'surfaces unowned failures again after %s changes',
        async (change) => {
            const original = asyncState.useAsyncState;
            let reportError: ((error: unknown) => void) | undefined;
            jest.spyOn(asyncState, 'useAsyncState').mockImplementation((...args) => {
                reportError = args[3];
                return original(...args);
            });
            const ref = React.createRef<ChartRef>();
            const onReady = jest.fn();
            let replaceData!: React.Dispatch<React.SetStateAction<ChartData>>;
            function Fixture() {
                const [chartData, setData] = React.useState<ChartData>({
                    ...data,
                    legend: {enabled: true},
                });
                replaceData = setData;
                return <Chart ref={ref} data={chartData} onReady={onReady} />;
            }
            const {container} = renderChart(<Fixture />);
            await waitFor(() => expect(onReady).toHaveBeenCalled());
            const failure = new Error('unowned failure');
            // Exercise the existing stage error callback synchronously so Jest can observe its throw.
            expect(() => reportError?.(failure)).toThrow(failure);
            const gate = deferred<Awaited<ReturnType<typeof shapes.getShapes>>>();
            jest.spyOn(shapes, 'getShapes').mockReturnValue(gate.promise);
            Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
            let completion!: Promise<void>;
            act(() => {
                completion = ref.current!.reflow({immediate: true});
            });
            const ownedHandler = reportError;
            act(() => {
                reportError?.(failure);
            });
            await expect(completion).rejects.toBe(failure);
            expect(() => reportError?.(new Error('owned sibling failure'))).not.toThrow();
            if (change === 'data') {
                act(() => {
                    replaceData({...data});
                });
            } else if (change === 'dimensions') {
                Object.defineProperty(container, 'clientHeight', {value: 530, configurable: true});
                act(() => {
                    __triggerResizeObserver(container);
                });
            } else {
                fireEvent.click(screen.getByText('Test Series'));
            }
            await waitFor(() => expect(reportError).not.toBe(ownedHandler));
            expect(() => reportError?.(failure)).toThrow(failure);
        },
    );

    function customNode(name: string) {
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        node.setAttribute('data-custom-pie', name);
        return node;
    }

    async function readyPie() {
        const custom = jest.fn<
            ReturnType<NonNullable<PieSeries['renderCustomShape']>>,
            [Parameters<NonNullable<PieSeries['renderCustomShape']>>[0]]
        >(() => customNode('initial'));
        const pieData: ChartData = {
            series: {
                data: [
                    {
                        type: 'pie',
                        data: [{name: 'Slice', value: 2}],
                        innerRadius: 40,
                        radius: 100,
                        center: [150, 160],
                        borderWidth: 3,
                        borderColor: 'red',
                        cursor: 'pointer',
                        dataLabels: {enabled: false},
                        renderCustomShape: custom,
                    },
                ],
            },
            legend: {enabled: false},
        };
        const view = await readyChart(pieData);
        custom.mockClear();
        return {...view, custom, pieData};
    }

    test('waits for custom pie node commit, including same-size requests', async () => {
        const {ref, container, onReady, custom, pieData} = await readyPie();
        const gate = deferred<SVGElement>();
        custom.mockReturnValue(gate.promise);
        Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
        let completion!: Promise<void>;
        let sameSize!: Promise<void>;
        let completed = false;
        act(() => {
            completion = ref.current!.reflow({immediate: true});
            completion.then(() => {
                completed = true;
            });
        });
        await waitFor(() => expect(custom).toHaveBeenCalled());
        await act(async () => {
            sameSize = ref.current!.reflow({immediate: true});
        });
        expect(completed).toBe(false);
        expect(onReady).not.toHaveBeenCalled();
        const node = customNode('current');
        await act(async () => {
            gate.resolve(node);
        });
        await Promise.all([completion, sameSize]);
        expect(completed).toBe(true);
        expect(custom).toHaveBeenLastCalledWith({series: {innerRadius: 40}});
        /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Verify committed custom node and preserved pie geometry/style. */
        expect(container.querySelector('[data-custom-pie="current"]')).toBe(node);
        const group = node.parentElement!;
        expect(group.getAttribute('transform')).toBe('translate(150, 160)');
        expect(group.style.strokeWidth).toBe('3');
        expect(group.getAttribute('cursor')).toBe('pointer');
        const segment = group.querySelector('.gcharts-pie__segment')!;
        expect(segment.getAttribute('d')).toContain('A150,150');
        expect(segment.getAttribute('d')).toContain('A40,40');
        expect((segment as SVGElement).style.stroke).toBe('red');
        expect(container.querySelector('svg')?.getAttribute('height')).toBe('472');
        /* eslint-enable testing-library/no-container, testing-library/no-node-access */
        expect(pieData.series.data[0]).not.toHaveProperty('customShape');
        expect(pieData.series.data[0].data[0]).not.toHaveProperty('customShape');
    });

    test.each(['resolve', 'reject'] as const)(
        'ignores superseded custom pie %s without completing newer request',
        async (outcome) => {
            const {ref, container, onReady, custom} = await readyPie();
            const old = deferred<SVGElement>();
            const current = deferred<SVGElement>();
            custom.mockReturnValue(old.promise);
            Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
            let first!: Promise<void>;
            act(() => {
                first = ref.current!.reflow({immediate: true});
            });
            await waitFor(() => expect(custom).toHaveBeenCalled());
            custom.mockClear().mockReturnValue(current.promise);
            Object.defineProperty(container, 'clientHeight', {value: 530, configurable: true});
            let second!: Promise<void>;
            let completed = false;
            act(() => {
                second = ref.current!.reflow({immediate: true});
                second.then(() => {
                    completed = true;
                });
            });
            await waitFor(() => expect(custom).toHaveBeenCalled());
            const staleNode = customNode('stale');
            await act(async () => {
                if (outcome === 'resolve') {
                    old.resolve(staleNode);
                } else {
                    old.reject(new Error('stale custom shape failed'));
                }
            });
            expect(completed).toBe(false);
            expect(onReady).not.toHaveBeenCalled();
            const node = customNode('current');
            await act(async () => {
                current.resolve(node);
            });
            await Promise.all([first, second]);
            /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Stale custom nodes must never enter current SVG. */
            expect(staleNode.isConnected).toBe(false);
            expect(container.querySelector('[data-custom-pie="current"]')).toBe(node);
            /* eslint-enable testing-library/no-container, testing-library/no-node-access */
            expect(onReady).toHaveBeenLastCalledWith({dimensions: {width: 800, height: 530}});
        },
    );

    test('custom pie rejection preserves original cause', async () => {
        const {ref, container, onReady, custom} = await readyPie();
        const gate = deferred<SVGElement>();
        custom.mockReturnValue(gate.promise);
        Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
        let completion!: Promise<void>;
        act(() => {
            completion = ref.current!.reflow({immediate: true});
        });
        await waitFor(() => expect(custom).toHaveBeenCalled());
        const failure = new Error('custom pie failed');
        await act(async () => {
            gate.reject(failure);
            await expect(completion).rejects.toBe(failure);
        });
        expect(onReady).not.toHaveBeenCalled();
    });

    test.each(['resolve', 'reject'] as const)(
        'ignores custom pie %s after unmount',
        async (outcome) => {
            const {ref, container, unmount, onReady, custom} = await readyPie();
            const gate = deferred<SVGElement>();
            custom.mockReturnValue(gate.promise);
            Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
            let completion!: Promise<void>;
            act(() => {
                completion = ref.current!.reflow({immediate: true});
            });
            await waitFor(() => expect(custom).toHaveBeenCalled());
            unmount();
            await expect(completion).rejects.toThrow('unmounted');
            const node = customNode('unmounted');
            await act(async () => {
                if (outcome === 'resolve') {
                    gate.resolve(node);
                } else {
                    gate.reject(new Error('unmounted custom shape failed'));
                }
            });
            // A completed callback must not resurrect DOM or report readiness after unmount.
            expect(node.isConnected).toBe(false);
            expect(onReady).not.toHaveBeenCalled();
        },
    );

    test.each([0, 'unavailable'] as const)('rejects unusable host: %s', async (size) => {
        const {ref, container} = await readyChart();
        if (size === 0) {
            Object.defineProperty(container, 'clientHeight', {value: 0, configurable: true});
        } else {
            /* eslint-disable testing-library/no-node-access -- Simulate an unavailable rendering host without breaking React cleanup. */
            Object.defineProperty(container.firstElementChild, 'parentElement', {
                value: null,
                configurable: true,
            });
            /* eslint-enable testing-library/no-node-access */
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
