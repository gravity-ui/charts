import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {MultipleYAxesTooltipExample} from '../../docs/examples/src/charts/tooltip/multiple-y-axes';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    areaStakingPercentData,
    barXGroupedColumnsData,
    barXStakingPercentData,
    tooltipOverflowedRowsData,
    tooltipOverflowedRowsHtmlData,
} from '../__stories__/__data__';
import {TIME_UNITS} from '../core/utils/time';
import type {ChartData} from '../types';

import {CrosshairEventsTestStory} from './components/CrosshairEventsTestStory';
import {DrawerChartTestStory} from './components/DrawerChartTestStory';
import {HoveredPlotsTestStory} from './components/HoveredPlotsTestStory';
import {StackingPercentRowRendererTestStory} from './components/StackingPercentRowRendererTestStory';
import {getLocator, getLocatorBoundingBox} from './utils';

test.describe('Tooltip', () => {
    test('Custom renderer reuses default content with multiple Y axes', async ({
        mount,
        page,
    }, testInfo) => {
        const component = await mount(
            <div style={{height: 280, width: 400}}>
                <MultipleYAxesTooltipExample />
            </div>,
        );
        const line = component.locator('.gcharts-line').first();
        await expect(line).toBeVisible();
        const box = await getLocatorBoundingBox(line);
        await page.mouse.move(box.x + 1, box.y + box.height - 1);
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip.getByText('Jan', {exact: true})).toBeVisible();
        await expect(tooltip.getByText('Load', {exact: true})).toBeVisible();
        const total = tooltip.locator('.gcharts-tooltip__content-row_totals');
        await expect(total.getByText('10', {exact: true})).toBeVisible();
        await page.screenshot({path: testInfo.outputPath('multiple-y-axes-tooltip.png')});
    });

    test('Clears stale crosshair after categories shrink', async ({mount, page}) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const data: ChartData = {
            legend: {enabled: false},
            xAxis: {type: 'category', categories: ['A', 'B'], crosshair: {enabled: true}},
            yAxis: [{min: 0, max: 30}],
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series',
                        data: [
                            {x: 0, y: 5},
                            {x: 1, y: 10},
                        ],
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await component.locator('.gcharts-bar-x__segment').last().hover();
        const crosshair = component.locator('[data-crosshair-x-line] path');
        await expect(crosshair).toHaveAttribute('d', /^M[\d.]+,0L[\d.]+,[\d.]+$/);
        await expect(page.locator('.gcharts-tooltip').getByText('10', {exact: true})).toBeVisible();

        await component.update(
            <ChartTestStory
                data={{
                    ...data,
                    xAxis: {...data.xAxis, categories: ['A']},
                    series: {data: [{type: 'bar-x', name: 'Series', data: [{x: 0, y: 20}]}]},
                }}
            />,
        );
        const bar = component.locator('.gcharts-bar-x__segment');
        await expect(bar).toHaveCount(1);
        await expect(bar).toBeVisible();
        await expect(crosshair).toHaveCount(0);
        await bar.hover();
        await expect(crosshair).toHaveAttribute('d', /^M[\d.]+,0L[\d.]+,[\d.]+$/);
        await expect(page.locator('.gcharts-tooltip').getByText('20', {exact: true})).toBeVisible();
        expect(errors).toEqual([]);
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });

    for (const axis of ['x', 'y']) {
        for (const snap of [true, false]) {
            test(`Crosshair allows chart clicks (${axis}, snap=${snap})`, async ({mount, page}) => {
                let pointerMoveCount = 0;
                const data: ChartData = {
                    chart: {
                        events: {
                            pointermove: () => pointerMoveCount++,
                        },
                    },
                    legend: {enabled: false},
                    tooltip: {pin: {enabled: true}},
                    xAxis: {
                        type: 'category',
                        categories: ['A', 'B'],
                        crosshair: {enabled: axis === 'x', snap, width: 8, layerPlacement: 'after'},
                    },
                    yAxis: [
                        {
                            min: 0,
                            max: 30,
                            crosshair: {
                                enabled: axis === 'y',
                                snap,
                                width: 8,
                                layerPlacement: 'after',
                            },
                        },
                    ],
                    series: {
                        data: [
                            {
                                type: 'bar-x',
                                name: 'Series',
                                data: [
                                    {x: 0, y: 5},
                                    {x: 1, y: 10},
                                ],
                            },
                        ],
                    },
                };
                const component = await mount(<CrosshairEventsTestStory data={data} />);
                const bar = component.locator('.gcharts-bar-x__segment').last();
                await expect(bar).toBeVisible();
                const box = await getLocatorBoundingBox(bar);
                const x = Math.round(box.x + box.width / 2);
                const y = Math.round(axis === 'y' && snap ? box.y + 1 : box.y + box.height / 2);
                await page.mouse.move(x, y);
                await expect(component.locator('[data-crosshair] path')).toHaveCount(1);
                await expect.poll(() => pointerMoveCount).toBeGreaterThan(0);
                // A crosshair drawn over the pointer must leave the underlying bar clickable.
                await expect
                    .poll(() =>
                        bar.evaluate(
                            (element, position) =>
                                document.elementFromPoint(position.x, position.y) === element,
                            {x, y},
                        ),
                    )
                    .toBe(true);
                const tooltip = page.locator('.gcharts-tooltip');
                await expect(tooltip.getByText('10', {exact: true})).toBeVisible();
                await page.mouse.click(x, y);
                await expect(component.getByTestId('clicked-point')).toHaveText('1:10');
                await expect(tooltip).toHaveClass(/gcharts-tooltip_pinned/);
                await page.mouse.click(x, y);
                await expect(tooltip).not.toHaveClass(/gcharts-tooltip_pinned/);
            });
        }
    }

    test('Unpins a stale tooltip after data changes', async ({mount, page}) => {
        const data: ChartData = {
            legend: {enabled: false},
            tooltip: {pin: {enabled: true}},
            xAxis: {type: 'category', categories: ['A', 'B']},
            yAxis: [{min: 0, max: 30}],
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series',
                        data: [
                            {x: 0, y: 5},
                            {x: 1, y: 10},
                        ],
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        const bar = component.locator('.gcharts-bar-x__segment').last();
        await bar.hover();
        await bar.click();
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveClass(/gcharts-tooltip_pinned/);

        await component.update(
            <ChartTestStory
                data={{
                    ...data,
                    series: {
                        data: [
                            {
                                type: 'bar-x',
                                name: 'Series',
                                data: [
                                    {x: 0, y: 5},
                                    {x: 1, y: 20},
                                ],
                            },
                        ],
                    },
                }}
            />,
        );
        await expect(tooltip).not.toBeVisible();
        await component.locator('.gcharts-bar-x__segment').first().hover();
        await bar.hover();
        await expect(tooltip.getByText('20', {exact: true})).toBeVisible();
        await expect(tooltip).not.toHaveClass(/gcharts-tooltip_pinned/);
    });

    for (const {name, categories} of [
        {name: 'categories and data are replaced', categories: ['C', 'D']},
        {name: 'data is replaced on unchanged categories', categories: ['A', 'B']},
    ]) {
        test(`Clears stale hover after ${name}`, async ({mount, page}) => {
            const data: ChartData = {
                legend: {enabled: false},
                xAxis: {type: 'category', categories: ['A', 'B']},
                yAxis: [{min: 0, max: 30}],
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series',
                            data: [
                                {x: 0, y: 5},
                                {x: 1, y: 10},
                            ],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            const bar = component.locator('.gcharts-bar-x__segment').nth(1);
            await expect(bar).toBeVisible();
            const position = await getLocatorBoundingBox(bar);
            await page.mouse.move(
                position.x + position.width / 2,
                position.y + position.height / 2,
            );
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip.getByText('B', {exact: true})).toBeVisible();
            await expect(tooltip.getByText('10', {exact: true})).toBeVisible();

            await component.update(
                <ChartTestStory
                    data={{
                        ...data,
                        xAxis: {type: 'category', categories},
                        series: {
                            data: [
                                {
                                    type: 'bar-x',
                                    name: 'Series',
                                    data: [
                                        {x: 0, y: 5},
                                        {x: 1, y: 20},
                                    ],
                                },
                            ],
                        },
                    }}
                />,
            );
            await expect(
                component.locator('svg').getByText(categories[1], {exact: true}),
            ).toBeVisible();
            await expect(tooltip).not.toBeVisible();

            const updatedPosition = await getLocatorBoundingBox(bar);
            await page.mouse.move(
                updatedPosition.x + updatedPosition.width / 2,
                updatedPosition.y + updatedPosition.height / 2,
            );
            await expect(tooltip.getByText(categories[1], {exact: true})).toBeVisible();
            await expect(tooltip.getByText('20', {exact: true})).toBeVisible();
            await expect(tooltip.getByText('10', {exact: true})).not.toBeVisible();
        });
    }

    test('More points row', async ({mount, page}) => {
        await page.setViewportSize({width: 500, height: 280});
        const component = await mount(<ChartTestStory data={tooltipOverflowedRowsData} />);
        const bar = component.locator('.gcharts-bar-y').first();
        const barBox = await getLocatorBoundingBox(bar);
        await page.mouse.move(
            Math.round(barBox.x + barBox.width / 2),
            Math.round(barBox.y + barBox.height / 2),
        );
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
        await page.mouse.click(
            Math.round(barBox.x + barBox.width / 2),
            Math.round(barBox.y + barBox.height / 2),
        );
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });

    test('More points row & totals', async ({mount, page}) => {
        await page.setViewportSize({width: 500, height: 280});
        const data = cloneDeep(tooltipOverflowedRowsData);
        set(data, 'tooltip.totals.enabled', true);
        const component = await mount(<ChartTestStory data={data} />);
        const bar = component.locator('.gcharts-bar-y').first();
        const barBox = await getLocatorBoundingBox(bar);
        await page.mouse.move(
            Math.round(barBox.x + barBox.width / 2),
            Math.round(barBox.y + barBox.height / 2),
        );
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
        await page.mouse.click(
            Math.round(barBox.x + barBox.width / 2),
            Math.round(barBox.y + barBox.height / 2),
        );
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });

    test('More points row with HTML labels', async ({mount, page}) => {
        await page.setViewportSize({width: 500, height: 280});
        const component = await mount(<ChartTestStory data={tooltipOverflowedRowsHtmlData} />);
        const bar = component.locator('.gcharts-bar-y').first();
        const barBox = await getLocatorBoundingBox(bar);
        await page.mouse.move(
            Math.round(barBox.x + barBox.width / 2),
            Math.round(barBox.y + barBox.height / 2),
        );
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
        await page.mouse.click(
            Math.round(barBox.x + barBox.width / 2),
            Math.round(barBox.y + barBox.height / 2),
        );
        await expect(tooltip).toHaveScreenshot();
    });

    test('Default date format', async ({page, mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [
                            {x: 100, y: new Date('2025-10-20').getTime()},
                            {x: 95, y: new Date('2026-10-20').getTime()},
                        ],
                    },
                ],
            },
            yAxis: [{type: 'datetime'}],
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        const bar = component.locator('.gcharts-bar-y').first();
        const position = await getLocatorBoundingBox(bar);
        await page.mouse.move(Math.round(position.x + position.width / 2), 50);
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });

    test('Tooltip header uses tooltip.dateTimeLabelFormats for default datetime header', async ({
        page,
        mount,
    }) => {
        const t0 = new Date('2025-10-20T12:00:00.000Z').getTime();
        const t1 = t0 + TIME_UNITS.day;
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: [
                            {x: t0, y: 10},
                            {x: t1, y: 20},
                        ],
                    },
                ],
            },
            xAxis: {type: 'datetime'},
            tooltip: {
                dateTimeLabelFormats: {
                    day: 'YYYY',
                },
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        const bar = component.locator('.gcharts-bar-x').first();
        const position = await getLocatorBoundingBox(bar);
        await page.mouse.move(
            Math.round(position.x + position.width / 2),
            Math.round(position.y + position.height / 2),
        );
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip.getByText('2025', {exact: true})).toBeVisible();
    });

    test('Hiding specific series from the tooltip', async ({page, mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: [
                            {x: 1, y: 7},
                            {x: 2, y: 30},
                        ],
                        stacking: 'normal',
                    },
                    {
                        type: 'bar-x',
                        name: 'Series 2',
                        data: [
                            {x: 1, y: 3},
                            {x: 2, y: 10},
                        ],
                        stacking: 'normal',
                    },
                    {
                        type: 'line',
                        name: 'Series 3',
                        data: [
                            {x: 1, y: 5},
                            {x: 2, y: 20},
                        ],
                        tooltip: {enabled: false},
                    },
                ],
            },
            tooltip: {
                totals: {
                    enabled: true,
                },
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        const bar = component.locator('.gcharts-bar-x').first();
        const position = await getLocatorBoundingBox(bar);
        await page.mouse.move(Math.round(position.x + position.width / 2), 50);
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
    });

    test('For series of different types, need to choose the only closest value', async ({
        page,
        mount,
    }) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 1, y: 7},
                            {x: 2, y: 30},
                        ],
                    },
                    {
                        type: 'bar-x',
                        name: 'Series 2',
                        data: [
                            {x: 1, y: 3},
                            {x: 2, y: 10},
                        ],
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        const bar = component.locator('.gcharts-bar-x').first();
        const position = await getLocatorBoundingBox(bar);
        await page.mouse.move(Math.round(position.x + position.width / 2), 50);
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
    });

    test('Long category name in header', async ({page, mount}) => {
        const longCategory =
            'Very long category name for testing display in tooltip with ellipsis when overflowed '.repeat(
                2,
            );

        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: [{x: 0, y: 100}],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: [longCategory],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        const bar = component.locator('.gcharts-bar-x').first();
        const position = await getLocatorBoundingBox(bar);
        await page.mouse.move(Math.round(position.x + position.width / 2), 50);
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
    });

    test('Long series name truncation', async ({page, mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Very long series name that should be truncated with ellipsis in tooltip row',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 100},
                            {x: 1, y: 200},
                        ],
                    },
                    {
                        type: 'bar-x',
                        name: 'Short',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 50},
                            {x: 1, y: 150},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['A', 'B'],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        const bar = await getLocator({component, selector: '.gcharts-bar-x'});
        const position = await getLocatorBoundingBox(bar);
        await page.mouse.move(Math.round(position.x + position.width / 2), 50);
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
    });

    test('Plot band custom data in tooltip', async ({page, mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'S',
                        data: [
                            {x: 0, y: 1},
                            {x: 1, y: 2},
                        ],
                    },
                ],
            },
            xAxis: {
                plotBands: [{from: -1, to: 2, custom: 'Test band'}],
            },
        };
        const component = await mount(<HoveredPlotsTestStory data={chartData} />);
        const bandRect = await getLocator({component, selector: '[data-plot-x] rect'});
        await bandRect.hover();
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
    });

    test('Plot line custom data in tooltip', async ({page, mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'S',
                        data: [
                            {x: 0, y: 1},
                            {x: 1, y: 2},
                        ],
                    },
                ],
            },
            xAxis: {
                plotLines: [{value: 0.5, custom: 'Test line'}],
            },
        };
        const component = await mount(<HoveredPlotsTestStory data={chartData} />);
        const plotLine = component.locator('[data-plot-x] path').first();
        await plotLine.waitFor({state: 'attached'});
        await expect(plotLine).toHaveAttribute('d', /^M.+L.+$/);
        const lineBox = await getLocatorBoundingBox(plotLine);
        await page.mouse.move(
            Math.round(lineBox.x + lineBox.width / 2),
            Math.round(lineBox.y + lineBox.height / 2),
        );
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
    });

    test('X-axis plot line hoverThreshold', async ({page, mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'S',
                        data: [
                            {x: 0, y: 1},
                            {x: 1, y: 2},
                        ],
                    },
                ],
            },
            xAxis: {
                plotLines: [{value: 0.5, custom: 'threshold-line'}],
            },
        };
        const component = await mount(<HoveredPlotsTestStory data={chartData} />);
        const line = await getLocator({component, selector: '.gcharts-line'});
        const lineBox = await getLocatorBoundingBox(line);
        const tooltip = page.locator('.gcharts-tooltip');
        // Move cursor far from the plot line — default threshold is too small to reach it
        await page.mouse.move(
            Math.round(lineBox.x + 5),
            Math.round(lineBox.y + lineBox.height / 2),
        );
        await expect(tooltip).not.toBeVisible();
        // Update data with a large hoverThreshold so the line is detected from the edge
        await component.update(
            <HoveredPlotsTestStory
                data={{
                    ...chartData,
                    xAxis: {
                        plotLines: [{value: 0.5, custom: 'threshold-line', hoverThreshold: 500}],
                    },
                }}
            />,
        );
        // Move cursor to the same position again
        await page.mouse.move(
            Math.round(lineBox.x + 5),
            Math.round(lineBox.y + lineBox.height / 2),
        );
        await expect(tooltip.getByText('threshold-line')).toBeVisible();
    });

    test('Y-axis plot line hoverThreshold', async ({page, mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'S',
                        data: [
                            {x: 0, y: 0},
                            {x: 1, y: 2},
                        ],
                    },
                ],
            },
            yAxis: [
                {
                    plotLines: [{value: 1, custom: 'y-threshold-line'}],
                },
            ],
        };
        const component = await mount(<HoveredPlotsTestStory data={chartData} />);
        const line = await getLocator({component, selector: '.gcharts-line'});
        const lineBox = await getLocatorBoundingBox(line);
        const tooltip = page.locator('.gcharts-tooltip');
        // Move cursor near the top edge — far from the horizontal plot line at center
        await page.mouse.move(Math.round(lineBox.x + lineBox.width / 2), Math.round(lineBox.y + 5));
        await expect(tooltip).not.toBeVisible();
        // Update data with a large hoverThreshold so the line is detected from the edge
        await component.update(
            <HoveredPlotsTestStory
                data={{
                    ...chartData,
                    yAxis: [
                        {
                            plotLines: [
                                {value: 1, custom: 'y-threshold-line', hoverThreshold: 500},
                            ],
                        },
                    ],
                }}
            />,
        );
        // Move cursor to the same position again
        await page.mouse.move(Math.round(lineBox.x + lineBox.width / 2), Math.round(lineBox.y + 5));
        await expect(tooltip.getByText('y-threshold-line')).toBeVisible();
    });

    test('Grouped bar-x with line series', async ({mount, page}) => {
        const data = cloneDeep(barXGroupedColumnsData);
        data.series.data.push({
            type: 'line',
            name: 'Average',
            data: [
                {x: 0, y: 15},
                {x: 1, y: 18},
                {x: 2, y: 20},
                {x: 3, y: 17},
                {x: 4, y: 12},
            ],
        });

        const component = await mount(<ChartTestStory data={data} />);
        const bars = component.locator('.gcharts-bar-x__segment');
        const tooltip = page.locator('.gcharts-tooltip');
        const barBox = await getLocatorBoundingBox(bars.nth(1));
        await page.mouse.move(
            Math.round(barBox.x + barBox.width / 2),
            Math.round(barBox.y + barBox.height / 2),
        );
        await expect(tooltip).toHaveScreenshot();
    });

    test('ValueFormat with HTML-escaped prefix', async ({page, mount}) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 1, y: 0.42},
                            {x: 2, y: 0.75},
                        ],
                        tooltip: {
                            valueFormat: {
                                format: 'percent',
                                labelMode: 'absolute',
                                postfix: '',
                                precision: 1,
                                prefix: '&lt; ',
                                showRankDelimiter: true,
                                type: 'number',
                            },
                        },
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        const line = component.locator('.gcharts-line');
        const position = await getLocatorBoundingBox(line);
        await page.mouse.move(
            Math.round(position.x + position.width / 2),
            Math.round(position.y + position.height / 2),
        );
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
    });

    test('Mouse hover shows tooltip on touch-enabled desktop @desktop-touch', async ({
        page,
        mount,
    }) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 100},
                            {x: 1, y: 200},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['A', 'B'],
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        const bar = component.locator('.gcharts-bar-x').first();
        const position = await getLocatorBoundingBox(bar);
        await page.mouse.move(
            Math.round(position.x + position.width / 2),
            Math.round(position.y + position.height / 2),
        );
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toBeVisible();
    });

    test.describe('rowRenderer', () => {
        const FLEX_SNAPSHOT_NAME = 'Tooltip-row-renderer-flex-layout.png';
        const TABLE_SNAPSHOT_NAME = 'Tooltip-row-renderer-table-layout.png';
        const AREA_SNAPSHOT_NAME = 'Tooltip-row-renderer-area-table-layout.png';

        test('flex layout, JSX renderer', async ({mount, page}) => {
            await page.setViewportSize({width: 800, height: 400});
            const component = await mount(
                <StackingPercentRowRendererTestStory
                    data={barXStakingPercentData}
                    rendererType="flex-jsx"
                />,
            );
            const bar = component.locator('.gcharts-bar-x__segment').last();
            await bar.scrollIntoViewIfNeeded();
            const barBox = await getLocatorBoundingBox(bar);
            await page.mouse.move(
                Math.round(barBox.x + barBox.width / 2),
                Math.round(barBox.y + barBox.height / 2),
            );
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip).toHaveScreenshot(FLEX_SNAPSHOT_NAME);
        });

        test('flex layout, HTML string renderer', async ({mount, page}) => {
            await page.setViewportSize({width: 800, height: 400});
            const component = await mount(
                <StackingPercentRowRendererTestStory
                    data={barXStakingPercentData}
                    rendererType="flex-html"
                />,
            );
            const bar = component.locator('.gcharts-bar-x__segment').last();
            await bar.scrollIntoViewIfNeeded();
            const barBox = await getLocatorBoundingBox(bar);
            await page.mouse.move(
                Math.round(barBox.x + barBox.width / 2),
                Math.round(barBox.y + barBox.height / 2),
            );
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip).toHaveScreenshot(FLEX_SNAPSHOT_NAME);
        });

        test('table layout, JSX renderer', async ({mount, page}) => {
            await page.setViewportSize({width: 800, height: 400});
            const component = await mount(
                <StackingPercentRowRendererTestStory
                    data={barXStakingPercentData}
                    rendererType="table-jsx"
                />,
            );
            const bar = component.locator('.gcharts-bar-x__segment').last();
            await bar.scrollIntoViewIfNeeded();
            const barBox = await getLocatorBoundingBox(bar);
            await page.mouse.move(
                Math.round(barBox.x + barBox.width / 2),
                Math.round(barBox.y + barBox.height / 2),
            );
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip).toBeVisible();
            await expect(tooltip).toHaveScreenshot(TABLE_SNAPSHOT_NAME);
        });

        test('table layout, HTML string renderer', async ({mount, page}) => {
            await page.setViewportSize({width: 800, height: 400});
            const component = await mount(
                <StackingPercentRowRendererTestStory
                    data={barXStakingPercentData}
                    rendererType="table-html"
                />,
            );
            const bar = component.locator('.gcharts-bar-x__segment').last();
            await bar.scrollIntoViewIfNeeded();
            const barBox = await getLocatorBoundingBox(bar);
            await page.mouse.move(
                Math.round(barBox.x + barBox.width / 2),
                Math.round(barBox.y + barBox.height / 2),
            );
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip).toHaveScreenshot(TABLE_SNAPSHOT_NAME);
        });

        test('area series, table layout, JSX renderer', async ({mount, page}) => {
            await page.setViewportSize({width: 800, height: 400});
            const component = await mount(
                <StackingPercentRowRendererTestStory
                    data={areaStakingPercentData}
                    rendererType="table-jsx"
                />,
            );
            const area = component.locator('.gcharts-area__series').first();
            const areaBox = await getLocatorBoundingBox(area);
            await page.mouse.move(
                Math.round(areaBox.x + areaBox.width / 2),
                Math.round(areaBox.y + areaBox.height / 2),
            );
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip).toBeVisible();
            await expect(tooltip).toHaveScreenshot(AREA_SNAPSHOT_NAME);
        });

        test('area series, table layout, HTML string renderer', async ({mount, page}) => {
            await page.setViewportSize({width: 800, height: 400});
            const component = await mount(
                <StackingPercentRowRendererTestStory
                    data={areaStakingPercentData}
                    rendererType="table-html"
                />,
            );
            const area = component.locator('.gcharts-area__series').first();
            const areaBox = await getLocatorBoundingBox(area);
            await page.mouse.move(
                Math.round(areaBox.x + areaBox.width / 2),
                Math.round(areaBox.y + areaBox.height / 2),
            );
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip).toHaveScreenshot(AREA_SNAPSHOT_NAME);
        });
    });

    // TODO: rewrite the test after updating @gravity-ui/uikit (to the version with a drawer)
    test('Tooltip is visible and correctly positioned when chart is inside an animated panel', async ({
        mount,
        page,
    }) => {
        await page.setViewportSize({width: 1280, height: 800});

        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 10},
                            {x: 1, y: 20},
                            {x: 2, y: 15},
                        ],
                    },
                ],
            },
        };

        await mount(<DrawerChartTestStory data={chartData} />);

        await page.getByRole('button', {name: 'Open drawer'}).click();
        // wait for drawer to open
        await page.waitForTimeout(500);

        const bar = page.locator('.gcharts-bar-x__segment').first();
        await expect(bar).toBeVisible();
        const barBbox = await getLocatorBoundingBox(bar);
        await page.mouse.move(Math.round(barBbox.x + barBbox.width / 2), Math.round(barBbox.y + 1));

        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toBeVisible();
        await expect(page.locator('.gcharts-chart > svg')).toHaveScreenshot();
    });
});
