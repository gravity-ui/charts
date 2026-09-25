import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

test.describe('Content-based legend width', () => {
    test('horizontal auto width preserves plot space unless maxWidth is explicit', async ({
        mount,
    }) => {
        const data: ChartData = {
            legend: {enabled: true, position: 'left'},
            series: {
                data: Array.from({length: 12}, (_, index) => ({
                    type: 'line',
                    name: `Series ${index + 1}`,
                    data: [
                        {x: 0, y: index + 1},
                        {x: 1, y: index + 2},
                    ],
                })),
            },
        };
        let readyCount = 0;
        const getReadyCount = () => readyCount;
        const onRender = () => {
            readyCount++;
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 1000}} onRender={onRender} />,
        );
        const legend = component.locator('.gcharts-legend');
        const plot = component.locator('clipPath rect').first();
        await expect.poll(getReadyCount).toBeGreaterThan(0);
        const defaultLegendWidth = Number(await legend.getAttribute('width'));
        const defaultPlotWidth = Number(await plot.getAttribute('width'));

        let previousCount = readyCount;
        await component.update(
            <ChartTestStory
                data={{...data, legend: {...data.legend, width: 'auto'}}}
                styles={{width: 1000}}
                onRender={onRender}
            />,
        );
        await expect.poll(getReadyCount).toBeGreaterThan(previousCount);
        expect(Number(await legend.getAttribute('width'))).toBeLessThanOrEqual(defaultLegendWidth);
        expect(Number(await plot.getAttribute('width'))).toBeGreaterThanOrEqual(defaultPlotWidth);

        previousCount = readyCount;
        await component.update(
            <ChartTestStory
                data={{...data, legend: {...data.legend, width: 'auto', maxWidth: '80%'}}}
                styles={{width: 1000}}
                onRender={onRender}
            />,
        );
        await expect.poll(getReadyCount).toBeGreaterThan(previousCount);
        expect(Number(await legend.getAttribute('width'))).toBeGreaterThan(defaultLegendWidth);
        expect(Number(await plot.getAttribute('width'))).toBeLessThan(defaultPlotWidth);
    });

    test('discrete title stays above rows with or without maxWidth', async ({mount}) => {
        const data: ChartData = {
            legend: {enabled: true, position: 'left', layout: 'vertical', title: {text: 'Regions'}},
            series: {
                data: [
                    {
                        type: 'pie',
                        dataLabels: {enabled: false},
                        data: Array.from({length: 20}, (_, index) => ({
                            name: `Region ${index + 1}`,
                            value: index + 1,
                        })),
                    },
                ],
            },
        };
        let readyCount = 0;
        const getReadyCount = () => readyCount;
        const onRender = () => {
            readyCount++;
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{height: 160}} onRender={onRender} />,
        );
        const legend = component.locator('.gcharts-legend');
        const title = component.locator('.gcharts-legend__title');
        const firstRow = component.locator('.gcharts-legend__line').first();
        await expect.poll(getReadyCount).toBeGreaterThan(0);
        await expect(component.locator('.gcharts-legend__pagination')).toBeVisible();
        const initialHeight = await legend.getAttribute('height');
        for (const maxWidth of [undefined, 1000]) {
            const previousCount = readyCount;
            await component.update(
                <ChartTestStory
                    data={{...data, legend: {...data.legend, maxWidth}}}
                    styles={{height: 160}}
                    onRender={onRender}
                />,
            );
            await expect.poll(getReadyCount).toBeGreaterThan(previousCount);
            await expect(legend).toHaveAttribute('height', initialHeight ?? '');
            const titleBox = await title.boundingBox();
            const rowBox = await firstRow.boundingBox();
            if (!titleBox || !rowBox) {
                throw new Error('Expected title and first row bounds');
            }
            expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(rowBox.y + 1);
        }
    });

    for (const html of [false, true]) {
        test(`maxWidth preserves centered start-justified rows (${html ? 'html' : 'svg'})`, async ({
            mount,
        }) => {
            const data: ChartData = {
                legend: {enabled: true, align: 'center', justifyContent: 'start', html},
                series: {
                    data: [
                        {
                            type: 'pie',
                            dataLabels: {enabled: false},
                            data: [
                                {name: 'North', value: 1},
                                {name: 'South', value: 2},
                            ],
                        },
                    ],
                },
            };
            let readyCount = 0;
            const getReadyCount = () => readyCount;
            const onRender = () => {
                readyCount++;
            };
            const component = await mount(<ChartTestStory data={data} onRender={onRender} />);
            await expect.poll(getReadyCount).toBeGreaterThan(0);
            const labels = component.locator(
                html ? '.gcharts-legend__item-text-html' : '.gcharts-legend__item-text',
            );
            await expect(labels).toHaveCount(2);
            const initialBox = await labels.first().boundingBox();
            if (!initialBox) {
                throw new Error('Expected a visible legend label');
            }
            for (const maxWidth of [1000, 200, undefined]) {
                const previousCount = getReadyCount();
                await component.update(
                    <ChartTestStory
                        data={{...data, legend: {...data.legend, maxWidth}}}
                        onRender={onRender}
                    />,
                );
                await expect.poll(getReadyCount).toBeGreaterThan(previousCount);
                await expect(component.locator('.gcharts-legend')).toHaveAttribute(
                    'width',
                    String(maxWidth === 200 ? 200 : 400),
                );
                await expect
                    .poll(async () => (await labels.first().boundingBox())?.x)
                    .toBeCloseTo(initialBox.x, 1);
            }
        });
    }

    test('title leaves room for items and pagination when the chart grows', async ({mount}) => {
        const data: ChartData = {
            chart: {margin: {top: 0, bottom: 0, left: 0, right: 0}},
            legend: {
                enabled: true,
                position: 'left',
                layout: 'vertical',
                width: 'auto',
                maxWidth: 150,
                title: {text: 'Regions', style: {fontSize: '32px'}},
            },
            series: {
                data: [
                    {
                        type: 'pie',
                        dataLabels: {enabled: false},
                        data: Array.from({length: 20}, (_, i) => ({
                            name: `Region ${i}`,
                            value: i + 1,
                        })),
                    },
                ],
            },
        };
        let readyCount = 0;
        const getReadyCount = () => readyCount;
        const onRender = () => {
            readyCount++;
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{height: 40}} onRender={onRender} />,
        );
        await expect.poll(getReadyCount).toBeGreaterThan(0);
        const title = component.locator('.gcharts-legend__title');
        const counter = component.locator('.gcharts-legend__pagination-counter');
        const label = component.locator('.gcharts-legend__item-text').first();
        await expect(title).toHaveCount(0);
        await component.getByText('▼').click();
        await expect(counter).toContainText('2/');
        for (const height of [45, 100, 45]) {
            const previousCount = getReadyCount();
            await component.update(
                <ChartTestStory data={data} styles={{height}} onRender={onRender} />,
            );
            await expect.poll(getReadyCount).toBeGreaterThan(previousCount);
            await expect(title).toHaveCount(height === 100 ? 1 : 0);
            await expect(counter).toBeVisible();
            const itemBox = await label.boundingBox();
            const symbolBox = await component
                .locator('.gcharts-legend__item-symbol')
                .first()
                .boundingBox();
            const controlsBox = await component
                .locator('.gcharts-legend__pagination')
                .boundingBox();
            const chartBox = await component.boundingBox();
            if (!itemBox || !symbolBox || !controlsBox || !chartBox) {
                throw new Error('Expected item, navigation and chart bounds');
            }
            expect(itemBox.y).toBeGreaterThanOrEqual(chartBox.y - 1);
            expect(itemBox.y + itemBox.height / 2).toBeLessThan(controlsBox.y);
            expect(symbolBox.y + symbolBox.height).toBeLessThanOrEqual(controlsBox.y);
            expect(controlsBox.y + controlsBox.height).toBeLessThanOrEqual(chartBox.y + height + 1);
            const text = await label.textContent();
            await component.getByText('▼').click();
            await expect(label).not.toHaveText(text ?? '');
        }
        await expect(component).toHaveScreenshot();
    });

    test('narrow pagination hides the counter and keeps both arrows usable', async ({mount}) => {
        const data: ChartData = {
            legend: {
                enabled: true,
                position: 'left',
                layout: 'vertical',
                width: 'auto',
                maxWidth: 20,
            },
            series: {
                data: [
                    {
                        type: 'pie',
                        dataLabels: {enabled: false},
                        data: Array.from({length: 20}, (_, i) => ({
                            name: `Region ${i}`,
                            value: i + 1,
                        })),
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} styles={{height: 160}} />);
        const legend = component.locator('.gcharts-legend');
        const symbols = component.locator('.gcharts-legend__item-symbol');
        await expect(component.getByText('▼')).toBeVisible();
        await expect(legend).toHaveAttribute('width', '20');
        await expect(component.locator('.gcharts-legend__pagination-counter')).toHaveCount(0);
        const firstPageColor = await symbols
            .first()
            .evaluate((element) => getComputedStyle(element).fill);
        await component.getByText('▼').click();
        await expect
            .poll(() => symbols.first().evaluate((element) => getComputedStyle(element).fill))
            .not.toBe(firstPageColor);
        await expect(component).toHaveScreenshot();
        const clippedImage = await component.screenshot();
        const clipPath = await legend.getAttribute('clip-path');
        if (!clipPath) {
            throw new Error('Expected the strict legend width to be enforced by a clip path');
        }
        await legend.evaluate((element) => element.removeAttribute('clip-path'));
        const unclippedImage = await component.screenshot();
        expect(unclippedImage).toEqual(clippedImage);
        await legend.evaluate((element, clip) => element.setAttribute('clip-path', clip), clipPath);
        await component.getByText('▲').click();
        await expect
            .poll(() => symbols.first().evaluate((element) => getComputedStyle(element).fill))
            .toBe(firstPageColor);
        await component.update(
            <ChartTestStory
                data={{...data, legend: {...data.legend, maxWidth: 24}}}
                styles={{height: 160}}
            />,
        );
        await expect(legend).toHaveAttribute('width', '24');
        const upArrow = component.getByText('▲');
        const downArrow = component.getByText('▼');
        await expect(upArrow).toHaveAttribute('x', '0');
        const advance = await upArrow.evaluate((element) =>
            (element as SVGTextElement).getComputedTextLength(),
        );
        expect(Number(await downArrow.getAttribute('x'))).toBeCloseTo(advance, 1);
        await expect(component).toHaveScreenshot();
        await component.update(
            <ChartTestStory
                data={{...data, legend: {...data.legend, maxWidth: 80}}}
                styles={{height: 160}}
            />,
        );
        await expect(component.locator('.gcharts-legend__pagination-counter')).toContainText('1/');
        await component.getByText('▼').click();
        await expect(component.locator('.gcharts-legend__pagination-counter')).toContainText('2/');
    });

    for (const html of [false, true]) {
        test(`vertical layout with mixed symbol widths (${html ? 'html' : 'svg'})`, async ({
            mount,
        }) => {
            const data: ChartData = {
                chart: {margin: {left: 10, right: 20}},
                legend: {
                    enabled: true,
                    position: 'right',
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'center',
                    width: 'auto',
                    maxWidth: '45%',
                    html,
                },
                series: {
                    data: [
                        {
                            type: 'line',
                            name: 'North',
                            legend: {symbol: {width: 32, padding: 12}},
                            data: [
                                {x: 0, y: 2},
                                {x: 1, y: 4},
                                {x: 2, y: 3},
                            ],
                        },
                        {
                            type: 'scatter',
                            name: 'Central region',
                            symbolType: 'triangle',
                            legend: {symbol: {width: 26, padding: 5}},
                            data: [
                                {x: 0, y: 1},
                                {x: 1, y: 2},
                                {x: 2, y: 4},
                            ],
                        },
                        {
                            type: 'scatter',
                            name: 'South',
                            symbolType: 'diamond',
                            legend: {symbol: {width: 36, padding: 3}},
                            data: [
                                {x: 0, y: 3},
                                {x: 1, y: 1},
                                {x: 2, y: 2},
                            ],
                        },
                    ],
                },
            };
            const component = await mount(
                <ChartTestStory data={data} styles={{width: 500, height: 260}} />,
            );
            const legend = component.locator('.gcharts-legend');
            const rows = component.locator('.gcharts-legend__line');
            const labels = component.locator(
                html ? '.gcharts-legend__item-text-html' : '.gcharts-legend__item-text',
            );
            await expect(rows).toHaveCount(3);
            await expect(labels).toHaveText(['North', 'Central region', 'South']);
            const initialWidth = Number(await legend.getAttribute('width'));
            expect(initialWidth).toBeLessThan(211.5);

            const checkContentBounds = async () => {
                const labelBoxes = await labels.evaluateAll((elements) =>
                    elements.map((element) => {
                        const {x, width} = element.getBoundingClientRect();
                        return {x, width};
                    }),
                );
                const symbolBoxes = await component
                    .locator('.gcharts-legend__item-symbol')
                    .evaluateAll((elements) =>
                        elements.map((element) => {
                            const {x, width} = element.getBoundingClientRect();
                            return {x, width};
                        }),
                    );
                for (const label of labelBoxes) {
                    expect(label.x).toBeCloseTo(labelBoxes[0].x, 1);
                }
                for (const symbol of symbolBoxes) {
                    expect(symbol.x + symbol.width / 2).toBeCloseTo(
                        symbolBoxes[0].x + symbolBoxes[0].width / 2,
                        1,
                    );
                }
                const contentLeft = Math.min(...symbolBoxes.map((box) => box.x));
                const contentRight = Math.max(...labelBoxes.map((box) => box.x + box.width));
                const width = Number(await legend.getAttribute('width'));
                // Canvas advance widths and SVG glyph bounds can differ by a fraction of a pixel.
                expect(Math.abs(contentRight - contentLeft - width)).toBeLessThan(1);
            };
            await checkContentBounds();
            await expect(component).toHaveScreenshot();

            await component.update(
                <ChartTestStory
                    data={{...data, legend: {...data.legend, maxWidth: 100}}}
                    styles={{width: 500, height: 260}}
                />,
            );
            await expect
                .poll(async () => Number(await legend.getAttribute('width')))
                .toBeLessThanOrEqual(100);
            await checkContentBounds();
            await expect(component).toHaveScreenshot();
            await component.update(
                <ChartTestStory data={data} styles={{width: 500, height: 260}} />,
            );
            await expect(legend).toHaveAttribute('width', String(initialWidth));
            await expect(labels).toHaveText(['North', 'Central region', 'South']);
        });
    }
});
