import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator} from '@playwright/test';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {getCustomStackLabelsData, getStackLabelsData} from '../__stories__/__data__/stack-labels';
import type {PreparedBarYData} from '../core/shapes/bar-y/types';
import type {ChartData} from '../types';

const labelSelector = '.gcharts-stack-labels__label';

async function getBoundingBox(locator: Locator) {
    await expect(locator).toBeVisible();

    // WebKit's automation bounding box can omit SVG text's x/y offsets.
    return locator.evaluate((element) => {
        const {x, y, width, height} = element.getBoundingClientRect();
        return {x, y, width, height};
    });
}

function getBoundaryTestData(): ChartData {
    return {
        chart: {margin: {top: 0, right: 0, bottom: 0, left: 0}},
        legend: {enabled: false},
        xAxis: {visible: false},
        yAxis: [{visible: false}],
        series: {data: []},
    };
}

test.describe('Stack labels', () => {
    test('bar-y: zero segments do not add totals to negative stacks', async ({mount}) => {
        const data: ChartData = {
            title: {text: 'bar-y: A = [-10, 0], B = [-20, -5]'},
            xAxis: {},
            yAxis: [{type: 'category', categories: ['A', 'B']}],
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Loss',
                        stacking: 'normal',
                        data: [
                            {x: -10, y: 0},
                            {x: -20, y: 1},
                        ],
                    },
                    {
                        type: 'bar-y',
                        name: 'Other',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 0},
                            {x: -5, y: 1},
                        ],
                    },
                ],
                options: {'bar-y': {stackLabels: {enabled: true}}},
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        const labels = component.locator(labelSelector);
        await expect
            .poll(async () => (await labels.allTextContents()).sort())
            .toEqual(['-10', '-25']);
        await expect(component.locator('svg')).toHaveScreenshot();

        await component.getByText('Other', {exact: true}).click();
        await expect.poll(async () => (await labels.allTextContents()).sort()).toEqual(['-5', '0']);
        await component.getByText('Other', {exact: true}).click();
        await expect
            .poll(async () => (await labels.allTextContents()).sort())
            .toEqual(['-10', '-25']);
    });

    test('bar-x normal: decimal totals fit in a narrow plot', async ({mount}) => {
        const data = getBoundaryTestData();
        data.xAxis = {visible: false, min: 0, max: 2};
        data.yAxis = [{visible: false, min: 0, max: 0.4}];
        data.series.data = [0.2, 0.1].map((y) => ({
            type: 'bar-x',
            name: String(y),
            stacking: 'normal',
            stackLabels: {enabled: true},
            data: [{x: 1, y}],
        }));
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 160, height: 160}} />,
        );
        const label = component.locator(labelSelector);
        await expect(label).toHaveText('0.3');
        const plot = await getBoundingBox(component.locator('svg'));
        const box = await getBoundingBox(label);
        expect(box.x).toBeGreaterThanOrEqual(plot.x - 0.1);
        expect(box.y).toBeGreaterThanOrEqual(plot.y - 0.1);
        expect(box.x + box.width).toBeLessThanOrEqual(plot.x + plot.width + 0.1);
        expect(box.y + box.height).toBeLessThanOrEqual(plot.y + plot.height + 0.1);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    for (const type of ['bar-x', 'bar-y', 'area'] as const) {
        for (const stacking of ['normal', 'percent'] as const) {
            test(`${type} ${stacking}: totals, point labels and legend`, async ({mount}) => {
                const data = getStackLabelsData(type, stacking);
                const component = await mount(<ChartTestStory data={data} />);
                const labels = component.locator(labelSelector);
                await expect(labels).toHaveCount(3);
                await expect
                    .poll(async () => (await labels.allTextContents()).sort())
                    .toEqual(['30', '50', '70']);
                await expect(component.locator('svg')).toHaveScreenshot();

                await component.getByText('Desktop', {exact: true}).click();
                await expect
                    .poll(async () => (await labels.allTextContents()).sort())
                    .toEqual(['10', '20', '30']);
                await component.getByText('Desktop', {exact: true}).click();
                await expect
                    .poll(async () => (await labels.allTextContents()).sort())
                    .toEqual(['30', '50', '70']);
            });

            test(`${type} ${stacking}: series participation and legend`, async ({mount}) => {
                const data = getStackLabelsData(type, stacking);
                // Keep totals enabled only on the outer series. Area stacking uses
                // the opposite series order to bars.
                const participant = type === 'area' ? 0 : 1;
                data.series.options = {};
                data.series.data.forEach((series, index) => {
                    Object.assign(series, {stackLabels: {enabled: index === participant}});
                    series.dataLabels = {enabled: false};
                });
                const component = await mount(<ChartTestStory data={data} />);
                const labels = component.locator(labelSelector);
                await expect(labels).toHaveCount(3);
                await expect
                    .poll(async () => (await labels.allTextContents()).sort())
                    .toEqual(participant === 0 ? ['10', '20', '30'] : ['20', '30', '40']);
                const before = await labels.evaluateAll((elements) =>
                    elements.map((element) => {
                        const box = element.getBoundingClientRect();
                        return {x: box.x, y: box.y, width: box.width};
                    }),
                );
                const all = getStackLabelsData(type, stacking);
                all.series.data.forEach((series) => {
                    series.dataLabels = {enabled: false};
                });
                await component.update(<ChartTestStory data={all} />);
                await expect
                    .poll(async () => (await labels.allTextContents()).sort())
                    .toEqual(['30', '50', '70']);
                const after = await labels.evaluateAll((elements) =>
                    elements.map((element) => {
                        const box = element.getBoundingClientRect();
                        return {x: box.x, y: box.y, width: box.width};
                    }),
                );
                // Centering or clamping different-width totals can move their left edges.
                after.forEach((position, index) => {
                    expect(position.y).toBeCloseTo(before[index].y, 1);
                    expect(Math.abs(position.x - before[index].x)).toBeLessThanOrEqual(
                        Math.abs(position.width - before[index].width) + 0.01,
                    );
                });
                await component.update(<ChartTestStory data={data} />);
                await expect
                    .poll(async () => (await labels.allTextContents()).sort())
                    .toEqual(participant === 0 ? ['10', '20', '30'] : ['20', '30', '40']);
                await component
                    .getByText(participant === 0 ? 'Mobile' : 'Desktop', {exact: true})
                    .click();
                await expect(labels).toHaveCount(0);
                await component
                    .getByText(participant === 0 ? 'Mobile' : 'Desktop', {exact: true})
                    .click();
                await expect(labels).toHaveCount(3);
            });
        }
    }

    test('the label of a small top segment takes priority over its total', async ({mount}) => {
        for (const allowOverlap of [false, true]) {
            const data = getBoundaryTestData();
            data.xAxis = {visible: false, min: 0, max: 2};
            data.yAxis = [{visible: false, min: 0, max: 30}];
            data.series.data = [20, 1].map((y) => ({
                type: 'bar-x',
                name: String(y),
                stacking: 'normal',
                data: [{x: 1, y}],
                stackLabels: {enabled: true, allowOverlap},
                dataLabels: {enabled: y === 1, padding: 5},
            }));
            const component = await mount(
                <ChartTestStory data={data} styles={{width: 400, height: 200}} />,
            );
            const pointLabel = component.getByText('1', {exact: true});
            await expect(pointLabel).toBeVisible();
            await expect(component.locator(labelSelector)).toHaveCount(allowOverlap ? 1 : 0);
            if (allowOverlap) {
                const point = await getBoundingBox(pointLabel);
                const total = await getBoundingBox(component.locator(labelSelector));
                expect(Math.min(point.y + point.height, total.y + total.height)).toBeGreaterThan(
                    Math.max(point.y, total.y),
                );
                expect(Math.min(point.x + point.width, total.x + total.width)).toBeGreaterThan(
                    Math.max(point.x, total.x),
                );
            }
            await component.unmount();
        }
    });

    for (const borderWidth of [0, 2]) {
        test(`bar-y: percent totals at the plot edge with border ${borderWidth}`, async ({
            mount,
        }) => {
            const data = getBoundaryTestData();
            data.yAxis = [{visible: false, type: 'category', categories: ['A']}];
            data.series = {
                data: [10, 20].map((x) => ({
                    type: 'bar-y',
                    name: String(x),
                    stacking: 'percent',
                    borderWidth,
                    data: [{x, y: 0}],
                })),
                options: {'bar-y': {stackLabels: {enabled: true}}},
            };
            for (const width of [101, 100, 101.5]) {
                const component = await mount(
                    <ChartTestStory data={data} styles={{width, height: 200}} />,
                );
                const label = component.locator(labelSelector);
                await expect(label).toHaveText('30');
                const plot = await getBoundingBox(component.locator('svg'));
                const box = await getBoundingBox(label);
                expect(box.x + box.width).toBeLessThanOrEqual(plot.x + plot.width + 0.1);
                await component.unmount();
            }
        });
    }

    test('area: percent totals at a fractional split boundary', async ({mount}) => {
        const data = getBoundaryTestData();
        data.xAxis = {visible: false, min: 0, max: 3};
        data.yAxis = [{visible: false, plotIndex: 2}];
        data.split = {enable: true, plots: [{}, {}, {}], gap: 0};
        data.series = {
            data: [10, 20].map((y) => ({
                type: 'area',
                name: String(y),
                stacking: 'percent',
                data: [
                    {x: 1, y},
                    {x: 2, y},
                ],
            })),
            options: {area: {stackLabels: {enabled: true}}},
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 400, height: 200}} />,
        );
        const labels = component.locator(labelSelector);
        await expect(labels).toHaveText(['30', '30']);
        const plot = await getBoundingBox(component.locator('svg'));
        for (const label of await labels.all()) {
            const box = await getBoundingBox(label);
            expect(box.y).toBeGreaterThanOrEqual(plot.y + (200 * 2) / 3 - 0.1);
        }
    });

    test('bar-y: totals follow the outer stack ends on a reversed value axis', async ({mount}) => {
        const data = getBoundaryTestData();
        data.xAxis = {visible: false, min: -100, max: 100, order: 'reverse'};
        data.yAxis = [{visible: false, type: 'category', categories: ['A']}];
        data.series = {
            data: [10, 20, -15, -25].map((x) => ({
                type: 'bar-y',
                name: String(x),
                stacking: 'normal',
                data: [{x, y: 0}],
            })),
            options: {'bar-y': {stackLabels: {enabled: true}}},
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 400, height: 200}} />,
        );
        await expect(component.locator(labelSelector)).toHaveCount(2);
        const segments = await component
            .locator('.gcharts-bar-y__segment')
            .evaluateAll((elements) =>
                elements.map((element) => {
                    interface BarElement extends SVGElement {
                        __data__: PreparedBarYData;
                    }
                    const box = element.getBoundingClientRect();
                    return {
                        value: (element as BarElement).__data__.data.x,
                        left: box.left,
                        right: box.right,
                    };
                }),
            );
        const positive = await getBoundingBox(
            component.locator(labelSelector).filter({hasText: '30'}),
        );
        const negative = await getBoundingBox(
            component.locator(labelSelector).filter({hasText: '-40'}),
        );
        expect(positive.x + positive.width).toBeLessThan(
            Math.min(...segments.filter((s) => Number(s.value) > 0).map((s) => s.left)),
        );
        expect(negative.x).toBeGreaterThan(
            Math.max(...segments.filter((s) => Number(s.value) < 0).map((s) => s.right)),
        );
    });

    test('totals respect point label overlap in either layer order', async ({mount}) => {
        for (const html of [false, true]) {
            for (const allowOverlap of [false, true]) {
                for (const reverse of [false, true]) {
                    const data = getBoundaryTestData();
                    data.xAxis = {visible: false, min: 0, max: 4};
                    data.yAxis = [{visible: false, min: -100, max: 100}];
                    data.series = {
                        data: [
                            {
                                type: 'line',
                                name: 'Line',
                                data: [{x: 1, y: 30, label: 'point'}],
                                dataLabels: {enabled: true, html, allowOverlap, padding: 5},
                            },
                            ...[10, 20].map((y) => ({
                                type: 'bar-x' as const,
                                name: String(y),
                                stacking: 'normal' as const,
                                data: [{x: 1, y}],
                            })),
                        ],
                        options: {'bar-x': {stackLabels: {enabled: true, allowOverlap}}},
                    };
                    if (reverse) data.series.data.reverse();
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: 400, height: 200}} />,
                    );
                    const labels = component
                        .locator(labelSelector)
                        .or(component.getByText('point', {exact: true}));
                    await expect(labels).toHaveCount(allowOverlap ? 2 : 1);
                    const boxes = await labels.evaluateAll((elements) =>
                        elements.map((el) => {
                            const box = el.getBoundingClientRect();
                            return {
                                left: box.left,
                                right: box.right,
                                top: box.top,
                                bottom: box.bottom,
                            };
                        }),
                    );
                    const overlaps =
                        boxes.length === 2 &&
                        boxes[0].left < boxes[1].right &&
                        boxes[1].left < boxes[0].right &&
                        boxes[0].top < boxes[1].bottom &&
                        boxes[1].top < boxes[0].bottom;
                    expect(overlaps).toBe(allowOverlap);
                    await component.unmount();
                }
            }
        }
    });
});

for (const type of ['bar-x', 'bar-y'] as const) {
    for (const reversed of [false, true]) {
        test(`${type} custom totals: geometry and legend, reversed=${reversed} @webkit`, async ({
            mount,
        }, testInfo) => {
            const data = getCustomStackLabelsData(type);
            const horizontal = type === 'bar-y';
            if (reversed) {
                if (horizontal) data.xAxis = {...data.xAxis, order: 'reverse'};
                else data.yAxis = [{...data.yAxis?.[0], order: 'reverse'}];
            }
            const component = await mount(<ChartTestStory data={data} />);
            const labels = component.locator(labelSelector);
            await expect
                .poll(async () => (await labels.allTextContents()).sort())
                .toEqual(['10 orders', '14 orders', '9 orders']);
            await component
                .locator('svg')
                .screenshot({path: testInfo.outputPath('custom-totals.png')});
            const bars = component.locator(`.gcharts-${type}__segment`);
            const before = await bars.evaluateAll((nodes) =>
                nodes.map((node) => node.getAttribute('d')),
            );
            const original = getCustomStackLabelsData(type);
            original.xAxis = data.xAxis;
            original.yAxis = data.yAxis;
            original.series.options = {[type]: {stackLabels: {enabled: true, allowOverlap: true}}};
            await component.update(<ChartTestStory data={original} />);
            await expect
                .poll(async () => (await labels.allTextContents()).sort())
                .toEqual(['250', '300', '350']);
            await expect
                .poll(async () =>
                    bars.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('d'))),
                )
                .toEqual(before);
            await component.update(<ChartTestStory data={data} />);
            await expect
                .poll(async () => (await labels.allTextContents()).sort())
                .toEqual(['10 orders', '14 orders', '9 orders']);
            await component.getByRole('button', {name: 'Mobile', exact: true}).press('Enter');
            await expect
                .poll(async () => (await labels.allTextContents()).sort())
                .toEqual(['4 orders', '6 orders', '7 orders']);
            await component.getByRole('button', {name: 'Mobile', exact: true}).press('Enter');
            await expect
                .poll(async () => (await labels.allTextContents()).sort())
                .toEqual(['10 orders', '14 orders', '9 orders']);
        });
    }
}

for (const type of ['bar-x', 'bar-y'] as const) {
    for (const stacking of ['normal', 'percent'] as const) {
        for (const reversed of [false, true]) {
            test(`${type} ${stacking}: reserves space outside the stack, reversed=${reversed} @webkit`, async ({
                mount,
            }, testInfo) => {
                const horizontal = type === 'bar-y';
                const valueAxis = {
                    visible: false,
                    min: 0,
                    max: 100,
                    order: reversed ? ('reverse' as const) : undefined,
                };
                const categoryAxis = {visible: false, type: 'category' as const, categories: ['A']};
                const data = getBoundaryTestData();
                data.xAxis = horizontal ? valueAxis : categoryAxis;
                data.yAxis = [horizontal ? categoryAxis : valueAxis];
                data.series = {
                    data: [30, 70].map((value) => ({
                        type,
                        name: String(value),
                        stacking,
                        borderWidth: 0,
                        data: [horizontal ? {x: value, y: 0} : {x: 0, y: value}],
                    })),
                    options: {[type]: {stackLabels: {enabled: true}}},
                };
                const component = await mount(
                    <ChartTestStory data={data} styles={{width: 240, height: 200}} />,
                );
                const label = component.locator(labelSelector);
                await expect(label).toHaveText('100');
                const box = await getBoundingBox(label);
                const plot = await getBoundingBox(component.locator('svg'));
                const bars = await getBoundingBox(component.locator(`.gcharts-${type}`));

                expect(box.x).toBeGreaterThanOrEqual(plot.x - 0.1);
                expect(box.y).toBeGreaterThanOrEqual(plot.y - 0.1);
                expect(box.x + box.width).toBeLessThanOrEqual(plot.x + plot.width + 0.1);
                expect(box.y + box.height).toBeLessThanOrEqual(plot.y + plot.height + 0.1);
                if (horizontal) {
                    if (reversed) expect(box.x + box.width).toBeLessThanOrEqual(bars.x - 4.9);
                    else expect(box.x).toBeGreaterThanOrEqual(bars.x + bars.width + 4.9);
                } else if (reversed)
                    expect(box.y).toBeGreaterThanOrEqual(bars.y + bars.height + 4.9);
                else expect(box.y + box.height).toBeLessThanOrEqual(bars.y - 4.9);
                await component
                    .locator('svg')
                    .screenshot({path: testInfo.outputPath('outside-total.png')});

                await component.update(
                    <ChartTestStory
                        data={data}
                        styles={horizontal ? {width: 12, height: 200} : {width: 240, height: 12}}
                    />,
                );
                await expect(label).toHaveCount(0);
            });
        }
    }
}

for (const reversed of [false, true]) {
    test(`bar-y logarithmic: custom totals follow cumulative stack ends, reversed=${reversed} @webkit`, async ({
        mount,
    }, testInfo) => {
        const data = getCustomStackLabelsData('bar-y');
        data.xAxis = {
            type: 'logarithmic',
            min: 1,
            max: 1000,
            order: reversed ? 'reverse' : undefined,
        };
        const component = await mount(<ChartTestStory data={data} />);
        const labels = component.locator(labelSelector);
        await expect
            .poll(async () => (await labels.allTextContents()).sort())
            .toEqual(['10 orders', '14 orders', '9 orders']);

        const bars = await component.locator('.gcharts-bar-y__segment').evaluateAll((elements) =>
            elements.map((element) => {
                const {x, y, width, height} = element.getBoundingClientRect();
                return {x, y, width, height};
            }),
        );
        const plot = await getBoundingBox(component.locator('svg'));
        for (const label of await labels.all()) {
            const box = await getBoundingBox(label);
            const middle = box.y + box.height / 2;
            const row = bars.filter((bar) => middle >= bar.y && middle <= bar.y + bar.height);
            expect(row).toHaveLength(2);
            expect(box.x).toBeGreaterThanOrEqual(plot.x);
            expect(box.x + box.width).toBeLessThanOrEqual(plot.x + plot.width + 0.1);
            if (reversed)
                expect(box.x + box.width).toBeLessThanOrEqual(
                    Math.min(...row.map((bar) => bar.x)) - 4.4,
                );
            else
                expect(box.x).toBeGreaterThanOrEqual(
                    Math.max(...row.map((bar) => bar.x + bar.width)) + 4.4,
                );
        }
        await component
            .locator('svg')
            .screenshot({path: testInfo.outputPath('logarithmic-totals.png')});
    });
}
