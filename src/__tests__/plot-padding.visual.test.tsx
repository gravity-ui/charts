import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import PlotPaddingExample from '../../docs/examples/src/charts/layout/plot-padding';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData, ChartPlotPadding, ChartSeries} from '../types';

import {getLocatorBoundingBox} from './utils';

const auto: ChartPlotPadding = {top: 'auto', right: 'auto', bottom: 'auto', left: 'auto'};
function dataFor(
    type: 'line' | 'area' | 'area-range' | 'scatter',
    plotPadding?: ChartPlotPadding,
): ChartData {
    const points = [
        {x: 0, y: 30},
        {x: 1, y: 50},
        {x: 2, y: 80},
    ];
    let series: ChartSeries;
    if (type === 'area-range') {
        series = {
            type,
            name: 'Revenue range',
            marker: {enabled: true, radius: 10, borderWidth: 2},
            data: points.map(({x, y}) => ({x, y0: y - 10, y1: y + 10})),
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
    }
    return {
        chart: {plotPadding},
        legend: {enabled: false},
        xAxis: {type: 'linear', min: 0, max: 2},
        yAxis: [{min: 0, max: 100}],
        series: {data: [series]},
    };
}

test.describe('Plot padding', () => {
    for (const type of ['line', 'area', 'area-range', 'scatter'] as const) {
        test(`${type} fits edge markers and hover without moving the scales`, async ({
            mount,
            page,
        }) => {
            const component = await mount(
                <ChartTestStory data={dataFor(type, auto)} styles={{width: 600, height: 300}} />,
            );
            const svg = component.locator('svg');
            const markers = component.locator('.gcharts-marker__symbol[d]');
            await expect(markers).toHaveCount(type === 'area-range' ? 6 : 3);
            const svgBox = await getLocatorBoundingBox(svg);
            const boxes = await markers.evaluateAll((elements) =>
                elements.map((element) => {
                    const box = element.getBoundingClientRect();
                    return {x: box.x, right: box.right, y: box.y, bottom: box.bottom};
                }),
            );
            for (const box of boxes) {
                expect(box.x).toBeGreaterThanOrEqual(svgBox.x - 0.1);
                expect(box.right).toBeLessThanOrEqual(svgBox.x + svgBox.width + 0.1);
            }
            const right = boxes.reduce((a, b) => (a.right > b.right ? a : b));
            const ticks = component.locator('.gcharts-x-axis');
            const before = await ticks
                .locator('.tick')
                .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('transform')));
            await page.mouse.move((right.x + right.right) / 2, (right.y + right.bottom) / 2);
            if (type === 'scatter') {
                const halo = component.locator('.gcharts-marker__halo[visibility=""]');
                await expect(halo).toHaveCount(1);
                const haloBox = await getLocatorBoundingBox(halo);
                expect(haloBox.x).toBeGreaterThanOrEqual(svgBox.x - 0.1);
                expect(haloBox.x + haloBox.width).toBeLessThanOrEqual(
                    svgBox.x + svgBox.width + 0.1,
                );
            }
            await expect
                .poll(async () =>
                    markers.evaluateAll((elements) =>
                        Math.max(
                            ...elements.map((element) => element.getBoundingClientRect().right),
                        ),
                    ),
                )
                .toBeLessThanOrEqual(svgBox.x + svgBox.width + 0.1);
            expect(
                await ticks
                    .locator('.tick')
                    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('transform'))),
            ).toEqual(before);
            await expect(svg).toHaveScreenshot();
        });
    }

    test('keeps default clipping and adds explicit padding to external margin', async ({mount}) => {
        const data = dataFor('line');
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        const last = component.locator('.gcharts-marker__symbol[d]').last();
        await expect(last).toBeVisible();
        const root = await getLocatorBoundingBox(component.locator('svg'));
        expect(
            (await getLocatorBoundingBox(last)).x + (await getLocatorBoundingBox(last)).width,
        ).toBeGreaterThan(root.x + root.width);
        await component.update(
            <ChartTestStory
                data={{...data, chart: {margin: {right: 10}, plotPadding: {right: 16}}}}
                styles={{width: 600, height: 300}}
            />,
        );
        await expect
            .poll(async () => {
                const box = await getLocatorBoundingBox(last);
                return root.x + root.width - box.x - box.width / 2;
            })
            .toBeCloseTo(26, 1);
    });

    test('does not reveal out-of-domain markers inside the new inset', async ({mount, page}) => {
        const data = dataFor('line', {right: 40});
        const s = data.series.data[0];
        if (s.type !== 'line') throw new Error('Expected line');
        s.data.push({x: 2.05, y: 80});
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        await expect(component.locator('.gcharts-marker__symbol[d]')).toHaveCount(3);
        const right = await getLocatorBoundingBox(
            component.locator('.gcharts-marker__symbol[d]').last(),
        );
        await page.mouse.move(right.x + right.width / 2 + 20, right.y + right.height / 2);
        await expect(component.locator('.gcharts-marker__wrapper:visible > path[d]')).toHaveCount(
            3,
        );
    });

    test('recovers finite marker positions after resizing through zero plot width', async ({
        mount,
    }) => {
        const data = dataFor('line', {right: 'auto'});
        data.chart = {...data.chart, margin: {left: 40, right: 40}};
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        const markers = component.locator('.gcharts-marker__symbol[d]');
        await expect(markers).toHaveCount(3);
        await component.update(<ChartTestStory data={data} styles={{width: 60, height: 300}} />);
        await expect(markers).toHaveCount(0);
        await component.update(<ChartTestStory data={data} styles={{width: 900, height: 300}} />);
        await expect(markers).toHaveCount(3);
        const svgBox = await getLocatorBoundingBox(component.locator('svg'));
        const last = await getLocatorBoundingBox(markers.last());
        expect(Number.isFinite(last.x)).toBe(true);
        expect(last.x + last.width).toBeLessThanOrEqual(svgBox.x + svgBox.width - 40 + 0.1);
        expect(last.x).toBeGreaterThan(svgBox.x + svgBox.width / 2);
    });

    test('recomputes padding after zoom and reset without revealing excluded points', async ({
        mount,
        page,
    }) => {
        const data = dataFor('line', auto);
        data.chart = {...data.chart, zoom: {enabled: true, type: 'x'}};
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 300}} />,
        );
        const markers = component.locator('.gcharts-marker__symbol[d]');
        await expect(markers).toHaveCount(3);
        const brush = await getLocatorBoundingBox(component.locator('.gcharts-brush'));
        await page.mouse.move(brush.x + brush.width * 0.1, brush.y + brush.height / 2);
        await page.mouse.down();
        await page.mouse.move(brush.x + brush.width * 0.9, brush.y + brush.height / 2, {steps: 8});
        await page.mouse.up();
        await expect(markers).toHaveCount(1);
        await component.locator('.gcharts-chart__reset-zoom-button').click();
        await expect(markers).toHaveCount(3);
        const svgBox = await getLocatorBoundingBox(component.locator('svg'));
        const last = await getLocatorBoundingBox(markers.last());
        expect(last.x + last.width).toBeLessThanOrEqual(svgBox.x + svgBox.width + 0.1);
    });

    test('renders the guide example', async ({mount}) => {
        const component = await mount(
            <div style={{width: 600, height: 320}}>
                <PlotPaddingExample />
            </div>,
        );
        await expect(component.locator('.gcharts-marker__symbol[d]')).toHaveCount(4);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
