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
        test.describe('Vertical layout', () => {
            test('paginates HTML rows using their measured heights', async ({mount}) => {
                const names = range(12).map((i) => `Item ${i}`);
                const data: ChartData = {
                    legend: {enabled: true, layout: 'vertical', html: true, align: 'left'},
                    series: {
                        data: [
                            {
                                type: 'pie',
                                dataLabels: {enabled: false},
                                data: names.map((name, i) => ({
                                    name: `<span style="line-height: ${i % 2 ? 18 : 32}px">${name}</span>`,
                                    value: 1,
                                })),
                            },
                        ],
                    },
                };
                const component = await mount(<ChartTestStory data={data} />);
                const labels = component.locator('.gcharts-legend__item-text-html');
                const counter = component.locator('.gcharts-legend__pagination-counter');
                await expect(counter).toBeVisible();
                const pageCount = Number((await counter.textContent())?.split('/')[1]);
                expect(pageCount).toBeGreaterThan(1);
                const visited: string[] = [];
                for (let page = 1; page <= pageCount; page++) {
                    await expect(counter).toHaveText(`${page}/${pageCount}`);
                    const boxes = await labels.evaluateAll((elements) =>
                        elements.map((element) => {
                            const {x, y, height} = element.getBoundingClientRect();
                            return {x, y, height};
                        }),
                    );
                    expect(boxes.length).toBeGreaterThan(0);
                    for (let i = 1; i < boxes.length; i++) {
                        expect(boxes[i].y).toBeGreaterThanOrEqual(
                            boxes[i - 1].y + boxes[i - 1].height,
                        );
                        expect(boxes[i].x).toBe(boxes[0].x);
                    }
                    const paginator = await counter.boundingBox();
                    const last = boxes[boxes.length - 1];
                    expect(last.y + last.height).toBeLessThanOrEqual(paginator?.y ?? -Infinity);
                    visited.push(...(await labels.allTextContents()));
                    if (page < pageCount) {
                        await component.getByText('▼').click();
                    }
                }
                expect(visited).toEqual(names);
            });

            for (const html of [false, true]) {
                const output = html ? 'html' : 'svg';
                const labelSelector = html
                    ? '.gcharts-legend__item-text-html'
                    : '.gcharts-legend__item text';

                for (const layout of ['vertical', 'horizontal'] as const) {
                    for (const type of ['pie', 'scatter'] as const) {
                        test(`large ${type} symbols fit rows and pages (${layout}, ${output})`, async ({
                            mount,
                        }) => {
                            const names = range(15).map((i) => `Marker label ${i}`);
                            const symbolTypes = [
                                'circle',
                                'diamond',
                                'square',
                                'triangle',
                                'triangle-down',
                            ] as const;
                            const data: ChartData = {
                                legend: {
                                    enabled: true,
                                    layout,
                                    html,
                                    position: 'left',
                                    width: 150,
                                    align: 'left',
                                },
                                series: {
                                    data:
                                        type === 'pie'
                                            ? [
                                                  {
                                                      type,
                                                      dataLabels: {enabled: false},
                                                      legend: {symbol: {width: 20}},
                                                      data: names.map((name) => ({name, value: 1})),
                                                  },
                                              ]
                                            : names.map((name, i) => ({
                                                  type,
                                                  name,
                                                  symbolType: symbolTypes[i % symbolTypes.length],
                                                  legend: {symbol: {width: 20}},
                                                  data: [{x: i, y: i}],
                                              })),
                                },
                            };
                            const component = await mount(
                                <ChartTestStory data={data} styles={{width: 600, height: 220}} />,
                            );
                            const labels = component.locator(labelSelector);
                            const symbols = component.locator('.gcharts-legend__item-symbol');
                            const counter = component.locator(
                                '.gcharts-legend__pagination-counter',
                            );
                            await expect(counter).toBeVisible();
                            const pageCount = Number((await counter.textContent())?.split('/')[1]);
                            expect(pageCount).toBeGreaterThan(1);
                            const visited: string[] = [];
                            for (let page = 1; page <= pageCount; page++) {
                                await expect(counter).toHaveText(`${page}/${pageCount}`);
                                const boxes = await symbols.evaluateAll((elements) =>
                                    elements.map((element) => {
                                        const {y, height} = element.getBoundingClientRect();
                                        return {y, height};
                                    }),
                                );
                                expect(boxes.length).toBeGreaterThan(0);
                                const chartBox = await component.boundingBox();
                                expect(boxes[0].y).toBeGreaterThanOrEqual(
                                    (chartBox?.y ?? Infinity) - 0.01,
                                );
                                for (let i = 1; i < boxes.length; i++) {
                                    expect(boxes[i].y).toBeGreaterThanOrEqual(
                                        boxes[i - 1].y + boxes[i - 1].height - 0.01,
                                    );
                                }
                                const paginator = await counter.boundingBox();
                                const last = boxes[boxes.length - 1];
                                expect(last.y + last.height).toBeLessThanOrEqual(
                                    (paginator?.y ?? -Infinity) + 0.01,
                                );
                                if (type === 'pie') {
                                    const labelBoxes = await labels.evaluateAll((elements) =>
                                        elements.map((element) => {
                                            const {y, height} = element.getBoundingClientRect();
                                            return {y, height};
                                        }),
                                    );
                                    labelBoxes.forEach((label, i) => {
                                        const marker = boxes[i];
                                        expect(
                                            Math.abs(
                                                label.y +
                                                    label.height / 2 -
                                                    (marker.y + marker.height / 2),
                                            ),
                                        ).toBeLessThan(2);
                                    });
                                }
                                visited.push(...(await labels.allTextContents()));
                                if (page < pageCount) {
                                    await component.getByText('▼').click();
                                }
                            }
                            expect(visited).toEqual(names);
                        });
                    }
                }

                for (const position of ['left', 'right', 'top', 'bottom'] as const) {
                    test(`${position} (${output})`, async ({mount}) => {
                        const data: ChartData = {
                            series: {
                                data: [
                                    lineLegendWidthSeries[0],
                                    {
                                        type: 'scatter',
                                        name: html ? '<b>Short</b>' : 'Short',
                                        data: [{x: 1, y: 9}],
                                    },
                                    {
                                        ...lineLegendWidthSeries[1],
                                        name: 'A very long legend label that must be truncated',
                                    },
                                ],
                            },
                            legend: {
                                enabled: true,
                                layout: 'vertical',
                                position,
                                width: 180,
                                html,
                                align: 'left',
                            },
                        };
                        const component = await mount(
                            <ChartTestStory data={data} styles={{width: 640, height: 320}} />,
                        );
                        const labels = component.locator(labelSelector);
                        const rows = component.locator('.gcharts-legend__line');
                        const checkGeometry = async () => {
                            await expect(rows).toHaveCount(3);
                            await expect(labels).toHaveCount(3);
                            await expect
                                .poll(async () => {
                                    const boxes = await labels.evaluateAll((elements) =>
                                        elements.map((element) => {
                                            const {x, y, height, width} =
                                                element.getBoundingClientRect();
                                            return {x, y, height, width};
                                        }),
                                    );
                                    return (
                                        boxes.length === 3 &&
                                        boxes.every(
                                            (box, i) =>
                                                Math.abs(box.x - boxes[0].x) < 1 &&
                                                box.width <= 159 &&
                                                (i === 0 ||
                                                    box.y >=
                                                        boxes[i - 1].y + boxes[i - 1].height - 1),
                                        )
                                    );
                                })
                                .toBe(true);
                            for (const row of await rows.all()) {
                                await expect(row.locator('.gcharts-legend__item')).toHaveCount(1);
                            }
                        };
                        await checkGeometry();
                        await expect(component).toHaveScreenshot();
                        await component.update(
                            <ChartTestStory data={data} styles={{width: 360, height: 320}} />,
                        );
                        await checkGeometry();
                    });
                }

                test(`pagination and updates (${output})`, async ({mount}) => {
                    const data = cloneDeep(piePaginatedLegendData);
                    data.legend = {
                        enabled: true,
                        layout: 'vertical',
                        position: 'left',
                        html,
                        align: 'left',
                        width: 180,
                    };
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: 600, height: 180}} />,
                    );
                    const labels = component.locator(labelSelector);
                    const counter = component.locator('.gcharts-legend__pagination-counter');
                    const next = component.getByText('▼');
                    await expect(counter).toBeVisible();
                    const firstPage = await labels.allTextContents();
                    await next.click();
                    await expect(labels.first()).not.toHaveText(firstPage[0]);
                    const secondPage = await labels.allTextContents();
                    expect(secondPage.every((name) => !firstPage.includes(name))).toBe(true);
                    const points = (data.series.data[0] as PieSeries).data;
                    expect([...firstPage, ...secondPage]).toEqual(
                        points
                            .slice(0, firstPage.length + secondPage.length)
                            .map((point) => point.name),
                    );
                    // Click a marker on a later page; its paired text reflects the same selection.
                    await component.locator('.gcharts-legend__item-symbol').first().click();
                    await expect(labels.first()).not.toHaveClass(/unselected/);
                    await expect(labels.nth(1)).toHaveClass(/unselected/);
                    await component.locator('.gcharts-legend__item-symbol').first().click();
                    await expect(labels.nth(1)).not.toHaveClass(/unselected/);

                    // A taller container reduces page count even when width is unchanged.
                    await component.update(
                        <ChartTestStory data={data} styles={{width: 600, height: 900}} />,
                    );
                    await expect(counter).toHaveCount(0);
                    await expect(labels).toHaveCount(points.length);
                    await component.update(
                        <ChartTestStory data={data} styles={{width: 600, height: 180}} />,
                    );
                    await expect(counter).toHaveText(/^1\//);
                    await next.click();
                    const updatedData: ChartData = {
                        ...data,
                        series: {
                            data: [
                                {
                                    ...(data.series.data[0] as PieSeries),
                                    data: points.slice(0, 3).reverse(),
                                },
                            ],
                        },
                    };
                    await component.update(
                        <ChartTestStory data={updatedData} styles={{width: 600, height: 180}} />,
                    );
                    await expect(counter).toHaveCount(0);
                    await expect(labels).toHaveText(
                        points
                            .slice(0, 3)
                            .reverse()
                            .map((point) => point.name),
                    );
                });

                test(`group selection survives resize (${output})`, async ({mount}) => {
                    const data: ChartData = {
                        ...groupedLegend,
                        legend: {
                            enabled: true,
                            layout: 'vertical',
                            html,
                            position: 'left',
                            align: 'left',
                        },
                    };
                    const component = await mount(<ChartTestStory data={data} />);
                    const labels = component.locator(labelSelector);
                    await expect(labels).toHaveText(['Series 1', 'Series 2', 'Series 3']);
                    await labels.first().click();
                    await expect(labels.first()).not.toHaveClass(/unselected/);
                    await expect(labels.nth(1)).toHaveClass(/unselected/);
                    await expect(labels.nth(2)).toHaveClass(/unselected/);
                    await component.update(<ChartTestStory data={data} styles={{width: 600}} />);
                    await expect(labels).toHaveText(['Series 1', 'Series 2', 'Series 3']);
                    await expect(labels.nth(1)).toHaveClass(/unselected/);
                    await labels.first().click();
                    await expect(
                        component.locator('[class*="gcharts-legend__item"][class*="unselected"]'),
                    ).toHaveCount(0);
                });
            }
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
