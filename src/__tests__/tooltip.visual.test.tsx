import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {
    barXGroupedColumnsData,
    barXStakingPercentData,
    tooltipOverflowedRowsData,
    tooltipOverflowedRowsHtmlData,
} from 'src/__stories__/__data__';
import type {ChartData} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

import {HoveredPlotsTestStory} from './components/HoveredPlotsTestStory';
import {StackingPercentRowRendererTestStory} from './components/StackingPercentRowRendererTestStory';
import {getLocator, getLocatorBoundingBox} from './utils';

test.describe('Tooltip', () => {
    test('More points row', async ({mount, page}) => {
        await page.setViewportSize({width: 500, height: 280});
        const component = await mount(<ChartTestStory data={tooltipOverflowedRowsData} />);
        const bar = component.locator('.gcharts-bar-y').first();
        await bar.hover();
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
        await bar.click();
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });

    test('More points row & totals', async ({mount, page}) => {
        await page.setViewportSize({width: 500, height: 280});
        const data = cloneDeep(tooltipOverflowedRowsData);
        set(data, 'tooltip.totals.enabled', true);
        const component = await mount(<ChartTestStory data={data} />);
        const bar = component.locator('.gcharts-bar-y').first();
        await bar.hover();
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
        await bar.click();
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
    });

    test('More points row with HTML labels', async ({mount, page}) => {
        await page.setViewportSize({width: 500, height: 280});
        const component = await mount(<ChartTestStory data={tooltipOverflowedRowsHtmlData} />);
        const bar = component.locator('.gcharts-bar-y').first();
        await bar.hover();
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
        await bar.click();
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
        const position = await bar.boundingBox();
        if (position === null) {
            throw Error('bar position is null');
        }
        await page.mouse.move(position.x + position.width / 2, 50);
        await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
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
        const position = await bar.boundingBox();
        if (position === null) {
            throw Error('bar position is null');
        }
        await page.mouse.move(position.x + position.width / 2, 50);
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
        const position = await bar.boundingBox();
        if (position === null) {
            throw Error('bar position is null');
        }
        await page.mouse.move(position.x + position.width / 2, 50);
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
        const position = await bar.boundingBox();
        if (position === null) {
            throw Error('bar position is null');
        }
        await page.mouse.move(position.x + position.width / 2, 50);
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
        await page.mouse.move(position.x + position.width / 2, 50);
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
        const lineBox = await getLocatorBoundingBox(plotLine);
        await page.mouse.move(lineBox.x + lineBox.width / 2, lineBox.y + lineBox.height / 2);
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
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
        await bars.nth(1).hover();
        await expect(tooltip).toHaveScreenshot();
    });

    test.describe('rowRenderer', () => {
        const FLEX_SNAPSHOT_NAME = 'Tooltip-row-renderer-flex-layout.png';
        const TABLE_SNAPSHOT_NAME = 'Tooltip-row-renderer-table-layout.png';

        test('flex layout, JSX renderer', async ({mount, page}) => {
            await page.setViewportSize({width: 800, height: 400});
            const component = await mount(
                <StackingPercentRowRendererTestStory
                    data={barXStakingPercentData}
                    rendererType="flex-jsx"
                />,
            );
            const bar = component.locator('.gcharts-bar-x__segment').last();
            await bar.hover();
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
            await bar.hover();
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
            await bar.hover();
            const tooltip = page.locator('.gcharts-tooltip');
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
            await bar.hover();
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip).toHaveScreenshot(TABLE_SNAPSHOT_NAME);
        });
    });
});
