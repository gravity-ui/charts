import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {MountResult} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {barYDatetimeYData, lineTwoYAxisData} from '../__stories__/__data__';
import type {ChartData} from '../types';

type BoundingBox = NonNullable<
    Awaited<ReturnType<ReturnType<MountResult['locator']>['boundingBox']>>
>;

type ZoomOptions = NonNullable<Parameters<MountResult['dragTo']>[1]>;

type GetZoomOptions = (boundingBox: BoundingBox) => ZoomOptions;

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

async function testZoom(args: {
    component: MountResult;
    getZoomOptions: GetZoomOptions;
    shouldScreenshotInitialState?: boolean;
    useComponentAsScreenshotLocator?: boolean;
}) {
    const {
        component,
        getZoomOptions,
        shouldScreenshotInitialState = true,
        useComponentAsScreenshotLocator = false,
    } = args;
    const screenShotLocator = useComponentAsScreenshotLocator
        ? component
        : component.locator('.gcharts-chart');

    if (shouldScreenshotInitialState) {
        await expect(screenShotLocator).toHaveScreenshot();
    }

    const brushAreaLocator = component.locator('.gcharts-brush');
    const boundingBox = await brushAreaLocator.boundingBox();

    if (!boundingBox) {
        throw new Error('Bounding box not found');
    }

    await component.dragTo(brushAreaLocator, getZoomOptions(boundingBox));

    await expect(screenShotLocator).toHaveScreenshot();
}

test.describe('Zoom', () => {
    test.describe('Type x', () => {
        test('One zoomed point', async ({mount}) => {
            const data: ChartData = {
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
    });

    test.describe('Reset button', () => {
        test('align=bottom-left, relativeTo=chart-box', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {align: 'bottom-left', relativeTo: 'chart-box'},
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(
                <ChartTestStory
                    chartStyles={{border: '1px solid black'}}
                    data={data}
                    styles={{padding: 20}}
                />,
            );

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=bottom-left, relativeTo=chart-box, offset', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {
                    align: 'bottom-left',
                    offset: {x: 10, y: -10},
                    relativeTo: 'chart-box',
                },
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(
                <ChartTestStory
                    chartStyles={{border: '1px solid black'}}
                    data={data}
                    styles={{padding: 20}}
                />,
            );

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=bottom-right, relativeTo=chart-box', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {align: 'bottom-right', relativeTo: 'chart-box'},
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(
                <ChartTestStory
                    chartStyles={{border: '1px solid black'}}
                    data={data}
                    styles={{padding: 20}}
                />,
            );

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=bottom-right, relativeTo=chart-box, offset', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {
                    align: 'bottom-right',
                    offset: {x: -10, y: -10},
                    relativeTo: 'chart-box',
                },
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(
                <ChartTestStory
                    chartStyles={{border: '1px solid black'}}
                    data={data}
                    styles={{padding: 20}}
                />,
            );

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=top-left, relativeTo=chart-box', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {align: 'top-left', relativeTo: 'chart-box'},
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(
                <ChartTestStory
                    chartStyles={{border: '1px solid black'}}
                    data={data}
                    styles={{padding: 20}}
                />,
            );

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=top-left, relativeTo=chart-box, offset', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {
                    align: 'top-left',
                    offset: {x: 10, y: 10},
                    relativeTo: 'chart-box',
                },
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(
                <ChartTestStory
                    chartStyles={{border: '1px solid black'}}
                    data={data}
                    styles={{padding: 20}}
                />,
            );

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=top-right, relativeTo=chart-box', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {align: 'top-right', relativeTo: 'chart-box'},
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(
                <ChartTestStory
                    chartStyles={{border: '1px solid black'}}
                    data={data}
                    styles={{padding: 20}}
                />,
            );

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=top-right, relativeTo=chart-box, offset', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {
                    align: 'top-right',
                    offset: {x: -10, y: 10},
                    relativeTo: 'chart-box',
                },
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(
                <ChartTestStory
                    chartStyles={{border: '1px solid black'}}
                    data={data}
                    styles={{padding: 20}}
                />,
            );

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=bottom-left, relativeTo=plot-box', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {align: 'bottom-left', relativeTo: 'plot-box'},
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=bottom-left, relativeTo=plot-box, offset', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {
                    align: 'bottom-left',
                    offset: {x: 10, y: -10},
                    relativeTo: 'plot-box',
                },
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=bottom-right, relativeTo=plot-box', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {align: 'bottom-right', relativeTo: 'plot-box'},
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=bottom-right, relativeTo=plot-box, offset', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {
                    align: 'bottom-right',
                    offset: {x: -10, y: -10},
                    relativeTo: 'plot-box',
                },
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=top-left, relativeTo=plot-box', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {align: 'top-left', relativeTo: 'plot-box'},
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=top-left, relativeTo=plot-box, offset', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {
                    align: 'top-left',
                    offset: {x: 10, y: 10},
                    relativeTo: 'plot-box',
                },
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=top-right, relativeTo=plot-box', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {align: 'top-right', relativeTo: 'plot-box'},
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });

        test('align=top-right, relativeTo=plot-box, offset', async ({mount}) => {
            const data = cloneDeep(lineTwoYAxisData);
            set(data, 'chart.zoom', {
                enabled: true,
                type: 'x',
                resetButton: {
                    align: 'top-right',
                    offset: {x: -10, y: 10},
                    relativeTo: 'plot-box',
                },
            });
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoom({
                component,
                getZoomOptions: getZoomXOptions,
                shouldScreenshotInitialState: false,
                useComponentAsScreenshotLocator: true,
            });
        });
    });
});
