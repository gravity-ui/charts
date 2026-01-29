import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    lineBasicData,
    lineNullModeConnectLinearXData,
    lineNullModeSkipLinearXData,
    lineNullModeZeroLinearXData,
    lineTwoYAxisData,
} from '../__stories__/__data__';
import type {ChartData} from '../types';

test.describe('Line series', () => {
    test.beforeEach(async ({page}) => {
        // Cancel test with error when an uncaught exception happens within the page
        page.on('pageerror', (exception) => {
            throw exception;
        });
    });

    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Datetime axis with yearly data', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Profit',
                        type: 'line',
                        color: '#4DA2F1',
                        nullMode: 'skip',
                        data: [
                            {
                                y: 48702,
                                x: 1388534400000,
                            },
                            {
                                y: 60715,
                                x: 1420070400000,
                            },
                            {
                                y: 80660,
                                x: 1451606400000,
                            },
                            {
                                y: 91993,
                                x: 1483228800000,
                            },
                        ],
                        dataLabels: {
                            enabled: false,
                            html: false,
                        },
                        legend: {
                            symbol: {
                                width: 36,
                            },
                            groupId: 'Profit',
                            itemText: 'Profit',
                        },
                        dashStyle: 'Solid',
                        yAxis: 0,
                    },
                ],
            },
            xAxis: {
                type: 'datetime',
                grid: {
                    enabled: true,
                },
                ticks: {
                    pixelInterval: 200,
                },
            },
            yAxis: [
                {
                    type: 'linear',
                    visible: true,
                    grid: {
                        enabled: true,
                    },
                    ticks: {
                        pixelInterval: 72,
                    },
                },
            ],
        };
        const component = await mount(
            <ChartTestStory data={chartData} styles={{width: 1000, height: 600}} />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Logarithmic Y axis', async ({mount}) => {
        const data: ChartData = {
            yAxis: [
                {
                    type: 'logarithmic',
                },
            ],
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Line series',
                        data: [
                            {x: 10, y: 10},
                            {x: 20, y: 50},
                            {x: 30, y: 90},
                        ],
                    },
                ],
            },
        };

        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('The second Y-axis', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineTwoYAxisData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Vertical line tooltip', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Line series',
                        data: [
                            {x: 10, y: 10},
                            {x: 10, y: 50},
                        ],
                    },
                ],
            },
        };

        const component = await mount(<ChartTestStory data={data} />);
        const line = component.locator('.gcharts-line');
        await line.hover({force: true, position: {x: 0, y: 0}});
        await expect(component.locator('svg')).toHaveScreenshot();
        const boundingBox = await line.boundingBox();
        // 20 - reserved space for point with marker
        const y = typeof boundingBox?.height === 'number' ? boundingBox.height - 20 : 0;
        await line.hover({force: true, position: {x: 0, y}});
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('x null values, nullMode=connect', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineNullModeConnectLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('x null values, nullMode=skip', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineNullModeSkipLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('x null values, nullMode=zero', async ({mount}) => {
        const component = await mount(<ChartTestStory data={lineNullModeZeroLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Single point (with marker enabled)', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'line',
                        data: [{y: 10, x: 10, marker: {states: {normal: {enabled: true}}}}],
                    },
                ],
            },
            yAxis: [{maxPadding: 0}],
            xAxis: {maxPadding: 0},
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Data labels', () => {
        test('Positioning of extreme point dataLabels', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: '',
                            type: 'line',
                            data: [
                                {x: 0, y: 0, label: 'left-bottom'},
                                {y: 10, x: 0, label: 'left-top'},
                                {y: 10, x: 10, label: 'right-top'},
                                {y: 0, x: 10, label: 'right-bottom'},
                            ],
                            dataLabels: {enabled: true},
                        },
                    ],
                },
                yAxis: [{maxPadding: 0}],
                xAxis: {maxPadding: 0},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Labels with escaped characters', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: '',
                            type: 'line',
                            data: [{x: 10, y: 10, label: '&gt;*'}],
                            dataLabels: {enabled: true},
                        },
                    ],
                },
                yAxis: [{maxPadding: 0}],
                xAxis: {maxPadding: 0},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test('Basic split', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 1, y: 1},
                            {x: 2, y: 2},
                        ],
                        yAxis: 0,
                    },
                    {
                        type: 'line',
                        name: 'Series 2',
                        data: [
                            {x: 2, y: 1},
                            {x: 1, y: 2},
                        ],
                        yAxis: 1,
                    },
                ],
            },
            yAxis: [{plotIndex: 0}, {plotIndex: 1}],
            split: {
                enable: true,
                plots: [{}, {}],
                gap: 20,
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Should redifine line styles for range slider', async ({mount}) => {
        const chartData: ChartData = {
            chart: {
                margin: {
                    left: 10,
                    right: 10,
                    bottom: 10,
                    top: 10,
                },
            },
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series',
                        lineWidth: 3,
                        data: [
                            {x: 0, y: 10},
                            {x: 1, y: 15},
                            {x: 2, y: 12},
                        ],
                        rangeSlider: {
                            lineWidth: 1,
                        },
                    },
                ],
            },
            xAxis: {
                labels: {
                    enabled: false,
                },
                rangeSlider: {
                    enabled: true,
                },
            },
            yAxis: [
                {
                    labels: {
                        enabled: false,
                    },
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Linejoin settings', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Round',
                        type: 'line',
                        data: [
                            {x: 0, y: 0},
                            {x: 0, y: 5},
                            {x: 5, y: 5},
                        ],
                        lineWidth: 10,
                        linejoin: 'round',
                    },
                    {
                        name: 'Bevel',
                        type: 'line',
                        data: [
                            {x: 2, y: 2},
                            {x: 2, y: 7},
                            {x: 7, y: 7},
                        ],
                        lineWidth: 10,
                        linejoin: 'bevel',
                    },
                    {
                        name: 'Miter',
                        type: 'line',
                        data: [
                            {x: 4, y: 4},
                            {x: 4, y: 9},
                            {x: 9, y: 9},
                        ],
                        lineWidth: 10,
                        linejoin: 'miter',
                    },
                    {
                        name: 'Unset',
                        type: 'line',
                        data: [
                            {x: 6, y: 6},
                            {x: 6, y: 11},
                            {x: 11, y: 11},
                        ],
                        lineWidth: 10,
                        linejoin: 'unset',
                    },
                ],
            },
            yAxis: [{min: -1, max: 12, visible: false}],
            xAxis: {min: -1, max: 12, visible: false},
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
