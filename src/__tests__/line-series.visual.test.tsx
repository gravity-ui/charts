import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import {median} from 'd3';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    lineBasicData,
    lineNullModeConnectLinearXData,
    lineNullModeSkipLinearXData,
    lineNullModeZeroLinearXData,
    lineTwoYAxisData,
} from '../__stories__/__data__';
import type {ChartData} from '../types';

import {generateSeriesData} from './__data__/utils';

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

        test('An empty string as label value', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: '',
                            type: 'line',
                            data: [
                                {x: 1, y: 1, label: ''},
                                {x: 2, y: 2, label: ''},
                                {x: 3, y: 3},
                            ],
                            dataLabels: {enabled: true},
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Html label position (center by default)', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: '',
                            type: 'line',
                            data: [
                                {x: 1, y: 1, label: '***'},
                                {x: 2, y: 2, label: '***'},
                                {x: 3, y: 3, label: '***'},
                            ],
                            dataLabels: {enabled: true, html: true},
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('An empty string as label value (with defined format)', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: '',
                            type: 'line',
                            data: [
                                {x: 1, y: 1, label: ''},
                                {x: 2, y: 2, label: ''},
                                {x: 3, y: 3},
                            ],
                            dataLabels: {enabled: true, format: {type: 'number'}},
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Labels for out-of-bounds points are hidden when min/max set on axes', async ({
            mount,
        }) => {
            const yValues = [
                12, 18, 9, 25, 31, 22, 14, 28, 35, 20, 16, 40, 33, 27, 19, 38, 29, 44, 36, 42,
            ];
            const chartData: ChartData = {
                series: {
                    data: [
                        generateSeriesData({
                            type: 'line',
                            pointCount: 20,
                            generateY: (_x: number | string, i: number) => yValues[i],
                            overrides: {dataLabels: {enabled: true}},
                        }),
                    ],
                },
                xAxis: {type: 'linear', min: 4, max: 14},
                yAxis: [{min: 15, max: 35}],
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Overlapping html labels should not be displayed (by default)', async ({mount}) => {
            const longLabel = 'On seashore far a green oak towers ...';
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: '',
                            type: 'line',
                            data: [
                                {x: 1, y: 1, label: ''},
                                {x: 1.9, y: 2, label: longLabel},
                                {x: 2.1, y: 2, label: longLabel},
                                {x: 3, y: 3, label: ''},
                            ],
                            dataLabels: {enabled: true, html: true},
                        },
                    ],
                },
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

    test('Equals values with defined min/max', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'line',
                        data: [
                            {x: 1, y: 0.9},
                            {x: 2, y: 0.9},
                        ],
                    },
                ],
            },
            yAxis: [
                {
                    min: 2,
                    max: 3,
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Performance', async ({mount}) => {
        test.setTimeout(120_000);

        const categories = new Array(10000).fill(null).map((_, i) => String(i));
        const items = categories.map((_category, i) => ({
            x: 10 * i,
            y: i,
        }));
        const data: ChartData = {
            yAxis: [
                {
                    type: 'category',
                    categories,
                },
            ],
            series: {
                data: [
                    {
                        type: 'line',
                        name: '',
                        data: items,
                        dataLabels: {enabled: true, format: {type: 'number'}},
                    },
                ],
            },
        };

        const widgetRenderTimes = [];
        for (let i = 0; i < 10; i++) {
            let widgetRenderTime: number | undefined;
            const handleRender = (renderTime?: number) => {
                widgetRenderTime = renderTime;
            };

            const component = await mount(
                <ChartTestStory
                    data={data}
                    styles={{height: 1000, width: 1000}}
                    onRender={handleRender}
                />,
            );
            await component.locator('svg').waitFor({state: 'visible'});
            await expect.poll(() => widgetRenderTime).toBeTruthy();
            widgetRenderTimes.push(widgetRenderTime);

            await component.unmount();
        }

        expect(median(widgetRenderTimes)).toBeLessThan(100);
    });
});
