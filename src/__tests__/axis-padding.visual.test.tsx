import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import AxisPaddingExample from '../../docs/examples/src/charts/layout/axis-padding';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData, ChartSeries} from '../types';

import {getLocatorBoundingBox} from './utils';

function dataFor(type: 'line' | 'area' | 'area-range' | 'scatter'): ChartData {
    const points = [
        {x: 0, y: 50},
        {x: 1, y: 100},
        {x: 2, y: 50},
    ];
    let series: ChartSeries;
    if (type === 'area-range') {
        series = {
            type,
            name: 'Forecast',
            marker: {enabled: true, radius: 10},
            data: points.map(({x, y}) => ({x, y0: y - 20, y1: y})),
        };
    } else if (type === 'scatter') {
        series = {type, name: 'Revenue', data: points.map((p) => ({...p, radius: 10}))};
    } else {
        series = {
            type,
            name: 'Revenue',
            marker: {enabled: true, radius: 10, borderWidth: 2},
            data: points,
        };
        if (series.type === 'line') series.dataLabels = {enabled: true, anchor: 'marker-edge'};
    }
    return {
        legend: {enabled: false},
        xAxis: {padding: {min: 'auto', max: 'auto'}},
        yAxis: [{min: 0, padding: {max: 'auto'}, endOnTick: true}],
        series: {data: [series]},
    };
}

test.describe('Axis padding', () => {
    for (const type of ['line', 'area', 'area-range', 'scatter'] as const) {
        test(`${type} fits markers with a continuous axis and stable hover`, async ({
            mount,
            page,
        }) => {
            const component = await mount(
                <ChartTestStory data={dataFor(type)} styles={{width: 600, height: 300}} />,
            );
            const svg = component.locator('svg');
            const markers = component.locator('.gcharts-marker__symbol[d]');
            await expect(markers).toHaveCount(type === 'area-range' ? 6 : 3);
            const svgBox = await getLocatorBoundingBox(svg);
            const boxes = await markers.evaluateAll((nodes) =>
                nodes.map((node) => node.getBoundingClientRect().toJSON()),
            );
            for (const box of boxes) {
                expect(box.x).toBeGreaterThanOrEqual(svgBox.x);
                expect(box.right).toBeLessThanOrEqual(svgBox.x + svgBox.width);
                expect(box.y).toBeGreaterThanOrEqual(svgBox.y);
            }
            const ticks = component.locator('.gcharts-y-axis__tick text');
            await expect(ticks.first()).toBeVisible();
            const labels = await ticks.allTextContents();
            expect(labels.some((value) => Number(value) > 100)).toBe(true);
            const before = await ticks.evaluateAll((nodes) =>
                nodes.map((node) => node.getBoundingClientRect().toJSON()),
            );
            const right = boxes.reduce((a, b) => (a.right > b.right ? a : b));
            await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2);
            await expect(page.locator('.gcharts-tooltip')).toBeVisible();
            expect(
                await ticks.evaluateAll((nodes) =>
                    nodes.map((node) => node.getBoundingClientRect().toJSON()),
                ),
            ).toEqual(before);
            await page.mouse.move(700, 500);
            await expect(svg).toHaveScreenshot();
        });
    }

    test('keeps explicit maximum limits and tick labels unchanged', async ({mount}) => {
        const data = dataFor('line');
        data.yAxis = [{min: 0, max: 100, endOnTick: false, padding: {max: 'auto'}}];
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        const labels = component.locator('.gcharts-y-axis__tick text');
        await expect(labels.last()).toBeVisible();
        expect((await labels.allTextContents()).map(Number)).toContain(100);
        expect((await labels.allTextContents()).map(Number).every((value) => value <= 100)).toBe(
            true,
        );
    });

    test('renders the guide example', async ({mount}) => {
        const component = await mount(
            <div style={{width: 600, height: 320}}>
                <AxisPaddingExample />
            </div>,
        );
        await expect(component.locator('.gcharts-marker__symbol[d]')).toHaveCount(4);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('restores automatic padding after resetting zoom', async ({mount, page}) => {
        const data = dataFor('line');
        data.chart = {zoom: {enabled: true, type: 'x'}};
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        const markers = component.locator('.gcharts-marker__symbol[d]');
        await expect(markers).toHaveCount(3);
        const before = await markers.evaluateAll((nodes) =>
            nodes.map((node) => node.getBoundingClientRect().toJSON()),
        );
        const ticks = component.locator('.gcharts-x-axis__tick text');
        const labels = await ticks.allTextContents();
        const brush = await getLocatorBoundingBox(component.locator('.gcharts-brush'));
        await page.mouse.move(brush.x + brush.width * 0.2, brush.y + brush.height / 2);
        await page.mouse.down();
        await page.mouse.move(brush.x + brush.width * 0.8, brush.y + brush.height / 2, {steps: 10});
        await page.mouse.up();
        const reset = component.locator('.gcharts-chart__reset-zoom-button');
        await expect(reset).toBeVisible();
        await expect.poll(() => ticks.allTextContents()).not.toEqual(labels);
        await reset.click();
        await expect(reset).not.toBeVisible();
        await expect(markers).toHaveCount(3);
        await expect
            .poll(() =>
                markers.evaluateAll((nodes) =>
                    nodes.map((node) => node.getBoundingClientRect().toJSON()),
                ),
            )
            .toEqual(before);
    });

    test('recovers from zero plot width', async ({mount}) => {
        const data = dataFor('scatter');
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        await expect(component.locator('.gcharts-marker__symbol[d]')).toHaveCount(3);
        await component.update(<ChartTestStory data={data} styles={{width: 1, height: 300}} />);
        await expect
            .poll(async () => (await getLocatorBoundingBox(component.locator('svg'))).width)
            .toBe(1);
        await component.update(<ChartTestStory data={data} styles={{width: 600, height: 300}} />);
        const markers = component.locator('.gcharts-marker__symbol[d]');
        await expect(markers).toHaveCount(3);
        expect(
            await markers.evaluateAll((nodes) =>
                nodes.every((node) => !/NaN|Infinity/.test(node.outerHTML)),
            ),
        ).toBe(true);
    });
});
