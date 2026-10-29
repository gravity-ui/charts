import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

test.describe('Default state', () => {
    test.describe('hoveredPosition', () => {
        test('keeps category B and its anchor under a CSS transform', async ({mount, page}) => {
            await page.setViewportSize({width: 1000, height: 600});
            const component = await mount(
                <ChartTestStory
                    data={{
                        legend: {enabled: false},
                        xAxis: {type: 'category', categories: ['A', 'B', 'C']},
                        series: {
                            data: [
                                {
                                    type: 'bar-x',
                                    name: 'Series',
                                    data: [
                                        {x: 0, y: 10},
                                        {x: 1, y: 20},
                                        {x: 2, y: 15},
                                    ],
                                },
                            ],
                        },
                        defaultState: {hoveredPosition: {x: '50%', y: '50%'}},
                    }}
                    styles={{
                        marginLeft: 100,
                        marginTop: 100,
                        transform: 'scale(0.6)',
                        transformOrigin: 'top left',
                    }}
                />,
            );
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip.getByText('B', {exact: true})).toBeVisible();
            const plot = component.locator('.gcharts-chart__content');
            const expected = await plot.evaluate((element) => {
                const matrix = (element as SVGGraphicsElement).getScreenCTM();
                if (!matrix) throw new Error('Plot screen transform is unavailable');
                const x = Number(element.getAttribute('width')) / 2;
                const y = Number(element.getAttribute('height')) / 2;
                return {
                    x: matrix.a * x + matrix.c * y + matrix.e,
                    y: matrix.b * x + matrix.d * y + matrix.f,
                };
            });
            await expect
                .poll(async () => {
                    const box = await tooltip.boundingBox();
                    return (
                        box &&
                        Math.max(
                            Math.abs(box.x - expected.x - 20),
                            Math.abs(box.y + box.height / 2 - expected.y),
                        )
                    );
                })
                .toBeLessThanOrEqual(2);
            await component.evaluate((element) => {
                element.style.marginLeft = '160px';
            });
            await expect
                .poll(async () => {
                    const box = await tooltip.boundingBox();
                    return box && Math.abs(box.x - expected.x - 60 - 20);
                })
                .toBeLessThanOrEqual(2);
        });

        test('number (pixels)', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            name: 'Series 1',
                            type: 'line',
                            data: [
                                {x: 1, y: 10},
                                {x: 2, y: 20},
                                {x: 3, y: 15},
                                {x: 4, y: 25},
                            ],
                        },
                    ],
                },
                defaultState: {
                    hoveredPosition: {x: 150, y: 150},
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
        });

        test('string (percentages)', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            name: 'Series 1',
                            type: 'area',
                            data: [
                                {x: 1, y: 10},
                                {x: 2, y: 20},
                                {x: 3, y: 15},
                                {x: 4, y: 25},
                            ],
                        },
                    ],
                },
                defaultState: {
                    hoveredPosition: {x: '50%', y: '75%'},
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('.gcharts-chart')).toHaveScreenshot();
        });
    });
});
