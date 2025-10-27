import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    barYBasicData,
    barYContinuousLegendData,
    barYGroupedColumnsData,
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

    test('Grouped series tooltip', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYGroupedColumnsData} />);

        const bar = component.locator('.gcharts-bar-y__segment').first();
        await bar.hover();
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Tooltip for series with continuous legend', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barYContinuousLegendData} />);

        const bar = component.locator('.gcharts-bar-y__segment').first();
        await bar.hover();
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Performance', async ({mount}) => {
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
        await expect.poll(() => widgetRenderTime).toBeLessThan(900);
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

    test('With x null values', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        data: [{y: 0, x: 1}],
                        name: '2022',
                        stacking: 'normal',
                        type: 'bar-y',
                    },
                    {
                        data: [{y: 0, x: 2}],
                        name: '2023',
                        stacking: 'normal',
                        type: 'bar-y',
                    },
                    {
                        // TODO: https://github.com/gravity-ui/charts/issues/28
                        // @ts-expect-error
                        data: [{y: 0, x: null}],
                        name: '2024',
                        stacking: 'normal',
                        type: 'bar-y',
                    },
                ],
            },
            yAxis: [
                {
                    type: 'category',
                    categories: ['Category with null values'],
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
        const legendItem = component.getByText('2024');
        await legendItem.click();
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With svg data labels', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'bar-y',
                        stacking: 'normal',
                        data: new Array(100).fill(null).map((_, index) => {
                            return {y: index, x: index};
                        }),
                        dataLabels: {enabled: true},
                    },
                ],
            },
            yAxis: [{maxPadding: 0}],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With html data labels', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'bar-y',
                        stacking: 'normal',
                        data: new Array(100).fill(null).map((_, index) => {
                            return {y: index, x: index};
                        }),
                        dataLabels: {enabled: true, html: true},
                    },
                ],
            },
            yAxis: [{maxPadding: 0}],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
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
});
