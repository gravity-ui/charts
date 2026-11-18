import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {AreaSeries, ChartData, SeriesInterpolation} from '../types';

import {ChartInteractionTestStory} from './components/ChartInteractionTestStory';
import {dragElementByCalculatedPosition} from './utils';

function stack(stacking: AreaSeries['stacking'], interpolation: SeriesInterpolation): ChartData {
    return {
        title: {text: `${stacking === 'percent' ? 'Percent' : 'Normal'} · ${interpolation.type}`},
        series: {
            data: [
                {name: 'Services', values: [10, 25, 15, 30, 20]},
                {name: 'Products', values: [25, 5, 40, 0, 30]},
                {name: 'Subscriptions', values: [40, 0, 0, 50, 10]},
            ].map(({name, values}) => ({
                type: 'area',
                name,
                stacking,
                interpolation,
                marker: {enabled: true, radius: 3},
                data: values.map((y, x) => ({x, y})),
            })),
        },
        xAxis: {min: 0, max: 4, padding: {min: 0, max: 0}},
        yAxis: [{min: 0, ...(stacking === 'percent' ? {} : {max: 100})}],
    };
}

for (const {stacking, interpolation, snapshot} of [
    {stacking: 'normal', interpolation: {type: 'cardinal'}, snapshot: 'area-normal-cardinal.png'},
    {stacking: 'percent', interpolation: {type: 'monotone'}, snapshot: 'area-percent-monotone.png'},
] as const) {
    test(`${interpolation.type} ${stacking} stack keeps shared boundaries and zero intervals`, async ({
        mount,
    }) => {
        const component = await mount(
            <ChartTestStory
                data={stack(stacking, interpolation)}
                styles={{width: 640, height: 360}}
            />,
        );
        await expect(component.locator('.gcharts-area__region')).toHaveCount(3);
        const overlaps = await component.locator('.gcharts-chart').evaluateAll((charts) =>
            charts.map((chart) => {
                const regions = Array.from(
                    chart.querySelectorAll<SVGPathElement>('.gcharts-area__region'),
                );
                const lines = Array.from(
                    chart.querySelectorAll<SVGPathElement>('.gcharts-area__line'),
                );
                const boxes = regions.map((region) => region.getBBox());
                const box = {
                    x: Math.min(...boxes.map((bounds) => bounds.x)),
                    y: Math.min(...boxes.map((bounds) => bounds.y)),
                    right: Math.max(...boxes.map((bounds) => bounds.x + bounds.width)),
                    bottom: Math.max(...boxes.map((bounds) => bounds.y + bounds.height)),
                };
                let overlap = 0;
                for (let x = box.x + 3.7; x < box.right; x += 7.1) {
                    for (let y = box.y + 2.3; y < box.bottom; y += 7.3) {
                        const point = new DOMPoint(x, y);
                        if (lines.some((line) => line.isPointInStroke(point))) continue;
                        if (regions.filter((region) => region.isPointInFill(point)).length > 1)
                            overlap++;
                    }
                }
                return overlap;
            }),
        );
        expect(overlaps).toEqual([0]);
        await expect(component.locator('svg').first()).toHaveScreenshot(snapshot);
    });
}

test('step fill, outline and interactions agree while tooltip points remain original', async ({
    mount,
    page,
}) => {
    const points = [
        {x: 0, y: 20, custom: 'first'},
        {x: 10, y: 80, custom: 'second'},
    ];
    const data: ChartData = {
        chart: {events: {clickMode: 'plot'}},
        legend: {enabled: false},
        series: {
            data: [{type: 'area', name: 'Quantity', interpolation: {type: 'step'}, data: points}],
        },
        xAxis: {min: -1, max: 11},
        yAxis: [{min: 0, max: 100}],
    };
    const component = await mount(<ChartInteractionTestStory data={data} />);
    const path = component.locator('.gcharts-area__line');
    await expect(path).toHaveAttribute('d', /M/);
    const positions = await path.evaluate((node) => {
        const outline = node as SVGPathElement;
        const start = outline.getPointAtLength(0);
        const end = outline.getPointAtLength(outline.getTotalLength());
        const matrix = outline.getScreenCTM();
        if (!matrix) throw new Error('Area transform is unavailable');
        const at = (y: number) =>
            new DOMPoint(
                start.x + (end.x - start.x) * 0.8,
                start.y + ((y - 20) / 60) * (end.y - start.y),
            );
        const plateau = at(20);
        return {
            outline: outline.isPointInStroke(plateau),
            inside: at(10).matrixTransform(matrix).toJSON(),
            outside: at(50).matrixTransform(matrix).toJSON(),
        };
    });
    expect(positions.outline).toBe(true);
    await page.mouse.move(positions.inside.x, positions.inside.y);
    await expect(page.locator('.gcharts-tooltip__content-row')).toContainText('80');
    await page.mouse.click(positions.inside.x, positions.inside.y);
    await expect(component.getByTestId('interaction-count')).toHaveText('1');
    const output = component.getByTestId('interaction-result');
    const inside = JSON.parse((await output.textContent()) ?? '{}');
    expect(inside.targets).toHaveLength(1);
    expect(inside.targets[0].point).toEqual({kind: 'shape', points});
    expect(inside.tooltip.point).toEqual(points[1]);
    await page.mouse.click(positions.outside.x, positions.outside.y);
    await expect(component.getByTestId('interaction-count')).toHaveText('2');
    expect(JSON.parse((await output.textContent()) ?? '{}').targets).toEqual([]);
});

test('smooth percent stacks recompute after hiding a series and retain range-slider interpolation', async ({
    mount,
    page,
}) => {
    const data = stack('percent', {type: 'cardinal'});
    data.chart = {zoom: {enabled: true, type: 'x'}};
    data.xAxis = {...data.xAxis, rangeSlider: {enabled: true}};
    const component = await mount(
        <ChartTestStory data={data} styles={{width: 640, height: 400}} />,
    );
    const regions = component.locator('.gcharts-chart__content .gcharts-area__region');
    await expect(regions).toHaveCount(3);
    const preview = component.locator('.gcharts-range-slider .gcharts-area__line');
    await expect(preview).toHaveCount(3);
    // Sampling has more than the five observed vertices even in the preview.
    expect(((await preview.first().getAttribute('d')) ?? '').split('L').length).toBeGreaterThan(5);
    const previous = await regions.last().getAttribute('d');
    await component
        .locator('.gcharts-legend__item')
        .filter({hasText: 'Products'})
        .click({modifiers: ['Control']});
    await expect(regions).toHaveCount(2);
    await expect(regions.last()).not.toHaveAttribute('d', previous ?? '');
    await dragElementByCalculatedPosition({
        component,
        page,
        selector: '.gcharts-chart__content .gcharts-brush .overlay',
        getDragOptions: ({boundingBox}) => ({
            from: [boundingBox.x + boundingBox.width * 0.3, boundingBox.y + boundingBox.height / 2],
            to: [boundingBox.x + boundingBox.width * 0.7, boundingBox.y + boundingBox.height / 2],
        }),
    });
    await expect(component.locator('.gcharts-chart__reset-zoom-button')).toBeVisible();
    await expect(regions).toHaveCount(2);
    await expect(regions.last()).toHaveAttribute('d', /M/);
});
