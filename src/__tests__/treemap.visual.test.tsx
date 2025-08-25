import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {treemapBasicData} from 'src/__stories__/__data__';
import type {ChartData, TreemapSeries} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {randomString} from '../utils';

test.describe('Treemap series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={treemapBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With special symbols', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: '& | &amp;',
                        data: [
                            {name: 'Tom & Jerry', value: 1},
                            {name: 'Tom &amp; Jerry', value: 1},
                        ],
                    },
                ],
            },
            legend: {enabled: true},
            title: {
                text: 'Title: & | &amp;',
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Html labels with style', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: '',
                        data: [
                            {name: 'Text', value: 1},
                            {name: 'Two words', value: 2},
                        ],
                        dataLabels: {
                            html: true,
                            style: {
                                fontSize: '20px',
                            },
                        },
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Not enough space to display the labels', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: '',
                        layoutAlgorithm: 'dice',
                        data: [
                            {name: 'Value 1', value: 1},
                            {name: 'Value 10', value: 10},
                            {name: 'Value 100', value: 100},
                        ],
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Labels go beyond the boundaries of the chart(html: false)', async ({mount}) => {
        const data: ChartData = {
            chart: {margin: {bottom: 20, right: 20}},
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: '',
                        data: [{name: ['Long name', 'With', 'Few', 'Rows'], value: 10}],
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{height: 80, width: 80}} />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Labels go beyond the boundaries of the chart(html: true)', async ({mount}) => {
        const data: ChartData = {
            chart: {margin: {bottom: 20, right: 20}},
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: '',
                        dataLabels: {html: true},
                        data: [
                            {
                                name: [
                                    '<span style="white-space: nowrap;">Long name</span>',
                                    'With',
                                    'Few',
                                    'Rows',
                                ],
                                value: 10,
                            },
                        ],
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{height: 80, width: 80}} />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With and without sorting', async ({mount}) => {
        const series: TreemapSeries = {
            type: 'treemap',
            name: 'With and without sorting',
            layoutAlgorithm: 'slice',
            levels: [
                {index: 1, padding: 3},
                {index: 2, padding: 1},
            ],
            data: [
                {name: '1. value = 10', value: 10},
                {name: '2. value = 30', value: 30},
                {name: '2. value(sum) = 20', id: '2'},
                {name: '2.1. value = 15', value: 15, parentId: '2'},
                {name: '2.2. value = 5', value: 5, parentId: '2'},
            ],
        };

        const chart = await mount(
            <ChartTestStory
                data={{
                    series: {
                        data: [series],
                    },
                }}
            />,
        );
        await expect(chart.locator('svg')).toHaveScreenshot();

        await chart.update(
            <ChartTestStory
                data={{
                    series: {
                        data: [
                            {
                                ...series,
                                sorting: {
                                    enabled: true,
                                },
                            },
                        ],
                    },
                }}
            />,
        );
        await expect(chart.locator('svg')).toHaveScreenshot();
    });

    test('Performance', async ({mount}) => {
        const items = new Array(1000).fill(null).map(() => ({
            name: randomString(5, '0123456789abcdefghijklmnopqrstuvwxyz'),
            value: 10,
        }));
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: '',
                        data: items,
                        dataLabels: {enabled: true},
                        sorting: {
                            enabled: true,
                        },
                    },
                ],
            },
        };

        let widgetRenderTime: number | undefined;
        const handleRender = (renderTime?: number) => {
            widgetRenderTime = renderTime;
        };

        const component = await mount(
            <ChartTestStory
                data={data}
                styles={{height: 1000, width: 1000}}
                onRender={handleRender}
            />,
        );
        await component.locator('svg').waitFor({state: 'visible'});
        await expect.poll(() => widgetRenderTime).toBeLessThan(400);
    });
});
