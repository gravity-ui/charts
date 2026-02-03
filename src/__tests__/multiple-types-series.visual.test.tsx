import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {otherLineAndBarData} from '../__stories__/__data__/other/line-and-bar';
import type {ChartData} from '../types';

test.describe('Multiple types of series on same chart', () => {
    test.beforeEach(async ({page}) => {
        // Cancel test with error when an uncaught exception happens within the page
        page.on('pageerror', (exception) => {
            throw exception;
        });
    });

    test('The series should be placed in the DOM in the same order as they are in the chart config', async ({
        mount,
    }) => {
        const chartData: ChartData = {
            series: {
                data: [
                    {
                        type: 'area',
                        name: '1. Area',
                        data: [
                            {x: 0, y: 0},
                            {x: 2, y: 15},
                        ],
                    },
                    {
                        type: 'bar-x',
                        name: '2. Bar-x',
                        data: [{x: 1, y: 10}],
                    },
                    {
                        type: 'line',
                        name: '3. Line',
                        data: [
                            {x: 0, y: 10},
                            {x: 2, y: 0},
                        ],
                    },
                ],
            },
            yAxis: [{maxPadding: 0, visible: false}],
            xAxis: {
                type: 'category',
                categories: ['a', 'b', 'c'],
                maxPadding: 0,
                grid: {enabled: false},
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Line series should be placed after bar series', async ({mount}) => {
        const data = cloneDeep(otherLineAndBarData);
        set(data, 'series.data[0].dataLabels.enabled', true);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
