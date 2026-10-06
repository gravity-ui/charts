import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    waterfallBasicData,
    waterfallNullModeSkipData,
    waterfallNullModeZeroData,
} from '../__stories__/__data__';
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

    test('Connectors with a negative total', async ({mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'waterfall',
                        name: 'Series',
                        data: [
                            {x: 0, y: -10},
                            {x: 1, total: true},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['Loss', 'Total'],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Negative subtotals fit the automatic Y domain', async ({mount}) => {
        const data: WaterfallSeriesData[] = [
            {x: 'Loss', y: -10},
            {x: 'Negative total', total: true},
            {x: 'Income', y: 15},
            {x: 'Positive total', total: true},
            {x: 'Expense', y: -5},
            {x: 'Zero total', total: true},
        ];
        const component = await mount(
            <ChartTestStory
                data={{
                    series: {data: [{type: 'waterfall', name: 'Balance', data}]},
                    xAxis: {type: 'category', categories: data.map((d) => String(d.x))},
                    legend: {enabled: false},
                }}
                styles={{width: 700, height: 300}}
            />,
        );

        const bars = component.locator('.gcharts-waterfall__segment');
        await expect(bars).toHaveCount(data.length);
        const plotBounds = component.locator('clipPath rect').first();
        await expect
            .poll(async () => {
                const plotHeight = Number(await plotBounds.getAttribute('height'));
                return bars.evaluateAll(
                    (elements, height) =>
                        Math.max(
                            0,
                            ...elements.flatMap((element) => {
                                const bounds = (element as SVGGraphicsElement).getBBox();
                                return [-bounds.y, bounds.y + bounds.height - height];
                            }),
                        ),
                    plotHeight,
                );
            })
            .toBeCloseTo(0, 2);

        const connectors = component.locator('.gcharts-waterfall__connector[d]');
        await expect(connectors).toHaveCount(data.length - 1);
        await expect
            .poll(() =>
                connectors.evaluateAll((elements) =>
                    Math.max(
                        ...elements.map(
                            (element) => (element as SVGGraphicsElement).getBBox().height,
                        ),
                    ),
                ),
            )
            .toBeCloseTo(0, 2);
    });
});
