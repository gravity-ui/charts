import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import range from 'lodash/range';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {groupedLegend, pieHtmlLegendData} from '../__stories__/__data__';
import type {ChartData, ChartLegend, LineSeries, PieSeries} from '../types';

import {LONG_TEXT} from './constants';

const pieOverflowedLegendItemsData: ChartData = {
    legend: {
        enabled: true,
    },
    series: {
        data: [
            {
                type: 'pie',
                dataLabels: {enabled: false},
                data: [
                    {
                        name: 'Lorem ipsum',
                        value: 2,
                    },
                    {
                        name: 'Lorem ipsum dolor',
                        value: 3,
                    },
                    {
                        name: 'Lorem ipsum dolor sit amet consectetur adipiscing elit',
                        value: 8,
                    },
                ],
            },
        ],
    },
};

const piePaginatedLegendData: ChartData = {
    legend: {
        enabled: true,
        type: 'discrete',
    },
    series: {
        data: [
            {
                type: 'pie',
                dataLabels: {enabled: false},
                data: range(1, 40).map((i) => ({
                    name: `Label ${i + 1}`,
                    value: i,
                })),
            },
        ],
    },
};

const lineLegendWidthSeries: LineSeries[] = [
    {name: 'North-West', values: [10, 14, 12, 18]},
    {name: 'Central', values: [6, 9, 15, 11]},
    {name: 'Southern', values: [3, 5, 4, 8]},
    {name: 'Volga', values: [12, 8, 9, 13]},
    {name: 'Ural', values: [2, 7, 10, 6]},
    {name: 'Siberian', values: [15, 12, 16, 17]},
].map(({name, values}) => ({
    type: 'line',
    name,
    data: values.map((y, x) => ({x, y})),
}));

test.describe('Legend', () => {
    test.describe('Discrete', () => {
        test.describe('Content-based width', () => {
            for (const html of [false, true]) {
                test(`title, pagination and resize (${html ? 'html' : 'svg'})`, async ({mount}) => {
                    const data: ChartData = {
                        chart: {margin: {left: 10, right: 30}},
                        legend: {
                            enabled: true,
                            position: 'left',
                            width: 'auto',
                            maxWidth: '30%',
                            html,
                            title: {text: 'Revenue by region', align: 'center'},
                        },
                        series: {
                            data: [
                                {
                                    type: 'pie',
                                    dataLabels: {enabled: false},
                                    data: Array.from({length: 30}, (_, i) => ({
                                        name: `Region ${i + 1} with a long label`,
                                        value: i + 1,
                                    })),
                                },
                            ],
                        },
                    };
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: 600, height: 240}} />,
                    );
                    const legend = component.locator('.gcharts-legend');
                    const plot = component.locator('clipPath rect').first();
                    await expect(component.getByText('▼')).toBeVisible();
                    const plotWidth = await plot.getAttribute('width');
                    const legendWidth = Number(await legend.getAttribute('width'));
                    expect(legendWidth).toBeLessThanOrEqual(168);
                    const title = await component.locator('.gcharts-legend__title').boundingBox();
                    const firstRow = await component
                        .locator('.gcharts-legend__line')
                        .first()
                        .boundingBox();
                    if (!title || !firstRow || plotWidth === null) {
                        throw new Error('Expected visible legend title, items, and plot bounds');
                    }
                    expect(title.y + title.height).toBeLessThanOrEqual(firstRow.y);
                    await expect(component).toHaveScreenshot();
                    await component.getByText('▼').click();
                    await expect(
                        component.locator('.gcharts-legend__pagination-counter'),
                    ).toContainText('2/');
                    await expect(plot).toHaveAttribute('width', plotWidth);
                    await expect(legend).toHaveAttribute('width', String(legendWidth));
                    await component.update(
                        <ChartTestStory data={data} styles={{width: 350, height: 240}} />,
                    );
                    await expect
                        .poll(async () => Number(await legend.getAttribute('width')))
                        .toBeLessThanOrEqual(93);
                    await expect(component).toHaveScreenshot();
                    await component.update(
                        <ChartTestStory data={data} styles={{width: 600, height: 240}} />,
                    );
                    await expect(legend).toHaveAttribute('width', String(legendWidth));
                    await expect(plot).toHaveAttribute('width', plotWidth);
                });
            }

            test('short content releases plot space and responds to font changes', async ({
                mount,
            }) => {
                const data: ChartData = {
                    legend: {enabled: true, position: 'right', width: 'auto', maxWidth: '50%'},
                    series: {
                        data: [
                            {
                                type: 'pie',
                                dataLabels: {enabled: false},
                                data: [
                                    {name: 'A', value: 1},
                                    {name: 'B', value: 2},
                                ],
                            },
                        ],
                    },
                };
                const component = await mount(<ChartTestStory data={data} />);
                const legend = component.locator('.gcharts-legend');
                await expect(component.locator('.gcharts-legend__item')).toHaveCount(2);
                const width = Number(await legend.getAttribute('width'));
                expect(width).toBeLessThan(100);
                const plotWidth = Number(
                    await component.locator('clipPath rect').first().getAttribute('width'),
                );
                expect(plotWidth).toBeGreaterThan(250);
                await component.update(
                    <ChartTestStory
                        data={{...data, legend: {...data.legend, itemStyle: {fontSize: '24px'}}}}
                    />,
                );
                await expect
                    .poll(async () => Number(await legend.getAttribute('width')))
                    .toBeGreaterThan(width);
            });
        });

        test.describe('Width larger than chart', () => {
            test('Bottom SVG legend in a 400px chart', async ({mount}) => {
                const data: ChartData = {
                    series: {data: lineLegendWidthSeries},
                    legend: {enabled: true, position: 'bottom', width: 600},
                };
                const component = await mount(<ChartTestStory data={data} />);

                await expect(component.locator('.gcharts-legend__line')).toHaveCount(2);
                await expect(component).toHaveScreenshot();
            });

            test('Bottom HTML legend in a 400px chart', async ({mount}) => {
                const series = cloneDeep(lineLegendWidthSeries.slice(0, 3));
                series[2].name =
                    'Siberian Federal District — revenue incl. Yakutia, Primorye and Khabarovsk';
                const data: ChartData = {
                    series: {data: series},
                    legend: {enabled: true, position: 'bottom', width: 600, html: true},
                };
                const component = await mount(<ChartTestStory data={data} />);
                const label = component.locator('.gcharts-legend__item-text-html').last();
                await expect(label).toBeVisible();
                await expect.poll(async () => (await label.boundingBox())?.width).toBeLessThan(400);
                await expect(component).toHaveScreenshot();
            });

            test('Right legend in a 500px chart', async ({mount}) => {
                const data: ChartData = {
                    series: {data: lineLegendWidthSeries.slice(0, 3)},
                    legend: {enabled: true, position: 'right', width: 600},
                };
                const component = await mount(<ChartTestStory data={data} styles={{width: 500}} />);
                await expect(component.locator('.gcharts-legend')).toBeVisible();
                await expect(component.locator('clipPath rect').first()).toHaveAttribute(
                    'width',
                    '0',
                );
                await expect(component.locator('.gcharts-chart__content')).toHaveCount(0);
                await expect(component.locator('.gcharts-line')).toHaveCount(0);
                await expect(component.locator('.gcharts-x-axis, .gcharts-y-axis')).toHaveCount(0);
                await expect(component).toHaveScreenshot();

                await component.update(
                    <ChartTestStory
                        data={{...data, legend: {...data.legend, width: 180}}}
                        styles={{width: 500}}
                    />,
                );
                await expect(component.locator('.gcharts-chart__content')).toBeVisible();
                await expect(component.locator('.gcharts-line')).toHaveCount(3);
                await expect(component.locator('.gcharts-x-axis')).toBeVisible();
                await expect(component.locator('.gcharts-y-axis')).toBeVisible();

                await component.update(<ChartTestStory data={data} styles={{width: 500}} />);
                await expect(component.locator('.gcharts-chart__content')).toHaveCount(0);
                await expect(component.locator('.gcharts-line')).toHaveCount(0);
                await expect(component.locator('.gcharts-x-axis, .gcharts-y-axis')).toHaveCount(0);
                await expect(component.locator('.gcharts-legend')).toBeVisible();
            });
        });

        test('Pagination svg', async ({mount}) => {
            const component = await mount(
                <ChartTestStory data={piePaginatedLegendData} styles={{width: '150px'}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
            const arrowNext = component.getByText('▼');
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Pagination html', async ({mount}) => {
            const component = await mount(
                <ChartTestStory data={pieHtmlLegendData} styles={{width: '225px'}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
            const arrowNext = component.getByText('▼');
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('With overflowed legend items', async ({mount}) => {
            const component = await mount(
                <ChartTestStory data={pieOverflowedLegendItemsData} styles={{width: '270px'}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('With overflowed html legend items', async ({mount}) => {
            const data = cloneDeep(pieOverflowedLegendItemsData);
            set(data, 'legend.html', true);
            const component = await mount(<ChartTestStory data={data} styles={{width: '270px'}} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('By clicking on the legend item, a series is selected', async ({mount}) => {
            const data: ChartData = {
                legend: {
                    enabled: true,
                },
                series: {
                    data: [
                        {
                            type: 'pie',
                            dataLabels: {enabled: false},
                            data: new Array(3).fill(null).map((_d, i) => ({
                                name: `${i + 1}`,
                                value: 1,
                            })),
                        },
                    ],
                },
            };

            const component = await mount(<ChartTestStory data={data} />);

            const legendItem = component.locator('.gcharts-legend__item text').first();
            await legendItem.click();

            await expect(component.locator('svg')).toHaveScreenshot();

            // When clicking on the legend again, the chart should return to its original state.
            await legendItem.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        const positions = ['top', 'bottom', 'left', 'right'] as const;

        positions.forEach((position) => {
            test.describe(`Position ${position}`, () => {
                for (const html of [false, true]) {
                    test(`Explicit width (${html ? 'html' : 'svg'})`, async ({mount}) => {
                        const data = cloneDeep(pieOverflowedLegendItemsData);
                        data.chart = {margin: {left: 10, right: 30}};
                        data.legend = {enabled: true, position, width: 230, html};
                        const points = (data.series.data[0] as PieSeries).data;
                        points[0].name = 'First moderately long legend label';
                        points[1].name = 'Second moderately long legend label';
                        points[2].name = LONG_TEXT;

                        const component = await mount(
                            <ChartTestStory data={data} styles={{width: 1000}} />,
                        );
                        const plotBounds = component.locator('clipPath rect').first();
                        const legendLines = component.locator('.gcharts-legend__line');
                        const labels = component.locator(
                            html ? '.gcharts-legend__item-text-html' : '.gcharts-legend__item text',
                        );
                        const isVertical = position === 'left' || position === 'right';

                        for (const width of [230, 600, 230]) {
                            if (data.legend.width !== width) {
                                data.legend = {...data.legend, width};
                                await component.update(
                                    <ChartTestStory data={data} styles={{width: 1000}} />,
                                );
                            }

                            await expect(plotBounds).toHaveAttribute(
                                'width',
                                String(960 - (isVertical ? width + 15 : 0)),
                            );
                            await expect(legendLines).toHaveCount(width === 230 ? 3 : 2);
                            await expect(labels.last()).toBeVisible();
                            await expect
                                .poll(async () => {
                                    const box = await labels.last().boundingBox();
                                    return box?.width;
                                })
                                .toBeLessThanOrEqual(width - 15 + 1);
                            await expect
                                .poll(async () => {
                                    const box = await labels.last().boundingBox();
                                    return box?.width;
                                })
                                .toBeGreaterThan(width - 35);
                        }
                    });
                }

                test('Basic', async ({mount}) => {
                    const data = cloneDeep(pieOverflowedLegendItemsData);
                    set(data, 'legend.position', position);
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: '270px'}} />,
                    );
                    await expect(component.locator('svg')).toHaveScreenshot();
                });

                test('With html', async ({mount}) => {
                    const data = cloneDeep(pieOverflowedLegendItemsData);
                    set(data, 'legend.position', position);
                    set(data, 'legend.html', true);
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: '270px'}} />,
                    );
                    await expect(component.locator('svg')).toHaveScreenshot();
                });

                test('Paginated', async ({mount}) => {
                    const data = cloneDeep(piePaginatedLegendData);
                    set(data, 'legend.position', position);

                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: '150px'}} />,
                    );
                    await expect(component.locator('svg')).toHaveScreenshot();

                    const arrowNext = component.getByText('▼');
                    await arrowNext.click();
                    await expect(component.locator('svg')).toHaveScreenshot();
                    await arrowNext.click();
                    await expect(component.locator('svg')).toHaveScreenshot();
                });
            });
        });

        test('Grouped legend items', async ({mount}) => {
            const component = await mount(<ChartTestStory data={groupedLegend} />);

            await expect(component.locator('svg')).toHaveScreenshot();

            const legendItem = component.locator('.gcharts-legend__item text').first();
            await legendItem.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Preserves series order for integer-like group ids', async ({mount}) => {
            const data: ChartData = {
                legend: {
                    enabled: true,
                },
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'First series',
                            legend: {
                                groupId: '10000',
                            },
                            data: [{x: 0, y: 1}],
                        },
                        {
                            type: 'line',
                            name: 'Second series',
                            legend: {
                                groupId: '1000',
                            },
                            data: [{x: 0, y: 2}],
                        },
                        {
                            type: 'line',
                            name: 'Third series',
                            legend: {
                                groupId: '999',
                            },
                            data: [{x: 0, y: 3}],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} />);

            await expect(component.locator('.gcharts-legend__item text')).toHaveText([
                'First series',
                'Second series',
                'Third series',
            ]);
        });

        test.describe('Vertical alignment (position left)', () => {
            const verticalAlignOptions: ChartLegend['verticalAlign'][] = [
                'top',
                'center',
                'bottom',
            ];

            verticalAlignOptions.forEach((verticalAlign) => {
                test(`verticalAlign="${verticalAlign}"`, async ({mount}) => {
                    const data = cloneDeep(pieOverflowedLegendItemsData);
                    set(data, 'legend.position', 'left');
                    set(data, 'legend.verticalAlign', verticalAlign);
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: '270px'}} />,
                    );
                    await expect(component.locator('svg')).toHaveScreenshot();
                });
            });
        });

        test('The default legend display should take into account the series settings', async ({
            mount,
        }) => {
            const chartData: ChartData = {
                series: {
                    data: [
                        {
                            name: 'Not null data',
                            type: 'line',
                            dataLabels: {enabled: false},
                            data: [{x: 10, y: 10}],
                        },
                        {
                            name: 'Null data',
                            type: 'line',
                            dataLabels: {enabled: false},
                            data: [{x: 10, y: null}],
                            legend: {enabled: false},
                        },
                    ],
                },
            };
            const component = await mount(
                <ChartTestStory data={chartData} styles={{width: '270px'}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Legend with long item names', async ({mount}) => {
            const data: ChartData = {
                legend: {enabled: true},
                series: {
                    data: [
                        {
                            type: 'pie',
                            data: [
                                {
                                    name: '1: ' + LONG_TEXT,
                                    value: 5,
                                },
                                {
                                    name: '2: ' + LONG_TEXT,
                                    value: 5,
                                },
                            ],
                        },
                    ],
                },
            };
            const component = await mount(<ChartTestStory data={data} styles={{width: 400}} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Continuous', () => {
        const legendAlign: ChartLegend['align'][] = ['left', 'right', 'center'];
        legendAlign.forEach((align) => {
            test(`Chart margin should be taken into account when positioning the legend (align="${align}")`, async ({
                mount,
            }) => {
                const chartData: ChartData = {
                    chart: {margin: {left: 10, right: 10}},
                    legend: {
                        enabled: true,
                        type: 'continuous',
                        align,
                        colorScale: {
                            colors: ['#348bdc', '#348bdc'],
                        },
                        width: 100,
                    },
                    series: {
                        data: [
                            {
                                type: 'pie',
                                dataLabels: {enabled: false},
                                data: [{value: 10, name: 'Data'}],
                            },
                        ],
                    },
                };
                const component = await mount(
                    <ChartTestStory data={chartData} styles={{width: 200}} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });
    });
});
