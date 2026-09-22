import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {areaRangeBasicData} from '../__stories__/__data__';
import type {ChartData} from '../types';

import {AreaRangeEventsTestStory} from './components/AreaRangeEventsTestStory';
import {getLocatorBoundingBox} from './utils';

test.describe('Area range series', () => {
    for (const permanent of [false, true]) {
        test(`boundary markers change hover state without duplicates (permanent=${permanent})`, async ({
            mount,
            page,
        }) => {
            const data: ChartData = {
                xAxis: {min: 0, max: 2},
                yAxis: [{min: 0, max: 40}],
                series: {
                    options: {
                        'area-range': {
                            marker: {enabled: permanent, radius: 7},
                            states: {
                                hover: {
                                    marker: {
                                        radius: 3,
                                        borderColor: '#00ff00',
                                        borderWidth: 2,
                                        halo: {size: 8, opacity: 0.4},
                                    },
                                },
                            },
                        },
                    },
                    data: [
                        {
                            type: 'area-range',
                            name: 'Band',
                            color: '#5282ff',
                            data: [
                                {x: 0, y0: 10, y1: 30},
                                {x: 1, y0: 10, y1: 30},
                                {x: 2, y0: 10, y1: 30},
                            ],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            const symbols = component.locator('.gcharts-marker__symbol');
            const halos = component.locator('.gcharts-marker__halo');
            await expect(symbols).toHaveCount(permanent ? 6 : 0);
            const box = await getLocatorBoundingBox(
                component.locator('.gcharts-area-range__region'),
            );
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await expect(halos).toHaveCount(2);
            await expect(symbols).toHaveCount(permanent ? 6 : 2);
            const active = component.locator('.gcharts-marker__symbol[stroke="#00ff00"]');
            await expect(active).toHaveCount(2);
            const bounds = await active.evaluateAll((elements) =>
                elements.map((element) => {
                    const rect = element.getBoundingClientRect();
                    return {
                        x: rect.x + rect.width / 2,
                        y: rect.y + rect.height / 2,
                        width: rect.width,
                    };
                }),
            );
            expect(bounds[0].x).toBeCloseTo(bounds[1].x, 1);
            expect(Math.abs(bounds[0].y - bounds[1].y)).toBeCloseTo(box.height, 0);
            for (const halo of await halos.all()) {
                await expect(halo).toHaveAttribute('opacity', '0.4');
            }
            await page.mouse.move(0, 0);
            await expect(halos).toHaveCount(0);
            await expect(symbols).toHaveCount(permanent ? 6 : 0);
            if (permanent) await expect(active).toHaveCount(0);
        });
    }

    test('point markers and hover disabling keep both boundaries visible as configured', async ({
        mount,
        page,
    }) => {
        const component = await mount(
            <ChartTestStory
                data={{
                    xAxis: {min: 0, max: 2},
                    yAxis: [{min: 0, max: 40}],
                    series: {
                        options: {'area-range': {states: {hover: {marker: {enabled: false}}}}},
                        data: [
                            {
                                type: 'area-range',
                                name: 'Band',
                                data: [
                                    {x: 0, y0: 10, y1: 30},
                                    {
                                        x: 1,
                                        y0: 10,
                                        y1: 30,
                                        marker: {
                                            color: '#ff0000',
                                            states: {normal: {enabled: true}},
                                        },
                                    },
                                    {x: 2, y0: 10, y1: 30},
                                ],
                            },
                        ],
                    },
                }}
            />,
        );
        const symbols = component.locator('.gcharts-marker__symbol');
        await expect(symbols).toHaveCount(2);
        for (const symbol of await symbols.all())
            await expect(symbol).toHaveAttribute('fill', '#ff0000');
        const box = await getLocatorBoundingBox(component.locator('.gcharts-area-range__region'));
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await expect(page.locator('.gcharts-tooltip')).toBeVisible();
        await expect(symbols).toHaveCount(2);
        await expect(component.locator('.gcharts-marker__halo')).toHaveCount(0);
    });

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
        await expect(component.locator('.gcharts-marker__symbol')).toHaveCount(2);
        await expect(component.locator('.gcharts-marker__halo')).toHaveCount(2);
        expect(await region.getAttribute('fill')).not.toBe(initialFill);

        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(component.locator('[data-qa="clicked-range"]')).toContainText('—');
    });
});
