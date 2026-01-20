import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import {median} from 'd3';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    barYBasicData,
    barYContinuousLegendData,
    barYGroupedColumnsData,
    barYNullModeSkipCategoryYData,
    barYNullModeSkipLinearXData,
    barYNullModeZeroCategoryYData,
    barYNullModeZeroLinearXData,
    barYPlotLinesData,
    barYStakingNormalData,
} from '../__stories__/__data__';
import type {BarYSeries, BarYSeriesData, ChartData, ChartMargin} from '../types';

const CHART_MARGIN: ChartMargin = {
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
};

test.describe('Bar-y series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Basic with reverse order on Y-axis (categories)', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [
                            {y: 0, x: 10},
                            {y: 1, x: 5},
                        ],
                    },
                ],
            },
            yAxis: [
                {
                    categories: ['1', '2'],
                    type: 'category',
                    order: 'reverse',
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Basic with reverse order on Y-axis (linear)', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [
                            {y: 1, x: 10},
                            {y: 2, x: 5},
                        ],
                    },
                ],
            },
            yAxis: [
                {
                    order: 'reverse',
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Basic with reverse order on X-axis', async ({mount}) => {
        const component = await mount(
            <ChartTestStory
                data={{
                    ...barYBasicData,
                    xAxis: {
                        ...barYBasicData.xAxis,
                        order: 'reverse',
                    },
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Basic with reverse order on X-axis and maxPadding', async ({mount}) => {
        const component = await mount(
            <ChartTestStory
                data={{
                    ...barYBasicData,
                    xAxis: {
                        ...barYBasicData.xAxis,
                        order: 'reverse',
                        maxPadding: 0.5,
                    },
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With X-axis plot lines', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYPlotLinesData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y-axis datetime', async ({mount}) => {
        const data: ChartData = {
            chart: {
                margin: CHART_MARGIN,
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [
                            {y: 1704067200000, x: 100},
                            {y: 1706745600000, x: 150},
                            {y: 1709251200000, x: 50},
                            {y: 1711929600000, x: 200},
                            {y: 1714521600000, x: 75},
                            {y: 1717200000000, x: 125},
                        ],
                    },
                ],
            },
            xAxis: {
                labels: {enabled: false},
            },
            yAxis: [
                {
                    type: 'datetime',
                    labels: {enabled: false},
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y-axis linear', async ({mount}) => {
        const data: ChartData = {
            chart: {
                margin: CHART_MARGIN,
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [
                            {y: 2020, x: 100},
                            {y: 2021, x: 150},
                            {y: 2022, x: 50},
                            {y: 2023, x: 200},
                            {y: 2024, x: 75},
                            {y: 2025, x: 125},
                        ],
                    },
                ],
            },
            xAxis: {
                labels: {enabled: false},
            },
            yAxis: [
                {
                    type: 'linear',
                    labels: {enabled: false},
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y-axis linear - with data holes', async ({mount}) => {
        const data: ChartData = {
            chart: {
                margin: CHART_MARGIN,
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [
                            {y: 1, x: 1},
                            {y: 2, x: 2},
                            {y: 10, x: 10},
                        ],
                    },
                ],
            },
            yAxis: [
                {
                    type: 'linear',
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y-axis linear one data point', async ({mount}) => {
        const data: ChartData = {
            chart: {
                margin: CHART_MARGIN,
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [{y: 2020, x: 100}],
                    },
                ],
            },
            xAxis: {
                labels: {enabled: false},
            },
            yAxis: [
                {
                    type: 'linear',
                    labels: {enabled: false},
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y-axis linear non-stacked series', async ({mount}) => {
        const data: ChartData = {
            chart: {
                margin: CHART_MARGIN,
            },
            legend: {
                enabled: false,
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [
                            {y: 2020, x: 100},
                            {y: 2021, x: 150},
                            {y: 2022, x: 50},
                            {y: 2023, x: 200},
                            {y: 2024, x: 75},
                            {y: 2025, x: 125},
                        ],
                    },
                    {
                        type: 'bar-y',
                        name: 'Series 2',
                        data: [
                            {y: 2020, x: 25},
                            {y: 2021, x: 175},
                            {y: 2022, x: 50},
                            {y: 2023, x: 15},
                            {y: 2024, x: 125},
                            {y: 2025, x: 100},
                        ],
                    },
                ],
            },
            xAxis: {
                labels: {enabled: false},
            },
            yAxis: [
                {
                    type: 'linear',
                    labels: {enabled: false},
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y-axis linear normal-stacked series', async ({mount}) => {
        const data: ChartData = {
            chart: {
                margin: CHART_MARGIN,
            },
            legend: {
                enabled: false,
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        stacking: 'normal',
                        data: [
                            {y: 2020, x: 100},
                            {y: 2021, x: 150},
                            {y: 2022, x: 50},
                            {y: 2023, x: 200},
                            {y: 2024, x: 75},
                            {y: 2025, x: 125},
                        ],
                    },
                    {
                        type: 'bar-y',
                        name: 'Series 2',
                        stacking: 'normal',
                        data: [
                            {y: 2020, x: 25},
                            {y: 2021, x: 175},
                            {y: 2022, x: 50},
                            {y: 2023, x: 15},
                            {y: 2024, x: 125},
                            {y: 2025, x: 100},
                        ],
                    },
                ],
            },
            xAxis: {
                labels: {enabled: false},
            },
            yAxis: [
                {
                    type: 'linear',
                    labels: {enabled: false},
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y-axis linear normal-stacked & non-stacked series', async ({mount}) => {
        const data: ChartData = {
            chart: {
                margin: CHART_MARGIN,
            },
            legend: {
                enabled: false,
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        stacking: 'normal',
                        data: [
                            {y: 2020, x: 100},
                            {y: 2021, x: 150},
                            {y: 2022, x: 50},
                            {y: 2023, x: 200},
                            {y: 2024, x: 75},
                            {y: 2025, x: 125},
                        ],
                    },
                    {
                        type: 'bar-y',
                        name: 'Series 2',
                        stacking: 'normal',
                        data: [
                            {y: 2020, x: 25},
                            {y: 2021, x: 175},
                            {y: 2022, x: 50},
                            {y: 2023, x: 15},
                            {y: 2024, x: 125},
                            {y: 2025, x: 100},
                        ],
                    },
                    {
                        type: 'bar-y',
                        name: 'Series 3',
                        data: [
                            {y: 2020, x: 50},
                            {y: 2021, x: 100},
                            {y: 2022, x: 50},
                            {y: 2023, x: 75},
                            {y: 2024, x: 150},
                            {y: 2025, x: 125},
                        ],
                    },
                ],
            },
            xAxis: {
                labels: {enabled: false},
            },
            yAxis: [
                {
                    type: 'linear',
                    labels: {enabled: false},
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y-axis linear percent-stacked series', async ({mount}) => {
        const data: ChartData = {
            chart: {
                margin: CHART_MARGIN,
            },
            legend: {
                enabled: false,
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        stacking: 'percent',
                        data: [
                            {y: 2020, x: 100},
                            {y: 2021, x: 150},
                            {y: 2022, x: 50},
                            {y: 2023, x: 200},
                            {y: 2024, x: 75},
                            {y: 2025, x: 125},
                        ],
                    },
                    {
                        type: 'bar-y',
                        name: 'Series 2',
                        stacking: 'percent',
                        data: [
                            {y: 2020, x: 25},
                            {y: 2021, x: 175},
                            {y: 2022, x: 50},
                            {y: 2023, x: 15},
                            {y: 2024, x: 125},
                            {y: 2025, x: 100},
                        ],
                    },
                ],
            },
            yAxis: [
                {
                    type: 'linear',
                    labels: {enabled: false},
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y-axis linear with stackId & non-stacked series', async ({mount}) => {
        const data: ChartData = {
            chart: {
                margin: CHART_MARGIN,
            },
            legend: {
                enabled: false,
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        stackId: '1',
                        data: [
                            {y: 2020, x: 100},
                            {y: 2021, x: 150},
                            {y: 2022, x: 50},
                            {y: 2023, x: 200},
                            {y: 2024, x: 75},
                            {y: 2025, x: 125},
                        ],
                    },
                    {
                        type: 'bar-y',
                        name: 'Series 2',
                        stackId: '1',
                        data: [
                            {y: 2020, x: 25},
                            {y: 2021, x: 175},
                            {y: 2022, x: 50},
                            {y: 2023, x: 15},
                            {y: 2024, x: 125},
                            {y: 2025, x: 100},
                        ],
                    },
                    {
                        type: 'bar-y',
                        name: 'Series 3',
                        data: [
                            {y: 2020, x: 50},
                            {y: 2021, x: 100},
                            {y: 2022, x: 50},
                            {y: 2023, x: 75},
                            {y: 2024, x: 150},
                            {y: 2025, x: 125},
                        ],
                    },
                ],
            },
            xAxis: {
                labels: {enabled: false},
            },
            yAxis: [
                {
                    type: 'linear',
                    labels: {enabled: false},
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Performance', async ({mount}) => {
        test.setTimeout(120_000);

        const categories = new Array(3000).fill(null).map((_, i) => String(i));
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
                        type: 'bar-y',
                        name: '',
                        data: items,
                        dataLabels: {enabled: true},
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

        await expect(median(widgetRenderTimes)).toBeLessThan(500);
    });

    test('Stacking normal', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYStakingNormalData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking normal with zero y values', async ({mount}) => {
        const stacks = new Array(10).fill(null).map((_, index) => String(index));
        const chartData: ChartData = {
            title: {text: 'Chart title'},
            series: {
                data: stacks.map((stack, index) => {
                    return {
                        name: stack,
                        type: 'bar-y',
                        stacking: 'normal',
                        data: [
                            {
                                y: 0,
                                x: index === stacks.length - 1 ? 10 : 0,
                            },
                        ],
                    };
                }),
            },
            yAxis: [
                {
                    type: 'category',
                    categories: ['Category'],
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking small y values with and without stack gap', async ({mount}) => {
        const smallValuesSeriesData: BarYSeries[] = new Array(100).fill(null).map((_, index) => {
            return {
                name: String(index),
                type: 'bar-y',
                stacking: 'normal',
                data: [
                    {
                        y: 0,
                        x: 0.1,
                    },
                ],
            };
        });
        const chartData: ChartData = {
            series: {
                data: [
                    ...smallValuesSeriesData,
                    {
                        name: 'Series 1',
                        type: 'bar-y',
                        stacking: 'normal',
                        data: [
                            {
                                y: 0,
                                x: 50,
                            },
                        ],
                    },
                    {
                        name: 'Series 2',
                        type: 'bar-y',
                        stacking: 'normal',
                        data: [
                            {
                                y: 0,
                                x: 50,
                            },
                        ],
                    },
                ],

                options: {
                    'bar-y': {
                        stackGap: 2,
                    },
                },
            },
            yAxis: [
                {
                    type: 'category',
                    categories: ['Category'],
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();

        await component.update(
            <ChartTestStory
                data={{
                    ...chartData,
                    series: {
                        ...chartData.series,
                        options: {
                            'bar-y': {
                                stackGap: 0,
                            },
                        },
                    },
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Stacking (percent) small y-values with and without stack gap', async ({mount}) => {
        const smallValuesSeriesData: BarYSeries[] = new Array(100).fill(null).map((_, index) => {
            return {
                name: String(index),
                type: 'bar-y',
                stacking: 'normal',
                data: [
                    {
                        y: 0,
                        x: 0.1,
                    },
                ],
            };
        });
        const chartData: ChartData = {
            series: {
                data: [
                    ...smallValuesSeriesData,
                    {
                        name: 'Series 1',
                        type: 'bar-y',
                        stacking: 'normal',
                        data: [
                            {
                                y: 0,
                                x: 50,
                            },
                        ],
                    },
                    {
                        name: 'Series 2',
                        type: 'bar-y',
                        stacking: 'normal',
                        data: [
                            {
                                y: 0,
                                x: 50,
                            },
                        ],
                    },
                ],

                options: {
                    'bar-y': {
                        stackGap: 2,
                    },
                },
            },
            yAxis: [
                {
                    type: 'category',
                    categories: ['Category'],
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();

        await component.update(
            <ChartTestStory
                data={{
                    ...chartData,
                    series: {
                        ...chartData.series,
                        options: {
                            'bar-y': {
                                stackGap: 0,
                            },
                        },
                    },
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Border should be ignored for dense bars', async ({mount}) => {
        const seriesData: BarYSeriesData[] = new Array(1000).fill(null).map((_, index) => {
            return {
                y: index,
                x: index,
            };
        });
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'bar-y',
                        stacking: 'normal',
                        data: seriesData,
                    },
                ],

                options: {
                    'bar-y': {
                        borderWidth: 1,
                    },
                },
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Data labels', () => {
        const basicSeries: BarYSeries = {
            name: 'Series 1',
            type: 'bar-y',
            data: new Array(100).fill(null).map((_, index) => {
                return {y: index, x: index};
            }),
        };

        test('Svg data labels', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            ...basicSeries,
                            dataLabels: {enabled: true},
                        },
                    ],
                },
                yAxis: [{maxPadding: 0}],
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Html data labels', async ({mount}) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            ...basicSeries,
                            dataLabels: {enabled: true, html: true},
                        },
                    ],
                },
                yAxis: [{maxPadding: 0}],
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Only the necessary free space to the right of the bars is reserved for labels', async ({
            mount,
        }) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: '',
                            type: 'bar-y',
                            dataLabels: {
                                enabled: true,
                            },
                            data: [
                                {
                                    y: 1,
                                    x: 9.999999999,
                                    label: 'A',
                                },
                            ],
                        },
                    ],
                },
                xAxis: {ticks: {interval: '50%'}},
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test('The labels inside should move outward if there is insufficient space', async ({
        mount,
    }) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'bar-y',
                        stacking: 'normal',
                        data: [
                            {y: 1, x: 1, label: 'Data label: 1'},
                            {y: 2, x: 100, label: 'Data label: 100'},
                        ],
                        dataLabels: {enabled: true, inside: true},
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max-category', async ({mount}) => {
        const data = cloneDeep(barYStakingNormalData);
        set(data, 'yAxis[0].min', 5);
        set(data, 'yAxis[0].max', 10);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Tooltip', () => {
        test('Grouped series tooltip', async ({mount}) => {
            const component = await mount(<ChartTestStory data={barYGroupedColumnsData} />);

            const bar = component.locator('.gcharts-bar-y__segment').first();
            await bar.hover();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Series with continuous legend', async ({mount}) => {
            const component = await mount(<ChartTestStory data={barYContinuousLegendData} />);

            const bar = component.locator('.gcharts-bar-y__segment').first();
            await bar.hover();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Сorrect selection of the nearest bar', async ({mount, page}) => {
            const component = await mount(<ChartTestStory data={barYBasicData} />);

            const bar = component.locator('.gcharts-bar-y__segment').last();
            const position = await bar.boundingBox();
            if (position === null) {
                throw Error('bar position is null');
            }
            await page.mouse.move(position.x + 1, position.y + position.height - 1);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Null modes', () => {
        test.describe('Linear X-axis', () => {
            test('nullMode=skip', async ({mount}) => {
                const data = cloneDeep(barYNullModeSkipLinearXData);
                const component = await mount(<ChartTestStory data={data} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('nullMode=zero', async ({mount}) => {
                const data = cloneDeep(barYNullModeZeroLinearXData);
                const component = await mount(<ChartTestStory data={data} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });

        test.describe('Category Y-axis', () => {
            test('nullMode=skip', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={barYNullModeSkipCategoryYData} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('nullMode=zero', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={barYNullModeZeroCategoryYData} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });
    });

    test('negative-values', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        data: [
                            {x: -1, y: 0},
                            {x: -2, y: 1},
                            {x: -3, y: 2},
                        ],
                        type: 'bar-y',
                        stacking: 'normal',
                        name: 'Series 1',
                    },
                ],
            },
            yAxis: [
                {
                    type: 'category',
                    categories: ['Category 1', 'Category 2', 'Category 3'],
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} styles={{width: 600}} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('negative-values-with-border', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        data: [
                            {x: -1, y: 0},
                            {x: -2, y: 1},
                            {x: -3, y: 2},
                        ],
                        type: 'bar-y',
                        stacking: 'normal',
                        name: 'Series 1',
                        borderWidth: 2,
                        borderColor: 'green',
                    },
                ],
            },
            yAxis: [
                {
                    type: 'category',
                    categories: ['Category 1', 'Category 2', 'Category 3'],
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} styles={{width: 600}} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Logarithmic X-axis', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [
                            {y: 0, x: 100},
                            {y: 1, x: 5},
                        ],
                    },
                ],
            },
            xAxis: {type: 'logarithmic'},
            yAxis: [
                {
                    categories: ['A', 'B'],
                    type: 'category',
                },
            ],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
