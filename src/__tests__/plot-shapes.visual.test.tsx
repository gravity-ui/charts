import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {PlotShapesTestStory} from './components/PlotShapesTestStory';

const BAR_X_SERIES = [
    {
        type: 'bar-x' as const,
        name: 'S',
        data: [
            {x: 0, y: 3},
            {x: 1, y: 5},
        ],
    },
];

const BAR_Y_SERIES = [
    {
        type: 'bar-y' as const,
        name: 'S',
        data: [
            {x: 3, y: 0},
            {x: 5, y: 1},
        ],
    },
];

test.describe('Plot Shapes', () => {
    test('X axis plot shape', async ({mount}) => {
        const component = await mount(
            <PlotShapesTestStory
                data={{
                    series: {data: BAR_X_SERIES},
                    xAxis: {plotShapes: [{value: 0}]},
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y axis plot shape', async ({mount}) => {
        const component = await mount(
            <PlotShapesTestStory
                data={{
                    series: {data: BAR_Y_SERIES},
                    yAxis: [{plotShapes: [{value: 0}]}],
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Should not render X plot shapes outside of plot area', async ({mount}) => {
        const component = await mount(
            <PlotShapesTestStory
                data={{
                    series: {data: BAR_X_SERIES},
                    xAxis: {plotShapes: [{value: -10}]},
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Should not render Y plot shapes outside of plot area', async ({mount}) => {
        const component = await mount(
            <PlotShapesTestStory
                data={{
                    series: {data: BAR_Y_SERIES},
                    yAxis: [{plotShapes: [{value: -10}]}],
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('X axis plot shape with layerPlacement after', async ({mount}) => {
        const component = await mount(
            <PlotShapesTestStory
                data={{
                    series: {data: BAR_X_SERIES},
                    xAxis: {plotShapes: [{value: 0, layerPlacement: 'after'}]},
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Y axis plot shape with layerPlacement after', async ({mount}) => {
        const component = await mount(
            <PlotShapesTestStory
                data={{
                    series: {data: BAR_Y_SERIES},
                    yAxis: [{plotShapes: [{value: 0, layerPlacement: 'after'}]}],
                }}
            />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
