import React from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator} from '@playwright/test';
import cloneDeep from 'lodash/cloneDeep';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    groupedWaterfallData,
    temporalLabelLevelsData,
} from '../__stories__/__data__/axis-label-levels';
import type {ChartData} from '../types';

async function expectCenteredLabels(levels: Locator, horizontal = true) {
    const measurements = await levels.evaluateAll(
        (elements, isHorizontal) =>
            elements.flatMap((element) => {
                const paths = [...element.querySelectorAll('path')].map((path) =>
                    path.getBoundingClientRect(),
                );
                return [...element.querySelectorAll('text')].map((text) => {
                    const box = text.getBoundingClientRect();
                    const center = isHorizontal ? box.x + box.width / 2 : box.y + box.height / 2;
                    const path = paths.reduce((best, item) => {
                        const distance = Math.abs(
                            center -
                                (isHorizontal ? item.x + item.width / 2 : item.y + item.height / 2),
                        );
                        return distance < best ? distance : best;
                    }, Infinity);
                    return {distance: path, size: isHorizontal ? box.width : box.height};
                });
            }),
        horizontal,
    );
    expect(measurements.length).toBeGreaterThan(0);
    for (const measurement of measurements) {
        expect(measurement.distance).toBeLessThan(1);
        expect(measurement.size).toBeGreaterThan(0);
    }
}

test('waterfall reserves space for three additional levels and a title', async ({mount}) => {
    const component = await mount(
        <ChartTestStory data={groupedWaterfallData} styles={{width: 720, height: 420}} />,
    );
    const levels = component.locator('.gcharts-x-axis__level');
    await expect(levels).toHaveCount(3);
    await expectCenteredLabels(levels);
    const lastLevel = await levels.last().boundingBox();
    const title = await component.locator('.gcharts-x-axis__title').boundingBox();
    expect(title!.y).toBeGreaterThan(lastLevel!.y + lastLevel!.height);
    await expect(component.locator('svg')).toHaveScreenshot();
});

test('time labels clip, resize, update and disappear when disabled', async ({mount}) => {
    const data = cloneDeep(temporalLabelLevelsData);
    data.xAxis!.min = Date.UTC(2026, 0, 20);
    data.xAxis!.max = Date.UTC(2026, 1, 10);
    const component = await mount(
        <ChartTestStory data={data} styles={{width: 600, height: 360}} />,
    );
    const levels = component.locator('.gcharts-x-axis__level');
    await expect(levels).toHaveCount(2);
    await expectCenteredLabels(levels);
    await component.update(<ChartTestStory data={data} styles={{width: 240, height: 360}} />);
    await expect.poll(async () => (await component.locator('svg').boundingBox())?.width).toBe(240);
    await expectCenteredLabels(levels);
    await expect(component.locator('svg')).toHaveScreenshot();
    data.xAxis!.labels!.enabled = false;
    await component.update(<ChartTestStory data={data} styles={{width: 240, height: 360}} />);
    await expect(levels).toHaveCount(0);
});

test('category indexes survive ordering and min/max with repeated range values', async ({
    mount,
}) => {
    const data: ChartData = {
        legend: {enabled: false},
        xAxis: {
            type: 'category',
            categories: ['F', 'E', 'D', 'C', 'B', 'A'],
            order: 'sortAsc',
            min: 1,
            max: 4,
            labels: {
                additionalLevels: [
                    {
                        ranges: [
                            {from: 0, to: 2, value: 'Group'},
                            {from: 3, to: 5, value: 'Group'},
                        ],
                    },
                ],
            },
        },
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Value',
                    data: ['A', 'B', 'C', 'D', 'E', 'F'].map((x, y) => ({x, y})),
                },
            ],
        },
    };
    const component = await mount(<ChartTestStory data={data} />);
    const level = component.locator('.gcharts-x-axis__level');
    await expect(level.locator('text')).toHaveCount(2);
    await expectCenteredLabels(level);
    const widths = await level
        .locator('path')
        .evaluateAll((paths) => paths.map((path) => path.getBoundingClientRect().width));
    expect(widths[0]).toBeCloseTo(widths[1], 0);
    const serialized = await component.locator('svg').evaluate((svg) => {
        const document = new DOMParser().parseFromString(
            new XMLSerializer().serializeToString(svg),
            'image/svg+xml',
        );
        return {
            labels: [...document.querySelectorAll('.gcharts-x-axis__level tspan')].map(
                (label) => label.textContent,
            ),
            separators: document.querySelectorAll('.gcharts-x-axis__level path').length,
        };
    });
    expect(serialized).toEqual({labels: ['Group', 'Group'], separators: 2});
});

test('additional levels follow interactive zoom and reset', async ({mount, page}) => {
    const data: ChartData = {
        ...temporalLabelLevelsData,
        chart: {zoom: {enabled: true, type: 'x'}},
    };
    const component = await mount(
        <ChartTestStory data={data} styles={{width: 600, height: 360}} />,
    );
    const levels = component.locator('.gcharts-x-axis__level');
    await expect(levels.first().locator('text')).toHaveCount(2);
    const brush = await component.locator('.gcharts-brush').boundingBox();
    if (!brush) {
        throw new Error('Missing zoom brush');
    }
    await page.mouse.move(brush.x + brush.width * 0.6, brush.y + brush.height / 2);
    await page.mouse.down();
    await page.mouse.move(brush.x + brush.width * 0.9, brush.y + brush.height / 2, {steps: 5});
    await page.mouse.up();
    await expect(levels.first().locator('text')).toHaveCount(1);
    await expect(levels.first().locator('tspan')).toHaveText('February');
    await expectCenteredLabels(levels);
    await component.locator('.gcharts-chart__reset-zoom-button').click();
    await expect(levels.first().locator('text')).toHaveCount(2);
    await expectCenteredLabels(levels);
});

test('left and right Y levels use the same scale and stay inside the chart', async ({mount}) => {
    const data: ChartData = {
        legend: {enabled: false},
        yAxis: [
            {
                min: 0,
                max: 100,
                maxPadding: 0,
                title: {text: 'Score'},
                labels: {
                    additionalLevels: [
                        {
                            ranges: [
                                {from: 0, to: 50, value: 'Low'},
                                {from: 50, to: 100, value: 'High'},
                            ],
                        },
                        {ranges: [{from: 0, to: 100, value: 'All scores'}]},
                    ],
                },
            },
            {
                position: 'right',
                type: 'logarithmic',
                min: 1,
                max: 1000,
                maxPadding: 0,
                title: {text: 'Volume'},
                labels: {
                    additionalLevels: [
                        {
                            ranges: [
                                {from: 1, to: 10, value: 'Small'},
                                {from: 10, to: 1000, value: 'Large'},
                            ],
                        },
                    ],
                },
            },
        ],
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Score',
                    data: [
                        {x: 0, y: 10},
                        {x: 1, y: 90},
                    ],
                },
                {
                    type: 'line',
                    name: 'Volume',
                    yAxis: 1,
                    data: [
                        {x: 0, y: 1},
                        {x: 1, y: 1000},
                    ],
                },
            ],
        },
    };
    const component = await mount(
        <ChartTestStory data={data} styles={{width: 640, height: 380}} />,
    );
    const levels = component.locator('.gcharts-y-axis__level');
    await expect(levels).toHaveCount(3);
    await expectCenteredLabels(levels, false);
    const svg = await component.locator('svg').boundingBox();
    for (const level of await levels.all()) {
        const box = await level.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(svg!.x);
        expect(box!.x + box!.width).toBeLessThanOrEqual(svg!.x + svg!.width);
    }
    await expect(component.locator('svg')).toHaveScreenshot();
});

test('vertical category labels follow reordered bands in a dark theme', async ({mount}) => {
    const data: ChartData = {
        legend: {enabled: false},
        yAxis: [
            {
                type: 'category',
                categories: ['Web', 'Stores', 'Partners', 'Direct', 'Wholesale'],
                order: 'reverse',
                min: 1,
                max: 3,
                labels: {
                    additionalLevels: [
                        {
                            ranges: [
                                {from: 0, to: 2, value: 'North'},
                                {from: 3, to: 4, value: 'South'},
                            ],
                        },
                    ],
                },
            },
        ],
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'Sales',
                    data: ['Web', 'Stores', 'Partners', 'Direct', 'Wholesale'].map((y, i) => ({
                        x: 30 + i * 10,
                        y,
                    })),
                },
            ],
        },
    };
    const component = await mount(
        <ThemeProvider theme="dark">
            <ChartTestStory data={data} styles={{width: 480, height: 320}} />
        </ThemeProvider>,
    );
    const levels = component.locator('.gcharts-y-axis__level');
    await expect(levels.locator('text')).toHaveCount(2);
    await expectCenteredLabels(levels, false);
    await expect(component.locator('svg')).toHaveScreenshot();
});

test('exhausted plot space does not create invalid geometry and recovers on resize', async ({
    mount,
}) => {
    const data = cloneDeep(temporalLabelLevelsData);
    let renderCount = 0;
    const onRender = () => {
        renderCount++;
    };
    const component = await mount(
        <ChartTestStory data={data} styles={{width: 80, height: 35}} onRender={onRender} />,
    );
    await expect(component.locator('svg')).toBeVisible();
    await expect.poll(() => renderCount).toBeGreaterThan(0);
    await expect(component.locator('.gcharts-x-axis__level')).toHaveCount(0);
    await expect
        .poll(async () =>
            component.locator('svg').evaluate((svg) => {
                const invalid = [...svg.querySelectorAll('*')].some(
                    (node) =>
                        [...node.attributes].some(({value}) => /NaN|Infinity/.test(value)) ||
                        ['width', 'height', 'r'].some(
                            (attr) => Number(node.getAttribute(attr)) < 0,
                        ),
                );
                return invalid;
            }),
        )
        .toBe(false);
    await component.update(<ChartTestStory data={data} styles={{width: 500, height: 320}} />);
    await expect(component.locator('.gcharts-x-axis__level text')).toHaveCount(3);
    await expectCenteredLabels(component.locator('.gcharts-x-axis__level'));
});
