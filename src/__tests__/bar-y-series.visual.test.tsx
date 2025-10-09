import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    barYBasicData,
    barYContinuousLegendData,
    barYGroupedColumnsData,
    barYPlotLinesData,
} from '../__stories__/__data__';
import type {ChartData, ChartMargin} from '../types';

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

    test('Basic with reverse order on Y-axis', async ({mount}) => {
        const component = await mount(
            <ChartTestStory
                data={{
                    ...barYBasicData,
                    yAxis: [
                        {
                            ...barYBasicData.yAxis?.[0],
                            order: 'reverse',
                        },
                    ],
                }}
            />,
        );
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
});
