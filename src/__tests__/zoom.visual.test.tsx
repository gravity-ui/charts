import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {MountResult} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {barYDatetimeYData, lineTwoYAxisData, scatterBasicData} from '../__stories__/__data__';
import type {ChartData, ChartZoom} from '../types';

type BoundingBox = NonNullable<
    Awaited<ReturnType<ReturnType<MountResult['locator']>['boundingBox']>>
>;

type ZoomOptions = NonNullable<Parameters<MountResult['dragTo']>[1]>;

type GetZoomOptions = (boundingBox: BoundingBox) => ZoomOptions;

type ResetButtonConfig = NonNullable<ChartZoom['resetButton']>;
type ResetButtonAlign = NonNullable<ResetButtonConfig['align']>;
type ResetButtonRelativeTo = NonNullable<ResetButtonConfig['relativeTo']>;

const getZoomXOptions: GetZoomOptions = (boundingBox) => {
    const startX = boundingBox.x + boundingBox.width / 10;
    const endX = boundingBox.x + (boundingBox.width / 10) * 2;
    const y = boundingBox.y + boundingBox.height / 2;

    return {sourcePosition: {x: startX, y}, targetPosition: {x: endX, y}};
};

const getZoomYOptions: GetZoomOptions = (boundingBox) => {
    const startY = boundingBox.y + boundingBox.height / 10;
    const endY = boundingBox.y + (boundingBox.height / 10) * 2;
    const x = boundingBox.x + boundingBox.width / 2;

    return {sourcePosition: {x, y: startY}, targetPosition: {x, y: endY}};
};

const getZoomXYOptions: GetZoomOptions = (boundingBox) => {
    const startX = boundingBox.x + boundingBox.width * 0.25;
    const startY = boundingBox.y + boundingBox.height * 0.25;
    const endX = boundingBox.x + boundingBox.width * 0.75;
    const endY = boundingBox.y + boundingBox.height * 0.75;

    return {sourcePosition: {x: startX, y: startY}, targetPosition: {x: endX, y: endY}};
};

async function triggerZoom(component: MountResult, getZoomOptions: GetZoomOptions) {
    const brushAreaLocator = component.locator('.gcharts-brush');
    await expect(brushAreaLocator).toBeVisible();
    const boundingBox = await brushAreaLocator.evaluate((el) => el.getBoundingClientRect());

    if (!boundingBox) {
        throw new Error('Bounding box not found');
    }

    await component.dragTo(brushAreaLocator, getZoomOptions(boundingBox));
}

async function testZoom(args: {component: MountResult; getZoomOptions: GetZoomOptions}) {
    const {component, getZoomOptions} = args;
    const screenShotLocator = component.locator('.gcharts-chart');

    await expect(screenShotLocator).toHaveScreenshot();

    await triggerZoom(component, getZoomOptions);

    await expect(screenShotLocator).toHaveScreenshot();
}

async function assertResetButtonPosition(args: {
    component: MountResult;
    align: ResetButtonAlign;
    relativeTo: ResetButtonRelativeTo;
    offset?: {x: number; y: number};
}) {
    const {component, align, relativeTo, offset = {x: 0, y: 0}} = args;

    await triggerZoom(component, getZoomXOptions);

    const buttonLocator = component.locator('.gcharts-chart__reset-zoom-button');
    await expect(buttonLocator).toBeVisible();

    const layout = await component.evaluate((root: HTMLElement) => {
        const chartEl = root.querySelector('.gcharts-chart');
        const brushEl = root.querySelector('.gcharts-brush');
        const buttonEl = root.querySelector('.gcharts-chart__reset-zoom-button');
        const titleEl = root.querySelector('.gcharts-chart > svg > text');

        if (!chartEl || !brushEl || !buttonEl) {
            throw new Error('Required chart elements not found');
        }

        const toBox = (rect: DOMRect) => ({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
        });

        return {
            chart: toBox(chartEl.getBoundingClientRect()),
            plot: toBox(brushEl.getBoundingClientRect()),
            button: toBox(buttonEl.getBoundingClientRect()),
            titleHeight: titleEl ? titleEl.getBoundingClientRect().height : 0,
        };
    });

    const {chart, plot, button, titleHeight} = layout;

    let leftInChart: number;
    let topInChart: number;

    if (relativeTo === 'chart-box') {
        leftInChart = align.endsWith('left') ? 0 : chart.width - button.width;
        topInChart = align.startsWith('top') ? 0 : chart.height - button.height;
    } else {
        const boundsOffsetLeft = plot.x - chart.x;
        const boundsOffsetTop = plot.y - chart.y;
        const boundsWidth = plot.width;
        const boundsHeight = plot.height;

        leftInChart = align.endsWith('left')
            ? boundsOffsetLeft
            : boundsOffsetLeft + boundsWidth - button.width;
        topInChart = align.startsWith('top')
            ? boundsOffsetTop
            : boundsHeight - button.height + titleHeight;
    }

    const expectedX = chart.x + leftInChart + offset.x;
    const expectedY = chart.y + topInChart + offset.y;

    expect(button.x).toBeCloseTo(expectedX, 0);
    expect(button.y).toBeCloseTo(expectedY, 0);
}

test.describe('Zoom', () => {
    test.describe('Type x', () => {
        const basicData: ChartData = {
            chart: {
                zoom: {
                    enabled: true,
                    type: 'x',
                },
            },
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Line series',
                        data: [
                            {x: 0, y: 97},
                            {x: 1, y: 14},
                            {x: 2, y: 42},
                            {x: 3, y: 28},
                            {x: 4, y: 16},
                            {x: 5, y: 79},
                            {x: 6, y: 73},
                            {x: 7, y: 82},
                            {x: 8, y: 27},
                            {x: 9, y: 100},
                            {x: 10, y: 97},
                        ],
                    },
                ],
            },
            tooltip: {
                enabled: false,
            },
        };

        test('One zoomed point', async ({mount}) => {
            const component = await mount(<ChartTestStory data={basicData} />);

            await testZoom({component, getZoomOptions: getZoomXOptions});
        });

        test('One zoomed point scatter', async ({mount}) => {
            const data = cloneDeep(basicData);
            set(data, 'series.data[0].type', 'scatter');
            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({component, getZoomOptions: getZoomXOptions});
        });

        test('Datetime x axis min/max', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {enabled: true, type: 'x'});
            set(data, 'tooltip.enabled', false);
            set(data, 'xAxis.min', 1390777200000);
            set(data, 'xAxis.max', 1394319600000);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({component, getZoomOptions: getZoomXOptions});
        });
    });

    test.describe('Type y', () => {
        test('Datetime y axis', async ({mount}) => {
            const data = cloneDeep(barYDatetimeYData);
            set(data, 'chart.zoom', {enabled: true, type: 'y'});
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({component, getZoomOptions: getZoomYOptions});
        });

        test('Datetime y axis order=reverse', async ({mount}) => {
            const data = cloneDeep(barYDatetimeYData);
            set(data, 'chart.zoom', {enabled: true, type: 'y'});
            set(data, 'tooltip.enabled', false);
            set(data, 'yAxis[0].order', 'reverse');

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({component, getZoomOptions: getZoomYOptions});
        });

        test('Datetime y axis min/max', async ({mount}) => {
            const data = cloneDeep(barYDatetimeYData);
            set(data, 'chart.zoom', {enabled: true, type: 'y'});
            set(data, 'tooltip.enabled', false);
            set(data, 'yAxis[0].min', 1737158400000);
            set(data, 'yAxis[0].max', 1743120000000);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({component, getZoomOptions: getZoomYOptions});
        });
    });

    test.describe('Type xy', () => {
        test('Datetime x, linear y', async ({mount}) => {
            const data = cloneDeep(scatterBasicData);
            set(data, 'chart.zoom', {enabled: true, type: 'xy'});
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({component, getZoomOptions: getZoomXYOptions});
        });

        test('Datetime x, linear y, min/max x and y', async ({mount}) => {
            const data = cloneDeep(scatterBasicData);
            set(data, 'chart.zoom', {enabled: true, type: 'xy'});
            set(data, 'tooltip.enabled', false);
            set(data, 'xAxis.min', 1275253200000);
            set(data, 'xAxis.max', 1455832800000);
            set(data, 'yAxis[0].min', 5);
            set(data, 'yAxis[0].max', 8);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({component, getZoomOptions: getZoomXYOptions});
        });
    });

    test.describe.only('Reset button', () => {
        const cases: {
            align: ResetButtonAlign;
            relativeTo: ResetButtonRelativeTo;
            offset?: {x: number; y: number};
        }[] = [
            {align: 'bottom-left', relativeTo: 'chart-box'},
            {align: 'bottom-left', relativeTo: 'chart-box', offset: {x: 10, y: -10}},
            {align: 'bottom-right', relativeTo: 'chart-box'},
            {align: 'bottom-right', relativeTo: 'chart-box', offset: {x: -10, y: -10}},
            {align: 'top-left', relativeTo: 'chart-box'},
            {align: 'top-left', relativeTo: 'chart-box', offset: {x: 10, y: 10}},
            {align: 'top-right', relativeTo: 'chart-box'},
            {align: 'top-right', relativeTo: 'chart-box', offset: {x: -10, y: 10}},
            {align: 'bottom-left', relativeTo: 'plot-box'},
            {align: 'bottom-left', relativeTo: 'plot-box', offset: {x: 10, y: -10}},
            {align: 'bottom-right', relativeTo: 'plot-box'},
            {align: 'bottom-right', relativeTo: 'plot-box', offset: {x: -10, y: -10}},
            {align: 'top-left', relativeTo: 'plot-box'},
            {align: 'top-left', relativeTo: 'plot-box', offset: {x: 10, y: 10}},
            {align: 'top-right', relativeTo: 'plot-box'},
            {align: 'top-right', relativeTo: 'plot-box', offset: {x: -10, y: 10}},
        ];

        for (const {align, relativeTo, offset} of cases) {
            const title = `align=${align}, relativeTo=${relativeTo}${offset ? ', offset' : ''}`;

            test(title, async ({mount}) => {
                const data = cloneDeep(lineTwoYAxisData);
                set(data, 'chart.zoom', {
                    enabled: true,
                    type: 'x',
                    resetButton: offset ? {align, relativeTo, offset} : {align, relativeTo},
                });
                set(data, 'tooltip.enabled', false);

                const component = await mount(<ChartTestStory data={data} />);

                await assertResetButtonPosition({component, align, relativeTo, offset});
            });
        }
    });
});
