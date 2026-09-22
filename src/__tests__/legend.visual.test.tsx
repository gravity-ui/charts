import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator} from '@playwright/test';
import cloneDeep from 'lodash/cloneDeep';
import range from 'lodash/range';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {groupedLegend, pieHtmlLegendData} from '../__stories__/__data__';
import type {ChartData, ChartLegend, LineSeries, PieSeries} from '../types';

import {LegendItemClickTestStory} from './components/LegendItemClickTestStory';
import {LONG_TEXT} from './constants';

async function visitLegendPages(
    component: Locator,
    labels: Locator,
    checkPage: () => Promise<void>,
) {
    const counter = component.locator('.gcharts-legend__pagination-counter');
    await expect(counter).toBeVisible();
    const pageCount = Number((await counter.textContent())?.split('/')[1]);
    expect(pageCount).toBeGreaterThan(1);
    const visited: string[] = [];
    for (let page = 1; page <= pageCount; page++) {
        await expect(counter).toHaveText(`${page}/${pageCount}`);
        await checkPage();
        visited.push(...(await labels.allTextContents()));
        if (page < pageCount) {
            await component.getByText('▼').click();
        }
    }
    return visited;
}

async function getVerticalBoxes(locator: Locator) {
    return locator.evaluateAll((elements) =>
        elements.map((element) => {
            const {y, height} = element.getBoundingClientRect();
            return {y, height};
        }),
    );
}

async function checkLegendSymbolBounds(component: Locator) {
    const symbols = component.locator('.gcharts-legend__item-symbol');
    const boxes = await getVerticalBoxes(symbols);
    expect(boxes.length).toBeGreaterThan(0);
    const chartBox = await component.boundingBox();
    expect(boxes[0].y).toBeGreaterThanOrEqual((chartBox?.y ?? Infinity) - 0.01);
    for (let i = 1; i < boxes.length; i++) {
        expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].height - 0.01);
    }
    const counter = component.locator('.gcharts-legend__pagination-counter');
    const paginator = await counter.boundingBox();
    const last = boxes[boxes.length - 1];
    expect(last.y + last.height).toBeLessThanOrEqual((paginator?.y ?? -Infinity) + 0.01);
    expect((paginator?.y ?? Infinity) + (paginator?.height ?? 0)).toBeLessThanOrEqual(
        (chartBox?.y ?? -Infinity) + (chartBox?.height ?? 0) + 0.01,
    );
    return boxes;
}

async function expectSvgWidth(locator: Locator, width: number) {
    await expect(locator).toHaveAttribute('width', /^-?(?:\d|\.\d)/);
    await expect
        .poll(async () => Number.parseFloat((await locator.getAttribute('width')) ?? ''))
        .toBeCloseTo(width, 5);
}

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
    for (const position of ['left', 'right', 'top', 'bottom'] as const) {
        test(`Continuous width formats preserve pixel layout (${position})`, async ({mount}) => {
            const data = cloneDeep(pieOverflowedLegendItemsData);
            const chartWidth = 1000;
            const chartMargin = {left: 10, right: 30};
            data.chart = {margin: chartMargin};
            data.legend = {
                enabled: true,
                type: 'continuous',
                position,
                width: '230.5px',
                colorScale: {colors: ['#e8f1fa', '#348bdc'], domain: [0, 10]},
            };
            const component = await mount(
                <ChartTestStory data={data} styles={{width: chartWidth}} />,
            );
            const gradient = component.locator('.gcharts-legend image');
            const availableWidth = chartWidth - chartMargin.left - chartMargin.right;
            const isVertical = position === 'left' || position === 'right';
            for (const {width, pixels} of [
                {width: '230.5px', pixels: 230.5},
                {width: '12.5%', pixels: 120},
                {width: 120, pixels: 120},
                {width: '230.5px', pixels: 230.5},
            ] as const) {
                data.legend = {...data.legend, width};
                await component.update(<ChartTestStory data={data} styles={{width: chartWidth}} />);
                await expectSvgWidth(gradient, pixels);
                const offsetLeft =
                    position === 'right'
                        ? chartWidth - chartMargin.right - pixels
                        : chartMargin.left;
                // Side gradients use their own width; horizontal gradients center in the chart.
                const expectedLeft = offsetLeft + (isVertical ? 0 : (availableWidth - pixels) / 2);
                await expect
                    .poll(async () => {
                        const chartBox = await component.locator('svg').first().boundingBox();
                        const gradientBox = await gradient.boundingBox();
                        return chartBox && gradientBox ? gradientBox.x - chartBox.x : undefined;
                    })
                    .toBeCloseTo(expectedLeft, 0);
            }
        });
    }

    for (const position of ['top', 'bottom', 'left', 'right'] as const) {
        test(`Continuous percentage width respects chart margins (${position})`, async ({
            mount,
        }) => {
            const data = cloneDeep(pieOverflowedLegendItemsData);
            const legendMargin = 35;
            data.chart = {margin: {left: 10, right: 30}};
            data.legend = {
                enabled: true,
                type: 'continuous',
                position,
                width: '150%',
                margin: legendMargin,
                colorScale: {colors: ['#e8f1fa', '#348bdc'], domain: [0, 10]},
            };
            const component = await mount(<ChartTestStory data={data} styles={{width: 1000}} />);
            const gradient = component.locator('.gcharts-legend image');
            const plotBounds = component.locator('clipPath rect').first();
            const isVertical = position === 'left' || position === 'right';

            for (const {containerWidth, width, ratio} of [
                {containerWidth: 1000, width: '25%', ratio: 0.25},
                {containerWidth: 500, width: '25%', ratio: 0.25},
                {containerWidth: 1000, width: '25%', ratio: 0.25},
                {containerWidth: 1000, width: '150%', ratio: 1},
                {containerWidth: 500, width: '150%', ratio: 1},
            ] as const) {
                data.legend = {...data.legend, width};
                await component.update(
                    <ChartTestStory data={data} styles={{width: containerWidth}} />,
                );
                const availableWidth = containerWidth - 40;
                const gradientWidth = availableWidth * ratio;
                const offsetLeft = position === 'right' ? containerWidth - 30 - gradientWidth : 10;
                const expectedLeft =
                    offsetLeft + (isVertical ? 0 : (availableWidth - gradientWidth) / 2);
                await expectSvgWidth(gradient, gradientWidth);
                await expectSvgWidth(
                    plotBounds,
                    Math.max(0, availableWidth - (isVertical ? gradientWidth + legendMargin : 0)),
                );
                await expect
                    .poll(async () => {
                        const chartBox = await component.locator('svg').first().boundingBox();
                        const gradientBox = await gradient.boundingBox();
                        return chartBox && gradientBox ? gradientBox.x - chartBox.x : undefined;
                    })
                    .toBeCloseTo(expectedLeft, 0);
            }
        });
    }

    test('A full-width percentage side legend leaves no plot or axes', async ({mount}) => {
        const data: ChartData = {
            chart: {margin: {left: 10, right: 30}},
            legend: {enabled: true, position: 'left', width: '100%'},
            series: {data: lineLegendWidthSeries},
        };
        const component = await mount(<ChartTestStory data={data} styles={{width: 1000}} />);
        await expectSvgWidth(component.locator('.gcharts-legend'), 960);
        await expectSvgWidth(component.locator('clipPath rect').first(), 0);
        await expect(component.locator('.gcharts-chart__content')).toHaveCount(0);
        await expect(component.locator('.gcharts-line')).toHaveCount(0);
        await expect(component.locator('.gcharts-x-axis, .gcharts-y-axis')).toHaveCount(0);
    });

    test('Percentage width resizes (discrete)', async ({mount}) => {
        const data = cloneDeep(pieOverflowedLegendItemsData);
        data.chart = {margin: {left: 10, right: 30}};
        data.legend = {
            enabled: true,
            type: 'discrete',
            position: 'left',
            align: 'left',
            width: '25%',
            margin: 35,
            html: true,
        };
        const component = await mount(<ChartTestStory data={data} styles={{width: 1000}} />);
        const legend = component.locator('.gcharts-legend');
        const label = component.locator('.gcharts-legend__item-text-html').last();
        const plotBounds = component.locator('clipPath rect').first();

        for (const containerWidth of [1000, 500, 1000]) {
            await component.update(<ChartTestStory data={data} styles={{width: containerWidth}} />);
            const legendWidth = (containerWidth - 40) * 0.25;
            await expectSvgWidth(legend, legendWidth);
            await expectSvgWidth(plotBounds, containerWidth - 40 - legendWidth - 35);
            // The default circle has area 8² px²; reserve its diameter and 5px label padding.
            const symbolAndPaddingWidth = 2 * Math.sqrt(64 / Math.PI) + 5;
            await expect
                .poll(async () => (await label.boundingBox())?.width)
                .toBeLessThanOrEqual(legendWidth - symbolAndPaddingWidth + 1);
        }
    });

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

                test(`right-aligned list (${output})`, async ({mount}) => {
                    const data: ChartData = {
                        chart: {margin: {top: 20, right: 20, bottom: 20, left: 20}},
                        legend: {
                            enabled: true,
                            layout: 'vertical',
                            position: 'bottom',
                            width: 240,
                            align: 'right',
                            html,
                        },
                        series: {
                            data: [
                                {...lineLegendWidthSeries[0], name: 'Longest legend label'},
                                {
                                    type: 'scatter',
                                    name: html ? '<b>Short</b>' : 'Short',
                                    data: [{x: 1, y: 9}],
                                },
                            ],
                        },
                    };
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: 640, height: 320}} />,
                    );
                    const labels = component.locator(labelSelector);
                    const symbols = component.locator('.gcharts-legend__item-symbol');
                    await expect(labels).toHaveCount(2);
                    await expect(symbols).toHaveCount(2);
                    await expect
                        .poll(async () => {
                            const chart = await component.boundingBox();
                            const longLabel = await labels.nth(0).boundingBox();
                            const shortLabel = await labels.nth(1).boundingBox();
                            const lineSymbol = await symbols.nth(0).boundingBox();
                            const scatterSymbol = await symbols.nth(1).boundingBox();
                            if (
                                !chart ||
                                !longLabel ||
                                !shortLabel ||
                                !lineSymbol ||
                                !scatterSymbol
                            ) {
                                return false;
                            }
                            return (
                                Math.abs(
                                    longLabel.x + longLabel.width - (chart.x + chart.width - 20),
                                ) < 2 &&
                                Math.abs(longLabel.x - shortLabel.x) < 1 &&
                                shortLabel.y >= longLabel.y + longLabel.height - 1 &&
                                lineSymbol.x + lineSymbol.width < longLabel.x &&
                                scatterSymbol.x + scatterSymbol.width < shortLabel.x &&
                                Math.abs(
                                    lineSymbol.x +
                                        lineSymbol.width / 2 -
                                        (scatterSymbol.x + scatterSymbol.width / 2),
                                ) < 1
                            );
                        })
                        .toBe(true);
                    await expect(component).toHaveScreenshot();
                });

                for (const layout of ['vertical', 'horizontal'] as const) {
                    test(`large pie symbols fit rows and pages (${layout}, ${output})`, async ({
                        mount,
                    }) => {
                        const names = range(15).map((i) => `Marker label ${i}`);
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
                                data: [
                                    {
                                        type: 'pie',
                                        dataLabels: {enabled: false},
                                        legend: {symbol: {width: 20}},
                                        data: names.map((name) => ({name, value: 1})),
                                    },
                                ],
                            },
                        };
                        const component = await mount(
                            <ChartTestStory data={data} styles={{width: 600, height: 220}} />,
                        );
                        const labels = component.locator(labelSelector);
                        const visited = await visitLegendPages(component, labels, async () => {
                            const boxes = await checkLegendSymbolBounds(component);
                            const labelBoxes = await getVerticalBoxes(labels);
                            labelBoxes.forEach((label, i) => {
                                const marker = boxes[i];
                                expect(
                                    Math.abs(
                                        label.y + label.height / 2 - (marker.y + marker.height / 2),
                                    ),
                                ).toBeLessThan(2);
                            });
                        });
                        expect(visited).toEqual(names);
                    });

                    test(`large scatter symbols fit rows and pages (${layout}, ${output})`, async ({
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
                                data: names.map((name, i) => ({
                                    type: 'scatter',
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
                        const visited = await visitLegendPages(component, labels, async () => {
                            await checkLegendSymbolBounds(component);
                        });
                        expect(visited).toEqual(names);
                    });
                }

                test(`oversized row keeps pagination accessible (${output})`, async ({mount}) => {
                    const data: ChartData = {
                        chart: {margin: {top: 10, bottom: 10}},
                        legend: {
                            enabled: true,
                            layout: 'vertical',
                            html,
                            position: 'left',
                            width: 300,
                            align: 'left',
                        },
                        series: {
                            data: [
                                {
                                    type: 'scatter',
                                    symbolType: 'square',
                                    name: 'Tall',
                                    legend: {symbol: {width: 220}},
                                    data: [{x: 0, y: 1}],
                                },
                                {
                                    type: 'scatter',
                                    symbolType: 'square',
                                    name: 'Short',
                                    legend: {symbol: {width: 8}},
                                    data: [{x: 0, y: 2}],
                                },
                                {
                                    type: 'scatter',
                                    symbolType: 'square',
                                    name: 'Medium',
                                    legend: {symbol: {width: 40}},
                                    data: [{x: 0, y: 3}],
                                },
                            ],
                        },
                    };
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: 600, height: 180}} />,
                    );
                    const counter = component.locator('.gcharts-legend__pagination-counter');
                    await expect(counter).toHaveText('1/2');
                    const viewport = component.locator('.gcharts-legend clipPath rect');
                    const viewportBox = await viewport.evaluate((element: SVGRectElement) => {
                        const height = element.height.baseVal.value;
                        const bottom = new DOMPoint(0, height).matrixTransform(
                            element.getScreenCTM() ?? undefined,
                        );
                        return {height, bottom: bottom.y};
                    });
                    const paginatorBox = await counter.boundingBox();
                    expect(paginatorBox).not.toBeNull();
                    expect(viewportBox.bottom).toBeLessThanOrEqual(paginatorBox?.y ?? -Infinity);
                    const marker = await component
                        .locator('.gcharts-legend__item-symbol')
                        .boundingBox();
                    expect(marker?.height ?? -Infinity).toBeGreaterThan(viewportBox.height);
                    if (html) {
                        await expect(component.locator('[data-legend]')).toHaveCSS(
                            'overflow',
                            'hidden',
                        );
                    }
                    const firstLabelBox = await component.locator(labelSelector).boundingBox();
                    await expect(component).toHaveScreenshot();
                    await component.getByText('▼').click();
                    await expect(counter).toHaveText('2/2');
                    await expect(component.locator(labelSelector)).toHaveText(['Short', 'Medium']);
                    // Preserve both column positions when the largest symbol is on another page.
                    for (const label of await component.locator(labelSelector).all()) {
                        expect((await label.boundingBox())?.x).toBe(firstLabelBox?.x);
                    }
                    for (const symbol of await component
                        .locator('.gcharts-legend__item-symbol')
                        .all()) {
                        const box = await symbol.boundingBox();
                        expect((box?.x ?? Infinity) + (box?.width ?? 0) / 2).toBeCloseTo(
                            (marker?.x ?? -Infinity) + (marker?.width ?? 0) / 2,
                        );
                    }
                    await checkLegendSymbolBounds(component);
                    await expect(component).toHaveScreenshot();
                    await component.getByText('▲').click();
                    await expect(counter).toHaveText('1/2');
                    await expect(component.locator(labelSelector)).toHaveText(['Tall']);
                });

                test(`six triangle markers fit without pagination (${output})`, async ({mount}) => {
                    const data: ChartData = {
                        legend: {
                            enabled: true,
                            layout: 'vertical',
                            html,
                            position: 'left',
                            width: 150,
                            align: 'left',
                        },
                        series: {
                            data: range(6).map((i) => ({
                                type: 'scatter',
                                name: `Item ${i}`,
                                symbolType: 'triangle',
                                legend: {symbol: {width: 20}},
                                data: [{x: i, y: i}],
                            })),
                        },
                    };
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: 600, height: 200}} />,
                    );
                    await expect(component.locator(labelSelector)).toHaveCount(6);
                    await expect(
                        component.locator('.gcharts-legend__pagination-counter'),
                    ).toHaveCount(0);
                    const boxes = await getVerticalBoxes(
                        component.locator('.gcharts-legend__item-symbol'),
                    );
                    const chart = await component.boundingBox();
                    expect(boxes[0].y).toBeGreaterThanOrEqual(chart?.y ?? Infinity);
                    expect(boxes[5].y + boxes[5].height).toBeLessThanOrEqual(
                        (chart?.y ?? -Infinity) + (chart?.height ?? 0),
                    );
                    await expect(component).toHaveScreenshot();
                });

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

        for (const symbolType of ['diamond', 'triangle', 'triangle-down'] as const) {
            test(`does not wrap fitting ${symbolType} symbols onto another row`, async ({
                mount,
            }) => {
                const symbolPadding = 5;
                const itemDistance = 20;
                const data: ChartData = {
                    legend: {enabled: true, itemDistance},
                    series: {
                        data: ['East', 'West'].map((name, i) => ({
                            type: 'scatter',
                            name,
                            symbolType,
                            legend: {symbol: {width: 8, padding: symbolPadding}},
                            data: [{x: i, y: i + 1}],
                        })),
                    },
                };
                const component = await mount(<ChartTestStory data={data} />);
                const labels = component.locator('.gcharts-legend__item-text');
                await expect(labels).toHaveText(['East', 'West']);
                const symbols = component.locator('.gcharts-legend__item-symbol');
                await expect(symbols).toHaveCount(2);
                // Measure the rendered geometry independently of getSymbolBBoxWidth so an
                // overestimate in that helper cannot also widen the test's fitting threshold.
                // Use the same fractional Canvas text advances as getTextSizeFn in legend layout.
                const textWidth = await labels.evaluateAll((elements) => {
                    const context = document.createElement('canvas').getContext('2d');
                    if (!context) {
                        throw new Error('Expected a Canvas context for measuring legend text');
                    }
                    return elements.reduce((sum, element) => {
                        const {fontWeight, fontSize, fontFamily} = getComputedStyle(element);
                        context.font = `${fontWeight} ${fontSize} ${fontFamily}`;
                        return sum + context.measureText(element.textContent ?? '').width;
                    }, 0);
                });
                const symbolsWidth = await symbols.evaluateAll((elements) =>
                    elements.reduce(
                        (sum, element) => sum + element.getBoundingClientRect().width,
                        0,
                    ),
                );
                // Round up to allow for D3's three-decimal SVG path serialization.
                const legendWidth = Math.ceil(
                    textWidth + symbolsWidth + 2 * symbolPadding + itemDistance,
                );
                data.legend = {...data.legend, width: legendWidth};
                await component.update(<ChartTestStory data={data} />);
                await expectSvgWidth(component.locator('.gcharts-legend'), legendWidth);
                await expect(labels).toHaveText(['East', 'West']);
                const boxes = await labels.evaluateAll((elements) =>
                    elements.map((element) => {
                        const {y, right} = element.getBoundingClientRect();
                        return {y, right};
                    }),
                );
                expect(boxes[0].y).toBe(boxes[1].y);
                const firstSymbol = await symbols.first().boundingBox();
                if (!firstSymbol) {
                    throw new Error('Expected a visible legend symbol');
                }
                expect(boxes[1].right - firstSymbol.x).toBeLessThanOrEqual(legendWidth);
                await expect(component).toHaveScreenshot();
            });
        }

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
                await expectSvgWidth(component.locator('clipPath rect').first(), 0);
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

        test('Item click event runs before the default SVG legend action', async ({mount}) => {
            const component = await mount(<LegendItemClickTestStory />);
            const legendItems = component.locator('.gcharts-legend__item text');

            await legendItems.first().click();

            await expect(component.locator('[data-qa="clicked-legend-item"]')).toHaveText(
                'First series:true',
            );
            await expect(legendItems.nth(1)).toHaveClass(/gcharts-legend__item-text_unselected/);
        });

        test('Item click event can prevent the default HTML legend action', async ({mount}) => {
            const component = await mount(
                <LegendItemClickTestStory html={true} preventDefault={true} />,
            );
            const legendItems = component.locator('.gcharts-legend__item-text-html');

            await legendItems.first().click();

            await expect(component.locator('[data-qa="clicked-legend-item"]')).toHaveText(
                'First series:true',
            );
            await expect(legendItems.nth(1)).toHaveClass(/gcharts-legend__item-text-html_selected/);
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

                        for (const configuredWidth of [230, '600px', '230px'] as const) {
                            const width =
                                typeof configuredWidth === 'number'
                                    ? configuredWidth
                                    : Number.parseFloat(configuredWidth);
                            if (data.legend.width !== configuredWidth) {
                                data.legend = {...data.legend, width: configuredWidth};
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
