import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {areaRangeBasicData} from '../__stories__/__data__';
import type {ChartData} from '../types';

import {AreaRangeEventsTestStory} from './components/AreaRangeEventsTestStory';
import {getLocatorBoundingBox} from './utils';

test.describe('Area range series', () => {
    for (const type of ['y', 'xy'] as const) {
        for (const companion of [undefined, 'line', 'scatter'] as const) {
            test(`${type} zoom keeps the band with ${companion ?? 'no companion'}`, async ({
                mount,
                page,
            }) => {
                const xs = [0, 1, 2, 3, 4];
                const data: ChartData = {
                    chart: {zoom: {enabled: true, type}},
                    xAxis: {min: 0, max: 4},
                    yAxis: [{min: 0, max: 100}],
                    series: {
                        data: [
                            {
                                type: 'area-range',
                                name: 'Band',
                                data: xs.map((x) => ({x, y0: 10, y1: 90})),
                            },
                            ...(companion
                                ? [
                                      {
                                          type: companion,
                                          name: 'Values',
                                          data: xs.map((x) => ({x, y: 50})),
                                      },
                                  ]
                                : []),
                        ],
                    },
                };
                const component = await mount(<ChartTestStory data={data} />);
                const region = component.locator('.gcharts-area-range__region');
                await expect(region).toHaveAttribute('d', /^M/);
                const originalPath = await region.getAttribute('d');
                const box = await getLocatorBoundingBox(
                    component.locator('.gcharts-brush .overlay'),
                );
                await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25);
                await page.mouse.down();
                await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.75, {
                    steps: 10,
                });
                await page.mouse.up();
                await expect(component.locator('.gcharts-chart__reset-zoom-button')).toBeVisible();
                await expect(region).toHaveAttribute('d', /^M/);
                await expect(region).not.toHaveAttribute('d', originalPath ?? '');
                const bandBox = await getLocatorBoundingBox(region);
                expect(bandBox.width).toBeGreaterThan(0);
                expect(bandBox.height).toBeGreaterThan(0);
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await expect(page.locator('.gcharts-tooltip')).toContainText('10 — 90');
            });
        }
    }

    test('Basic @webkit', async ({mount}) => {
        const component = await mount(<ChartTestStory data={areaRangeBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Hover and click expose the range point', async ({mount, page}) => {
        const component = await mount(<AreaRangeEventsTestStory data={areaRangeBasicData} />);
        const region = component.locator('.gcharts-area-range__region');
        const initialFill = await region.getAttribute('fill');
        const box = await getLocatorBoundingBox(region);

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

        await expect(page.locator('.gcharts-tooltip')).toContainText('—');
        expect(await region.getAttribute('fill')).not.toBe(initialFill);

        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(component.locator('[data-qa="clicked-range"]')).toContainText('—');
    });
});
