import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import StepExample from '../../docs/examples/src/charts/line-interpolation/step';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

import {ChartInteractionTestStory} from './components/ChartInteractionTestStory';
import {getLocatorBoundingBox} from './utils';

test.describe('Step interpolation', () => {
    test('positions with markers and automatic labels', async ({mount}) => {
        const points = [
            {x: 0, y: 20},
            {x: 1, y: 60},
            {x: 3, y: 40},
            {x: 4, y: 80},
            {x: 6, y: 30},
        ];
        const data: ChartData = {
            series: {
                data: (['middle', 'before', 'after'] as const).map((position, index) => ({
                    type: 'line',
                    name: position,
                    interpolation: {type: 'step', position},
                    lineWidth: 2,
                    marker: {enabled: true, radius: 3},
                    dataLabels: {enabled: true, placement: 'auto'},
                    data: points.map((point) => ({...point, y: point.y + index * 100})),
                })),
            },
            xAxis: {min: -0.5, max: 6.5},
            yAxis: [{min: 0, max: 300}],
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 640, height: 480}} />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    for (const nullMode of ['skip', 'connect', 'zero'] as const) {
        test(`preserves nullMode ${nullMode}`, async ({mount}) => {
            const data: ChartData = {
                legend: {enabled: false},
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Price',
                            interpolation: {type: 'step', position: 'after'},
                            nullMode,
                            marker: {enabled: true},
                            data: [
                                {x: 0, y: 20},
                                {x: 1, y: 40},
                                {x: 2, y: null},
                                {x: 3, y: 60},
                                {x: 4, y: 30},
                            ],
                        },
                    ],
                },
                xAxis: {min: -1, max: 5},
                yAxis: [{min: -10, max: 80}],
            };
            const component = await mount(<ChartTestStory data={data} />);
            const path = component.locator('.gcharts-line > path');
            await expect(path).toBeVisible();
            const d = (await path.getAttribute('d')) ?? '';
            expect(d.match(/M/g)).toHaveLength(nullMode === 'skip' ? 2 : 1);
            await expect(component.locator('.gcharts-marker__symbol')).toHaveCount(
                nullMode === 'zero' ? 5 : 4,
            );
        });
    }

    test('clicks the step and keeps tooltip values at original points', async ({mount, page}) => {
        const points = [
            {x: 0, y: 20, custom: {id: 'first'}},
            {x: 10, y: 80, custom: {id: 'second'}},
        ];
        const data: ChartData = {
            chart: {events: {clickMode: 'plot'}},
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Price',
                        interpolation: {type: 'step', position: 'after'},
                        lineWidth: 4,
                        data: points,
                    },
                ],
            },
            xAxis: {min: -1, max: 11},
            yAxis: [{min: 0, max: 100}],
        };
        const component = await mount(<ChartInteractionTestStory data={data} />);
        const path = component.locator('.gcharts-line > path');
        await expect(path).toBeVisible();
        const {start, end} = await path.evaluate((node) => {
            const line = node as SVGPathElement;
            const matrix = line.getScreenCTM();
            if (!matrix) throw new Error('Line transform is unavailable');
            const startPoint = line.getPointAtLength(0).matrixTransform(matrix);
            const endPoint = line.getPointAtLength(line.getTotalLength()).matrixTransform(matrix);
            return {
                start: {x: startPoint.x, y: startPoint.y},
                end: {x: endPoint.x, y: endPoint.y},
            };
        });
        // This part of the horizontal step is far from the straight chord.
        const position = {x: start.x + (end.x - start.x) * 0.8, y: start.y};
        await page.mouse.move(position.x, position.y);
        await expect(page.locator('.gcharts-tooltip__content-row')).toContainText('80');
        const marker = await getLocatorBoundingBox(component.locator('.gcharts-marker__symbol'));
        expect(marker.x + marker.width / 2).toBeCloseTo(end.x, 0);
        expect(marker.y + marker.height / 2).toBeCloseTo(end.y, 0);

        await page.mouse.click(position.x, position.y);
        await expect(component.getByTestId('interaction-count')).toHaveText('1');
        const output = component.getByTestId('interaction-result');
        const result = JSON.parse((await output.textContent()) ?? '{}');
        expect(result.targets).toHaveLength(1);
        expect(result.targets[0].point).toEqual({kind: 'shape', points});
        expect(result.tooltip.point).toEqual(points[1]);
        // The chord between the points is outside the painted step.
        await page.mouse.click(
            start.x + (end.x - start.x) * 0.2,
            start.y + (end.y - start.y) * 0.2,
        );
        await expect(component.getByTestId('interaction-count')).toHaveText('2');
        expect(JSON.parse((await output.textContent()) ?? '{}').targets).toEqual([]);
    });

    test('documentation example', async ({mount}) => {
        const component = await mount(
            <div style={{width: 640, height: 320}}>
                <StepExample />
            </div>,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
