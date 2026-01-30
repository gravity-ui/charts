import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {scatterBasicData} from '../__stories__/__data__';
import type {ChartData, ChartMargin} from '../types';

import {lineDualAxesSplitData} from './__data__/line-dual-axes-split';

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

        test('Rotated title (0deg)', async ({mount}) => {
            const data: ChartData = {
                yAxis: [
                    {
                        title: {text: 'Title text', rotation: 0},
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

        test('Rotated title (0deg) - right axis', async ({mount}) => {
            const data: ChartData = {
                yAxis: [
                    {
                        title: {text: 'Title text', rotation: 0},
                        position: 'right',
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

        test('Multiline rotated title (0deg)', async ({mount}) => {
            const text = `Oh, mournful season that delights the eyes, Your farewell beauty captivates my spirit.`;
            const data: ChartData = {
                yAxis: [
                    {
                        title: {text, rotation: 0, maxRowCount: 3},
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

        test('Html title (default rotation)', async ({mount}) => {
            const data: ChartData = {
                yAxis: [
                    {
                        title: {
                            text: '<span style="background: var(--g-color-text-info); border-radius: 4px;">Html title</span>',
                            html: true,
                        },
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

        test('Html title (0deg rotation)', async ({mount}) => {
            const data: ChartData = {
                yAxis: [
                    {
                        title: {
                            text: '<span style="background: var(--g-color-text-info); border-radius: 4px;">Html title</span>',
                            html: true,
                            rotation: 0,
                        },
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

        test('The labels should be displayed considering only the visible series', async ({
            mount,
        }) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            type: 'scatter',
                            name: 'Series 1',
                            data: [{x: 1, y: 15001}],
                        },
                        {
                            type: 'scatter',
                            name: 'Series 2',
                            data: [{x: 2, y: 24999}],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={chartData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
            const legendItem = component.getByText('Series 2');
            await legendItem.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Rotated labels (short and long values)', async ({mount}) => {
            const data: ChartData = {
                yAxis: [
                    {
                        type: 'category',
                        categories: ['Long text (with ellipsis)', 'Short text'],
                        labels: {
                            rotation: 45,
                            maxWidth: '30%',
                        },
                    },
                ],
                xAxis: {visible: false},
                series: {
                    data: [
                        {
                            type: 'bar-y',
                            name: 'Series 1',
                            data: [
                                {x: 10, y: 0},
                                {x: 10, y: 1},
                            ],
                        },
                    ],
                },
            };
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
                        data: [{x: 10, y: 0}],
                        name: 'Series 1',
                    },
                    {
                        type: 'scatter',
                        data: [{x: 20, y: 1}],
                        name: 'Series 2',
                    },
                    {
                        type: 'scatter',
                        data: [{x: 30, y: 2}],
                        name: 'Series 3',
                    },
                ],
            },
            yAxis: [
                {
                    categories: ['Category 1', 'Category 2', 'Category 3'],
                    max: 1,
                    type: 'category',
                },
            ],
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('startOnTick / endOnTick', () => {
        test.describe('linear', () => {
            const baseData: ChartData = {
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [
                                {x: 1, y: 17},
                                {x: 2, y: 83},
                                {x: 3, y: 50},
                            ],
                        },
                    ],
                },
                yAxis: [{}],
                chart: {
                    margin: CHART_MARGIN,
                },
            };

            test('default (startOnTick=false, endOnTick=false)', async ({mount}) => {
                const component = await mount(<ChartTestStory data={baseData} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });

            test('startOnTick=true, endOnTick=true', async ({mount}) => {
                const data = cloneDeep(baseData);
                set(data, 'yAxis[0].startOnTick', true);
                set(data, 'yAxis[0].endOnTick', true);
                const component = await mount(<ChartTestStory data={data} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });

        test.describe('datetime', () => {
            const baseData: ChartData = {
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'Series 1',
                            data: [
                                {x: 1, y: 1704153600000}, // 2024-01-02
                                {x: 2, y: 1706832000000}, // 2024-02-02
                                {x: 3, y: 1709337600000}, // 2024-03-02
                            ],
                        },
                    ],
                },
                yAxis: [
                    {
                        type: 'datetime',
                        timestamps: [1704153600000, 1706832000000, 1709337600000],
                    },
                ],
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
                set(data, 'yAxis[0].startOnTick', false);
                set(data, 'yAxis[0].endOnTick', false);
                const component = await mount(<ChartTestStory data={data} />);
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });
    });

    test.describe('Dual Y axes', () => {
        const baseData: ChartData = {
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        data: [
                            {x: 1767225600000, y: 80},
                            {x: 1769904000000, y: 50},
                            {x: 1772323200000, y: 20},
                            {x: 1775001600000, y: 120},
                            {x: 1777593600000, y: 5},
                        ],
                        yAxis: 0,
                    },
                    {
                        type: 'line',
                        name: 'Series 2',
                        data: [
                            {x: 1767225600000, y: 0.1},
                            {x: 1769904000000, y: 0.7},
                            {x: 1772323200000, y: 0.3},
                            {x: 1775001600000, y: 0.25},
                            {x: 1777593600000, y: 0.5},
                        ],
                        yAxis: 1,
                    },
                ],
            },
            xAxis: {
                type: 'datetime',
            },
            yAxis: [
                {
                    endOnTick: true,
                    startOnTick: true,
                },
                {
                    endOnTick: true,
                    startOnTick: true,
                },
            ],
        };

        test('Aligned linear axes', async ({mount}) => {
            const component = await mount(<ChartTestStory data={baseData} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Aligned linear axes, split, height=300px', async ({mount}) => {
            const component = await mount(
                <ChartTestStory data={lineDualAxesSplitData} styles={{height: '300px'}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Aligned linear axes, split, height=900px', async ({mount}) => {
            const component = await mount(
                <ChartTestStory data={lineDualAxesSplitData} styles={{height: '900px'}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test('Should not use vertical clip path', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Series 1',
                        lineWidth: 2,
                        data: [
                            {x: 0, y: 260},
                            {x: 1, y: 50},
                            {x: 2, y: -100},
                            {x: 3, y: 190},
                        ],
                    },
                    {
                        type: 'line',
                        name: 'Series 2',
                        data: [
                            {x: 0, y: 834},
                            {x: 1, y: 100},
                            {x: 2, y: 428},
                            {x: 3, y: 1922},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['2014-04-01', '2014-02-01', '2014-01-01', '2014-03-01'],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
