import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator} from '@playwright/test';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

function getClipRect(locator: Locator) {
    return locator.evaluate((element) => {
        const id = (element.getAttribute('clip-path') ?? '').slice(5, -1);
        const rect = document.getElementById(id)?.querySelector('rect');
        return {
            x: rect?.getAttribute('x'),
            y: rect?.getAttribute('y'),
            width: rect?.getAttribute('width'),
            height: rect?.getAttribute('height'),
        };
    });
}

const points = [
    {x: 0, y: 0},
    {x: 1, y: 1},
];

for (const series of [
    {type: 'line', name: 'line', rangeSlider: {lineWidth: 12}, data: points},
    {type: 'scatter', name: 'scatter', data: points},
] satisfies ChartData['series']['data']) {
    const {type} = series;
    test(`Range-slider ${type} references the preview bounds without explicit Y limits`, async ({
        mount,
    }) => {
        const data: ChartData = {
            legend: {enabled: false},
            xAxis: {type: 'linear', rangeSlider: {enabled: true}},
            series: {data: [series]},
        };
        const component = await mount(<ChartTestStory data={data} />);
        const slider = component.locator('.gcharts-range-slider');
        const preview = slider.locator(`.gcharts-range-slider__shapes > .gcharts-${type}`);
        await expect(preview.locator('path')).not.toHaveCount(0);
        const clip = await getClipRect(preview);
        expect(clip).toEqual({
            x: '0',
            y: '0',
            width: await slider.getAttribute('width'),
            height: await slider.getAttribute('height'),
        });
        expect(Number(clip.width)).toBeGreaterThan(0);
        expect(Number(clip.height)).toBeGreaterThan(0);
    });
}
