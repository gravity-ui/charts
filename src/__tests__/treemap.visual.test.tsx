import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import {median} from 'd3-array';

import {randomString} from '~core/utils';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {treemapBasicData} from '../__stories__/__data__';
import type {ChartData, TreemapSeries} from '../types';

test.describe('Treemap series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={treemapBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Point opacity', async ({mount, page}) => {
        function createData(opacity?: number, inactiveOpacity = 0.2): ChartData {
            return {
                series: {
                    data: [
                        {
                            type: 'treemap',
                            name: 'Values',
                            layoutAlgorithm: 'dice',
                            data: [
                                {id: 'hover-target', name: 'opacity: 1', value: 10, opacity: 1},
                                {
                                    id: 'updated-point',
                                    name: `opacity: ${opacity}`,
                                    value: 10,
                                    opacity,
                                },
                                {
                                    id: 'transparent-point',
                                    name: 'opacity: 0',
                                    value: 10,
                                    opacity: 0,
                                },
                            ],
                            dataLabels: {enabled: true, html: false},
                        },
                    ],
                    options: {
                        treemap: {
                            states: {
                                hover: {enabled: true, brightness: 0},
                                inactive: {enabled: true, opacity: inactiveOpacity},
                            },
                        },
                    },
                },
                legend: {enabled: false},
                tooltip: {enabled: false},
            };
        }

        const component = await mount(<ChartTestStory data={createData(0.5)} />);
        const svg = component.locator('svg');

        await expect(svg).toHaveScreenshot('point-opacity-initial.png');
        await component.locator('rect[id="hover-target"]').hover({position: {x: 10, y: 10}});
        await expect(svg).toHaveScreenshot('point-opacity-inactive.png');
        await page.mouse.move(0, 0);
        await expect(svg).toHaveScreenshot('point-opacity-initial.png');

        await component.update(<ChartTestStory data={createData(0)} />);
        await expect(svg).toHaveScreenshot('point-opacity-updated.png');
        await component.update(<ChartTestStory data={createData()} />);
        await expect(svg).toHaveScreenshot('point-opacity-removed.png');

        await component.update(<ChartTestStory data={createData(0.5, 0)} />);
        await component.locator('rect[id="hover-target"]').hover({position: {x: 10, y: 10}});
        await expect(svg).toHaveScreenshot('point-opacity-inactive-zero.png');
        await page.mouse.move(0, 0);
        await expect(svg).toHaveScreenshot('point-opacity-initial.png');
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

    test('Performance @perf', async ({mount}) => {
        test.setTimeout(120_000);

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

        const widgetRenderTimes = [];
        for (let i = 0; i < 10; i++) {
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
            await expect.poll(() => widgetRenderTime).toBeTruthy();
            widgetRenderTimes.push(widgetRenderTime);

            await component.unmount();
        }

        await expect(median(widgetRenderTimes)).toBeLessThan(400);
    });
});
