import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {barYBasicData} from '../__stories__/__data__';
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

test.describe('X-axis', () => {
    test('min', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.min', 60);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('max', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.max', 120);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.min', 60);
        set(data, 'xAxis.max', 120);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('formatted labels', async ({mount}) => {
        const chartData: ChartData = {
            ...barYBasicData,
            xAxis: {
                labels: {
                    numberFormat: {
                        unit: 'k',
                    },
                },
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
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
                        type: 'scatter',
                        name: 'Series 1',
                        data: [
                            {x: 0, y: 2.5},
                            {x: 1, y: 5},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: HTML_CATEGORIES,
                labels: {
                    html: true,
                },
            },
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
            set(data, 'xAxis.labels.margin', 0);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test('max-indexed-category', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'scatter',
                        data: [{x: 0, y: 10}],
                        name: 'Series 1',
                    },
                    {
                        type: 'scatter',
                        data: [{x: 1, y: 20}],
                        name: 'Series 2',
                    },
                    {
                        type: 'scatter',
                        data: [{x: 3, y: 30}],
                        name: 'Series 3',
                    },
                ],
            },
            xAxis: {
                categories: ['Category 1', 'Category 2', 'Category 3'],
                max: 1,
                type: 'category',
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Axis tick labels', () => {
        test('Rotated labels (-45 deg)', async ({mount}) => {
            const data: ChartData = {
                xAxis: {
                    type: 'category',
                    categories: ['Long text (with ellipsis)', 'Short text'],
                    labels: {
                        rotation: -45,
                    },
                },

                yAxis: [{visible: false}],
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series 1',
                            data: [
                                {x: 0, y: 10},
                                {x: 1, y: 5},
                            ],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Rotated labels (45 deg)', async ({mount}) => {
            const data: ChartData = {
                xAxis: {
                    type: 'category',
                    categories: ['Long text (with ellipsis)', 'Short text'],
                    labels: {
                        rotation: 45,
                    },
                },

                yAxis: [{visible: false}],
                series: {
                    data: [
                        {
                            type: 'bar-x',
                            name: 'Series 1',
                            data: [
                                {x: 0, y: 10},
                                {x: 1, y: 5},
                            ],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Axis title', () => {
        test('With labels.enabled = false', async ({mount}) => {
            const data: ChartData = {
                xAxis: {
                    title: {text: 'X-axis title'},
                    labels: {
                        enabled: false,
                    },
                },
                series: {
                    data: [
                        {
                            type: 'bar-y',
                            name: 'Series 1',
                            data: [{x: 1, y: 1}],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test('Invisible axis (with labels, grid and title enabled)', async ({mount}) => {
        const data: ChartData = {
            xAxis: {
                visible: false,
                grid: {enabled: true},
                labels: {
                    enabled: true,
                },
                title: {text: 'X-axis'},
            },
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Series 1',
                        data: [{x: 1, y: 1}],
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('startOnTick / endOnTick', () => {
        const baseData: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 17, y: 10},
                            {x: 50, y: 20},
                            {x: 83, y: 15},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'linear',
            },
            chart: {
                margin: CHART_MARGIN,
            },
        };

        test('default (startOnTick=true, endOnTick=true)', async ({mount}) => {
            const component = await mount(<ChartTestStory data={baseData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('startOnTick=false, endOnTick=false', async ({mount}) => {
            const data = cloneDeep(baseData);
            set(data, 'xAxis.startOnTick', false);
            set(data, 'xAxis.endOnTick', false);
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });
});
