import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData, ChartSeries, LinearGradient} from '../types';

import {dragElementByCalculatedPosition, getLocatorBoundingBox} from './utils';

const colors = [0, 60, 120, 180, 240].map((value) => `rgb(${value}, ${value}, ${value})`);

function getData(type: 'line' | 'area' | 'area-range'): ChartData {
    const color: LinearGradient = {
        type: 'linear-gradient',
        angle: 90,
        stops: colors.map((stopColor, index) => ({offset: index / 4, color: stopColor})),
    };
    const points = colors.map((pointColor, index) => ({x: index, y: index + 1, color: pointColor}));
    const series: ChartSeries =
        type === 'area-range'
            ? {
                  type,
                  name: 'Value',
                  marker: {enabled: true},
                  color,
                  data: points.map((point) => ({...point, y0: point.y, y1: point.y + 1})),
              }
            : {type, name: 'Value', marker: {enabled: true}, color, data: points};
    return {
        chart: {zoom: {enabled: true, type: 'x'}},
        xAxis: {type: 'category', categories: ['A', 'B', 'C', 'D', 'E']},
        yAxis: [{type: 'linear'}],
        series: {data: [series]},
        legend: {
            enabled: true,
            type: 'continuous',
            title: {text: 'Color value'},
            colorScale: {colors: ['#000000', '#f0f0f0'], domain: [0, 100]},
        },
    };
}

test.describe('Gradient colors across zoom', () => {
    test.describe.configure({timeout: 20_000});

    test('range-slider changes preserve colors and clipping neighbors', async ({mount, page}) => {
        const data = getData('line');
        data.xAxis = {
            type: 'linear',
            min: 0,
            max: 4,
            rangeSlider: {enabled: true},
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{height: 400, width: 800}} />,
        );
        const chart = component.locator('svg').first();
        await expect(chart).toHaveScreenshot('slider-full-range.png');
        const sliderBox = await getLocatorBoundingBox(
            component.locator('.gcharts-range-slider .gcharts-brush .overlay'),
        );

        await dragElementByCalculatedPosition({
            component,
            page,
            selector: '.gcharts-range-slider .gcharts-brush .handle--w',
            getDragOptions: ({boundingBox}) => {
                const y = boundingBox.y + boundingBox.height / 2;
                const start = boundingBox.x + boundingBox.width / 2;
                // Select 1.8–4: retain C–E and the preceding point for clipping.
                return {from: [start, y], to: [start + sliderBox.width * 0.45, y]};
            },
        });
        await page.mouse.move(0, 0);
        // C–E plus B, retained outside the viewport for clipping.
        await expect(
            component.locator('.gcharts-chart__content .gcharts-marker__symbol'),
        ).toHaveCount(4);
        await expect(chart).toHaveScreenshot('slider-selected-range.png');
    });

    for (const type of ['line', 'area', 'area-range'] as const) {
        test(`${type}: selecting C–E preserves the gradient colors`, async ({mount, page}) => {
            const component = await mount(
                <ChartTestStory data={getData(type)} styles={{height: 400, width: 800}} />,
            );
            const chart = component.locator('svg').first();
            await expect(chart).toHaveScreenshot(`${type}-before-zoom.png`);

            await dragElementByCalculatedPosition({
                component,
                page,
                selector: '.gcharts-chart__content .gcharts-brush .overlay',
                getDragOptions: ({boundingBox}) => {
                    const y = boundingBox.y + boundingBox.height / 2;
                    return {
                        from: [boundingBox.x + boundingBox.width * 0.45, y],
                        to: [boundingBox.x + boundingBox.width * 0.99, y],
                    };
                },
            });
            await expect(component.locator('.gcharts-chart__reset-zoom-button')).toBeVisible();
            await page.mouse.move(0, 0);
            await expect(chart.locator('.gcharts-marker__symbol')).toHaveCount(
                type === 'area-range' ? 6 : 3,
            );
            await expect(chart).toHaveScreenshot(`${type}-zoom-c-e.png`);

            await component.locator('.gcharts-chart__reset-zoom-button').click();
            await expect(component.locator('.gcharts-chart__reset-zoom-button')).toHaveCount(0);
            await page.mouse.move(0, 0);
            await expect(chart).toHaveScreenshot(`${type}-before-zoom.png`);
        });
    }
});
