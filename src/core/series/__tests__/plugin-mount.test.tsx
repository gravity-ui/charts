/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

/* eslint-disable testing-library/no-container, testing-library/no-node-access -- Inspect plugin-owned SVG geometry and cleanup. */
import React from 'react';

import {act, fireEvent, screen, waitFor} from '@testing-library/react';

import {Chart} from '../../../components';
import type {ChartRef} from '../../../components';
import {renderChart} from '../../../components/__tests__/utils';
import type {ChartApi, ChartData, ChartSeries} from '../../../types';
import {registerSeriesPlugin} from '../seriesRegistry';

import {samplePlugin, sampleShapesPlugin} from './fixtures/custom-plugin';
import type {SampleSeries} from './fixtures/custom-plugin';

afterEach(() => jest.restoreAllMocks());

test.each([
    {mode: 'shapes only', plugin: sampleShapesPlugin, interaction: false, tooltip: false},
    {
        mode: 'interaction without tooltip',
        plugin: {...samplePlugin, tooltip: undefined},
        interaction: true,
        tooltip: false,
    },
    {mode: 'interaction and tooltip', plugin: samplePlugin, interaction: true, tooltip: true},
])('a custom plugin mounts and cleans up two series: $mode', async (mode) => {
    registerSeriesPlugin(mode.plugin);
    const first = {at: 10, amount: 20, caption: 'Orders'};
    const second = {at: 60, amount: 70, caption: 'Returns'};
    const series: SampleSeries[] = [
        {type: 'sample', name: 'Orders', data: [first]},
        {type: 'sample', name: 'Returns', data: [second]},
    ];
    let api: ChartApi | undefined;
    const data: ChartData = {
        chart: {
            margin: {top: 0, bottom: 0, left: 0, right: 0},
            events: {
                clickMode: 'plot',
                click: ({chart}) => {
                    api = chart;
                },
            },
        },
        legend: {enabled: false},
        // The test's new type is not part of the public built-in config union.
        series: {data: series as unknown as ChartSeries[]},
    };
    const plots: SVGGElement[] = [];
    // eslint-disable-next-line testing-library/render-result-naming-convention -- Preserve the plugin renderer while recording its SVG containers.
    const drawShapes = mode.plugin.renderShapes;
    jest.spyOn(mode.plugin, 'renderShapes').mockImplementation((args) => {
        plots.push(args.plot);
        return drawShapes(args);
    });
    const onReady = jest.fn();
    const {container, unmount} = renderChart(<Chart data={data} onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    expect(
        Array.from(container.querySelectorAll('.gcharts-sample circle'), (circle) =>
            circle.getAttribute('cx'),
        ),
    ).toEqual(['14', '64']);
    const svg = container.querySelector('svg');
    if (!svg) throw new Error('Chart SVG is missing');
    fireEvent.click(svg, {clientX: 14, clientY: 20});
    if (mode.interaction) {
        expect(api?.getClosest([14, 20])?.point).toBe(first);
        expect(api?.getClosest([64, 70])?.point).toBe(second);
        expect(api?.getClosest([14, 20])?.series.id).not.toBe(api?.getClosest([64, 70])?.series.id);
    } else {
        expect(api?.getClosest([14, 20])).toBeNull();
    }
    const selected = api?.getClosest([14, 20], {mode: 'tooltip'});
    if (mode.tooltip) expect(selected?.point).toBe(first);
    else expect(selected).toBeNull();
    unmount();
    expect(plots.length).toBeGreaterThan(0);
    expect(plots.every((plot) => plot.children.length === 0)).toBe(true);
    expect(api?.getClosest([14, 20])).toBeNull();
});

test('a custom plugin follows legend, data and size updates in a mixed chart', async () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        measureText: (text: string) => ({
            width: text.length * 6,
            fontBoundingBoxAscent: 10,
            fontBoundingBoxDescent: 2,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: text.length * 6,
        }),
    } as CanvasRenderingContext2D);
    registerSeriesPlugin(samplePlugin);
    const validate = jest.spyOn(samplePlugin, 'validate');
    const first = {at: 10, amount: 20, caption: 'Ordered units'};
    const second = {at: 60, amount: 70, caption: 'Returned units'};
    const series: SampleSeries[] = [
        {type: 'sample', id: 'orders', name: 'Orders', legend: {groupId: 'orders'}, data: [first]},
        {
            type: 'sample',
            id: 'returns',
            name: 'Returns',
            legend: {groupId: 'returns'},
            data: [second],
        },
    ];
    let api: ChartApi | undefined;
    const data: ChartData = {
        chart: {
            margin: {top: 0, bottom: 0, left: 0, right: 0},
            events: {
                clickMode: 'plot',
                click: ({chart}) => {
                    api = chart;
                },
            },
        },
        legend: {enabled: true, position: 'bottom'},
        xAxis: {min: 0, max: 100},
        yAxis: [{min: 0, max: 100}],
        series: {
            data: [
                series[0],
                {type: 'line', name: 'Context', data: [{x: 90, y: 90}]},
                series[1],
            ] as unknown as ChartSeries[],
        },
    };
    const ref = React.createRef<ChartRef>();
    const view = renderChart(<Chart ref={ref} data={data} />);
    await waitFor(() =>
        expect(view.container.querySelectorAll('.gcharts-sample circle')).toHaveLength(2),
    );
    expect(validate).toHaveBeenCalledWith(
        expect.objectContaining({series: series[0], allSeries: data.series.data}),
    );
    const svg = view.container.querySelector('svg');
    if (!svg || !ref.current) throw new Error('Chart is missing');
    const chart = ref.current;
    fireEvent(svg, new MouseEvent('pointermove', {bubbles: true, clientX: 50, clientY: 20}));
    await screen.findByText(first.caption);
    fireEvent.click(svg, {clientX: 50, clientY: 20});
    fireEvent.click(svg, {clientX: 50, clientY: 20});
    expect(api?.getClosest([14, 20])?.point).toBe(first);
    fireEvent.click(screen.getByText('Orders'), {metaKey: true, ctrlKey: true});
    await waitFor(() =>
        expect(view.container.querySelectorAll('.gcharts-sample circle')).toHaveLength(1),
    );
    await waitFor(() => expect(api?.getClosest([14, 20])?.point).toBe(second));
    fireEvent.click(screen.getByText('Orders'), {metaKey: true, ctrlKey: true});
    await waitFor(() =>
        expect(view.container.querySelectorAll('.gcharts-sample circle')).toHaveLength(2),
    );

    const point = {at: 30, amount: 20, caption: 'Updated units'};
    const next: ChartData = {
        ...data,
        series: {
            data: [
                {...series[0], data: [point]},
                data.series.data[1],
                series[1],
            ] as unknown as ChartSeries[],
        },
    };
    view.rerender(<Chart ref={ref} data={next} />);
    await waitFor(() => expect(api?.getClosest([34, 20])?.point).toBe(point));
    fireEvent(svg, new MouseEvent('pointermove', {bubbles: true, clientX: 50, clientY: 20}));
    await screen.findByText(point.caption);
    expect(api?.getClosest([34, 20])?.point).toBe(point);
    expect(
        Array.from(view.container.querySelectorAll('.gcharts-sample circle'), (circle) =>
            circle.getAttribute('cx'),
        ),
    ).toEqual(['34', '64']);

    let completion!: Promise<void>;
    Object.defineProperty(view.container, 'clientWidth', {value: 0, configurable: true});
    await act(async () => {
        completion = chart.reflow({immediate: true});
        await expect(completion).rejects.toThrow('zero size');
    });
    await waitFor(() => expect(api?.getClosest([34, 20])).toBeNull());
    Object.defineProperty(view.container, 'clientWidth', {value: 600, configurable: true});
    await act(async () => {
        completion = chart.reflow({immediate: true});
    });
    await waitFor(() => expect(api?.getClosest([34, 20])?.point).toBe(point));
    await completion;

    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
        view.rerender(
            <Chart
                data={{
                    ...data,
                    series: {
                        data: [
                            {...series[0], data: [{...first, amount: NaN}]},
                        ] as unknown as ChartSeries[],
                    },
                }}
            />,
        ),
    ).toThrow('Sample positions must be finite');
    view.unmount();
    expect(api?.getClosest([34, 20])).toBeNull();
});

test('core renders HTML labels when the plugin has no private geometry', async () => {
    registerSeriesPlugin({
        ...sampleShapesPlugin,
        prepareShapeData: ({
            series,
        }: Parameters<typeof sampleShapesPlugin.prepareShapeData>[0]) => ({
            renderData: [],
            htmlLabels: series.flatMap((s) =>
                s.data.map((sample) => ({
                    x: sample.at,
                    y: sample.amount,
                    content: sample.caption,
                    size: {width: 40, height: 16},
                })),
            ),
        }),
    });
    const onReady = jest.fn();
    const view = renderChart(
        <Chart
            onReady={onReady}
            data={{
                legend: {enabled: false},
                series: {
                    data: [
                        {type: 'sample', data: [{at: 10, amount: 20, caption: 'Orders'}]},
                    ] as unknown as ChartSeries[],
                },
            }}
        />,
    );
    await screen.findByText('Orders');
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    view.unmount();
    expect(screen.queryByText('Orders')).toBeNull();
});
