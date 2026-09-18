import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ResizeInteractionPerformanceStory} from '../../playwright/components/ResizeInteractionPerformanceStory';
import type {ResizeInteractionMetrics} from '../../playwright/components/ResizeInteractionPerformanceStory';
import type {ChartData, LineSeries} from '../types';

import {generateSeriesData} from './__data__/utils';

const INTERACTION_P95_LIMIT = 200;

test('continuous resize keeps interaction updates responsive @perf', async ({mount}) => {
    test.setTimeout(30_000);

    const pointCount = 25000;
    const series: LineSeries[] = [
        generateSeriesData({
            type: 'line',
            pointCount,
            generateY: (_x, index) => Math.sin(index / 50) * 100 + 200,
            overrides: {name: 'Series 1'},
        }),
        generateSeriesData({
            type: 'line',
            pointCount,
            generateY: (_x, index) => Math.sin(index / 50) * 100 + 100,
            overrides: {name: 'Series 2'},
        }),
    ];
    const data: ChartData = {series: {data: series}};
    const component = await mount(<ResizeInteractionPerformanceStory data={data} />);

    await component.locator('svg').waitFor({state: 'visible'});
    await component.getByTestId('start-measurement').click();

    const metricsNode = component.getByTestId('metrics');
    await expect(metricsNode).not.toHaveText('', {timeout: 10_000});
    const metrics = JSON.parse((await metricsNode.textContent()) ?? '') as ResizeInteractionMetrics;

    console.info('continuous resize metrics', metrics);
    expect(metrics.resizeCount).toBeGreaterThanOrEqual(5);
    expect(metrics.interactionCount).toBeGreaterThanOrEqual(10);
    expect(metrics.interactionP95).toBeLessThan(INTERACTION_P95_LIMIT);
});
