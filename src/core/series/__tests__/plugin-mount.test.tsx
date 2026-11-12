/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

/* eslint-disable testing-library/no-container, testing-library/no-node-access -- Inspect plugin-owned SVG geometry and cleanup. */
import React from 'react';

import {fireEvent, waitFor} from '@testing-library/react';

import {Chart} from '../../../components';
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
