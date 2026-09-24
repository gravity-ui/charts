import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {barXBordersData} from '../__stories__/__data__/bar-x/borders';
import type {BarXSeries, ChartData} from '../types';

test.describe('Bar-x borders', () => {
    test('Grouped and per-series overrides', async ({mount}) => {
        const component = await mount(<ChartTestStory data={barXBordersData} />);
        await expect(component.locator('.gcharts-bar-x__segment-border')).toHaveCount(6);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    for (const stacking of ['normal', 'percent'] as const) {
        for (const stackGap of [0, 4]) {
            test(`${stacking} stacking with gap ${stackGap}`, async ({mount}) => {
                const data = cloneDeep(barXBordersData);
                Object.assign(data.series.data[2], {name: 'Top segment', borderWidth: 3});
                data.series.data.forEach((series) => {
                    (series as BarXSeries).stacking = stacking;
                    (series as BarXSeries).stackLabels = {enabled: true};
                });
                data.series.options = {
                    'bar-x': {...data.series.options?.['bar-x'], stackGap},
                };
                const component = await mount(<ChartTestStory data={data} />);
                const bounds = await component
                    .locator('.gcharts-bar-x__segment-border')
                    .evaluateAll((elements) =>
                        elements.map((element) => {
                            const {x, y, width, height} = (element as SVGGraphicsElement).getBBox();
                            return {x, y, width, height};
                        }),
                    );
                const firstStack = bounds.filter((box) => box.x === bounds[0].x);
                for (let i = 1; i < firstStack.length; i++) {
                    expect(
                        firstStack[i - 1].y - firstStack[i].y - firstStack[i].height,
                    ).toBeCloseTo(stackGap);
                }
                if (stacking === 'percent') expect(firstStack[2].y).toBeCloseTo(0);
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        }
    }

    test('Negative and short segments preserve bounds', async ({mount}) => {
        const data: ChartData = {
            series: {
                options: {
                    'bar-x': {borderWidth: 3, borderColor: '#283593', borderRadius: 8, stackGap: 4},
                },
                data: [
                    {
                        type: 'bar-x',
                        name: 'A',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 10},
                            {x: 1, y: -10},
                            {x: 2, y: 0.05},
                            {x: 3, y: 0},
                            {x: 4, y: 8},
                        ],
                    },
                    {
                        type: 'bar-x',
                        name: 'B',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 5},
                            {x: 1, y: -5},
                            {x: 2, y: 0.1},
                            {x: 3, y: -0.1},
                            {x: 4, y: -6},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['Positive', 'Negative', 'Short', 'Zero', 'Mixed'],
            },
            yAxis: [{min: -15, max: 15, maxPadding: 0}],
        };
        const plain = cloneDeep(data);
        plain.series.options = {'bar-x': {...plain.series.options?.['bar-x'], borderWidth: 0}};
        const component = await mount(<ChartTestStory data={plain} />);
        const segments = component.locator('.gcharts-bar-x__segment');
        await expect(segments).toHaveCount(10);
        const bounds = await segments.evaluateAll((elements) =>
            elements.map((element) => {
                const {x, y, width, height} = (element as SVGGraphicsElement).getBBox();
                return {x, y, width, height};
            }),
        );
        await component.update(<ChartTestStory data={data} />);
        const borders = component.locator('.gcharts-bar-x__segment-border');
        await expect(borders).toHaveCount(9);
        const borderedBounds = await borders.evaluateAll((elements) =>
            elements.map((element) => {
                const {x, y, width, height} = (element as SVGGraphicsElement).getBBox();
                return {x, y, width, height};
            }),
        );
        expect(borderedBounds).toEqual(bounds.filter((box) => box.height > 0));
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Dense bars ignore borders', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'Dense',
                        borderWidth: 3,
                        data: Array.from({length: 100}, (_, x) => ({x, y: x + 1})),
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('.gcharts-bar-x__segment')).toHaveCount(100);
        await expect(component.locator('.gcharts-bar-x__segment-border')).toHaveCount(0);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Hover and inactive states restore point opacity', async ({mount, page}) => {
        const data = cloneDeep(barXBordersData);
        data.series.data = data.series.data.slice(0, 2);
        data.series.data[1].tooltip = {enabled: false};
        (data.series.data[0] as BarXSeries).data.forEach((point) => {
            point.opacity = 0.6;
        });
        data.series.options = {
            'bar-x': {
                ...data.series.options?.['bar-x'],
                states: {
                    hover: {enabled: true, brightness: 0.5},
                    inactive: {enabled: true, opacity: 0.2},
                },
            },
        };
        data.tooltip = {enabled: true};
        const component = await mount(<ChartTestStory data={data} />);
        const fill = component.locator('.gcharts-bar-x__segment').first();
        const border = component.locator('.gcharts-bar-x__segment-border').first();
        await expect(border).toHaveAttribute('opacity', '0.6');
        const box = await fill.boundingBox();
        if (!box) throw new Error('Missing bar bounds');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await expect(fill).not.toHaveAttribute('fill', '#90caf9');
        await expect(page.locator('.gcharts-tooltip')).toBeVisible();
        await expect(border).toHaveAttribute('fill', '#283593');
        await expect(border).toHaveAttribute('opacity', '0.6');
        await expect(component.locator('.gcharts-bar-x__segment-border').nth(1)).toHaveAttribute(
            'opacity',
            '0.2',
        );
        // Tooltip behavior is checked above; keep its text out of the border snapshot.
        await page.addStyleTag({content: '.gcharts-tooltip { visibility: hidden !important; }'});
        await expect(component.locator('svg')).toHaveScreenshot();
        await page.mouse.move(0, 0);
        await expect(fill).toHaveAttribute('fill', '#90caf9');
        await expect(fill).toHaveAttribute('opacity', '0.6');
        await expect(border).toHaveAttribute('opacity', '0.6');
    });
    test('Cursor and tooltip cover borders, including solid short bars', async ({mount, page}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'bar-x',
                        name: 'A',
                        cursor: 'pointer',
                        borderWidth: 3,
                        borderColor: 'red',
                        data: [
                            {x: 0, y: 1},
                            {x: 1, y: 50},
                        ],
                    },
                ],
            },
            xAxis: {type: 'category', categories: ['Short', 'Tall']},
            yAxis: [{min: 0, max: 100}],
        };
        const component = await mount(<ChartTestStory data={data} />);
        const borders = component.locator('.gcharts-bar-x__segment-border');
        await expect(borders).toHaveCount(2);
        for (const index of [0, 1]) {
            const box = await borders.nth(index).boundingBox();
            if (!box) throw new Error('Missing border bounds');
            const point = {x: box.x + box.width / 2, y: box.y + Math.min(1, box.height / 2)};
            await page.mouse.move(point.x, point.y);
            const cursor = await page.evaluate(({x, y}) => {
                const target = document.elementFromPoint(x, y);
                return target && getComputedStyle(target).cursor;
            }, point);
            expect(cursor).toBe('pointer');
            await expect(page.locator('.gcharts-tooltip')).toBeVisible();
        }
    });

    for (const reversed of [false, true]) {
        test(`Rounded ends of mixed stacks, reversed=${reversed}`, async ({mount}) => {
            const data: ChartData = {
                series: {
                    options: {
                        'bar-x': {
                            borderWidth: 3,
                            borderRadius: 10,
                            borderColor: '#283593',
                            stackGap: 4,
                            stackLabels: {enabled: true},
                        },
                    },
                    data: [8, -6, 4, -3, 0, null].map((y, i) => ({
                        type: 'bar-x',
                        name: String(i),
                        stacking: 'normal',
                        data: [{x: 0, y}],
                    })),
                },
                xAxis: {type: 'category', categories: ['Mixed']},
                yAxis: [{min: -15, max: 15, order: reversed ? 'reverse' : undefined}],
            };
            const component = await mount(<ChartTestStory data={data} />);
            const borders = component.locator('.gcharts-bar-x__segment-border');
            await expect(borders).toHaveCount(4);
            const corners = await borders.evaluateAll((elements) =>
                elements.map((element) => {
                    const path = element as SVGPathElement;
                    const {x, y, height} = path.getBBox();
                    return {
                        top: path.isPointInFill(new DOMPoint(x + 0.5, y + 0.5)),
                        bottom: path.isPointInFill(new DOMPoint(x + 0.5, y + height - 0.5)),
                    };
                }),
            );
            expect(corners.slice(0, 2)).toEqual([
                {top: true, bottom: true},
                {top: true, bottom: true},
            ]);
            expect(corners[2]).toEqual({top: reversed, bottom: !reversed});
            expect(corners[3]).toEqual({top: !reversed, bottom: reversed});
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    }
});
