import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {BarXOverlayExample} from '../../docs/examples/src/charts/series-types/bar-x-overlay';
import {BarYOverlayExample} from '../../docs/examples/src/charts/series-types/bar-y-overlay';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {DEFAULT_PALETTE} from '../core/constants';
import type {ChartData} from '../types';

import {getLocatorBoundingBox} from './utils';

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

        test('later series cover earlier borders', async ({mount}) => {
            const component = await mount(
                <ChartTestStory
                    data={{
                        ...data,
                        series: {
                            ...data.series,
                            options: {[type]: {borderWidth: 3, borderColor: DEFAULT_PALETTE[2]}},
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
    });
}
