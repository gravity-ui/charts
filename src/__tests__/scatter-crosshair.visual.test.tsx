import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator, Page} from '@playwright/test';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

import {getLocatorBoundingBox} from './utils';

async function hoverMarker(page: Page, marker: Locator) {
    const box = await getLocatorBoundingBox(marker);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

async function expectSnappedCrosshair(component: Locator, marker: Locator, yAxis = 0) {
    await expect
        .poll(async () => {
            const box = await getLocatorBoundingBox(marker);
            const x = await component
                .locator('[data-crosshair-x-line] path')
                .evaluate((element) => element.getBoundingClientRect().x);
            const y = await component
                .locator(`[data-crosshair-y-line-${yAxis}] path`)
                .evaluate((element) => element.getBoundingClientRect().y);
            return Math.max(
                Math.abs(x - box.x - box.width / 2),
                Math.abs(y - box.y - box.height / 2),
            );
        })
        .toBeLessThan(1);
}

function getData(clustered: boolean): ChartData {
    return {
        legend: {enabled: false},
        series: {
            data: [
                {
                    type: 'scatter',
                    name: 'Observations',
                    data: clustered
                        ? [
                              {x: 25, y: 50},
                              {x: 25.1, y: 50.1},
                          ]
                        : [{x: 25, y: 50}],
                    cluster: {enabled: clustered, layoutAlgorithm: {gridSize: '50%'}},
                },
            ],
        },
        xAxis: {type: 'linear', min: 0, max: 100, crosshair: {enabled: true, snap: true}},
        yAxis: [{type: 'linear', min: 0, max: 100, crosshair: {enabled: true, snap: true}}],
    };
}

test.describe('Scatter crosshair geometry', () => {
    for (const clustered of [false, true]) {
        test(`Stationary hover refreshes after resize (clustered=${clustered})`, async ({
            mount,
            page,
        }) => {
            const component = await mount(
                <ChartTestStory
                    data={getData(clustered)}
                    chartStyles={{width: '100%', height: '100%'}}
                />,
            );
            const marker = component.locator('.gcharts-marker__symbol').first();
            await hoverMarker(page, marker);
            await expectSnappedCrosshair(component, marker);
            const before = await getLocatorBoundingBox(marker);

            await component.evaluate((element) => {
                element.style.width = '300px';
                element.style.height = '220px';
            });
            await expect
                .poll(async () => (await getLocatorBoundingBox(marker)).x)
                .toBeLessThan(before.x - 10);
            await expectSnappedCrosshair(component, marker);
            await expect(page.locator('.gcharts-tooltip')).toBeVisible();
            await expect(component.locator('.gcharts-marker__halo').first()).toHaveAttribute(
                'visibility',
                '',
            );
        });
    }

    test('Stationary hover follows current shifted geometry', async ({mount, page}) => {
        const data = getData(true);
        const series = data.series.data[0];
        if (series.type !== 'scatter') {
            throw new Error('Scatter series required');
        }
        series.data = [49, 49.1, 50.1, 50.2].map((x) => ({x, y: 75}));
        series.cluster = {
            enabled: true,
            layoutAlgorithm: {gridSize: '50%'},
            overlapMode: 'shift',
            marker: {radius: 12},
        };
        const component = await mount(
            <ChartTestStory data={data} chartStyles={{width: '100%', height: '100%'}} />,
        );
        const hoveredMarker = component.locator(
            '.gcharts-marker__wrapper:has(> .gcharts-marker__halo[visibility=""]) .gcharts-marker__symbol',
        );
        await hoverMarker(page, component.locator('.gcharts-marker__symbol').first());
        await expectSnappedCrosshair(component, hoveredMarker);
        const before = await getLocatorBoundingBox(hoveredMarker);
        await component.evaluate((element) => {
            element.style.width = '300px';
            element.style.height = '220px';
        });
        await expect
            .poll(async () => (await getLocatorBoundingBox(hoveredMarker)).y)
            .toBeLessThan(before.y - 5);
        await expectSnappedCrosshair(component, hoveredMarker);
        await expect(page.locator('.gcharts-tooltip')).toBeVisible();
    });

    test('Disabled X crosshair still refreshes the assigned Y axis', async ({mount, page}) => {
        const data = getData(true);
        data.xAxis = {...data.xAxis, crosshair: {enabled: false}};
        data.yAxis = [{type: 'linear', min: 0, max: 10}, ...(data.yAxis ?? [])];
        const series = data.series.data[0];
        if (series.type !== 'scatter') {
            throw new Error('Scatter series required');
        }
        series.yAxis = 1;
        const component = await mount(
            <ChartTestStory data={data} chartStyles={{width: '100%', height: '100%'}} />,
        );
        const marker = component.locator('.gcharts-marker__symbol');
        await hoverMarker(page, marker);
        await expect(component.locator('[data-crosshair-x-line]')).toHaveCount(0);
        const before = await getLocatorBoundingBox(marker);
        await component.evaluate((element) => {
            element.style.height = '220px';
        });
        await expect
            .poll(async () => (await getLocatorBoundingBox(marker)).y)
            .toBeLessThan(before.y - 10);
        await expect
            .poll(async () => {
                const box = await getLocatorBoundingBox(marker);
                const crosshairY = await component
                    .locator('[data-crosshair-y-line-1] path')
                    .evaluate((element) => element.getBoundingClientRect().y);
                return Math.abs(crosshairY - box.y - box.height / 2);
            })
            .toBeLessThan(1);
        await expect(component.locator('[data-crosshair-y-line-0]')).toHaveCount(0);
    });

    test('Disabling crosshairs removes their already rendered lines', async ({mount, page}) => {
        const data = getData(true);
        const component = await mount(<ChartTestStory data={data} />);
        await hoverMarker(page, component.locator('.gcharts-marker__symbol'));
        await expect(component.locator('[data-crosshair]')).toHaveCount(2);
        await component.update(
            <ChartTestStory
                data={{
                    ...data,
                    xAxis: {...data.xAxis, crosshair: {enabled: false}},
                    yAxis: [{...data.yAxis?.[0], crosshair: {enabled: false}}],
                }}
            />,
        );
        await expect(component.locator('[data-crosshair]')).toHaveCount(0);
    });

    test('A replaced source clears hover instead of keeping stale cluster geometry', async ({
        mount,
        page,
    }) => {
        const data = getData(true);
        data.tooltip = {pin: {enabled: true}};
        const component = await mount(<ChartTestStory data={data} />);
        await hoverMarker(page, component.locator('.gcharts-marker__symbol').first());
        await page.mouse.down();
        await page.mouse.up();
        await expect(page.locator('.gcharts-tooltip')).toHaveClass(/gcharts-tooltip_pinned/);
        await expect(component.locator('[data-crosshair]')).toHaveCount(2);
        const next = getData(true);
        next.tooltip = data.tooltip;
        const series = next.series.data[0];
        if (series.type !== 'scatter') {
            throw new Error('Scatter series required');
        }
        series.data = [{x: 80, y: 10}];
        await component.update(<ChartTestStory data={next} />);
        await expect(component.locator('.gcharts-scatter__cluster-label')).toHaveCount(0);
        await expect(component.locator('[data-crosshair]')).toHaveCount(0);
        await expect(page.locator('.gcharts-tooltip')).toHaveCount(0);
        await hoverMarker(page, component.locator('.gcharts-marker__symbol'));
        await expectSnappedCrosshair(component, component.locator('.gcharts-marker__symbol'));
        await expect(page.locator('.gcharts-tooltip')).toBeVisible();
        await expect(page.locator('.gcharts-tooltip')).not.toHaveClass(/gcharts-tooltip_pinned/);
    });

    test('A delayed hover cannot restore geometry from a replaced source', async ({
        mount,
        page,
    }) => {
        const data = getData(true);
        data.tooltip = {throttle: 1000};
        const component = await mount(<ChartTestStory data={data} />);
        const marker = component.locator('.gcharts-marker__symbol');
        const box = await getLocatorBoundingBox(marker);
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await page.mouse.move(x, y);
        await expect(page.locator('.gcharts-tooltip')).toBeVisible();
        await component.locator('svg').evaluate(
            (element, position) => {
                for (const offset of [1, 2]) {
                    element.dispatchEvent(
                        new PointerEvent('pointermove', {
                            bubbles: true,
                            pointerType: 'mouse',
                            clientX: position.x + offset,
                            clientY: position.y + offset,
                        }),
                    );
                }
            },
            {x, y},
        );

        const next = getData(true);
        next.tooltip = data.tooltip;
        const series = next.series.data[0];
        if (series.type !== 'scatter') {
            throw new Error('Scatter series required');
        }
        series.data = [{x: 80, y: 10}];
        await component.update(<ChartTestStory data={next} />);
        await expect(component.locator('.gcharts-scatter__cluster-label')).toHaveCount(0);
        await expect(component.locator('[data-crosshair]')).toHaveCount(0);
        await page.waitForTimeout(1100);
        await expect(component.locator('[data-crosshair]')).toHaveCount(0);
        await expect(page.locator('.gcharts-tooltip')).toHaveCount(0);
    });

    test('Empty bounds clear hover without another pointer event', async ({mount, page}) => {
        const data = getData(true);
        data.tooltip = {pin: {enabled: true}};
        const component = await mount(
            <ChartTestStory data={data} chartStyles={{width: '100%', height: '100%'}} />,
        );
        await hoverMarker(page, component.locator('.gcharts-marker__symbol').first());
        await page.mouse.down();
        await page.mouse.up();
        await expect(page.locator('.gcharts-tooltip')).toHaveClass(/gcharts-tooltip_pinned/);
        await expect(component.locator('[data-crosshair]')).toHaveCount(2);
        await component.evaluate((element) => {
            element.style.width = '0px';
        });
        await expect(component.locator('[data-crosshair]')).toHaveCount(0);
        await expect(page.locator('.gcharts-tooltip')).toHaveCount(0);
        await component.evaluate((element) => {
            element.style.width = '400px';
        });
        await hoverMarker(page, component.locator('.gcharts-marker__symbol'));
        await expect(page.locator('.gcharts-tooltip')).toBeVisible();
        await expect(page.locator('.gcharts-tooltip')).not.toHaveClass(/gcharts-tooltip_pinned/);
    });

    test('Regrouping refreshes tooltip count, marker hover and crosshair together', async ({
        mount,
        page,
    }) => {
        const data = getData(true);
        data.xAxis = {...data.xAxis, max: 10};
        const series = data.series.data[0];
        if (series.type !== 'scatter') {
            throw new Error('Scatter series required');
        }
        series.data = [1, 1, 2.2, 2.2].map((x) => ({x, y: 50}));
        series.cluster = {enabled: true, layoutAlgorithm: {gridSize: 50}};
        const component = await mount(
            <ChartTestStory data={data} chartStyles={{width: '100%', height: '100%'}} />,
        );
        await expect(component.locator('.gcharts-scatter__cluster-label')).toHaveCount(2);
        await hoverMarker(page, component.locator('.gcharts-marker__symbol').first());
        await expect(page.locator('.gcharts-tooltip').getByText('2', {exact: true})).toBeVisible();
        await component.evaluate((element) => {
            element.style.width = '200px';
        });
        await expect(component.locator('.gcharts-scatter__cluster-label')).toHaveCount(1);
        await expect(page.locator('.gcharts-tooltip').getByText('4', {exact: true})).toBeVisible();
        await expect(component.locator('.gcharts-marker__halo')).toHaveAttribute('visibility', '');
        await expectSnappedCrosshair(component, component.locator('.gcharts-marker__symbol'));
    });

    test('A lower split plot keeps both crosshairs aligned after a stationary resize', async ({
        mount,
        page,
    }) => {
        const data = getData(true);
        data.split = {enable: true, gap: 40, plots: [{}, {}]};
        data.yAxis = [
            {min: 0, max: 100, plotIndex: 0},
            {min: 0, max: 100, plotIndex: 1, crosshair: {enabled: true, snap: true}},
        ];
        const series = data.series.data[0];
        if (series.type !== 'scatter') {
            throw new Error('Scatter series required');
        }
        series.yAxis = 1;
        const component = await mount(
            <ChartTestStory data={data} chartStyles={{width: '100%', height: '100%'}} />,
        );
        const marker = component.locator('.gcharts-marker__symbol');
        await hoverMarker(page, marker);
        await expectSnappedCrosshair(component, marker, 1);
        const before = await getLocatorBoundingBox(marker);
        await component.evaluate((element) => {
            element.style.width = '300px';
            element.style.height = '340px';
        });
        await expect
            .poll(async () => (await getLocatorBoundingBox(marker)).y)
            .toBeGreaterThan(before.y + 10);
        await expectSnappedCrosshair(component, marker, 1);
        await expect(component.locator('[data-crosshair-y-line-0]')).toHaveCount(0);
    });

    test('Resetting zoom clears a pinned cluster and allows hovering again', async ({
        mount,
        page,
    }) => {
        const data = getData(true);
        data.chart = {zoom: {enabled: true, type: 'x'}};
        data.tooltip = {pin: {enabled: true}};
        data.xAxis = {...data.xAxis, max: 9};
        const series = data.series.data[0];
        if (series.type !== 'scatter') {
            throw new Error('Scatter series required');
        }
        series.data = [1, 1, 8, 8].map((x) => ({x, y: 50}));
        series.cluster = {enabled: true, layoutAlgorithm: {gridSize: 50}};
        const component = await mount(<ChartTestStory data={data} />);
        const brush = await getLocatorBoundingBox(component.locator('.gcharts-brush'));
        const y = brush.y + brush.height / 2;
        await page.mouse.move(brush.x + brush.width * 0.05, y);
        await page.mouse.down();
        await page.mouse.move(brush.x + brush.width * 0.4, y);
        await page.mouse.up();
        await expect(component.locator('.gcharts-scatter__cluster-label')).toHaveCount(1);
        const marker = component.locator('.gcharts-marker__symbol');
        await hoverMarker(page, marker);
        await page.mouse.down();
        await page.mouse.up();
        await expect(page.locator('.gcharts-tooltip')).toHaveClass(/gcharts-tooltip_pinned/);
        await component.locator('.gcharts-chart__reset-zoom-button').click();
        await expect(component.locator('.gcharts-scatter__cluster-label')).toHaveCount(2);
        await expect(page.locator('.gcharts-tooltip')).toHaveCount(0);
        await hoverMarker(page, component.locator('.gcharts-marker__symbol').first());
        await expect(page.locator('.gcharts-tooltip')).toBeVisible();
        await expect(page.locator('.gcharts-tooltip')).not.toHaveClass(/gcharts-tooltip_pinned/);
    });
});
