/**
 * @jest-environment jsdom
 */
import React from 'react';

import {act, fireEvent, screen, waitFor} from '@testing-library/react';

import * as axisGenerators from '../../core/utils/axis-generators/bottom';
import * as textUtils from '../../core/utils/text';
import * as shapes from '../../hooks/useShapes';
import type {ChartData, PieSeries} from '../../types';
import {CustomShapeRenderer} from '../../utils';
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
            fillRect: () => undefined,
            measureText: (text: string) => ({
                width: text.length * 6,
                fontBoundingBoxAscent: 10,
                fontBoundingBoxDescent: 2,
                actualBoundingBoxLeft: 0,
                actualBoundingBoxRight: text.length * 6,
            }),
        } as unknown as CanvasRenderingContext2D);
        jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
            'data:image/png;base64,',
        );
    });
    afterEach(() => jest.restoreAllMocks());

    async function readyChart(chartData: ChartData = data) {
        const ref = React.createRef<ChartRef>();
        const onReady = jest.fn();
        const view = renderChart(<Chart ref={ref} data={chartData} onReady={onReady} />);
        await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
        let committed = false;
        act(() => {
            ref.current!.reflow({immediate: true}).then(() => {
                committed = true;
            });
        });
        await waitFor(() => expect(committed).toBe(true));
        onReady.mockClear();
        return {...view, ref, onReady};
    }

    test('public onReady does not repeat for legend or equivalent data', async () => {
        const onReady = jest.fn();
        let replaceData!: () => void;
        function Fixture() {
            const [chartData, setData] = React.useState<ChartData>({
                ...data,
                legend: {enabled: true},
            });
            replaceData = () => setData({...data, legend: {enabled: true}});
            return <Chart data={chartData} onReady={onReady} />;
        }
        renderChart(<Fixture />);
        await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByText('Test Series'));
        await act(async () => {
            await Promise.resolve();
        });
        act(replaceData);
        await act(async () => {
            await Promise.resolve();
        });
        expect(onReady).toHaveBeenCalledTimes(1);
    });

    test('public onReady repeats when callback identity changes', async () => {
        const first = jest.fn();
        const second = jest.fn();
        let replaceCallback!: () => void;
        function Fixture() {
            const [changed, setChanged] = React.useState(false);
            replaceCallback = () => setChanged(true);
            return <Chart data={data} onReady={changed ? second : first} />;
        }
        renderChart(<Fixture />);
        await waitFor(() => expect(first).toHaveBeenCalledTimes(1));
        act(replaceCallback);
        await waitFor(() => expect(second).toHaveBeenCalledTimes(1));
        expect(first).toHaveBeenCalledTimes(1);
    });

    test('stable parent dimension callback with inline data terminates', async () => {
        const calls = jest.fn();
        function Fixture() {
            const [, setDimensions] = React.useState<unknown>();
            const onReady = React.useCallback((args: unknown) => {
                calls();
                // Bound the broken baseline so its infinite loop cannot hang the test worker.
                if (calls.mock.calls.length < 5) setDimensions(args);
            }, []);
            return <Chart data={{...data}} onReady={onReady} />;
        }
        renderChart(<Fixture />);
        await waitFor(() => expect(calls).toHaveBeenCalled());
        await act(async () => {
            await Promise.resolve();
        });
        expect(calls).toHaveBeenCalledTimes(1);
    });

    test('identical requests join delayed preparation without restarting', async () => {
        const {ref, container} = await readyChart();
        const gate = deferred<void>();
        const original = shapes.getShapes;
        const preparation = jest.spyOn(shapes, 'getShapes').mockImplementation(async (args) => {
            await gate.promise;
            return original(args);
        });
        Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
        const completions: Promise<void>[] = [];
        act(() => {
            completions.push(ref.current!.reflow({immediate: true}));
        });
        await waitFor(() => expect(preparation).toHaveBeenCalledTimes(1));
        for (let i = 0; i < 3; i++) {
            await act(async () => {
                completions.push(ref.current!.reflow({immediate: true}));
            });
        }
        expect(preparation).toHaveBeenCalledTimes(1);
        await act(async () => {
            gate.resolve();
        });
        await Promise.all(completions);
    });

    test('export completion waits for visible continuous legend', async () => {
        const chartData: ChartData = {
            ...data,
            legend: {
                enabled: true,
                type: 'continuous',
                colorScale: {colors: ['red', 'blue']},
            },
        };
        const {ref, container} = await readyChart(chartData);
        const gate = deferred<void>();
        const original = axisGenerators.axisBottom;
        let started = false;
        jest.spyOn(axisGenerators, 'axisBottom').mockImplementation(async (args) => {
            if (args.domain.color === 'transparent') {
                started = true;
                await gate.promise;
            }
            return original(args);
        });
        Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
        let completion!: Promise<void>;
        let completed = false;
        act(() => {
            completion = ref.current!.reflow({immediate: true});
            completion.then(() => {
                completed = true;
            });
        });
        await waitFor(() => expect(started).toBe(true));
        expect(completed).toBe(false);
        // Rendering is hidden during asynchronous tick measurement.
        /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Export contract requires actual visible legend DOM. */
        expect((container.querySelector('.gcharts-legend') as SVGElement).style.opacity).toBe('0');
        await act(async () => {
            gate.resolve();
        });
        await completion;
        expect((container.querySelector('.gcharts-legend') as SVGElement).style.opacity).toBe('1');
        expect(container.querySelectorAll('.gcharts-legend .tick').length).toBeGreaterThan(0);
        /* eslint-enable testing-library/no-container, testing-library/no-node-access */
    });

    test('export completion waits for current range slider preview', async () => {
        const {ref, container} = await readyChart({...data, xAxis: {rangeSlider: {enabled: true}}});
        /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Compare actual preview geometry after resize. */
        const previousPath = container
            .querySelector('.gcharts-range-slider__shapes .gcharts-line path')
            ?.getAttribute('d');
        /* eslint-enable testing-library/no-container, testing-library/no-node-access */
        const gate = deferred<void>();
        const original = shapes.getShapes;
        let started = false;
        jest.spyOn(shapes, 'getShapes').mockImplementation(async (args) => {
            if (args.isRangeSlider) {
                started = true;
                await gate.promise;
            }
            return original(args);
        });
        Object.defineProperty(container, 'clientWidth', {value: 640, configurable: true});
        let completion!: Promise<void>;
        let completed = false;
        act(() => {
            completion = ref.current!.reflow({immediate: true});
            completion.then(() => {
                completed = true;
            });
        });
        await waitFor(() => expect(started).toBe(true));
        expect(completed).toBe(false);
        await act(async () => {
            gate.resolve();
        });
        await completion;
        /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Assert current slider preview paths and resized bounds. */
        const slider = container.querySelector('.gcharts-range-slider')!;
        expect(Number(slider.getAttribute('width'))).toBeLessThan(640);
        expect(slider.querySelector('.gcharts-line path')?.getAttribute('d')).not.toBe(
            previousPath,
        );
        expect(
            slider.querySelectorAll('.gcharts-range-slider__shapes .gcharts-line path').length,
        ).toBeGreaterThan(0);
        /* eslint-enable testing-library/no-container, testing-library/no-node-access */
    });

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
            const {ref, container} = await readyChart();
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
            xPreparation.mockRestore();
            yPreparation.mockRestore();
            act(() => {
                completion = ref.current!.reflow({immediate: true});
            });
            await completion;
        },
    );

    test('old measured-size failure cannot reject a newer resize request', async () => {
        const {ref, container} = await readyChart();
        const old = deferred<void>();
        const original = shapes.getShapes;
        let runs = 0;
        jest.spyOn(shapes, 'getShapes').mockImplementation(async (args) => {
            if (++runs === 1) await old.promise;
            return original(args);
        });
        Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
        let first!: Promise<void>;
        act(() => {
            first = ref.current!.reflow({immediate: true});
        });
        await waitFor(() => expect(runs).toBe(1));
        Object.defineProperty(container, 'clientHeight', {value: 530, configurable: true});
        const second = ref.current!.reflow();
        await act(async () => {
            old.reject(new Error('obsolete measured geometry'));
        });
        await Promise.all([first, second]);
        /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Completion must target the latest host geometry. */
        expect(container.querySelector('svg')?.getAttribute('height')).toBe('530');
        /* eslint-enable testing-library/no-container, testing-library/no-node-access */
    });

    test('resize prepares each axis once and ignores obsolete axis failures', async () => {
        const {ref, container} = await readyChart();
        const old = deferred<Awaited<ReturnType<typeof xAxis.prepareXAxisData>>>();
        const original = xAxis.prepareXAxisData;
        const prepare = jest
            .spyOn(xAxis, 'prepareXAxisData')
            .mockReturnValueOnce(old.promise)
            .mockImplementation(original);
        Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
        let first!: Promise<void>;
        act(() => {
            first = ref.current!.reflow({immediate: true});
        });
        await waitFor(() => expect(prepare).toHaveBeenCalledTimes(1));
        const gate = deferred<void>();
        const getShapes = shapes.getShapes;
        const next = jest.spyOn(shapes, 'getShapes').mockImplementation(async (args) => {
            await gate.promise;
            return getShapes(args);
        });
        Object.defineProperty(container, 'clientHeight', {value: 530, configurable: true});
        let second!: Promise<void>;
        act(() => {
            second = ref.current!.reflow({immediate: true});
        });
        await waitFor(() => expect(next).toHaveBeenCalledTimes(1));
        expect(prepare).toHaveBeenCalledTimes(1);
        await act(async () => {
            old.reject(new Error('obsolete axis'));
        });
        await act(async () => {
            gate.resolve();
        });
        await Promise.all([first, second]);
        expect(prepare).toHaveBeenCalledTimes(2);
    });

    test.each(['pending', 'reject'] as const)(
        'initial chart renders despite %s optional pie callback',
        async (outcome) => {
            const gate = deferred<SVGElement>();
            const ref = React.createRef<ChartRef>();
            const {container} = renderChart(
                <Chart
                    ref={ref}
                    data={{
                        legend: {enabled: false},
                        series: {
                            data: [
                                {
                                    type: 'pie',
                                    data: [{name: 'Slice', value: 2}],
                                    renderCustomShape: () => gate.promise,
                                },
                                ...data.series.data,
                            ],
                        },
                    }}
                />,
            );
            /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Main paths must render on first mount without the optional node. */
            await waitFor(() =>
                expect(container.querySelectorAll('.gcharts-pie__segment').length).toBe(1),
            );
            await waitFor(() =>
                expect(container.querySelectorAll('.gcharts-line path').length).toBeGreaterThan(0),
            );
            if (outcome === 'reject')
                await act(async () => {
                    gate.reject(new Error('optional node failed'));
                });
            expect(container.querySelectorAll('.gcharts-pie__segment').length).toBe(1);
            /* eslint-enable testing-library/no-container, testing-library/no-node-access */
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

    test('export completion waits for built-in pie center text measurement and insertion', async () => {
        const total = 'EXPORT TOTAL 42';
        const {ref, container} = await readyChart({
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'pie',
                        innerRadius: 60,
                        data: [{name: 'Slice', value: 2}],
                        renderCustomShape: CustomShapeRenderer.pieCenterText(total),
                    },
                ],
            },
        });
        const gate = deferred<void>();
        const original = textUtils.getLabelsSize;
        let measurementStarted = false;
        jest.spyOn(textUtils, 'getLabelsSize').mockImplementation(async (args) => {
            if (args.labels.includes(total)) {
                measurementStarted = true;
                await gate.promise;
            }
            return original(args);
        });
        Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
        let completion!: Promise<void>;
        let completed = false;
        act(() => {
            completion = ref.current!.reflow({immediate: true});
            completion.then(() => {
                completed = true;
            });
        });
        await waitFor(() => expect(measurementStarted).toBe(true));
        /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Export requires current geometry and the actual built-in total. */
        expect(container.querySelector('.gcharts-pie__segment')).not.toBeNull();
        expect(container.querySelector('.gcharts-pie__item text')).toBeNull();
        expect(completed).toBe(false);
        await act(async () => {
            gate.resolve();
        });
        await completion;
        expect(container.querySelector('.gcharts-pie__item text tspan')?.textContent).toBe(total);
        expect(container.querySelector('svg')?.getAttribute('height')).toBe('472');
        /* eslint-enable testing-library/no-container, testing-library/no-node-access */
    });

    test('coalesced exports wait for every asynchronous consumer pie node', async () => {
        const custom = [
            jest.fn(() => Promise.resolve(customNode('initial'))),
            jest.fn(() => Promise.resolve(customNode('initial'))),
        ];
        const {ref, container} = await readyChart({
            legend: {enabled: false},
            series: {
                data: custom.map((renderCustomShape) => ({
                    type: 'pie' as const,
                    data: [{name: 'Slice', value: 2}],
                    renderCustomShape,
                })),
            },
        });
        const first = deferred<SVGCircleElement>();
        const second = deferred<SVGCircleElement>();
        custom[0].mockClear().mockReturnValue(first.promise);
        custom[1].mockClear().mockReturnValue(second.promise);
        Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
        let completion!: Promise<void>;
        let joined!: Promise<void>;
        let completed = false;
        act(() => {
            completion = ref.current!.reflow({immediate: true});
            completion.then(() => {
                completed = true;
            });
        });
        await waitFor(() => expect(custom[1]).toHaveBeenCalledTimes(1));
        act(() => {
            joined = ref.current!.reflow({immediate: true});
        });
        const firstNode = customNode('first');
        await act(async () => {
            first.resolve(firstNode);
        });
        expect(firstNode.isConnected).toBe(true);
        expect(completed).toBe(false);
        const secondNode = customNode('second');
        await act(async () => {
            second.resolve(secondNode);
        });
        await Promise.all([completion, joined]);
        expect(secondNode.isConnected).toBe(true);
        expect(custom[0]).toHaveBeenCalledTimes(1);
        expect(custom[1]).toHaveBeenCalledTimes(1);
    });

    test('export waits for asynchronous pie preview nodes while main series is visible', async () => {
        const custom = jest.fn<
            ReturnType<NonNullable<PieSeries['renderCustomShape']>>,
            [Parameters<NonNullable<PieSeries['renderCustomShape']>>[0]]
        >(() => customNode('initial'));
        const {ref, container} = await readyChart({
            ...data,
            legend: {enabled: false},
            xAxis: {rangeSlider: {enabled: true, height: 40}},
            series: {
                data: [
                    ...data.series.data,
                    {
                        type: 'pie',
                        innerRadius: '50%',
                        data: [{name: 'Slice', value: 2}],
                        renderCustomShape: custom,
                    },
                ],
            },
        });
        const gate = deferred<SVGElement>();
        let previewStarted = false;
        custom.mockImplementation(({series}) => {
            if (series.innerRadius <= 20) {
                previewStarted = true;
                return gate.promise;
            }
            return customNode('main');
        });
        Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
        let completion!: Promise<void>;
        let completed = false;
        act(() => {
            completion = ref.current!.reflow({immediate: true});
            completion.then(() => {
                completed = true;
            });
        });
        await waitFor(() => expect(previewStarted).toBe(true));
        /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Main series stays visible while preview content is pending. */
        expect(
            container.querySelectorAll('.gcharts-chart__content .gcharts-line path').length,
        ).toBeGreaterThan(0);
        expect(
            container.querySelector('.gcharts-range-slider .gcharts-pie__segment'),
        ).not.toBeNull();
        expect(completed).toBe(false);
        const preview = customNode('preview');
        await act(async () => {
            gate.resolve(preview);
        });
        await completion;
        expect(container.querySelector('.gcharts-range-slider [data-custom-pie="preview"]')).toBe(
            preview,
        );
        /* eslint-enable testing-library/no-container, testing-library/no-node-access */
    });

    test.each(['pending', 'resolve', 'reject'] as const)(
        'renders main pie immediately while export waits for %s optional node',
        async (outcome) => {
            const {ref, container, custom, pieData, onReady, unmount} = await readyPie();
            const gate = deferred<SVGElement>();
            custom.mockReturnValue(gate.promise);
            Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
            let completion!: Promise<void>;
            let completed = false;
            act(() => {
                completion = ref.current!.reflow({immediate: true});
                completion.then(
                    () => {
                        completed = true;
                    },
                    () => undefined,
                );
            });
            await waitFor(() => expect(custom).toHaveBeenCalledTimes(1));
            /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Verify main pie geometry before optional callback settles. */
            const segment = container.querySelector('.gcharts-pie__segment')!;
            expect(segment.getAttribute('d')).toContain('A150,150');
            expect(segment.getAttribute('d')).toContain('A40,40');
            expect((segment as SVGElement).style.stroke).toBe('red');
            expect(completed).toBe(false);
            expect(onReady).toHaveBeenLastCalledWith({dimensions: {width: 800, height: 472}});
            const node = customNode('optional');
            if (outcome === 'pending') {
                unmount();
                await expect(completion).rejects.toThrow('unmounted');
            } else {
                await act(async () => {
                    if (outcome === 'resolve') gate.resolve(node);
                    else gate.reject(new Error('optional pie failed'));
                });
                await completion;
                expect(completed).toBe(true);
                expect(container.querySelector('.gcharts-pie__segment')).toBe(segment);
                expect(node.isConnected).toBe(outcome === 'resolve');
            }
            /* eslint-enable testing-library/no-container, testing-library/no-node-access */
            expect(pieData.series.data[0]).not.toHaveProperty('customShape');
            expect(pieData.series.data[0].data[0]).not.toHaveProperty('customShape');
        },
    );

    test.each(['resize', 'resize during preparation', 'unmount'] as const)(
        'stale optional pie completion after %s cannot append or complete current export',
        async (change) => {
            const {ref, container, custom, unmount} = await readyPie();
            const old = deferred<SVGElement>();
            const current = deferred<SVGElement>();
            custom.mockReturnValueOnce(old.promise).mockReturnValue(current.promise);
            Object.defineProperty(container, 'clientHeight', {value: 472, configurable: true});
            let first!: Promise<void>;
            let completed = false;
            act(() => {
                first = ref.current!.reflow({immediate: true});
                first.then(
                    () => {
                        completed = true;
                    },
                    () => undefined,
                );
            });
            await waitFor(() => expect(custom).toHaveBeenCalledTimes(1));
            expect(completed).toBe(false);
            let second!: Promise<void>;
            const preparation = deferred<void>();
            let preparing = false;
            if (change === 'resize during preparation') {
                const original = shapes.getShapes;
                jest.spyOn(shapes, 'getShapes').mockImplementation(async (args) => {
                    preparing = true;
                    await preparation.promise;
                    return original(args);
                });
            }
            if (change === 'unmount') {
                unmount();
                await expect(first).rejects.toThrow('unmounted');
            } else {
                Object.defineProperty(container, 'clientHeight', {value: 530, configurable: true});
                act(() => {
                    second = ref.current!.reflow({immediate: true});
                });
                if (change === 'resize')
                    await waitFor(() => expect(custom).toHaveBeenCalledTimes(2));
                else await waitFor(() => expect(preparing).toBe(true));
            }
            const stale = customNode('stale');
            await act(async () => {
                old.resolve(stale);
            });
            // Even a detached obsolete group must not receive the stale node.
            // eslint-disable-next-line testing-library/no-node-access -- Verify no append even to a detached obsolete group.
            expect(stale.parentNode).toBeNull();
            expect(completed).toBe(false);
            if (change !== 'unmount') {
                await act(async () => {
                    preparation.resolve();
                });
                await waitFor(() => expect(custom).toHaveBeenCalledTimes(2));
                const node = customNode('current');
                await act(async () => {
                    current.resolve(node);
                });
                await Promise.all([first, second]);
                expect(completed).toBe(true);
                expect(node.isConnected).toBe(true);
                /* eslint-disable testing-library/no-container, testing-library/no-node-access -- Export must commit latest dimensions. */
                expect(container.querySelector('svg')?.getAttribute('height')).toBe('530');
                /* eslint-enable testing-library/no-container, testing-library/no-node-access */
            }
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
