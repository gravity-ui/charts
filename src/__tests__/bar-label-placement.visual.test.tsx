import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import BarLabelPlacementExample from '../../docs/examples/src/charts/data-labels/bar-placement';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {migrateChartDataV1} from '../compat/v1';
import type {ChartData} from '../types';

import {getLocatorBoundingBox} from './utils';

for (const type of ['bar-x', 'bar-y'] as const) {
    for (const stacking of ['percent', 'normal'] as const) {
        for (const outsideOnly of [false, true]) {
            test(`${type} ${stacking} stack with ${outsideOnly ? 'outside-only' : 'auto'} placement`, async ({
                mount,
            }) => {
                const vertical = type === 'bar-x';
                const percent = stacking === 'percent';
                const html = percent || (outsideOnly && !vertical);
                const values = percent ? [20, 80] : [20, -20, 30, -30];
                const axis = {min: percent ? 0 : -100, max: 100};
                const category = {type: 'category' as const, categories: ['A']};
                const data: ChartData = {
                    legend: {enabled: false},
                    xAxis: vertical ? category : axis,
                    yAxis: [vertical ? axis : category],
                    series: {
                        data: values.map((value) => ({
                            type,
                            name: String(value),
                            stacking,
                            data: [vertical ? {x: 'A', y: value} : {x: value, y: 'A'}],
                            dataLabels: {
                                enabled: true,
                                html,
                                placement: outsideOnly ? ['outside'] : 'auto',
                                placementFallback: percent && outsideOnly ? 'hide' : 'show',
                                allowOverlap: true,
                                padding: 5,
                            },
                        })),
                    },
                };
                const component = await mount(<ChartTestStory data={data} />);
                const bars = component.locator(`.gcharts-${type}__segment`);
                const labels = component.locator(
                    html ? '.gcharts-chart__html-layer-item' : `.gcharts-${type}__label`,
                );
                // A percent stack fills the plot, so its outermost outside label cannot fit.
                const labelCount = percent && outsideOnly ? values.length - 1 : values.length;
                await expect(bars).toHaveCount(values.length);
                await expect(labels).toHaveCount(labelCount);
                for (let index = 0; index < labelCount; index++) {
                    const bar = await getLocatorBoundingBox(bars.nth(index));
                    const label = await getLocatorBoundingBox(
                        labels.filter({hasText: new RegExp(`^${values[index]}$`)}),
                    );
                    if (!outsideOnly && (percent || index < 2)) {
                        expect(label.x).toBeGreaterThanOrEqual(bar.x);
                        expect(label.y).toBeGreaterThanOrEqual(bar.y);
                        expect(label.x + label.width).toBeLessThanOrEqual(bar.x + bar.width);
                        expect(label.y + label.height).toBeLessThanOrEqual(bar.y + bar.height);
                    } else if (vertical) {
                        if (values[index] > 0) {
                            expect(label.y + label.height).toBeLessThanOrEqual(bar.y - 4);
                        } else {
                            expect(label.y).toBeGreaterThanOrEqual(bar.y + bar.height + 4);
                        }
                    } else if (values[index] > 0) {
                        expect(label.x).toBeGreaterThanOrEqual(bar.x + bar.width + 4);
                    } else {
                        expect(label.x + label.width).toBeLessThanOrEqual(bar.x - 4);
                    }
                }
            });
        }
    }
}

test('outside-only bar-y labels keep the legacy autoscale reserve', async ({mount}) => {
    const data = (placement?: ['outside']): ChartData => ({
        legend: {enabled: false},
        xAxis: {min: 0},
        yAxis: [{type: 'category', categories: ['A']}],
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'Orders',
                    data: [{x: 98, y: 'A'}],
                    dataLabels: {enabled: true, placement, placementFallback: 'hide'},
                },
            ],
        },
    });
    let readyCount = 0;
    const onRender = () => readyCount++;
    const component = await mount(<ChartTestStory data={data()} onRender={onRender} />);
    const bars = component.locator('.gcharts-bar-y__segment');
    const labels = component.locator('.gcharts-bar-y__label');
    await expect.poll(() => readyCount).toBeGreaterThan(0);
    const legacyBar = await getLocatorBoundingBox(bars);
    const previousCount = readyCount;
    await component.update(<ChartTestStory data={data(['outside'])} onRender={onRender} />);
    await expect.poll(() => readyCount).toBeGreaterThan(previousCount);
    await expect(labels).toHaveCount(1);
    const bar = await getLocatorBoundingBox(bars);
    const label = await getLocatorBoundingBox(labels);
    expect(bar.width).toBeCloseTo(legacyBar.width);
    expect(label.x).toBeGreaterThanOrEqual(bar.x + bar.width + 6);
});

test('bar-y placement hides fully clipped stack segments regardless of fallback', async ({
    mount,
}) => {
    const data: ChartData = {
        legend: {enabled: false},
        xAxis: {min: 500, max: 1000},
        yAxis: [{type: 'category', categories: ['A']}],
        series: {
            data: [100, 900].map((value) => ({
                type: 'bar-y',
                name: String(value),
                stacking: 'normal',
                data: [{x: value, y: 'A'}],
                dataLabels: {enabled: true, placement: 'auto'},
            })),
        },
    };
    const component = await mount(<ChartTestStory data={data} />);
    const labels = component.locator('.gcharts-bar-y__label');
    await expect(labels).toHaveCount(1);
    await expect(labels).toHaveText('900');
    const bar = await getLocatorBoundingBox(component.locator('.gcharts-bar-y__segment').nth(1));
    const label = await getLocatorBoundingBox(labels);
    expect(label.x).toBeGreaterThan(bar.x);
    expect(label.x + label.width).toBeLessThan(bar.x + bar.width);
});

test('explicit placement ignores legacy inside during autoscaling', async ({mount}) => {
    const data = (inside: boolean): ChartData =>
        migrateChartDataV1({
            legend: {enabled: false},
            xAxis: {min: 0, order: 'reverse', startOnTick: false, endOnTick: false},
            yAxis: [{type: 'category', categories: ['A']}],
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Orders',
                        data: [{x: 90, y: 'A', label: 'A long label'}],
                        dataLabels: {enabled: true, inside, placement: ['inside-center']},
                    },
                ],
            },
        }).data;
    let readyCount = 0;
    const onRender = () => {
        readyCount++;
    };
    const component = await mount(<ChartTestStory data={data(false)} onRender={onRender} />);
    const bars = component.locator('.gcharts-bar-y__segment');
    const labels = component.locator('.gcharts-bar-y__label');
    await expect.poll(() => readyCount).toBeGreaterThan(0);
    const before = await getLocatorBoundingBox(bars);
    const centered = await getLocatorBoundingBox(labels);
    expect(centered.x + centered.width / 2).toBeCloseTo(before.x + before.width / 2, 0);
    const previousCount = readyCount;
    await component.update(<ChartTestStory data={data(true)} onRender={onRender} />);
    await expect.poll(() => readyCount).toBeGreaterThan(previousCount);
    expect((await getLocatorBoundingBox(bars)).width).toBeCloseTo(before.width);
});

test('negative bar labels keep padding from the painted border', async ({mount}) => {
    const data = (placement: 'outside' | 'inside-end'): ChartData => ({
        legend: {enabled: false},
        xAxis: {min: -100, max: 0},
        yAxis: [{type: 'category', categories: ['A']}],
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'Orders',
                    borderWidth: 20,
                    data: [{x: -50, y: 'A'}],
                    dataLabels: {enabled: true, html: true, placement: [placement], padding: 5},
                },
            ],
        },
    });
    const component = await mount(<ChartTestStory data={data('outside')} />);
    const label = component.locator('.gcharts-chart__html-layer-item');
    const border = component.locator('.gcharts-bar-y__segment-border');
    await expect(label).toHaveCount(1);
    const painted = await getLocatorBoundingBox(border);
    const outside = await getLocatorBoundingBox(label);
    expect(outside.x + outside.width).toBeCloseTo(painted.x - 5, 0);
    await component.update(<ChartTestStory data={data('inside-end')} />);
    await expect(async () => {
        expect((await getLocatorBoundingBox(label)).x).toBeCloseTo(painted.x + 5, 0);
    }).toPass();
});

test('reversed percent stacks honor explicit inside-end', async ({mount}) => {
    const data: ChartData = {
        xAxis: {type: 'category', categories: ['A']},
        yAxis: [{min: 0, max: 100, order: 'reverse'}],
        legend: {enabled: false},
        series: {
            data: [20, 80].map((value) => ({
                type: 'bar-x',
                name: String(value),
                stacking: 'percent',
                data: [{x: 'A', y: value}],
                dataLabels: {enabled: true, placement: ['inside-end'], padding: 5},
            })),
        },
    };
    const component = await mount(<ChartTestStory data={data} />);
    const bars = component.locator('.gcharts-bar-x__segment');
    const labels = component.locator('.gcharts-bar-x__label');
    await expect(labels).toHaveCount(2);
    const bar = await getLocatorBoundingBox(bars.nth(0));
    const label = await getLocatorBoundingBox(labels.filter({hasText: '20'}));
    expect(label.y + label.height).toBeCloseTo(bar.y + bar.height - 5, 0);
});

for (const type of ['bar-y', 'bar-x'] as const) {
    const vertical = type === 'bar-x';

    for (const html of [false, true]) {
        test(`${type} ${html ? 'HTML' : 'SVG'} adaptive placement`, async ({mount, page}) => {
            const pointOverride = html && !vertical;
            const data: ChartData = {
                chart: {zoom: {enabled: true, type: 'xy'}},
                xAxis: vertical
                    ? {type: 'category', categories: ['Small', 'Large']}
                    : {min: 0, max: 1082.4, startOnTick: false, endOnTick: false, maxPadding: 0},
                yAxis: vertical
                    ? [{min: 0, max: 1000, startOnTick: false, endOnTick: false, maxPadding: 0}]
                    : [{type: 'category', categories: ['Small', 'Large']}],
                legend: {enabled: false},
                tooltip: {enabled: false},
                series: {
                    data: [
                        {
                            type,
                            name: 'Completion',
                            data: (vertical
                                ? [
                                      {x: 'Small', y: 16, label: '1.6%'},
                                      {x: 'Large', y: 984, label: '98.4%'},
                                  ]
                                : [
                                      {x: 16, y: 'Small', label: '1.6%'},
                                      {x: 984, y: 'Large', label: '98.4%'},
                                  ]
                            ).map((point) => ({...point, dataLabels: {enabled: true}})),
                            dataLabels: {
                                enabled: !pointOverride,
                                html,
                                placement: html ? 'auto' : ['outside', 'inside-end'],
                                padding: 5,
                                style: {fontSize: '11px', fontWeight: 'bold'},
                            },
                        },
                    ],
                },
            };
            const component = await mount(
                <ChartTestStory data={data} styles={{width: 300, height: 240}} />,
            );
            const labels = component.locator(
                html ? '.gcharts-chart__html-layer-item' : `.gcharts-${type}__label`,
            );
            const bars = component.locator(`.gcharts-${type}__segment`);
            await expect(labels).toHaveCount(2);
            async function assertPlacement() {
                await expect(async () => {
                    const small = await getLocatorBoundingBox(bars.nth(0));
                    const large = await getLocatorBoundingBox(bars.nth(1));
                    const smallLabel = await getLocatorBoundingBox(
                        labels.filter({hasText: '1.6%'}),
                    );
                    const largeLabel = await getLocatorBoundingBox(
                        labels.filter({hasText: '98.4%'}),
                    );
                    if (vertical) {
                        expect(smallLabel.y + smallLabel.height).toBeLessThanOrEqual(small.y - 4);
                        expect(largeLabel.y).toBeGreaterThanOrEqual(large.y + 4);
                        expect(largeLabel.y + largeLabel.height).toBeLessThan(
                            large.y + large.height,
                        );
                    } else {
                        expect(smallLabel.x).toBeGreaterThanOrEqual(small.x + small.width + 4);
                        expect(largeLabel.x + largeLabel.width).toBeLessThanOrEqual(
                            large.x + large.width - 4,
                        );
                        expect(largeLabel.x).toBeGreaterThan(large.x);
                    }
                }).toPass();
            }
            await assertPlacement();
            if (!html) await expect(component).toHaveScreenshot();
            // Both rendering modes share invalidation; cover each value axis once.
            if (html !== vertical) return;

            // Enlarging the value dimension makes the outside candidate fit.
            await component.update(
                <ChartTestStory
                    data={data}
                    styles={vertical ? {width: 300, height: 2400} : {width: 800, height: 240}}
                />,
            );
            await expect(async () => {
                const bar = await getLocatorBoundingBox(bars.nth(1));
                const label = await getLocatorBoundingBox(labels.filter({hasText: '98.4%'}));
                if (vertical) {
                    expect(label.y + label.height).toBeLessThanOrEqual(bar.y - 4);
                } else {
                    expect(label.x).toBeGreaterThanOrEqual(bar.x + bar.width + 4);
                }
            }).toPass();
            await component.update(
                <ChartTestStory data={data} styles={{width: 300, height: 240}} />,
            );
            await assertPlacement();

            const brush = component.locator('.gcharts-brush');
            const plot = await getLocatorBoundingBox(brush);
            const source = vertical
                ? {x: plot.x + 1, y: plot.y + plot.height * 0.005}
                : {x: plot.x + plot.width * 0.1, y: plot.y + 1};
            const target = vertical
                ? {x: plot.x + plot.width - 1, y: plot.y + plot.height * 0.9}
                : {x: plot.x + plot.width * 0.995, y: plot.y + plot.height - 1};
            await page.mouse.move(source.x, source.y);
            await page.mouse.down();
            await page.mouse.move(target.x, target.y, {steps: 12});
            await page.mouse.up();
            const reset = component.locator('.gcharts-chart__reset-zoom-button');
            await expect(reset).toBeVisible();
            await expect(bars).toHaveCount(1);
            await expect(async () => {
                const bar = await getLocatorBoundingBox(bars);
                const label = await getLocatorBoundingBox(labels.filter({hasText: '98.4%'}));
                if (vertical) {
                    expect(label.y).toBeGreaterThanOrEqual(bar.y + 4);
                    expect(label.y + label.height).toBeLessThanOrEqual(plot.y + plot.height);
                } else {
                    expect(label.x + label.width).toBeLessThanOrEqual(bar.x + bar.width - 4);
                    expect(label.x).toBeGreaterThanOrEqual(plot.x);
                }
            }).toPass();
            await reset.click();
            await expect(reset).toBeHidden();
            await assertPlacement();
        });
    }
}

test('bar placement guide demonstrates both candidates', async ({mount}) => {
    const component = await mount(
        <div style={{width: 420, height: 260}}>
            <BarLabelPlacementExample />
        </div>,
    );
    await expect(component.locator('.gcharts-bar-y__label')).toHaveCount(3);
    await expect(component).toHaveScreenshot();
});
