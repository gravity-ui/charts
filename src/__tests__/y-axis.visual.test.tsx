import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {scatterBasicData} from '../__stories__/__data__';
import type {ChartData, ChartMargin} from '../types';

const CHART_MARGIN: ChartMargin = {
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
};
const HTML_CATEGORIES = [
    '<div style="height: 18px; background-color: #4fc4b7; border-radius: 4px; color: #fff; padding: 4px; display: flex; align-items: center;">1</div>',
    '<div style="height: 32px; background-color: #4fc4b7; border-radius: 4px; color: #fff; padding: 4px; display: flex; align-items: center;">1000</div>',
];

test.describe('Y-axis', () => {
    test('min', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].min', 5);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('max', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].max', 8);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].min', 5);
        set(data, 'yAxis[0].max', 8);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('maxPadding=0', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].maxPadding', 0);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Html in categories', () => {
        const baseData: ChartData = {
            legend: {
                enabled: false,
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [
                            {x: 2, y: 0},
                            {x: 5, y: 1},
                        ],
                    },
                ],
            },
            yAxis: [
                {
                    type: 'category',
                    categories: HTML_CATEGORIES,
                    labels: {html: true},
                },
            ],
            xAxis: {maxPadding: 0},
        };

        test('default settings', async ({mount}) => {
            const component = await mount(<ChartTestStory data={baseData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('chart.margin=20', async ({mount}) => {
            const data: ChartData = cloneDeep(baseData);
            set(data, 'chart.margin', CHART_MARGIN);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('labels.margin=0', async ({mount}) => {
            const data: ChartData = cloneDeep(baseData);
            set(data, 'yAxis[0].labels.margin', 0);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('position=right', async ({mount}) => {
            const data: ChartData = cloneDeep(baseData);
            set(data, 'yAxis[0].position', 'right');
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('position=right, chart.margin=20', async ({mount}) => {
            const data: ChartData = cloneDeep(baseData);
            set(data, 'yAxis[0].position', 'right');
            set(data, 'chart.margin', CHART_MARGIN);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('position=right, labels.margin=0', async ({mount}) => {
            const data: ChartData = cloneDeep(baseData);
            set(data, 'yAxis[0].position', 'right');
            set(data, 'yAxis[0].labels.margin', 0);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe.only('Axis title', () => {
        test('Title alignment - left', async ({mount}) => {
            const data: ChartData = {
                yAxis: [
                    {
                        title: {text: 'Title text', align: 'left'},
                    },
                ],
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [{x: 1, y: 10}],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Title alignment - center', async ({mount}) => {
            const data: ChartData = {
                yAxis: [
                    {
                        title: {text: 'Title text', align: 'center'},
                    },
                ],
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [{x: 1, y: 10}],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Title alignment - right', async ({mount}) => {
            const data: ChartData = {
                yAxis: [
                    {
                        title: {text: 'Title text', align: 'right'},
                    },
                ],
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [{x: 1, y: 10}],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });
});
