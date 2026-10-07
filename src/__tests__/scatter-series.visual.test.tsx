import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {
    scatterBasicData,
    scatterClusteringData,
    scatterContinuousLegendData,
    scatterDataLabelsData,
    scatterNullModeSkipLinearXData,
    scatterNullModeZeroLinearXData,
} from '../__stories__/__data__';
import type {ChartData} from '../types';

import {ScatterClusterEventsTestStory} from './components/ScatterClusterEventsTestStory';
import {ScatterClusterSourceTestStory} from './components/ScatterClusterSourceTestStory';
import {getLocatorBoundingBox} from './utils';

test.describe('Scatter series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={scatterBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Continues legend', async ({mount}) => {
        const component = await mount(<ChartTestStory data={scatterContinuousLegendData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Clustering exposes the source points in tooltip and click events', async ({
        mount,
        page,
    }) => {
        const component = await mount(
            <ScatterClusterEventsTestStory data={scatterClusteringData} />,
        );
        const cluster = component.locator('.gcharts-scatter__cluster-label').first();
        const box = await getLocatorBoundingBox(cluster);
        const x = Math.round(box.x + box.width / 2);
        const y = Math.round(box.y + box.height / 2);

        await page.mouse.move(x, y);
        await expect(page.locator('.gcharts-tooltip')).toContainText('3');
        await expect(cluster).toHaveText('3');

        await page.mouse.click(x, y);
        await expect(component.locator('[data-qa="clicked-cluster"]')).toHaveText('3:a,b,c');
        await expect(cluster).toBeVisible();
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Cluster count uses its own tooltip format', async ({mount, page}) => {
        const data = cloneDeep(scatterClusteringData);
        data.series.data[0].tooltip = {
            valueFormat: {type: 'custom', formatter: () => 'Y format'},
        };
        const component = await mount(<ChartTestStory data={data} />);
        const box = await getLocatorBoundingBox(
            component.locator('.gcharts-scatter__cluster-label').first(),
        );
        await page.mouse.move(
            Math.round(box.x + box.width / 2),
            Math.round(box.y + box.height / 2),
        );
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toContainText('3');
        await expect(tooltip).not.toContainText('Y format');
    });

    test('Zero null mode preserves raw cluster members and resolved centroids', async ({
        mount,
        page,
    }) => {
        const component = await mount(
            <ScatterClusterSourceTestStory
                data={{
                    series: {
                        data: [
                            {
                                type: 'scatter',
                                name: 'Observations',
                                data: [
                                    {x: null, y: 2, custom: {id: 'a'}},
                                    {x: 2, y: null, custom: {id: 'b'}},
                                ],
                                nullMode: 'zero',
                                cluster: {enabled: true, layoutAlgorithm: {gridSize: '100%'}},
                            },
                        ],
                    },
                    xAxis: {min: -5, max: 5},
                    yAxis: [{min: -5, max: 5}],
                }}
            />,
        );
        const label = component.locator('.gcharts-scatter__cluster-label');
        await expect(label).toHaveText('2');
        const box = await getLocatorBoundingBox(label);
        const x = Math.round(box.x + box.width / 2);
        const y = Math.round(box.y + box.height / 2);
        await page.mouse.move(x, y);
        const expected = JSON.stringify({
            x: 1,
            y: 1,
            points: [
                {x: null, y: 2, sameReference: true, custom: {id: 'a'}},
                {x: 2, y: null, sameReference: true, custom: {id: 'b'}},
            ],
        });
        await expect(page.locator('[data-qa="hovered-source"]')).toHaveText(expected);
        await page.mouse.click(x, y);
        await expect(component.locator('[data-qa="clicked-source"]')).toHaveText(expected);
    });

    test('Cluster counts and ordinary HTML labels share overlap filtering', async ({mount}) => {
        const data: ChartData = {
            legend: {enabled: false},
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Clustered',
                        data: [
                            {x: 5, y: 50},
                            {x: 5, y: 50},
                        ],
                        cluster: {
                            enabled: true,
                            layoutAlgorithm: {gridSize: '100%'},
                            dataLabels: {allowOverlap: false, style: {fontSize: '24px'}},
                        },
                    },
                    {
                        type: 'scatter',
                        name: 'Ordinary',
                        data: [
                            {
                                x: 5,
                                y: 40,
                                radius: 0,
                                label: '<div style="width:40px;height:20px">HTML</div>',
                            },
                            {
                                x: 8,
                                y: 40,
                                radius: 0,
                                label: '<div style="width:40px;height:20px">Separate</div>',
                            },
                        ],
                        dataLabels: {enabled: true, html: true, allowOverlap: true, padding: 0},
                    },
                ],
            },
            xAxis: {min: 0, max: 10},
            yAxis: [{min: 0, max: 100}],
        };
        const component = await mount(<ChartTestStory data={data} />);
        const count = component.locator('.gcharts-scatter__cluster-label');
        const html = component.locator('.gcharts-chart__html-layer-item').filter({hasText: 'HTML'});
        await expect(count).toHaveCount(1);
        await expect(html).toHaveCount(1);
        const countBounds = await getLocatorBoundingBox(count);
        const htmlBounds = await getLocatorBoundingBox(html);
        expect(
            Math.min(countBounds.x + countBounds.width, htmlBounds.x + htmlBounds.width) -
                Math.max(countBounds.x, htmlBounds.x),
        ).toBeGreaterThan(0);
        expect(
            Math.min(countBounds.y + countBounds.height, htmlBounds.y + htmlBounds.height) -
                Math.max(countBounds.y, htmlBounds.y),
        ).toBeGreaterThan(0);

        const filtered = cloneDeep(data);
        set(filtered, 'series.data[1].dataLabels.allowOverlap', false);
        await component.update(<ChartTestStory data={filtered} />);
        await expect(count).toHaveCount(1);
        await expect(html).toHaveCount(0);
        await expect(
            component.locator('.gcharts-chart__html-layer-item').filter({hasText: 'Separate'}),
        ).toHaveCount(1);
        const separateBounds = await getLocatorBoundingBox(
            component.locator('.gcharts-chart__html-layer-item').filter({hasText: 'Separate'}),
        );
        expect(
            Math.min(countBounds.x + countBounds.width, separateBounds.x + separateBounds.width) -
                Math.max(countBounds.x, separateBounds.x),
        ).toBeLessThanOrEqual(0);
    });

    test('Point overrides enable oversized SVG and HTML labels without negative coordinates', async ({
        mount,
    }) => {
        const component = await mount(
            <ChartTestStory
                styles={{width: 200}}
                data={{
                    legend: {enabled: false},
                    series: {
                        data: [
                            {
                                type: 'scatter',
                                name: 'SVG',
                                data: [
                                    {
                                        x: 5,
                                        y: 75,
                                        label: 'Oversized SVG label '.repeat(10),
                                        dataLabels: {enabled: true},
                                    },
                                    {x: 8, y: 75, label: 'Disabled SVG'},
                                ],
                                dataLabels: {enabled: false, allowOverlap: true},
                            },
                            {
                                type: 'scatter',
                                name: 'HTML',
                                data: [
                                    {
                                        x: 5,
                                        y: 25,
                                        label: '<div style="width:500px;height:20px">Oversized HTML</div>',
                                        dataLabels: {enabled: true},
                                    },
                                    {x: 8, y: 25, label: 'Disabled HTML'},
                                ],
                                dataLabels: {enabled: false, html: true, allowOverlap: true},
                            },
                        ],
                    },
                    xAxis: {min: 0, max: 10},
                    yAxis: [{min: 0, max: 100}],
                }}
            />,
        );
        const svg = component.locator('.gcharts-scatter__label');
        const html = component
            .locator('.gcharts-chart__html-layer-item')
            .filter({hasText: 'Oversized HTML'});
        await expect(svg).toHaveCount(1);
        await expect(html).toHaveCount(1);
        expect(Number(await svg.getAttribute('x'))).toBeGreaterThanOrEqual(0);
        expect(
            await html.evaluate((element) =>
                Number.parseFloat((element as HTMLElement).style.left),
            ),
        ).toBeGreaterThanOrEqual(0);
        expect((await getLocatorBoundingBox(svg)).width).toBeGreaterThan(200);
        expect((await getLocatorBoundingBox(html)).width).toBe(500);
    });

    test('Shifted clusters stay in their split plot and the snapped crosshair follows them', async ({
        mount,
        page,
    }) => {
        const component = await mount(
            <ScatterClusterEventsTestStory
                data={{
                    legend: {enabled: false},
                    split: {enable: true, gap: '40px', plots: [{}, {}]},
                    series: {
                        data: [
                            {
                                type: 'scatter',
                                name: 'Lower plot',
                                yAxis: 1,
                                data: [49, 49.1, 50.1, 50.2].map((x, index) => ({
                                    x,
                                    y: 75,
                                    custom: {id: String(index)},
                                })),
                                cluster: {
                                    enabled: true,
                                    layoutAlgorithm: {gridSize: '50%'},
                                    overlapMode: 'shift',
                                    marker: {radius: 12},
                                },
                            },
                            {
                                type: 'scatter',
                                name: 'Upper plot',
                                data: [{x: 10, y: 50}],
                            },
                        ],
                    },
                    xAxis: {min: 0, max: 100, crosshair: {enabled: true, snap: true}},
                    yAxis: [
                        {min: 0, max: 100, plotIndex: 0},
                        {min: 0, max: 100, plotIndex: 1, crosshair: {enabled: true, snap: true}},
                    ],
                }}
            />,
        );
        const labels = component.locator('.gcharts-scatter__cluster-label');
        await expect(labels).toHaveCount(2);
        const lowerAxisDomain = component.locator('.gcharts-y-axis__domain').nth(1);
        await expect
            .poll(() =>
                lowerAxisDomain.evaluateAll(
                    (elements) => elements[0]?.getBoundingClientRect().height ?? 0,
                ),
            )
            .toBeGreaterThan(0);
        const plotBounds = await getLocatorBoundingBox(lowerAxisDomain);
        const labelBounds = await getLocatorBoundingBox(labels.first());
        const x = Math.round(labelBounds.x + labelBounds.width / 2);
        const y = Math.round(labelBounds.y + labelBounds.height / 2);
        expect(y).toBeGreaterThan(plotBounds.y);
        expect(y).toBeLessThan(plotBounds.y + plotBounds.height);
        await page.mouse.move(x, y);
        await expect(page.locator('.gcharts-tooltip')).toContainText('Lower plot');
        const crosshair = component.locator('[data-crosshair-y-line-1] path');
        await expect(crosshair).toHaveCount(1);
        await expect
            .poll(async () => {
                const currentLabelBounds = await getLocatorBoundingBox(labels.first());
                const crosshairBounds = await getLocatorBoundingBox(crosshair);
                return Math.abs(
                    crosshairBounds.y +
                        crosshairBounds.height / 2 -
                        (currentLabelBounds.y + currentLabelBounds.height / 2),
                );
            })
            .toBeLessThan(1);
        const currentLabelBounds = await getLocatorBoundingBox(labels.first());
        await page.mouse.click(
            Math.round(currentLabelBounds.x + currentLabelBounds.width / 2),
            Math.round(currentLabelBounds.y + currentLabelBounds.height / 2),
        );
        await expect(component.locator('[data-qa="clicked-cluster"]')).toHaveText('2:0,1');
    });

    test('Cluster marker uses its own symbol, fill and border', async ({mount, page}) => {
        const data = cloneDeep(scatterClusteringData);
        const series = data.series.data[0];
        if (series.type !== 'scatter') {
            throw new Error('Scatter series required');
        }
        series.cluster = {
            enabled: true,
            layoutAlgorithm: {gridSize: 50},
            marker: {
                symbol: 'square',
                radius: 12,
                color: '#123456',
                borderColor: '#ffffff',
                borderWidth: 2,
            },
        };

        const component = await mount(<ChartTestStory data={data} />);
        const marker = component.locator('.gcharts-marker__symbol').first();
        await expect(marker).toHaveAttribute('d', /[HhVv]/);
        await expect(marker).toHaveAttribute('fill', '#123456');
        await expect(marker).toHaveAttribute('stroke', '#ffffff');
        await expect(marker).toHaveAttribute('stroke-width', '2');

        const box = await getLocatorBoundingBox(marker);
        await page.mouse.move(
            Math.round(box.x + box.width / 2),
            Math.round(box.y + box.height / 2),
        );
        await expect(page.locator('.gcharts-tooltip svg path').first()).toHaveAttribute(
            'fill',
            '#123456',
        );
    });

    test('Snapped crosshair follows a shifted cluster marker', async ({mount, page}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Observations',
                        data: [49, 49.1, 50.1, 50.2].map((x) => ({x, y: 75})),
                        cluster: {
                            enabled: true,
                            layoutAlgorithm: {gridSize: '50%'},
                            overlapMode: 'shift',
                            marker: {radius: 12},
                        },
                    },
                ],
            },
            xAxis: {type: 'linear', min: 0, max: 100, crosshair: {enabled: true, snap: true}},
            yAxis: [{type: 'linear', min: 0, max: 100, crosshair: {enabled: true, snap: true}}],
        };
        const component = await mount(<ChartTestStory data={data} />);
        const label = component.locator('.gcharts-scatter__cluster-label').first();
        const labelBox = await getLocatorBoundingBox(label);
        const markerX = labelBox.x + labelBox.width / 2;
        await page.mouse.move(Math.round(markerX), Math.round(labelBox.y + labelBox.height / 2));

        const crosshair = component.locator('[data-crosshair-x-line] path').first();
        await expect(crosshair).toHaveCount(1);
        const crosshairX = await crosshair.evaluate((node) => node.getBoundingClientRect().x);
        expect(Math.abs(crosshairX - markerX)).toBeLessThan(2);
    });

    test('Cluster clicks work with the tooltip disabled', async ({mount, page}) => {
        const component = await mount(
            <ScatterClusterEventsTestStory
                data={{...scatterClusteringData, tooltip: {enabled: false}}}
            />,
        );
        const box = await getLocatorBoundingBox(
            component.locator('.gcharts-scatter__cluster-label').first(),
        );
        await page.mouse.click(
            Math.round(box.x + box.width / 2),
            Math.round(box.y + box.height / 2),
        );
        await expect(component.locator('[data-qa="clicked-cluster"]')).toHaveText('3:a,b,c');
        await expect(page.locator('.gcharts-tooltip')).toHaveCount(0);
    });

    test('The range slider overview stays unclustered and selection rebuilds clusters', async ({
        mount,
        page,
    }) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Observations',
                        data: [
                            {x: 1, y: 2},
                            {x: 1, y: 2},
                            {x: 8, y: 4},
                            {x: 8, y: 4},
                        ],
                        cluster: {enabled: true, layoutAlgorithm: {gridSize: 50}},
                    },
                ],
            },
            xAxis: {type: 'linear', min: 0, max: 9, rangeSlider: {enabled: true}},
        };
        const component = await mount(<ChartTestStory data={data} />);
        const labels = component.locator('.gcharts-scatter__cluster-label');
        await expect(labels).toHaveCount(2);
        await expect(
            component.locator('.gcharts-range-slider .gcharts-marker__wrapper'),
        ).toHaveCount(4);

        const leftHandle = component.locator('.gcharts-brush .handle--w');
        const brush = await getLocatorBoundingBox(component.locator('.gcharts-brush'));
        const handle = await getLocatorBoundingBox(leftHandle);
        const fromX = Math.round(handle.x + handle.width / 2);
        const y = Math.round(handle.y + handle.height / 2);
        await page.mouse.move(fromX, y);
        await page.mouse.down();
        await page.mouse.move(fromX + Math.round(brush.width / 2), y);
        await page.mouse.up();
        await expect(labels).toHaveCount(1);

        const narrowedHandle = await getLocatorBoundingBox(leftHandle);
        const narrowedX = Math.round(narrowedHandle.x + narrowedHandle.width / 2);
        await page.mouse.move(narrowedX, y);
        await page.mouse.down();
        await page.mouse.move(fromX, y);
        await page.mouse.up();
        await expect(labels).toHaveCount(2);
        await expect(
            component.locator('.gcharts-range-slider .gcharts-marker__wrapper'),
        ).toHaveCount(4);
    });

    test('Resizing recalculates grid membership', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Observations',
                        data: [
                            {x: 0.2, y: 2},
                            {x: 0.2, y: 2},
                            {x: 2.1, y: 2},
                            {x: 2.1, y: 2},
                        ],
                        cluster: {enabled: true, layoutAlgorithm: {gridSize: 50}},
                    },
                ],
            },
            xAxis: {min: 0, max: 9},
        };
        const component = await mount(<ChartTestStory data={data} styles={{width: 220}} />);
        const labels = component.locator('.gcharts-scatter__cluster-label');
        await expect(labels).toHaveCount(1);
        await expect(labels).toHaveText('4');

        await component.update(<ChartTestStory data={data} />);
        await expect(labels).toHaveCount(2);

        await component.update(<ChartTestStory data={data} styles={{width: 220}} />);
        await expect(labels).toHaveCount(1);
    });

    test('Zooming rebuilds clusters and reset restores them', async ({mount}) => {
        const data: ChartData = {
            chart: {zoom: {enabled: true, type: 'x'}},
            tooltip: {enabled: false},
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Observations',
                        data: [
                            {x: 1, y: 2},
                            {x: 1, y: 2},
                            {x: 8, y: 4},
                            {x: 8, y: 4},
                        ],
                        cluster: {enabled: true, layoutAlgorithm: {gridSize: 50}},
                    },
                ],
            },
            xAxis: {min: 0, max: 9},
        };
        const component = await mount(<ChartTestStory data={data} />);
        const labels = component.locator('.gcharts-scatter__cluster-label');
        await expect(labels).toHaveCount(2);

        const brush = component.locator('.gcharts-brush');
        const box = await getLocatorBoundingBox(brush);
        await component.dragTo(brush, {
            sourcePosition: {x: box.x + box.width * 0.05, y: box.y + box.height / 2},
            targetPosition: {x: box.x + box.width * 0.4, y: box.y + box.height / 2},
        });
        await expect(labels).toHaveCount(1);

        await component.locator('.gcharts-chart__reset-zoom-button').click();
        await expect(labels).toHaveCount(2);
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

    test('Tooltip works correctly with y=0 on logarithmic axis', async ({mount, page}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Series',
                        data: [
                            {x: 1, y: 10},
                            {x: 2, y: 0},
                            {x: 2, y: 100},
                        ],
                    },
                ],
            },
            yAxis: [{type: 'logarithmic'}],
        };

        const component = await mount(<ChartTestStory data={data} />);
        const box = await getLocatorBoundingBox(
            component.locator('.gcharts-marker__wrapper').last(),
        );

        // Hover near x=2 (the y=0 point's position)
        await page.mouse.move(Math.round(box.x), Math.round(box.y));

        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip.getByText('100', {exact: true})).toBeVisible();
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
