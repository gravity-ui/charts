import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {MountResult} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {barYDatetimeYData} from '../__stories__/__data__/bar-y';
import type {ChartData} from '../types';

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
            const screenShotLocator = component.locator('.gcharts-chart');

            await expect(screenShotLocator).toHaveScreenshot();

            const brushAreaLocator = component.locator('.gcharts-brush');
            const boundingBox = await brushAreaLocator.boundingBox();

            if (!boundingBox) {
                throw new Error('Bounding box not found');
            }

            const startX = boundingBox.x + boundingBox.width / 10;
            const endX = boundingBox.x + (boundingBox.width / 10) * 2;
            const y = boundingBox.y + boundingBox.height / 2;

            await component.dragTo(brushAreaLocator, {
                sourcePosition: {x: startX, y},
                targetPosition: {x: endX, y},
            });

            await expect(screenShotLocator).toHaveScreenshot();
        });
    });

    test.describe('Type y', () => {
        const testZoomY = async (args: {component: MountResult}) => {
            const {component} = args;
            const screenShotLocator = component.locator('.gcharts-chart');
            await expect(screenShotLocator).toHaveScreenshot();

            const brushAreaLocator = component.locator('.gcharts-brush');
            const boundingBox = await brushAreaLocator.boundingBox();

            if (!boundingBox) {
                throw new Error('Bounding box not found');
            }

            const startY = boundingBox.y + boundingBox.height / 10;
            const endY = boundingBox.y + (boundingBox.height / 10) * 2;
            const x = boundingBox.x + boundingBox.width / 2;

            await component.dragTo(brushAreaLocator, {
                sourcePosition: {x, y: startY},
                targetPosition: {x, y: endY},
            });

            await expect(screenShotLocator).toHaveScreenshot();
        };

        test.only('Datetime y axis', async ({mount}) => {
            const data = cloneDeep(barYDatetimeYData);
            set(data, 'chart.zoom', {enabled: true, type: 'y'});
            set(data, 'tooltip.enabled', false);

            const component = await mount(<ChartTestStory data={data} />);

            await testZoomY({component});
        });

        test('Datetime y axis order=reverse', async ({mount}) => {
            const data = cloneDeep(barYDatetimeYData);
            set(data, 'chart.zoom', {enabled: true, type: 'y'});
            set(data, 'tooltip.enabled', false);
            set(data, 'yAxis[0].order', 'reverse');

            const component = await mount(<ChartTestStory data={data} />);

            await testZoomY({component});
        });
    });
});
