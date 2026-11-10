import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {MountResult} from '@playwright/experimental-ct-react';
import type {Page} from '@playwright/test';

import StepExample from '../../docs/examples/src/charts/line-interpolation/step';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

import {ChartInteractionTestStory} from './components/ChartInteractionTestStory';
import {dragElementByCalculatedPosition, getLocatorBoundingBox} from './utils';

async function zoomX(component: MountResult, page: Page, from: number, to: number) {
    const path = component.locator('.gcharts-line > path');
    const previous = await path.getAttribute('d');
    await dragElementByCalculatedPosition({
        component,
        page,
        selector: '.gcharts-chart__content .gcharts-brush .overlay',
        getDragOptions: ({boundingBox}) => {
            const y = boundingBox.y + boundingBox.height / 2;
            return {
                from: [boundingBox.x + boundingBox.width * from, y],
                to: [boundingBox.x + boundingBox.width * to, y],
            };
        },
    });
    await expect(component.locator('.gcharts-chart__reset-zoom-button')).toBeVisible();
    await expect(path).not.toHaveAttribute('d', previous ?? '');
    await expect(path).toHaveAttribute('d', /M/);
}

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
            await expect(component.locator('.gcharts-marker__symbol')).toHaveCount(
                nullMode === 'zero' ? 5 : 4,
            );
            const geometry = await path.evaluate((node) => {
                const line = node as SVGPathElement;
                const start = line.getPointAtLength(0);
                const end = line.getPointAtLength(line.getTotalLength());
                const at = (x: number, y: number) =>
                    new DOMPoint(
                        start.x + (x / 4) * (end.x - start.x),
                        start.y + ((y - 20) / 10) * (end.y - start.y),
                    );
                const matrix = line.getScreenCTM();
                if (!matrix) throw new Error('Line transform is unavailable');
                const zero = at(2, 0).matrixTransform(matrix);
                return {
                    firstPlateau: line.isPointInStroke(at(0.5, 20)),
                    connectedPlateau: line.isPointInStroke(at(2.5, 40)),
                    zeroPlateau: line.isPointInStroke(at(2.5, 0)),
                    zeroTransition: line.isPointInStroke(at(2, 20)),
                    zero: {x: zero.x, y: zero.y},
                };
            });
            expect(geometry.firstPlateau).toBe(true);
            expect(geometry.connectedPlateau).toBe(nullMode === 'connect');
            expect(geometry.zeroPlateau).toBe(nullMode === 'zero');
            expect(geometry.zeroTransition).toBe(nullMode === 'zero');
            if (nullMode === 'zero') {
                const marker = await getLocatorBoundingBox(
                    component.locator('.gcharts-marker__symbol').nth(2),
                );
                expect(marker.x + marker.width / 2).toBeCloseTo(geometry.zero.x, 0);
                expect(marker.y + marker.height / 2).toBeCloseTo(geometry.zero.y, 0);
            }
        });
    }

    test('keeps a plateau when zooming between recorded changes', async ({mount, page}) => {
        const data: ChartData = {
            chart: {zoom: {enabled: true, type: 'x'}},
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Price',
                        interpolation: {type: 'step', position: 'after'},
                        data: [
                            {x: 0, y: 20},
                            {x: 10, y: 80},
                        ],
                    },
                ],
            },
            xAxis: {min: 0, max: 10},
            yAxis: [{min: 0, max: 100}],
        };
        const component = await mount(<ChartTestStory data={data} />);
        const path = component.locator('.gcharts-line > path');
        await expect(path).toHaveAttribute('d', /M/);
        await zoomX(component, page, 0.2, 0.4);
        const plot = await getLocatorBoundingBox(
            component.locator('.gcharts-chart__content .gcharts-brush .overlay'),
        );
        const onPlateau = await path.evaluate((node, bounds) => {
            const line = node as SVGPathElement;
            const matrix = line.getScreenCTM();
            if (!matrix) throw new Error('Line transform is unavailable');
            return [0.25, 0.75].every((fraction) => {
                const point = new DOMPoint(
                    bounds.x + bounds.width * fraction,
                    bounds.y + bounds.height * 0.8,
                ).matrixTransform(matrix.inverse());
                return line.isPointInStroke(point);
            });
        }, plot);
        expect(onPlateau).toBe(true);

        await zoomX(component, page, 0.3, 0.7);
    });

    test('keeps the plateau with automatic Y bounds when zoom includes the next change', async ({
        mount,
        page,
    }) => {
        const data: ChartData = {
            chart: {zoom: {enabled: true, type: 'x'}},
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Price',
                        interpolation: {type: 'step'},
                        lineWidth: 2,
                        data: [
                            {x: 0, y: 20},
                            {x: 10, y: 80},
                        ],
                    },
                    {type: 'scatter', name: 'Reference', data: [{x: 3, y: 50}]},
                ],
            },
            xAxis: {min: 0, max: 10},
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 640, height: 360}} />,
        );
        const path = component.locator('.gcharts-line > path');
        await expect(path).toHaveAttribute('d', /M/);
        await zoomX(component, page, 0.2, 1);
        const plot = await getLocatorBoundingBox(
            component.locator('.gcharts-chart__content .gcharts-brush .overlay'),
        );
        const plateau = await path.evaluate((node) => {
            const line = node as SVGPathElement;
            const matrix = line.getScreenCTM();
            if (!matrix) throw new Error('Line transform is unavailable');
            const start = line.getPointAtLength(0).matrixTransform(matrix);
            return {y: start.y};
        });
        expect(plateau.y).toBeGreaterThanOrEqual(plot.y);
        expect(plateau.y).toBeLessThanOrEqual(plot.y + plot.height);
        await page.mouse.move(0, 0);
        await expect(component.locator('.gcharts-chart > svg')).toHaveScreenshot();
    });

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
