import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator} from '@playwright/test';

import AxisPaddingExample from '../../docs/examples/src/charts/layout/axis-padding';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {migrateChartDataV1} from '../migration/v1';
import type {ChartDataV1} from '../migration/v1';
import type {ChartData, ChartSeries} from '../types';

import {getLocatorBoundingBox} from './utils';

// Baselines captured from the v1 configuration at be030612.
for (const type of ['bar-x', 'bar-y'] as const) {
    test(`v1 adapter preserves ${type} geometry after resize`, async ({mount}) => {
        const legacy: ChartDataV1 = {
            legend: {enabled: false},
            xAxis: {maxPadding: 0.25, startOnTick: false, endOnTick: false},
            yAxis: [{maxPadding: 0.25, startOnTick: false, endOnTick: false}],
            series: {
                data: [
                    {
                        type,
                        name: 'Revenue',
                        dataLabels: {enabled: true},
                        data:
                            type === 'bar-x'
                                ? [
                                      {x: 0, y: 60},
                                      {x: 100, y: 80},
                                  ]
                                : [
                                      {x: 60, y: 0},
                                      {x: 100, y: 1},
                                  ],
                    },
                ],
            },
        };
        const data = migrateChartDataV1(legacy).data;
        let readyCount = 0;
        const onRender = () => {
            readyCount++;
        };
        const getReadyCount = () => readyCount;
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 350, height: 300}} onRender={onRender} />,
        );
        await expect.poll(getReadyCount).toBeGreaterThan(0);
        for (const width of [350, 650]) {
            const previousReadyCount = readyCount;
            await component.update(
                <ChartTestStory data={data} styles={{width, height: 300}} onRender={onRender} />,
            );
            if (width !== 350) {
                await expect.poll(getReadyCount).toBeGreaterThan(previousReadyCount);
            }
            await expect(component.locator('svg').first()).toHaveAttribute('width', String(width));
            await expect(component.locator('.gcharts-chart')).toHaveScreenshot(
                `v1-${type}-${width}.png`,
            );
        }
    });
}

async function expectPaintInsidePlot(plot: Locator, paint: Locator) {
    const bounds = await plot.evaluate((element) => {
        const matrix = (element as SVGGraphicsElement).getScreenCTM();
        if (!matrix) throw new Error('Missing plot transform');
        const start = new DOMPoint(0, 0).matrixTransform(matrix);
        const end = new DOMPoint(
            Number(element.getAttribute('width')),
            Number(element.getAttribute('height')),
        ).matrixTransform(matrix);
        return {left: start.x, top: start.y, right: end.x, bottom: end.y};
    });
    const boxes = await paint.evaluateAll((nodes) =>
        nodes
            .filter((node) => getComputedStyle(node).visibility !== 'hidden')
            .map((node) => {
                const box = node.getBoundingClientRect();
                const style = getComputedStyle(node);
                // These fixtures use circular symbols; their stroke extends by half its width.
                const stroke = style.stroke === 'none' ? 0 : parseFloat(style.strokeWidth) / 2;
                return {
                    left: box.left - stroke,
                    right: box.right + stroke,
                    top: box.top - stroke,
                    bottom: box.bottom + stroke,
                };
            }),
    );
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
        expect(box.left).toBeGreaterThanOrEqual(bounds.left - 0.1);
        expect(box.right).toBeLessThanOrEqual(bounds.right + 0.1);
        expect(box.top).toBeGreaterThanOrEqual(bounds.top - 0.1);
        expect(box.bottom).toBeLessThanOrEqual(bounds.bottom + 0.1);
    }
}

function dataFor(type: 'line' | 'area' | 'area-range' | 'scatter'): ChartData {
    const points = [
        {x: 0, y: 50},
        {x: 1, y: 100},
        {x: 2, y: 50},
    ];
    let series: ChartSeries;
    if (type === 'area-range') {
        series = {
            type,
            name: 'Forecast',
            marker: {enabled: true, radius: 10},
            data: points.map(({x, y}) => ({x, y0: y - 20, y1: y})),
        };
    } else if (type === 'scatter') {
        series = {type, name: 'Revenue', data: points.map((p) => ({...p, radius: 10}))};
    } else {
        series = {
            type,
            name: 'Revenue',
            marker: {enabled: true, radius: 10, borderWidth: 2},
            data: points,
        };
        if (series.type === 'line') series.dataLabels = {enabled: true, anchor: 'marker-edge'};
    }
    return {
        legend: {enabled: false},
        xAxis: {padding: {min: 'auto', max: 'auto'}},
        yAxis: [{min: 0, padding: {max: 'auto'}, endOnTick: true}],
        series: {data: [series]},
    };
}

test.describe('Axis padding', () => {
    for (const type of ['linear', 'logarithmic'] as const) {
        test(`${type} percentages expand both ends symmetrically`, async ({mount}) => {
            const values = type === 'linear' ? [0, 100] : [1, 100];
            const axis = {
                type,
                padding: {min: '25%', max: '25%'},
                startOnTick: false,
                endOnTick: false,
            };
            const data: ChartData = {
                legend: {enabled: false},
                xAxis: axis,
                yAxis: [axis],
                series: {
                    data: [
                        {type: 'scatter', name: 'Revenue', data: values.map((v) => ({x: v, y: v}))},
                    ],
                },
            };
            const component = await mount(
                <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
            );
            const markers = component.locator('.gcharts-marker__symbol[d]');
            await expect(markers).toHaveCount(2);
            for (const order of [undefined, 'reverse'] as const) {
                await component.update(
                    <ChartTestStory
                        data={{...data, xAxis: {...axis, order}, yAxis: [{...axis, order}]}}
                        styles={{width: 600, height: 300}}
                    />,
                );
                await expect
                    .poll(async () => {
                        const plot = await component
                            .locator('.gcharts-chart__content')
                            .evaluate((element) => {
                                const matrix = (element as SVGGraphicsElement).getScreenCTM();
                                if (!matrix) throw new Error('Missing plot transform');
                                const start = new DOMPoint(0, 0).matrixTransform(matrix);
                                const end = new DOMPoint(
                                    Number(element.getAttribute('width')),
                                    Number(element.getAttribute('height')),
                                ).matrixTransform(matrix);
                                return {
                                    x: start.x,
                                    y: start.y,
                                    width: end.x - start.x,
                                    height: end.y - start.y,
                                };
                            });
                        const boxes = await markers.evaluateAll((nodes) =>
                            nodes.map((node) => node.getBoundingClientRect().toJSON()),
                        );
                        return ['x', 'y'].map((direction) =>
                            boxes
                                .map((box) => {
                                    const fraction =
                                        direction === 'x'
                                            ? (box.x + box.width / 2 - plot.x) / plot.width
                                            : (box.y + box.height / 2 - plot.y) / plot.height;
                                    return Math.round(fraction * 600);
                                })
                                .sort((a, b) => a - b),
                        );
                    })
                    .toEqual([
                        [100, 500],
                        [100, 500],
                    ]);
            }
        });
    }

    for (const type of ['line', 'area', 'area-range', 'scatter'] as const) {
        test(`${type} fits markers with a continuous axis and stable hover`, async ({
            mount,
            page,
        }) => {
            const component = await mount(
                <ChartTestStory data={dataFor(type)} styles={{width: 600, height: 300}} />,
            );
            const svg = component.locator('svg');
            const markers = component.locator('.gcharts-marker__symbol[d]');
            await expect(markers).toHaveCount(type === 'area-range' ? 6 : 3);
            const plot = component.locator('.gcharts-chart__content');
            await expectPaintInsidePlot(plot, markers);
            const boxes = await markers.evaluateAll((nodes) =>
                nodes.map((node) => node.getBoundingClientRect().toJSON()),
            );
            const ticks = component.locator('.gcharts-y-axis__tick text');
            await expect(ticks.first()).toBeVisible();
            const labels = await ticks.allTextContents();
            expect(labels.some((value) => Number(value) > 100)).toBe(true);
            const before = await ticks.evaluateAll((nodes) =>
                nodes.map((node) => node.getBoundingClientRect().toJSON()),
            );
            const right = boxes.reduce((a, b) => (a.right > b.right ? a : b));
            await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2);
            await expect(page.locator('.gcharts-tooltip')).toBeVisible();
            await expectPaintInsidePlot(
                plot,
                component.locator('.gcharts-marker__symbol[d], .gcharts-marker__halo[d]'),
            );
            if (type === 'scatter') {
                await expect(
                    component.locator('.gcharts-marker__halo[visibility=""]'),
                ).toBeVisible();
            }
            expect(
                await ticks.evaluateAll((nodes) =>
                    nodes.map((node) => node.getBoundingClientRect().toJSON()),
                ),
            ).toEqual(before);
            await page.mouse.move(700, 500);
            await expect(svg).toHaveScreenshot();
        });
    }

    test('shifted clusters keep their hover halo inside the padded plot', async ({mount, page}) => {
        const data: ChartData = {
            chart: {margin: {top: 0, bottom: 0, left: 0, right: 0}},
            legend: {enabled: false},
            xAxis: {
                visible: false,
                startOnTick: false,
                endOnTick: false,
                padding: {min: 'auto', max: 'auto'},
            },
            yAxis: [{visible: false, padding: {min: 'auto', max: 'auto'}}],
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Events',
                        cluster: {
                            enabled: true,
                            overlapMode: 'shift',
                            minimumClusterSize: 3,
                            dataLabels: {enabled: false},
                        },
                        data: [
                            {x: 0, y: 50, radius: 1},
                            {x: 0.001, y: 50, radius: 1},
                            {x: 0.002, y: 50, radius: 1},
                            {x: 0.13, y: 50, radius: 35},
                            {x: 2, y: 100, radius: 1},
                            {x: 2, y: 0, radius: 1},
                        ],
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        const markers = component.locator('.gcharts-marker__symbol[d]');
        await expect(markers).toHaveCount(4);
        const cluster = await getLocatorBoundingBox(markers.first());
        // Keep the tooltip on whole CSS pixels for consistent text rasterization.
        await page.mouse.move(
            Math.round(cluster.x + cluster.width / 2),
            Math.round(cluster.y + cluster.height / 2),
        );
        await expect(page.locator('.gcharts-tooltip')).toBeVisible();
        const halo = component.locator('.gcharts-marker__halo[visibility=""]');
        await expect(halo).toBeVisible();
        await expectPaintInsidePlot(component.locator('.gcharts-chart__content'), halo);
        await expect(component.locator('svg')).toHaveScreenshot();

        await component.update(
            <ChartTestStory
                data={{
                    ...data,
                    xAxis: {...data.xAxis, order: 'reverse', padding: {min: 'auto', max: 0}},
                }}
                styles={{width: 600, height: 300}}
            />,
        );
        await expect
            .poll(async () => (await getLocatorBoundingBox(markers.first())).x)
            .toBeGreaterThan(500);
        const reversedCluster = await getLocatorBoundingBox(markers.first());
        await page.mouse.move(
            Math.round(reversedCluster.x + reversedCluster.width / 2),
            Math.round(reversedCluster.y + reversedCluster.height / 2),
        );
        await expect(halo).toBeVisible();
        await expectPaintInsidePlot(component.locator('.gcharts-chart__content'), halo);
    });

    test('disabled scatter hover markers keep their normal paint and hide the halo', async ({
        mount,
        page,
    }) => {
        const data: ChartData = {
            legend: {enabled: false},
            xAxis: {startOnTick: false, endOnTick: false, padding: {min: 'auto', max: 'auto'}},
            yAxis: [{padding: {min: 'auto', max: 'auto'}}],
            series: {
                options: {
                    scatter: {
                        states: {
                            hover: {
                                marker: {
                                    enabled: false,
                                    radius: 30,
                                    borderWidth: 6,
                                    borderColor: 'red',
                                    halo: {enabled: true, size: 40, opacity: 0.4},
                                },
                            },
                        },
                    },
                },
                data: [
                    {
                        type: 'scatter',
                        name: 'Events',
                        data: [
                            {x: 0, y: 0},
                            {x: 2, y: 100},
                        ],
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        const markers = component.locator('.gcharts-marker__symbol[d]');
        await expect(markers).toHaveCount(2);
        const marker = markers.last();
        const path = await marker.getAttribute('d');
        if (!path) throw new Error('Missing normal marker path');
        const borderWidth = await marker.getAttribute('stroke-width');
        const borderColor = await marker.getAttribute('stroke');
        const box = await getLocatorBoundingBox(marker);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await expect(page.locator('.gcharts-tooltip')).toBeVisible();
        await expect(marker).toHaveAttribute('d', path);
        await expect(marker).toHaveAttribute('stroke-width', borderWidth ?? '');
        await expect(marker).toHaveAttribute('stroke', borderColor ?? '');
        await expect(component.locator('.gcharts-marker__halo[visibility=""]')).toHaveCount(0);
        await expectPaintInsidePlot(component.locator('.gcharts-chart__content'), markers);
    });

    test('keeps explicit maximum limits and tick labels unchanged', async ({mount}) => {
        const data = dataFor('line');
        data.yAxis = [{min: 0, max: 100, endOnTick: false, padding: {max: 'auto'}}];
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        const labels = component.locator('.gcharts-y-axis__tick text');
        await expect(labels.last()).toHaveText('100');
        expect((await labels.allTextContents()).map(Number).every((value) => value <= 100)).toBe(
            true,
        );
    });

    test('renders the guide example', async ({mount}) => {
        const component = await mount(
            <div style={{width: 600, height: 320}}>
                <AxisPaddingExample />
            </div>,
        );
        await expect(component.locator('.gcharts-marker__symbol[d]')).toHaveCount(4);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('restores automatic padding after resetting zoom', async ({mount, page}) => {
        const data = dataFor('line');
        data.chart = {zoom: {enabled: true, type: 'x'}};
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        const markers = component.locator('.gcharts-marker__symbol[d]');
        await expect(markers).toHaveCount(3);
        const before = await markers.evaluateAll((nodes) =>
            nodes.map((node) => node.getBoundingClientRect().toJSON()),
        );
        const ticks = component.locator('.gcharts-x-axis__tick text');
        const labels = await ticks.allTextContents();
        const brush = await getLocatorBoundingBox(component.locator('.gcharts-brush'));
        await page.mouse.move(brush.x + brush.width * 0.2, brush.y + brush.height / 2);
        await page.mouse.down();
        await page.mouse.move(brush.x + brush.width * 0.8, brush.y + brush.height / 2, {steps: 10});
        await page.mouse.up();
        const reset = component.locator('.gcharts-chart__reset-zoom-button');
        await expect(reset).toBeVisible();
        await expect.poll(() => ticks.allTextContents()).not.toEqual(labels);
        await reset.click();
        await expect(reset).not.toBeVisible();
        await expect(markers).toHaveCount(3);
        await expect
            .poll(() =>
                markers.evaluateAll((nodes) =>
                    nodes.map((node) => node.getBoundingClientRect().toJSON()),
                ),
            )
            .toEqual(before);
    });

    test('recovers from zero plot width', async ({mount}) => {
        const data = dataFor('scatter');
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        await expect(component.locator('.gcharts-marker__symbol[d]')).toHaveCount(3);
        await component.update(<ChartTestStory data={data} styles={{width: 1, height: 300}} />);
        await expect
            .poll(async () => (await getLocatorBoundingBox(component.locator('svg'))).width)
            .toBe(1);
        await component.update(<ChartTestStory data={data} styles={{width: 600, height: 300}} />);
        const markers = component.locator('.gcharts-marker__symbol[d]');
        await expect(markers).toHaveCount(3);
        expect(
            await markers.evaluateAll((nodes) =>
                nodes.every((node) => !/NaN|Infinity/.test(node.outerHTML)),
            ),
        ).toBe(true);
    });

    test('anchors the initial range slider selection at the unpadded data maximum', async ({
        mount,
    }) => {
        const data: ChartData = {
            legend: {enabled: false},
            xAxis: {
                startOnTick: false,
                endOnTick: false,
                padding: {min: 'auto', max: 'auto'},
                rangeSlider: {enabled: true, defaultRange: {size: 0.5}},
            },
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Events',
                        data: [
                            {x: 0, y: 20},
                            {x: 1.5, y: 50},
                            {x: 2, y: 80},
                        ],
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        const plot = component.locator('.gcharts-chart__content');
        const markers = plot.locator('.gcharts-marker__symbol[d]');
        await expect(markers).toHaveCount(2);

        const slider = component.locator('.gcharts-range-slider');
        const selection = slider.locator('.selection');
        const sliderWidth = Number(await slider.getAttribute('width'));
        await expect
            .poll(async () => Number(await selection.getAttribute('x')) / sliderWidth)
            .toBeCloseTo(0.75, 6);
        expect(Number(await selection.getAttribute('width')) / sliderWidth).toBeCloseTo(0.25, 6);
    });
});
