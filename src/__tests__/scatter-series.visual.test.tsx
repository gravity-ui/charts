import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    scatterBasicData,
    scatterContinuousLegendData,
    scatterDataLabelsData,
    scatterNullModeSkipLinearXData,
    scatterNullModeZeroLinearXData,
} from '../__stories__/__data__';
import type {ChartData} from '../types';

test.describe('Scatter series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={scatterBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Continues legend', async ({mount}) => {
        const component = await mount(<ChartTestStory data={scatterContinuousLegendData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With x null values', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        data: [{y: 0, x: 1}],
                        name: '2022',
                        type: 'scatter',
                    },
                    {
                        data: [{y: 0, x: 2}],
                        name: '2023',
                        type: 'scatter',
                    },
                    {
                        data: [{y: 0, x: null}],
                        name: '2024',
                        type: 'scatter',
                    },
                ],
            },
            yAxis: [
                {
                    type: 'category',
                    categories: ['Category with null values'],
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
        const legendItem = component.getByText('2024');
        await legendItem.click();
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With y null values', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        data: [{y: 1, x: 0}],
                        name: '2022',
                        type: 'scatter',
                    },
                    {
                        data: [{y: 2, x: 0}],
                        name: '2023',
                        type: 'scatter',
                    },
                    {
                        data: [{y: null, x: 0}],
                        name: '2024',
                        type: 'scatter',
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['Category with null values'],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
        const legendItem = component.getByText('2024');
        await legendItem.click();
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max-category-x', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'scatter',
                        data: [{x: 'Category 1', y: 10}],
                        name: 'Series 1',
                    },
                    {
                        type: 'scatter',
                        data: [{x: 'Category 2', y: 20}],
                        name: 'Series 2',
                    },
                    {
                        type: 'scatter',
                        data: [{x: 'Category 3', y: 30}],
                        name: 'Series 3',
                    },
                ],
            },
            xAxis: {
                categories: ['Category 1', 'Category 2', 'Category 3'],
                type: 'category',
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();

        const dataWithMinMax = cloneDeep(data);
        set(dataWithMinMax, 'xAxis.min', 1);
        set(dataWithMinMax, 'xAxis.max', 1);
        component.update(<ChartTestStory data={dataWithMinMax} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max-category-y', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'scatter',
                        data: [{x: 10, y: 'Category 1'}],
                        name: 'Series 1',
                    },
                    {
                        type: 'scatter',
                        data: [{x: 20, y: 'Category 2'}],
                        name: 'Series 2',
                    },
                    {
                        type: 'scatter',
                        data: [{x: 30, y: 'Category 3'}],
                        name: 'Series 3',
                    },
                ],
            },
            yAxis: [
                {
                    categories: ['Category 1', 'Category 2', 'Category 3'],
                    type: 'category',
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();

        const dataWithMinMax = cloneDeep(data);
        set(dataWithMinMax, 'yAxis[0].min', 1);
        set(dataWithMinMax, 'yAxis[0].max', 1);
        component.update(<ChartTestStory data={dataWithMinMax} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('x null values, nullMode=skip', async ({mount}) => {
        const component = await mount(<ChartTestStory data={scatterNullModeSkipLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('x null values, nullMode=zero', async ({mount}) => {
        const component = await mount(<ChartTestStory data={scatterNullModeZeroLinearXData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Data labels', () => {
        test('Basic (two series)', async ({mount}) => {
            const component = await mount(<ChartTestStory data={scatterDataLabelsData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Positioning of extreme point dataLabels', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: '',
                            data: [
                                {x: 0, y: 0, label: 'left-bottom'},
                                {x: 0, y: 10, label: 'left-top'},
                                {x: 10, y: 10, label: 'right-top'},
                                {x: 10, y: 0, label: 'right-bottom'},
                            ],
                            dataLabels: {enabled: true},
                        },
                    ],
                },
                yAxis: [{maxPadding: 0}],
                xAxis: {maxPadding: 0},
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Custom label value via label field', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: 'Series',
                            data: [
                                {x: 1, y: 10, label: 'alpha'},
                                {x: 2, y: 20, label: 'beta'},
                                {x: 3, y: 15, label: 'gamma'},
                            ],
                            dataLabels: {enabled: true},
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Html labels', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: 'Series',
                            data: [
                                {x: 1, y: 10, label: '<b>A</b>'},
                                {x: 2, y: 20, label: '<b>B</b>'},
                                {x: 3, y: 15, label: '<b>C</b>'},
                            ],
                            dataLabels: {enabled: true, html: true},
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Overlapping labels hidden by default', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: 'Series',
                            data: [
                                {x: 1, y: 10, label: 'close-1'},
                                {x: 1.05, y: 10.5, label: 'close-2'},
                                {x: 5, y: 50, label: 'far'},
                            ],
                            dataLabels: {enabled: true},
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('allowOverlap shows all labels', async ({mount}) => {
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: 'Series',
                            data: [
                                {x: 1, y: 10, label: 'close-1'},
                                {x: 1.05, y: 10.5, label: 'close-2'},
                                {x: 5, y: 50, label: 'far'},
                            ],
                            dataLabels: {enabled: true, allowOverlap: true},
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });
});
