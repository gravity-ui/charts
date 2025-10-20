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
    test.beforeEach(async ({page}) => {
        // Cancel test with error when an uncaught exception happens within the page
        page.on('pageerror', (exception) => {
            throw exception;
        });
    });

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

    test.describe('Axis title', () => {
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

        test('Long overflowed title', async ({mount}) => {
            const text = `Oh, mournful season that delights the eyes, Your farewell beauty captivates my spirit.`;
            const data: ChartData = {
                yAxis: [
                    {
                        title: {text},
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

            component.update(
                <ChartTestStory
                    data={{
                        ...data,
                        yAxis: [
                            {
                                title: {text, maxRowCount: 2},
                            },
                        ],
                    }}
                />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test('Split - few plots and axes', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 1, y: 10},
                            {x: 2, y: 5},
                        ],
                        yAxis: 0,
                    },
                    {
                        type: 'line',
                        name: 'Series 2',
                        data: [
                            {x: 1, y: 1},
                            {x: 2, y: 2},
                        ],
                        yAxis: 1,
                    },
                ],
            },
            split: {
                enable: true,
                plots: [{title: {text: '1'}}, {title: {text: '2'}}],
            },
            yAxis: [
                {
                    title: {text: 'First plot title'},
                    plotIndex: 0,
                },
                {
                    title: {text: 'Second plot title'},
                    plotIndex: 1,
                },
            ],
        };

        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Axis tick labels', () => {
        test('With text wrapping', async ({mount}) => {
            const longText = `Oh, mournful season that delights the eyes, Your farewell beauty captivates my spirit.`;
            const data: ChartData = {
                yAxis: [
                    {
                        type: 'category',
                        categories: ['...', 'Pushkin A.S.', longText],
                    },
                ],
                series: {
                    data: [
                        {
                            type: 'bar-y',
                            name: 'Series 1',
                            data: [
                                {y: 0, x: 10},
                                {y: 1, x: 15},
                                {y: 2, x: 20},
                            ],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Top label offset', async ({mount}) => {
            const data: ChartData = {
                yAxis: [
                    {
                        min: 0,
                        maxPadding: 0,
                    },
                ],
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: 'Series 1',
                            data: [
                                {y: 2, x: 10},
                                {y: 10, x: 5},
                            ],
                        },
                    ],
                },
                chart: {
                    margin: {
                        top: 10,
                    },
                },
            };
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });
});
