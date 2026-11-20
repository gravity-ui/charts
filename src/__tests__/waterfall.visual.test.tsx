import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import WaterfallHeaderTooltipExample from '../../docs/examples/src/charts/tooltip/waterfall-header';
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

    test('Only columns that intersect the plot get labels', async ({mount}) => {
        const createData = (placement?: 'auto'): ChartData => ({
            xAxis: {type: 'linear', min: 0, max: 10},
            yAxis: [{min: 0, max: 40}],
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'waterfall',
                        name: 'Customers',
                        dataLabels: {placement, allowOverlap: true},
                        data: [
                            {x: -100, y: 10, label: 'Hidden step'},
                            {x: -50, y: 0, label: 'Hidden zero'},
                            {x: 0, y: -10, label: 'Decrease'},
                            {x: 7, y: 0, label: placement ? 'Adaptive zero' : 'Visible zero'},
                        ],
                    },
                ],
            },
        });

        const component = await mount(<ChartTestStory data={createData()} />);
        const labels = component.locator('.gcharts-waterfall__label');
        await expect(labels).toHaveText(['Decrease', 'Visible zero']);

        await component.update(<ChartTestStory data={createData('auto')} />);
        await expect(labels).toHaveText(['Decrease', 'Adaptive zero']);
    });

    test('Adaptive labels move inside at both value ends and honor the fallback', async ({
        mount,
    }) => {
        const longLabel = 'Additional customers '.repeat(15).trim();
        const createData = (placementFallback?: 'hide'): ChartData => ({
            series: {
                data: [
                    {
                        type: 'waterfall',
                        name: 'Customers',
                        dataLabels: {placement: 'auto', placementFallback, allowOverlap: true},
                        data: [
                            {x: 'Gains', y: 40, label: '&#x41;&#x42;&#x43;&#x44;'},
                            {x: 'Losses', y: -80},
                            {x: 'Total', total: true},
                            {x: 'Additional', y: 10},
                            {x: 'Extended', y: 10, label: longLabel},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['Gains', 'Losses', 'Total', 'Additional', 'Extended'],
            },
            yAxis: [{min: -40, max: 40}],
            legend: {enabled: false},
        });
        const styles = {width: 480, height: 240};
        const component = await mount(<ChartTestStory data={createData()} styles={styles} />);
        const labels = component.locator('.gcharts-waterfall__label');
        const bars = component.locator('.gcharts-waterfall__segment');
        await expect(labels).toHaveText(['ABCD', '-80', '-40', '10', longLabel]);
        for (let index = 0; index < 3; index++) {
            const bar = await getLocatorBoundingBox(bars.nth(index));
            const label = await getLocatorBoundingBox(labels.nth(index));
            const gap = index === 0 ? label.y - bar.y : bar.y + bar.height - label.y - label.height;
            expect(gap).toBeCloseTo(5, 0);
            expect(label.x + label.width / 2).toBeCloseTo(bar.x + bar.width / 2, 0);
        }
        const outside = await getLocatorBoundingBox(labels.nth(3));
        const bar = await getLocatorBoundingBox(bars.nth(3));
        expect(bar.y - outside.y - outside.height).toBeCloseTo(5, 0);

        await component.update(<ChartTestStory data={createData('hide')} styles={styles} />);
        await expect(labels).toHaveText(['ABCD', '-80', '-40', '10']);
    });

    test.describe('Connectors', () => {
        const points: WaterfallSeriesData[] = [
            {x: 'Income', y: 10},
            {x: 'Expense', y: -4},
            {x: 'Total', total: true},
        ];
        const createData = (enabled?: boolean): ChartData => ({
            series: {
                data: [
                    {
                        type: 'waterfall',
                        name: 'Balance',
                        data: points,
                        ...(enabled === undefined ? {} : {connectors: {enabled}}),
                    },
                ],
            },
            xAxis: {type: 'category', categories: points.map((point) => String(point.x))},
        });

        for (const enabled of [undefined, true, false]) {
            test(`enabled = ${String(enabled)}`, async ({mount}) => {
                const component = await mount(<ChartTestStory data={createData(enabled)} />);
                await expect(component.locator('.gcharts-waterfall__segment')).toHaveCount(
                    points.length,
                );
                await expect(component.locator('.gcharts-waterfall__connector')).toHaveCount(
                    enabled === false ? 0 : points.length - 1,
                );
            });
        }

        test('Toggle on chart updates', async ({mount}) => {
            const component = await mount(<ChartTestStory data={createData()} />);
            const connectors = component.locator('.gcharts-waterfall__connector');
            const bars = component.locator('.gcharts-waterfall__segment');
            await expect(connectors).toHaveCount(points.length - 1);

            for (const enabled of [false, true, false, undefined]) {
                await component.update(<ChartTestStory data={createData(enabled)} />);
                await expect(bars).toHaveCount(points.length);
                await expect(connectors).toHaveCount(enabled === false ? 0 : points.length - 1);
                if (enabled !== false) {
                    for (const connector of await connectors.all()) {
                        await expect(connector).toHaveAttribute('d', /.+/);
                    }
                }
            }
        });
    });

    test.describe('Tooltip', () => {
        test('Datetime header in the runnable docs example', async ({mount, page}, testInfo) => {
            const component = await mount(
                <div style={{width: 500, height: 300}}>
                    <WaterfallHeaderTooltipExample />
                </div>,
            );
            await component.locator('.gcharts-waterfall__segment').first().hover();
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip.getByText('01.01.25', {exact: true})).toBeVisible();
            await component.screenshot({path: testInfo.outputPath('waterfall-date-header.png')});
        });

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
            await page.setViewportSize({width: 450, height: 280});
            const component = await mount(<ChartTestStory data={waterfallBasicData} />);

            const svg = component.locator('svg');
            const initialSvgBox = await getLocatorBoundingBox(svg);
            const totalColumn = component.locator('.gcharts-waterfall__segment').last();
            await expect(totalColumn).toBeVisible();
            const totalColumnBox = await getLocatorBoundingBox(totalColumn);
            const pointerX = Math.round(totalColumnBox.x + totalColumnBox.width / 2);
            const pointerY = Math.round(totalColumnBox.y + totalColumnBox.height / 2);
            await page.mouse.move(pointerX, pointerY);

            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip.getByText('2025', {exact: true})).toBeVisible();
            await expect(tooltip.getByRole('row', {name: 'Total 72', exact: true})).toBeVisible();

            for (const scrollY of [0, 8]) {
                await page.evaluate((y) => window.scrollTo(0, y), scrollY);
                await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY);
                await expect
                    .poll(async () => {
                        const box = await tooltip.boundingBox();
                        const svgBox = await getLocatorBoundingBox(svg);
                        const expectedY = pointerY + svgBox.y - initialSvgBox.y;
                        return (
                            box &&
                            Math.max(
                                Math.abs(box.x + box.width - pointerX + 20),
                                Math.abs(box.y + box.height / 2 - expectedY),
                            )
                        );
                    })
                    .toBeLessThanOrEqual(2);
            }
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

    test('Negative subtotals fit the automatic Y domain', async ({mount, page}) => {
        const data: WaterfallSeriesData[] = [
            {x: 'Loss', y: -10},
            {x: 'Negative total', total: true, y: 100},
            {x: 'Income', y: 15},
            {x: 'Positive total', total: true, y: -100},
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
        const waterfall = component.locator('.gcharts-waterfall');
        await expect(waterfall).toHaveAttribute('clip-path', /^url\(#.+\)$/);
        const clipPath = await waterfall.getAttribute('clip-path');
        const clipPathId = clipPath?.match(/^url\(#(.+)\)$/)?.[1];
        const plotBounds = component.locator(`clipPath[id="${clipPathId}"] rect`);
        await expect(plotBounds).toHaveCount(1);
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

        await bars.nth(1).hover();
        await expect(page.locator('.gcharts-tooltip')).toContainText('-10');
    });
});
