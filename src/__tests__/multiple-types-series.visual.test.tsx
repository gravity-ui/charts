import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {otherLineAndBarData} from '../__stories__/__data__/other/line-and-bar';
import type {ChartData} from '../types';

test.describe.only('Multiple types of series on same chart', () => {
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
