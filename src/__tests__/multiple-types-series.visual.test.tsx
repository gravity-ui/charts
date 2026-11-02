import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Page} from '@playwright/test';
import cloneDeep from 'es-toolkit/compat/cloneDeep';
import set from 'es-toolkit/compat/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {otherLineAndBarData} from '../__stories__/__data__/other/line-and-bar';
import type {ChartData} from '../types';

import {ActiveSeriesTestStory} from './components/ActiveSeriesTestStory';
import {getLocatorBoundingBox} from './utils';

test.describe('Multiple types of series on same chart', () => {
    test.beforeEach(async ({page}) => {
        // Cancel test with error when an uncaught exception happens within the page
        page.on('pageerror', (exception) => {
            throw exception;
        });
    });

    test('The series should be placed in the DOM in the same order as they are in the chart config', async ({
        mount,
    }) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'area',
                        name: '1. Area',
                        data: [
                            {x: 0, y: 0},
                            {x: 2, y: 15},
                        ],
                    },
                    {
                        type: 'bar-x',
                        name: '2. Bar-x',
                        data: [{x: 1, y: 10}],
                    },
                    {
                        type: 'line',
                        name: '3. Line',
                        data: [
                            {x: 0, y: 10},
                            {x: 2, y: 0},
                        ],
                    },
                ],
            },
            yAxis: [{maxPadding: 0, visible: false}],
            xAxis: {
                type: 'category',
                categories: ['a', 'b', 'c'],
                maxPadding: 0,
                grid: {enabled: false},
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Line series should be placed after bar series', async ({mount}) => {
        const data = cloneDeep(otherLineAndBarData);
        set(data, 'series.data[0].dataLabels.enabled', true);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    const crossSeriesLabelCases = [
        {s1: 'bar-x' as const, s2: 'line' as const},
        {s1: 'bar-x' as const, s2: 'area' as const},
        {s1: 'line' as const, s2: 'area' as const},
    ];

    test('SVG and HTML point labels respect overlap in either layer order', async ({mount}) => {
        for (const allowOverlap of [false, true]) {
            for (const reverse of [false, true]) {
                const data: ChartData = {
                    legend: {enabled: false},
                    xAxis: {min: 0, max: 2},
                    yAxis: [{min: 0, max: 100}],
                    series: {
                        data: [
                            {
                                type: 'line',
                                name: 'Line',
                                data: [{x: 1, y: 30, label: 'line label'}],
                                dataLabels: {enabled: true, html: true, allowOverlap, padding: 5},
                            },
                            {
                                type: 'bar-x',
                                name: 'Bar',
                                data: [{x: 1, y: 30, label: 'bar label'}],
                                dataLabels: {enabled: true, allowOverlap, padding: 5},
                            },
                        ],
                    },
                };
                if (reverse) data.series.data.reverse();
                const component = await mount(<ChartTestStory data={data} />);
                const labels = component
                    .getByText('line label', {exact: true})
                    .or(component.getByText('bar label', {exact: true}));
                await expect(labels).toHaveCount(allowOverlap ? 2 : 1);
                if (allowOverlap) {
                    const boxes = await labels.evaluateAll((elements) =>
                        elements.map((element) => {
                            const {left, right, top, bottom} = element.getBoundingClientRect();
                            return {left, right, top, bottom};
                        }),
                    );
                    expect(Math.min(boxes[0].right, boxes[1].right)).toBeGreaterThan(
                        Math.max(boxes[0].left, boxes[1].left),
                    );
                    expect(Math.min(boxes[0].bottom, boxes[1].bottom)).toBeGreaterThan(
                        Math.max(boxes[0].top, boxes[1].top),
                    );
                }
                await component.unmount();
            }
        }
    });

    for (const {s1, s2} of crossSeriesLabelCases) {
        for (const allowOverlap of [true, false]) {
            test(`${s1} + ${s2} cross-series labels, allowOverlap: ${allowOverlap}`, async ({
                mount,
            }) => {
                const chartData: ChartData = {
                    series: {
                        data: [
                            {
                                type: s1,
                                name: s1,
                                data: [
                                    {x: 0, y: 50},
                                    {x: 1, y: 60},
                                    {x: 2, y: 70},
                                ],
                                dataLabels: {
                                    enabled: true,
                                    allowOverlap,
                                    style: {fontColor: '#cc3300'},
                                },
                            },
                            {
                                type: s2,
                                name: s2,
                                data: [
                                    {x: 0, y: 52},
                                    {x: 1, y: 62},
                                    {x: 2, y: 72},
                                ],
                                dataLabels: {
                                    enabled: true,
                                    allowOverlap,
                                    style: {fontColor: '#0055cc'},
                                },
                            },
                        ],
                    },
                    xAxis: {
                        type: 'category',
                        categories: ['a', 'b', 'c'],
                    },
                    yAxis: [{min: 0, max: 80}],
                };
                const component = await mount(<ChartTestStory data={chartData} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        }
    }

    for (const {s1, s2} of crossSeriesLabelCases) {
        test(`${s1} + ${s2} cross-series labels, mixed allowOverlap (s1: true, s2: false)`, async ({
            mount,
        }) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            type: s1,
                            name: s1,
                            data: [
                                {x: 0, y: 50},
                                {x: 1, y: 60},
                                {x: 2, y: 70},
                            ],
                            dataLabels: {
                                enabled: true,
                                allowOverlap: true,
                                style: {fontColor: '#cc3300'},
                            },
                        },
                        {
                            type: s2,
                            name: s2,
                            data: [
                                {x: 0, y: 52},
                                {x: 1, y: 62},
                                {x: 2, y: 72},
                            ],
                            dataLabels: {
                                enabled: true,
                                allowOverlap: false,
                                style: {fontColor: '#0055cc'},
                            },
                        },
                    ],
                },
                xAxis: {
                    type: 'category',
                    categories: ['a', 'b', 'c'],
                },
                yAxis: [{min: 0, max: 80}],
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    }

    test('The series should be placed in the DOM in the same order as they are in the chart config (line on top of area)', async ({
        mount,
    }) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: '01. Line',
                        data: [
                            {x: 0, y: 5},
                            {x: 10, y: 5},
                        ],
                    },
                    {
                        type: 'area',
                        name: '02. Area',
                        data: [
                            {x: 0, y: 0},
                            {x: 10, y: 10},
                        ],
                    },
                    {
                        type: 'line',
                        name: '03. Line',
                        data: [
                            {x: 0, y: 10},
                            {x: 10, y: 0},
                        ],
                        dataLabels: {enabled: true},
                    },
                ],
                options: {
                    line: {
                        lineWidth: 2,
                    },
                },
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});

test.describe('Active series in mixed charts', () => {
    const data: ChartData = {
        chart: {margin: {left: 50, right: 20, top: 20, bottom: 40}},
        xAxis: {type: 'linear', min: 0, max: 9, startOnTick: false, endOnTick: false},
        yAxis: [{type: 'linear', min: 0, max: 7, startOnTick: false, endOnTick: false}],
        legend: {enabled: false},
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Summary',
                    lineWidth: 3,
                    marker: {enabled: false},
                    data: [
                        {x: 0, y: 1},
                        {x: 9, y: 1},
                    ],
                },
                {
                    type: 'scatter',
                    name: 'Tasks',
                    cluster: {
                        enabled: true,
                        layoutAlgorithm: {type: 'grid', gridSize: 50},
                        minimumClusterSize: 2,
                        marker: {radius: 10},
                    },
                    data: [
                        {x: 1, y: 6, custom: {id: 'a'}},
                        {x: 1.12, y: 6.08, custom: {id: 'b'}},
                        {x: 8, y: 5, custom: {id: 'c'}},
                    ],
                },
            ],
        },
    };

    test('The line under the pointer wins over a distant scatter cluster', async ({
        mount,
        page,
    }) => {
        const component = await mount(<ActiveSeriesTestStory data={data} />);
        const line = component.locator('.gcharts-line path').first();
        const box = await getLocatorBoundingBox(line);
        const x = Math.round(box.x + box.width / 2);
        const y = Math.round(box.y + box.height / 2);

        await page.mouse.move(x, y);
        await expect(page.locator('[data-qa="hovered-active"]')).toHaveText('Summary');
        await page.mouse.click(x, y);
        await expect(component.locator('[data-qa="clicked-active"]')).toHaveText('Summary');
    });

    test('A hovered scatter cluster wins and keeps its members', async ({mount, page}) => {
        const component = await mount(<ActiveSeriesTestStory data={data} />);
        const cluster = component.locator('.gcharts-scatter__cluster-label').first();
        const box = await getLocatorBoundingBox(cluster);
        const x = Math.round(box.x + box.width / 2);
        const y = Math.round(box.y + box.height / 2);

        await page.mouse.move(x, y);
        await expect(page.locator('[data-qa="hovered-active"]')).toHaveText('Tasks:a,b');
        await page.mouse.click(x, y);
        await expect(component.locator('[data-qa="clicked-active"]')).toHaveText('Tasks:a,b');
    });

    test.describe('Painted contours', () => {
        const axis = {
            type: 'linear' as const,
            min: 0,
            max: 300,
            startOnTick: false,
            endOnTick: false,
            visible: false,
        };
        const base: Omit<ChartData, 'series'> = {
            chart: {margin: {left: 50, right: 50, top: 50, bottom: 50}},
            xAxis: axis,
            yAxis: [axis],
            legend: {enabled: false},
        };
        const scatter: ChartData['series']['data'][number] = {
            type: 'scatter',
            name: 'Scatter',
            symbolType: 'circle',
            data: [],
        };

        /** Hovers and clicks the plot pixel and checks the active series of both. */
        async function expectActive(
            args: {mount: Parameters<Parameters<typeof test>[2]>[0]['mount']; page: Page},
            series: ChartData['series']['data'],
            plot: [number, number],
            expected: string,
        ) {
            const component = await args.mount(
                <ActiveSeriesTestStory
                    data={{...base, series: {data: series}}}
                    styles={{width: 400, height: 400}}
                />,
            );
            const box = await getLocatorBoundingBox(component.locator('svg').first());
            const x = box.x + 50 + plot[0];
            const y = box.y + 50 + plot[1];

            await args.page.mouse.move(x, y);
            await expect(args.page.locator('[data-qa="hovered-active"]')).toHaveText(expected);
            await args.page.mouse.click(x, y);
            await expect(component.locator('[data-qa="clicked-active"]')).toHaveText(expected);
        }

        test('rounded x-range corners are not hits', async ({mount, page}) => {
            await expectActive(
                {mount, page},
                [
                    {...scatter, data: [{x: 101, y: 269, radius: 1}]},
                    {
                        type: 'x-range',
                        name: 'Range',
                        borderRadius: 20,
                        borderWidth: 0,
                        dataLabels: {enabled: false},
                        data: [{x0: 100, x1: 200, y: 150}],
                    },
                ],
                [101, 31],
                'Scatter',
            );
        });

        test('rounded pie corners are not hits', async ({mount, page}) => {
            await expectActive(
                {mount, page},
                [
                    {...scatter, data: [{x: 151, y: 289, radius: 1}]},
                    {
                        type: 'pie',
                        borderRadius: 20,
                        borderWidth: 0,
                        dataLabels: {enabled: false},
                        data: [
                            {name: 'Slice1', value: 1},
                            {name: 'Slice2', value: 1},
                        ],
                    },
                ],
                [151, 11],
                'Scatter',
            );
        });

        test('the line under the pointer wins when the nearest X column belongs to another series', async ({
            mount,
            page,
        }) => {
            await expectActive(
                {mount, page},
                [
                    {
                        type: 'area',
                        name: 'Area',
                        data: [
                            {x: 100, y: 50},
                            {x: 150, y: 50},
                            {x: 200, y: 50},
                        ],
                    },
                    {...scatter, data: [{x: 150, y: 240, radius: 1}]},
                    {
                        type: 'line',
                        name: 'Line',
                        marker: {enabled: false},
                        data: [
                            {x: 0, y: 250},
                            {x: 300, y: 250},
                        ],
                    },
                ],
                [150, 50],
                'Line',
            );
        });

        test('the upper layer wins among lookup series containing the pointer', async ({
            mount,
            page,
        }) => {
            await expectActive(
                {mount, page},
                [
                    {
                        type: 'area',
                        name: 'Area',
                        data: [
                            {x: 0, y: 150},
                            {x: 300, y: 150},
                        ],
                    },
                    {...scatter, data: [{x: 150, y: 100, radius: 3}]},
                    {
                        type: 'line',
                        name: 'Line',
                        lineWidth: 4,
                        marker: {enabled: false},
                        data: [
                            {x: 0, y: 100},
                            {x: 300, y: 100},
                        ],
                    },
                ],
                [150, 201],
                'Line',
            );
        });
    });
});
