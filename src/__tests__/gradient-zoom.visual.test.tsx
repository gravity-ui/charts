import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData, ChartSeries, LinearGradient} from '../types';

import {dragElementByCalculatedPosition, getLocatorBoundingBox} from './utils';

const colors = [0, 60, 120, 180, 240].map((value) => `rgb(${value}, ${value}, ${value})`);

function getData(type: 'line' | 'area' | 'area-range'): ChartData {
    const color: LinearGradient = {
        type: 'linear-gradient',
        angle: 90,
        stops: colors.map((stopColor, index) => ({offset: index / 4, color: stopColor})),
    };
    const points = colors.map((pointColor, index) => ({x: index, y: index + 1, color: pointColor}));
    const series: ChartSeries =
        type === 'area-range'
            ? {
                  type,
                  name: 'Value',
                  marker: {enabled: true},
                  color,
                  data: points.map((point) => ({...point, y0: point.y, y1: point.y + 1})),
              }
            : {type, name: 'Value', marker: {enabled: true}, color, data: points};
    return {
        chart: {zoom: {enabled: true, type: 'x'}},
        xAxis: {type: 'category', categories: ['A', 'B', 'C', 'D', 'E']},
        yAxis: [{type: 'linear'}],
        series: {data: [series]},
        legend: {
            enabled: true,
            type: 'continuous',
            title: {text: 'Color value'},
            colorScale: {colors: ['#000000', '#f0f0f0'], domain: [0, 100]},
        },
    };
}

test.describe('Gradient colors across zoom', () => {
    test.describe.configure({timeout: 20_000});

    test('range-slider changes preserve colors and clipping neighbors', async ({mount, page}) => {
        const data = getData('line');
        data.xAxis = {
            type: 'linear',
            min: 0,
            max: 4,
            rangeSlider: {enabled: true},
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{height: 400, width: 800}} />,
        );
        const chart = component.locator('svg').first();
        await expect(chart).toHaveScreenshot('slider-full-range.png');
        const sliderBox = await getLocatorBoundingBox(
            component.locator('.gcharts-range-slider .gcharts-brush .overlay'),
        );

        await dragElementByCalculatedPosition({
            component,
            page,
            selector: '.gcharts-range-slider .gcharts-brush .handle--w',
            getDragOptions: ({boundingBox}) => {
                const y = boundingBox.y + boundingBox.height / 2;
                const start = boundingBox.x + boundingBox.width / 2;
                // Select 1.8–4: retain C–E and the preceding point for clipping.
                return {from: [start, y], to: [start + sliderBox.width * 0.45, y]};
            },
        });
        await page.mouse.move(0, 0);
        // C–E plus B, retained outside the viewport for clipping.
        await expect(
            component.locator('.gcharts-chart__content .gcharts-marker__symbol'),
        ).toHaveCount(4);
        await expect(chart).toHaveScreenshot('slider-selected-range.png');
        const updatedData: ChartData = {
            ...data,
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Updated',
                        marker: {enabled: true},
                        color: {
                            type: 'linear-gradient',
                            angle: 90,
                            stops: [
                                {offset: 0, color: '#ff0000'},
                                {offset: 1, color: '#0000ff'},
                            ],
                        },
                        data: [1, 2, 3, 4, 5].map((y, x) => ({x, y})),
                    },
                ],
            },
        };
        await component.update(
            <ChartTestStory data={updatedData} styles={{height: 400, width: 800}} />,
        );
        const mainMarkers = component.locator('.gcharts-chart__content .gcharts-marker__symbol');
        const previewMarkers = component.locator('.gcharts-range-slider .gcharts-marker__symbol');
        await expect(mainMarkers).toHaveCount(4);
        await expect(previewMarkers).toHaveCount(5);
        const fullColors = [
            'rgb(255, 0, 0)',
            'rgb(191, 0, 64)',
            'rgb(128, 0, 128)',
            'rgb(64, 0, 191)',
            'rgb(0, 0, 255)',
        ];
        const colorsMatch = (actual: string[], expected: string[]) =>
            actual.length === expected.length &&
            actual.every((fill, index) => {
                const channels = fill.match(/\d+/g)?.map(Number) ?? [];
                const expectedChannels = expected[index].match(/\d+/g)?.map(Number) ?? [];
                // Affine projection can differ by one RGB level at a rounding boundary.
                return (
                    channels.length === 3 &&
                    channels.every(
                        (value, channel) => Math.abs(value - expectedChannels[channel]) <= 1,
                    )
                );
            });
        await expect
            .poll(async () =>
                colorsMatch(
                    await mainMarkers.evaluateAll((items) =>
                        items.map((item) => getComputedStyle(item).fill),
                    ),
                    fullColors.slice(1),
                ),
            )
            .toBe(true);
        await expect
            .poll(async () =>
                colorsMatch(
                    await previewMarkers.evaluateAll((items) =>
                        items.map((item) => getComputedStyle(item).fill),
                    ),
                    fullColors,
                ),
            )
            .toBe(true);
    });

    test('computed markers, tooltip and independent fill keep their colors after zoom', async ({
        mount,
        page,
    }) => {
        const data = getData('area');
        data.legend = {enabled: false};
        data.series.data = [
            {
                type: 'area',
                name: 'Value',
                marker: {enabled: true},
                color: {
                    type: 'linear-gradient',
                    angle: 0,
                    stops: [
                        {offset: 0, color: '#000000'},
                        {offset: 1, color: '#ffffff'},
                    ],
                },
                fillColor: {
                    type: 'linear-gradient',
                    angle: 45,
                    stops: [
                        {offset: 0, color: '#ff0000'},
                        {offset: 1, color: '#0000ff'},
                    ],
                },
                data: [1, 4, 2, 5, 3].map((y, x) => ({x, y})),
            },
        ];
        const component = await mount(
            <ChartTestStory data={data} styles={{height: 400, width: 800}} />,
        );
        const chart = component.locator('svg').first();
        const markers = chart.locator('.gcharts-marker__symbol');
        await expect(markers).toHaveCount(5);
        const colorsBefore = await markers.evaluateAll((items) =>
            items.map((item) => item.getAttribute('fill')),
        );
        await expect(chart).toHaveScreenshot('computed-colors-before.png');
        await dragElementByCalculatedPosition({
            component,
            page,
            selector: '.gcharts-chart__content .gcharts-brush .overlay',
            getDragOptions: ({boundingBox: box}) => ({
                from: [box.x + box.width * 0.45, box.y + box.height / 2],
                to: [box.x + box.width * 0.99, box.y + box.height / 2],
            }),
        });
        await expect(markers).toHaveCount(3);
        await expect
            .poll(() =>
                markers.evaluateAll((items) => items.map((item) => item.getAttribute('fill'))),
            )
            .toEqual(colorsBefore.slice(2));
        await page.mouse.move(0, 0);
        await expect(chart).toHaveScreenshot('computed-colors-zoom.png');
        const markerBox = await getLocatorBoundingBox(markers.nth(1));
        const plotBox = await getLocatorBoundingBox(
            component.locator('.gcharts-chart__content .gcharts-brush .overlay'),
        );
        await page.mouse.move(markerBox.x + markerBox.width / 2, plotBox.y + plotBox.height / 2);
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toHaveScreenshot('computed-color-tooltip.png');
    });

    test('resized oblique gradient matches a fresh chart at the same size', async ({
        mount,
        page,
    }) => {
        const data: ChartData = {
            xAxis: {type: 'linear', min: 0, max: 2},
            yAxis: [{min: 0, max: 5}],
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Value',
                        marker: {enabled: true},
                        color: {
                            type: 'linear-gradient',
                            angle: 45,
                            stops: [
                                {offset: 0, color: '#000000'},
                                {offset: 1, color: '#ffffff'},
                            ],
                        },
                        data: [1, 4, 2].map((y, x) => ({x, y})),
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{height: 250, width: 600}} />,
        );
        await expect(component.locator('.gcharts-marker__symbol')).toHaveCount(3);
        await component.update(<ChartTestStory data={data} styles={{height: 500, width: 300}} />);
        const chart = component.locator('svg').first();
        await expect(chart).toHaveAttribute('width', '300');
        await page.mouse.move(0, 0);
        await expect(chart).toHaveScreenshot('oblique-resized.png');
        await component.unmount();
        const fresh = await mount(
            <ChartTestStory data={data} styles={{height: 500, width: 300}} />,
        );
        await expect(fresh.locator('svg').first()).toHaveScreenshot('oblique-resized.png');
    });

    test('resize with a selected range matches a fresh range-slider chart', async ({
        mount,
        page,
    }) => {
        const data: ChartData = {
            xAxis: {
                type: 'linear',
                min: 0,
                max: 4,
                rangeSlider: {enabled: true, defaultRange: {size: 2}},
            },
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Value',
                        marker: {enabled: true},
                        color: {
                            type: 'linear-gradient',
                            angle: 45,
                            stops: [
                                {offset: 0, color: '#000000'},
                                {offset: 1, color: '#ffffff'},
                            ],
                        },
                        data: [1, 10000, 2, 3, 4].map((y, x) => ({x, y})),
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{height: 300, width: 800}} />,
        );
        const markers = component.locator('.gcharts-chart__content .gcharts-marker__symbol');
        await expect(markers).toHaveCount(4);
        await component.update(<ChartTestStory data={data} styles={{height: 500, width: 400}} />);
        await expect(component.locator('svg').first()).toHaveAttribute('width', '400');
        // Take a stable screenshot to wait for asynchronous geometry preparation after resize.
        await page.mouse.move(0, 0);
        await expect(component.locator('svg').first()).toHaveScreenshot(
            'selected-range-resized.png',
        );
        const colorsAfterResize = await markers.evaluateAll((items) =>
            items.map((item) => getComputedStyle(item).fill),
        );
        await component.unmount();
        const fresh = await mount(
            <ChartTestStory data={data} styles={{height: 500, width: 400}} />,
        );
        const freshMarkers = fresh.locator('.gcharts-chart__content .gcharts-marker__symbol');
        await expect(freshMarkers).toHaveCount(4);
        await expect
            .poll(() =>
                freshMarkers.evaluateAll((items) =>
                    items.map((item) => getComputedStyle(item).fill),
                ),
            )
            .toEqual(colorsAfterResize);
        await expect(fresh.locator('svg').first()).toHaveScreenshot('selected-range-resized.png');
    });

    for (const type of ['line', 'area', 'area-range'] as const) {
        test(`${type}: selecting C–E preserves the gradient colors`, async ({mount, page}) => {
            const component = await mount(
                <ChartTestStory data={getData(type)} styles={{height: 400, width: 800}} />,
            );
            const chart = component.locator('svg').first();
            await expect(chart).toHaveScreenshot(`${type}-before-zoom.png`);

            await dragElementByCalculatedPosition({
                component,
                page,
                selector: '.gcharts-chart__content .gcharts-brush .overlay',
                getDragOptions: ({boundingBox}) => {
                    const y = boundingBox.y + boundingBox.height / 2;
                    return {
                        from: [boundingBox.x + boundingBox.width * 0.45, y],
                        to: [boundingBox.x + boundingBox.width * 0.99, y],
                    };
                },
            });
            await expect(component.locator('.gcharts-chart__reset-zoom-button')).toBeVisible();
            await page.mouse.move(0, 0);
            await expect(chart.locator('.gcharts-marker__symbol')).toHaveCount(
                type === 'area-range' ? 6 : 3,
            );
            await expect(chart).toHaveScreenshot(`${type}-zoom-c-e.png`);

            await component.locator('.gcharts-chart__reset-zoom-button').click();
            await expect(component.locator('.gcharts-chart__reset-zoom-button')).toHaveCount(0);
            await page.mouse.move(0, 0);
            await expect(chart).toHaveScreenshot(`${type}-before-zoom.png`);
        });
    }
});
