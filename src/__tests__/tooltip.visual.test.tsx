import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {tooltipOverflowedRowsData} from 'src/__stories__/__data__';
import type {ChartData} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

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
});
