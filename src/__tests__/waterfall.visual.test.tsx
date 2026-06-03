import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {
    waterfallBasicData,
    waterfallNullModeSkipData,
    waterfallNullModeZeroData,
} from 'src/__stories__/__data__';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData, WaterfallSeriesData} from '../types';

import {getLocatorBoundingBox} from './utils';

test.describe('Waterfall series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={waterfallBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Tooltip', () => {
        test('Income column', async ({page, mount}) => {
            page.setViewportSize({width: 450, height: 280});
            const component = await mount(<ChartTestStory data={waterfallBasicData} />);

            const incomeColumn = component.locator('.gcharts-waterfall__segment').nth(1);
            await expect(incomeColumn).toBeVisible();
            const incomeColumnBox = await getLocatorBoundingBox(incomeColumn);
            await page.mouse.move(
                Math.round(incomeColumnBox.x + incomeColumnBox.width / 2),
                Math.round(incomeColumnBox.y + incomeColumnBox.height / 2),
            );

            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip).toHaveScreenshot();
        });

        test('Totals column', async ({page, mount}) => {
            page.setViewportSize({width: 450, height: 280});
            const component = await mount(<ChartTestStory data={waterfallBasicData} />);

            const totalColumn = component.locator('.gcharts-waterfall__segment').last();
            await expect(totalColumn).toBeVisible();
            const totalColumnBox = await getLocatorBoundingBox(totalColumn);
            await page.mouse.move(
                Math.round(totalColumnBox.x + totalColumnBox.width / 2),
                Math.round(totalColumnBox.y + totalColumnBox.height / 2),
            );

            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Overrided tooltip.rows.cells', async ({page, mount}) => {
            page.setViewportSize({width: 450, height: 280});
            const data = [
                {y: 97, x: '2024'},
                {y: 10, x: 'revenue', custom: {icon: '💵'}},
                {y: -20, x: 'fixed costs', custom: {icon: '💸'}},
                {y: -15, x: 'cost price'},
                {total: true, x: '2025'},
            ];

            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            type: 'waterfall',
                            data,
                            name: 'Profit',
                            legend: {
                                itemText: {
                                    positive: 'income',
                                    negative: 'outcome',
                                    totals: 'totals',
                                },
                            },
                            // It is not necessary to put it in the custom so - you can simply define the value/formatting in the method.
                            // But playwright doesn't work well with serializing a function to pass to a component.
                            custom: {subtotalsIcon: '🧮', subtotalsLabel: 'Subtotal'},
                        },
                    ],
                },
                xAxis: {
                    type: 'category',
                    categories: data.map((d) => d.x),
                    labels: {autoRotation: false},
                },
                legend: {enabled: true},
                tooltip: {
                    rows: [
                        {
                            cells: [
                                {
                                    id: 'icon',
                                    source: 'data.custom.icon',
                                    width: '16px',
                                },
                                {
                                    id: 'name',
                                    source: 'series.name',
                                    align: 'start',
                                },
                                {
                                    id: 'value',
                                    source: 'data.y',
                                },
                            ],
                        },
                        {
                            cells: [
                                {
                                    id: 'icon',
                                    source: 'series.custom.subtotalsIcon',
                                },
                                {
                                    id: 'name',
                                    source: 'series.custom.subtotalsLabel',
                                    align: 'start',
                                },
                                {
                                    id: 'value',
                                    source: 'subTotal',
                                },
                            ],
                        },
                    ],
                },
            };

            const component = await mount(<ChartTestStory data={chartData} />);

            const incomeColumn = component.locator('.gcharts-waterfall__segment').nth(1);
            await expect(incomeColumn).toBeVisible();
            const incomeColumnBox = await getLocatorBoundingBox(incomeColumn);
            await page.mouse.move(
                Math.round(incomeColumnBox.x + incomeColumnBox.width / 2),
                Math.round(incomeColumnBox.y + incomeColumnBox.height / 2),
            );

            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip).toHaveScreenshot();
        });
    });

    test('nullMode=skip', async ({mount}) => {
        const component = await mount(<ChartTestStory data={waterfallNullModeSkipData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('nullMode=zero', async ({mount}) => {
        const component = await mount(<ChartTestStory data={waterfallNullModeZeroData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With multiple total columns', async ({mount}) => {
        const dataWithTotals: WaterfallSeriesData[] = [
            {x: 'A', y: 10},
            {x: 'Total1', y: 0, total: true},
            {x: 'D', y: 25},
            {x: 'Total2', y: 0, total: true},
        ];

        const waterfallDataWithTotals: ChartData = {
            series: {
                data: [
                    {
                        type: 'waterfall',
                        name: 'Series',
                        data: dataWithTotals,
                        nullMode: 'skip',
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: dataWithTotals.map((d) => d.x) as string[],
            },
        };

        const component = await mount(<ChartTestStory data={waterfallDataWithTotals} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
