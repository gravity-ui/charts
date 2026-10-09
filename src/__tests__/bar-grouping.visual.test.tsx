import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {BarXOverlayExample} from '../../docs/examples/src/charts/series-types/bar-x-overlay';
import {BarYOverlayExample} from '../../docs/examples/src/charts/series-types/bar-y-overlay';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {barXStackedOverlayData} from '../__stories__/__data__/bar-x/stacked-overlay';
import {barYStackedOverlayData} from '../__stories__/__data__/bar-y/stacked-overlay';
import {DEFAULT_PALETTE, seriesOptionsDefaults} from '../core/constants';
import type {ChartData} from '../types';

import {getLocatorBoundingBox} from './utils';

test('bar-x overlay tooltip selects the last painted duplicate point', async ({mount, page}) => {
    const component = await mount(
        <ChartTestStory
            data={{
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Actual',
                            grouping: false,
                            data: [
                                {x: 'A', y: 100},
                                {x: 'A', y: 75, color: DEFAULT_PALETTE[1]},
                            ],
                        },
                    ],
                },
                xAxis: {type: 'category', categories: ['A']},
            }}
            styles={{width: 600, height: 360}}
        />,
    );
    await component.locator('.gcharts-bar-x__segment').nth(1).hover();
    const rows = page.locator('.gcharts-tooltip__content-row');
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText('75');
});

test('bar-y overlay tooltip selects the visible border over a negative bar', async ({
    mount,
    page,
}) => {
    const component = await mount(
        <ChartTestStory
            data={{
                series: {
                    data: [
                        {type: 'bar-y', name: 'Plan', grouping: false, data: [{y: 'A', x: -100}]},
                        {
                            type: 'bar-y',
                            name: 'Actual',
                            grouping: false,
                            borderWidth: 8,
                            borderColor: DEFAULT_PALETTE[2],
                            data: [{y: 'A', x: 75}],
                        },
                    ],
                },
                xAxis: {min: -100, max: 100},
                yAxis: [{type: 'category', categories: ['A']}],
            }}
            styles={{width: 600, height: 360}}
        />,
    );
    const border = component.locator('.gcharts-bar-y__segment-border');
    await expect(border).toHaveCount(1);
    const box = await getLocatorBoundingBox(border);
    await page.mouse.move(box.x + 1, box.y + box.height / 2);
    await expect(page.locator('.gcharts-tooltip__content-row_active')).toContainText('Actual');
});

for (const type of ['bar-x', 'bar-y'] as const) {
    test.describe(`${type} overlays`, () => {
        const vertical = type === 'bar-x';
        const categories = ['A', 'B'];
        // Per-series thickness is tracked in https://github.com/gravity-ui/charts/issues/761.
        // Update the examples and snapshots to show a wider Plan and narrower Actual once supported.
        const data = {
            series: {
                data: [
                    {name: 'Plan', values: [100, 80]},
                    {name: 'Actual', values: [75, 50]},
                ].map(({name, values}) => ({
                    type,
                    name,
                    grouping: false,
                    opacity: 0.6,
                    dataLabels: {enabled: name === 'Actual', inside: true},
                    data: values.map((value, index) =>
                        vertical
                            ? {x: categories[index], y: value}
                            : {y: categories[index], x: value},
                    ),
                })),
            },
            xAxis: vertical ? {type: 'category', categories} : undefined,
            yAxis: vertical ? undefined : [{type: 'category', categories}],
        } satisfies ChartData;

        test('Plan and Actual, labels, tooltip and visibility', async ({mount, page}) => {
            const component = await mount(
                <ChartTestStory data={data} styles={{width: 600, height: 360}} />,
            );
            const plan = component.locator(
                `.gcharts-${type}__segment[fill="${DEFAULT_PALETTE[0]}"]`,
            );
            const actual = component.locator(
                `.gcharts-${type}__segment[fill="${DEFAULT_PALETTE[1]}"]`,
            );
            await expect(plan).toHaveCount(2);
            await expect(actual).toHaveCount(2);
            async function expectAligned() {
                const p = await getLocatorBoundingBox(plan.first());
                const a = await getLocatorBoundingBox(actual.first());
                expect(vertical ? p.x + p.width / 2 : p.y + p.height / 2).toBeCloseTo(
                    vertical ? a.x + a.width / 2 : a.y + a.height / 2,
                    1,
                );
            }
            await expectAligned();
            await expect(component).toHaveScreenshot();
            await actual.first().hover();
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip).toBeVisible();
            await expect(tooltip).toContainText('Plan');
            await expect(tooltip).toContainText('Actual');
            await expect(tooltip.locator('.gcharts-tooltip__content-row_active')).toHaveCount(1);
            await expect(tooltip.locator('.gcharts-tooltip__content-row_active')).toContainText(
                'Actual',
            );
            await page.mouse.move(0, 0);
            const before = await getLocatorBoundingBox(actual.first());
            await component
                .locator('.gcharts-legend__item')
                .filter({hasText: 'Plan'})
                .click({modifiers: ['Control']});
            await expect(plan).toHaveCount(0);
            await expect(actual).toHaveCount(2);
            await component.update(
                <ChartTestStory
                    data={{...data, series: {...data.series, options: {[type]: {opacity: 0.5}}}}}
                    styles={{width: 600, height: 360}}
                />,
            );
            await expect(plan).toHaveCount(0);
            await expect(actual).toHaveCount(2);
            await component
                .locator('.gcharts-legend__item')
                .filter({hasText: 'Plan'})
                .click({modifiers: ['Control']});
            await expect(plan).toHaveCount(2);
            await expectAligned();
            const after = await getLocatorBoundingBox(actual.first());
            expect(after).toEqual(before);
            await component.update(
                <ChartTestStory data={data} styles={{width: 420, height: 300}} />,
            );
            await expect
                .poll(async () => {
                    const box = await getLocatorBoundingBox(actual.first());
                    return vertical ? box.x : box.width;
                })
                .not.toBe(vertical ? after.x : after.width);
            await expectAligned();
        });

        test('partial stack grouping keeps one total', async ({mount}) => {
            const component = await mount(
                <ChartTestStory
                    data={{
                        series: {
                            data: [20, 40, 10].map((value, index) => ({
                                type,
                                name: String(index),
                                stacking: 'normal',
                                grouping: index !== 1,
                                stackId: index < 2 ? 'shared' : 'other',
                                stackLabels: {enabled: index < 2},
                                data: [vertical ? {x: 'A', y: value} : {y: 'A', x: value}],
                            })),
                        },
                        xAxis: vertical ? {type: 'category', categories: ['A']} : undefined,
                        yAxis: vertical ? undefined : [{type: 'category', categories: ['A']}],
                    }}
                    styles={{width: 600, height: 360}}
                />,
            );
            await expect(component.locator('.gcharts-stack-labels__label')).toHaveText(['60']);
        });

        for (const stacking of [undefined, 'normal'] as const) {
            test(`later series cover earlier borders, stacking=${stacking ?? 'none'}`, async ({
                mount,
            }) => {
                const component = await mount(
                    <ChartTestStory
                        data={{
                            ...data,
                            series: {
                                ...data.series,
                                data: data.series.data.map((s) => ({
                                    ...s,
                                    stacking,
                                    stackId: s.name,
                                })),
                                options: {
                                    [type]: {borderWidth: 3, borderColor: DEFAULT_PALETTE[2]},
                                },
                            },
                        }}
                    />,
                );
                const paths = component.locator(
                    `.gcharts-${type}__segment, .gcharts-${type}__segment-border`,
                );
                await expect(paths).toHaveCount(8);
                // SVG paint order must keep earlier borders below later fills.
                expect(
                    await paths.evaluateAll((elements) =>
                        elements.map((element) => element.getAttribute('fill')),
                    ),
                ).toEqual([0, 2, 0, 2, 1, 2, 1, 2].map((index) => DEFAULT_PALETTE[index]));
            });
        }

        test('HTML labels follow overlay centers', async ({mount}) => {
            const htmlData: ChartData = {
                ...data,
                series: {
                    ...data.series,
                    data: data.series.data.map((s) => ({
                        ...s,
                        dataLabels: {
                            enabled: s.name === 'Actual',
                            inside: true,
                            html: true,
                        },
                    })),
                },
            };
            const component = await mount(
                <ChartTestStory data={htmlData} styles={{width: 420, height: 300}} />,
            );
            const actual = component.locator(
                `.gcharts-${type}__segment[fill="${DEFAULT_PALETTE[1]}"]`,
            );
            const labels = component.locator('.gcharts-chart__html-layer-item');
            await expect(labels).toHaveCount(2);
            const label = await getLocatorBoundingBox(labels.filter({hasText: '75'}));
            const bar = await getLocatorBoundingBox(actual.first());
            expect(vertical ? label.x + label.width / 2 : label.y + label.height / 2).toBeCloseTo(
                vertical ? bar.x + bar.width / 2 : bar.y + bar.height / 2,
                1,
            );
        });

        test('zoom keeps overlaid bars aligned', async ({mount, page}) => {
            const component = await mount(
                <ChartTestStory
                    data={{
                        ...data,
                        chart: {zoom: {enabled: true, type: vertical ? 'x' : 'y'}},
                        tooltip: {enabled: false},
                    }}
                    styles={{width: 600, height: 360}}
                />,
            );
            const actual = component.locator(
                `.gcharts-${type}__segment[fill="${DEFAULT_PALETTE[1]}"]`,
            );
            const plan = component.locator(
                `.gcharts-${type}__segment[fill="${DEFAULT_PALETTE[0]}"]`,
            );
            await expect(actual).toHaveCount(2);
            const brush = await getLocatorBoundingBox(component.locator('.gcharts-brush'));
            const start = {x: brush.x + brush.width * 0.05, y: brush.y + brush.height * 0.05};
            const end = {
                x: vertical ? brush.x + brush.width * 0.45 : start.x,
                y: vertical ? start.y : brush.y + brush.height * 0.45,
            };
            await page.mouse.move(start.x, start.y);
            await page.mouse.down();
            await page.mouse.move(end.x, end.y, {steps: 5});
            await page.mouse.up();
            await expect(actual).toHaveCount(1);
            await expect(plan).toHaveCount(1);
            const p = await getLocatorBoundingBox(plan);
            const a = await getLocatorBoundingBox(actual);
            expect(vertical ? p.x + p.width / 2 : p.y + p.height / 2).toBeCloseTo(
                vertical ? a.x + a.width / 2 : a.y + a.height / 2,
                1,
            );
            await component.locator('.gcharts-chart__reset-zoom-button').click();
            await expect(actual).toHaveCount(2);
        });

        test('guide example renders overlays', async ({mount}) => {
            const component = await mount(
                <div style={{width: 500, height: 320}}>
                    {vertical ? <BarXOverlayExample /> : <BarYOverlayExample />}
                </div>,
            );
            const bars = component.locator(`.gcharts-${type}__segment`);
            await expect(bars).toHaveCount(4);
            const first = await getLocatorBoundingBox(bars.nth(0));
            const third = await getLocatorBoundingBox(bars.nth(2));
            expect(vertical ? first.x : first.y).toBeCloseTo(vertical ? third.x : third.y);
            await expect(component.locator(`.gcharts-${type}__label`)).toHaveCount(2);
        });

        test('stacked overlays, tooltip and visibility', async ({mount, page}) => {
            const component = await mount(
                <ChartTestStory
                    data={vertical ? barXStackedOverlayData : barYStackedOverlayData}
                    styles={{width: 600, height: 360}}
                />,
            );
            const bars = component.locator(`.gcharts-${type}__segment`);
            await expect(bars).toHaveCount(4);
            const boxes = await Promise.all(
                [0, 1, 2, 3].map((index) => getLocatorBoundingBox(bars.nth(index))),
            );
            const center = (box: (typeof boxes)[number]) =>
                vertical ? box.x + box.width / 2 : box.y + box.height / 2;
            boxes.forEach((box) => expect(center(box)).toBeCloseTo(center(boxes[0])));
            expect(
                vertical
                    ? boxes[0].y - boxes[1].y - boxes[1].height
                    : boxes[1].x - boxes[0].x - boxes[0].width,
            ).toBeCloseTo(seriesOptionsDefaults[type].stackGap);
            await expect(component).toHaveScreenshot();
            await bars.nth(3).hover();
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip.locator('.gcharts-tooltip__content-row')).toHaveCount(4);
            const active = tooltip.locator('.gcharts-tooltip__content-row_active');
            await expect(active).toHaveCount(1);
            await expect(active).toContainText('Actual 2');
            await page.mouse.move(
                vertical ? center(boxes[1]) : boxes[1].x + boxes[1].width * 0.9,
                vertical ? boxes[1].y + boxes[1].height * 0.1 : center(boxes[1]),
            );
            await expect(active).toContainText('Plan 2');
            const actualBaseLegend = component
                .locator('.gcharts-legend__item')
                .filter({hasText: 'Actual 1'});
            await actualBaseLegend.click({modifiers: ['Control']});
            await expect(bars).toHaveCount(3);
            const top = await getLocatorBoundingBox(bars.nth(2));
            expect(center(top)).toBeCloseTo(center(boxes[3]));
            expect(vertical ? top.y : top.x).not.toBe(vertical ? boxes[3].y : boxes[3].x);
            await actualBaseLegend.click({modifiers: ['Control']});
            await expect(bars).toHaveCount(4);
            expect(await getLocatorBoundingBox(bars.nth(3))).toEqual(boxes[3]);
        });
    });
}
