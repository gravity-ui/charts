import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import DataLabelsMarkerEdgeExample from '../../docs/examples/src/charts/data-labels/marker-edge';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData, LineSeries} from '../types';

import {getLocatorBoundingBox} from './utils';

const symbols = ['circle', 'square', 'diamond', 'triangle', 'triangle-down'] as const;
const borderWidth = 4;
const directions = ['top', 'bottom', 'left', 'right'] as const;
const axes = {
    legend: {enabled: false},
    tooltip: {enabled: false},
    xAxis: {min: 0, max: 10},
    yAxis: [{min: 0, max: 100}],
};

test.describe('Line marker labels', () => {
    for (const html of [false, true]) {
        test(`marker edge in every direction (${html ? 'HTML' : 'SVG'})`, async ({mount}) => {
            const series: LineSeries[] = symbols.flatMap((symbol, column) =>
                directions.map((direction, row) => ({
                    type: 'line',
                    name: symbol,
                    data: [{x: 1 + column * 2, y: 15 + row * 23, label: direction}],
                    marker: {
                        enabled: true,
                        symbol,
                        radius: 16,
                        borderWidth,
                        borderColor: '#444',
                    },
                    dataLabels: {
                        enabled: true,
                        anchor: 'marker-edge',
                        placement: [direction],
                        padding: 5,
                        html,
                    },
                })),
            );
            const component = await mount(
                <ChartTestStory
                    styles={{width: 850, height: 620}}
                    data={{...axes, series: {data: series}}}
                />,
            );
            const labels = component.locator(
                html ? '.gcharts-chart__html-layer-item' : '.gcharts-line__label',
            );
            const markers = component.locator('.gcharts-marker__symbol');
            await expect(labels).toHaveCount(series.length);
            for (let i = 0; i < series.length; i++) {
                const label = await getLocatorBoundingBox(labels.nth(i));
                const marker = await markers.nth(i).evaluate((element) => {
                    const path = element as SVGGraphicsElement;
                    const box = path.getBBox();
                    const matrix = path.getScreenCTM();
                    if (!matrix) throw new Error('Marker transform is unavailable');
                    const origin = new DOMPoint(box.x, box.y).matrixTransform(matrix);
                    return {x: origin.x, y: origin.y, width: box.width, height: box.height};
                });
                const direction = directions[i % 4];
                const symbol = symbols[Math.floor(i / 4)];
                // Browser path bounds exclude the stroke. Include its mitered corners.
                let stroke = borderWidth / 2;
                if (symbol === 'diamond') stroke *= Math.SQRT2;
                if (symbol === 'triangle' || symbol === 'triangle-down') {
                    if (direction === 'left' || direction === 'right') stroke *= Math.sqrt(3);
                    else if ((symbol === 'triangle') === (direction === 'top'))
                        stroke = borderWidth;
                }
                const gaps = {
                    top: marker.y - label.y - label.height,
                    bottom: label.y - marker.y - marker.height,
                    left: marker.x - label.x - label.width,
                    right: label.x - marker.x - marker.width,
                };
                expect(
                    Math.abs(gaps[direction] - stroke - 5),
                    `${symbol}: ${direction}`,
                ).toBeLessThan(1);
            }
            await expect(component).toHaveScreenshot();
        });
    }

    test('large markers keep the same label gap after a radius update', async ({mount}) => {
        const makeData = (radius: number): ChartData => ({
            ...axes,
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Line',
                        data: [{x: 5, y: 50}],
                        marker: {enabled: true, radius},
                        dataLabels: {enabled: true, anchor: 'marker-edge', padding: 5},
                    },
                ],
            },
        });
        const component = await mount(<ChartTestStory data={makeData(8)} />);
        const labels = component.locator('.gcharts-line__label');
        const marker = component.locator('.gcharts-marker__symbol');
        await expect(labels).toHaveCount(1);
        const smallLabel = await getLocatorBoundingBox(labels);
        const smallMarker = await getLocatorBoundingBox(marker);
        expect(smallMarker.y - smallLabel.y - smallLabel.height).toBeCloseTo(5, 0);
        await expect(component).toHaveScreenshot('marker-edge-radius-8.png');

        await component.update(<ChartTestStory data={makeData(40)} />);
        await expect.poll(async () => (await getLocatorBoundingBox(marker)).width).toBe(80);
        const largeLabel = await getLocatorBoundingBox(labels);
        const largeMarker = await getLocatorBoundingBox(marker);
        expect(largeMarker.y - largeLabel.y - largeLabel.height).toBeCloseTo(5, 0);
        expect(smallLabel.y - largeLabel.y).toBeCloseTo(32, 0);
        await expect(component).toHaveScreenshot('marker-edge-radius-40.png');
    });

    test('default labels stay above normal and hover markers without moving', async ({
        mount,
        page,
    }) => {
        const data: ChartData = {
            ...axes,
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Line',
                        data: [{x: 5, y: 50}],
                        marker: {enabled: true, radius: 30},
                        dataLabels: {enabled: true},
                    },
                ],
                options: {line: {states: {hover: {marker: {radius: 40, borderWidth: 0}}}}},
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        const label = component.locator('.gcharts-line__label');
        await expect(label).toHaveCount(1);
        const before = await getLocatorBoundingBox(label);
        const marker = await getLocatorBoundingBox(component.locator('.gcharts-marker__symbol'));
        expect(before.y).toBeGreaterThan(marker.y);
        expect(before.y + before.height).toBeLessThan(marker.y + marker.height);
        await expect(component).toHaveScreenshot('default-label-above-marker.png');
        await page.mouse.move(marker.x + marker.width / 2, marker.y + marker.height / 2);
        await expect(component.locator('.gcharts-marker__symbol')).toHaveCount(2);
        expect(await getLocatorBoundingBox(label)).toEqual(before);
        await expect(component).toHaveScreenshot('default-label-above-hover-marker.png');
    });

    test('hidden markers use the center, point-enabled markers use their edge, hover is stable', async ({
        mount,
        page,
    }) => {
        const data: ChartData = {
            ...axes,
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Line',
                        data: [
                            {x: 2, y: 50, label: 'A'},
                            {x: 5, y: 50, label: 'B', marker: {states: {normal: {enabled: true}}}},
                            {x: 8, y: 50, label: 'C'},
                        ],
                        marker: {enabled: false, radius: 20},
                        dataLabels: {
                            enabled: true,
                            anchor: 'marker-edge',
                            placement: 'auto',
                            padding: 5,
                        },
                    },
                ],
                options: {line: {states: {hover: {marker: {radius: 35}}}}},
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        const labels = component.locator('.gcharts-line__label');
        await expect(labels).toHaveCount(3);
        const before = await Promise.all(
            ['A', 'B', 'C'].map((text) => getLocatorBoundingBox(labels.filter({hasText: text}))),
        );
        expect(before[0].y - before[1].y).toBeCloseTo(20, 0);
        expect(before[0].y).toBe(before[2].y);
        const marker = await getLocatorBoundingBox(component.locator('.gcharts-marker__symbol'));
        await page.mouse.move(marker.x + marker.width / 2, marker.y + marker.height / 2);
        await expect(component.locator('.gcharts-marker__symbol')).toHaveCount(2);
        expect(await getLocatorBoundingBox(labels.filter({hasText: 'B'}))).toEqual(before[1]);
    });

    test('automatic placement and fallback use marker bounds', async ({mount}) => {
        const line: LineSeries = {
            type: 'line',
            name: 'Line',
            data: [
                {x: 5, y: 25, dataLabels: {enabled: false}},
                {x: 5, y: 50},
                {x: 5, y: 75, dataLabels: {enabled: false}},
            ],
            dataLabels: {enabled: true, anchor: 'marker-edge', placement: 'auto', padding: 5},
        };
        const data: ChartData = {
            ...axes,
            series: {
                data: [line],
                options: {line: {marker: {enabled: true, radius: 20}}},
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        const labels = component.locator('.gcharts-line__label');
        await expect(labels).toHaveCount(1);
        // Top and bottom cross the vertical line, so auto chooses left.
        const label = await getLocatorBoundingBox(labels);
        const marker = await getLocatorBoundingBox(
            component.locator('.gcharts-marker__symbol').nth(1),
        );
        expect(marker.x - label.x - label.width).toBeCloseTo(5, 0);
        const withFallback = (placementFallback: 'hide' | 'show'): ChartData => ({
            ...data,
            series: {
                ...data.series,
                data: [
                    {
                        ...line,
                        dataLabels: {...line.dataLabels, placement: ['top'], placementFallback},
                    },
                ],
            },
        });
        await component.update(<ChartTestStory data={withFallback('hide')} />);
        await expect(labels).toHaveCount(0);
        await component.update(<ChartTestStory data={withFallback('show')} />);
        await expect(labels).toHaveCount(1);
        const fallback = await getLocatorBoundingBox(labels);
        expect(marker.y - fallback.y - fallback.height).toBeCloseTo(5, 0);
    });

    test('marker edge guide example', async ({mount}) => {
        const component = await mount(
            <div style={{width: 600, height: 320}}>
                <DataLabelsMarkerEdgeExample />
            </div>,
        );
        await expect(component.locator('.gcharts-line__label')).toHaveCount(4);
        await expect(component).toHaveScreenshot();
    });
});
