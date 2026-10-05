import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {AreaSeries, ChartData} from '../types';

import {dragElementByCalculatedPosition} from './utils';

const stackedSeries: AreaSeries[] = [
    {
        type: 'area',
        name: 'Green',
        stacking: 'normal',
        color: '#4caf50',
        data: [10, 20, 10].map((y, x) => ({x, y})),
    },
    {
        type: 'area',
        name: 'Blue',
        stacking: 'normal',
        color: '#3063e5',
        data: [20, 10, 20].map((y, x) => ({x, y})),
    },
];

for (const {name, yAxis} of [
    {name: 'logarithmic Y (#727)', yAxis: {type: 'logarithmic' as const, min: 1, max: 100}},
    {
        name: 'reversed Y (#728)',
        yAxis: {type: 'linear' as const, min: 0, max: 40, order: 'reverse' as const},
    },
]) {
    test(`stacked area renders both layers on ${name}`, async ({mount}) => {
        const data: ChartData = {
            chart: {margin: {top: 20, right: 20, bottom: 20, left: 20}},
            legend: {enabled: false},
            xAxis: {type: 'category', categories: ['A', 'B', 'C']},
            yAxis: [yAxis],
            series: {data: stackedSeries},
        };
        const chart = await mount(
            <ChartTestStory data={data} styles={{width: 600, height: 360}} />,
        );
        await expect(chart.locator('.gcharts-area__region')).toHaveCount(2);
        await expect(chart.locator('svg').first()).toHaveScreenshot(
            name.startsWith('logarithmic')
                ? 'area-logarithmic-stack.png'
                : 'area-reversed-stack.png',
        );
    });
}

test('isolated area point does not lift the next layer after X zoom (#729)', async ({
    mount,
    page,
}) => {
    const data: ChartData = {
        chart: {
            zoom: {enabled: true, type: 'x'},
            margin: {top: 20, right: 20, bottom: 20, left: 20},
        },
        legend: {enabled: false},
        xAxis: {type: 'category', categories: ['A', 'B', 'C', 'D', 'E']},
        yAxis: [{type: 'linear', min: 0, max: 10}],
        series: {
            data: [
                {
                    type: 'area',
                    name: 'Upper',
                    stacking: 'normal',
                    color: '#3063e5',
                    marker: {enabled: true},
                    data: ['A', 'B', 'C', 'D', 'E'].map((x) => ({x, y: 2})),
                },
                {
                    type: 'area',
                    name: 'Isolated',
                    stacking: 'normal',
                    nullMode: 'skip',
                    color: '#4caf50',
                    marker: {enabled: true},
                    data: ['A', 'B', 'C', 'D', 'E'].map((x) => ({x, y: x === 'C' ? 5 : null})),
                },
            ],
        },
    };
    const chart = await mount(<ChartTestStory data={data} styles={{width: 600, height: 400}} />);
    const svg = chart.locator('svg').first();
    await expect(svg).toHaveScreenshot('area-isolated-before-zoom.png');
    await dragElementByCalculatedPosition({
        component: chart,
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
    await expect(chart.locator('.gcharts-chart__reset-zoom-button')).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(svg).toHaveScreenshot('area-isolated-after-zoom.png');
});

test('area on a plot without drawable height is skipped', async ({mount}) => {
    const data: ChartData = {
        chart: {margin: {top: 20, right: 20, bottom: 20, left: 20}},
        legend: {enabled: false},
        split: {enable: true, gap: '400px', plots: [{}, {}]},
        xAxis: {type: 'category', categories: ['A', 'B', 'C']},
        yAxis: [
            {type: 'linear', plotIndex: 0},
            {type: 'linear', plotIndex: 1},
        ],
        series: {
            data: [
                {...stackedSeries[0], yAxis: 0},
                {...stackedSeries[1], yAxis: 1},
            ],
        },
    };
    const chart = await mount(<ChartTestStory data={data} styles={{width: 600, height: 360}} />);
    await expect(chart.locator('.gcharts-x-axis').first()).toBeVisible();
    await expect(chart.locator('.gcharts-area__region')).toHaveCount(0);
});
