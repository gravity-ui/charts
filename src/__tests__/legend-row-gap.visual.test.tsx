import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator} from '@playwright/test';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData, ChartLegend} from '../types';

function getData(legend: ChartLegend): ChartData {
    return {
        chart: {margin: {left: 10, right: 10, top: 10, bottom: 10}},
        legend: {
            enabled: true,
            position: 'right',
            width: 220,
            align: 'left',
            itemMaxRowCount: 2,
            ...legend,
        },
        series: {
            data: Array.from({length: 6}, (_, i) => ({
                type: 'scatter',
                name: legend.html
                    ? `<span style="line-height: ${i % 2 ? 16 : 20}px">Region ${i}<br>Revenue</span>`
                    : `Region ${i}\nRevenue`,
                symbolType: 'square',
                legend: {symbol: {width: 8}},
                data: [{x: i, y: i + 1}],
            })),
        },
    };
}

async function getRowTops(component: Locator) {
    return component
        .locator('.gcharts-legend__line')
        .evaluateAll((elements) =>
            elements.map(
                (element) =>
                    (element as SVGGElement).transform.baseVal.consolidate()?.matrix.f ?? 0,
            ),
        );
}

async function getItemGeometry(component: Locator, html: boolean) {
    const labels = component.locator(
        html ? '.gcharts-legend__item-text-html' : '.gcharts-legend__item-text',
    );
    const symbols = component.locator('.gcharts-legend__item-symbol');
    const boxes = async (locator: Locator) =>
        locator.evaluateAll((elements) =>
            elements.map((element) => {
                const {x, y, width, height} = element.getBoundingClientRect();
                return {x, y, width, height};
            }),
        );
    return {labels: await boxes(labels), symbols: await boxes(symbols)};
}

test.describe('Legend row gap', () => {
    test('short HTML rows remain visible and clickable when a gap introduces pagination', async ({
        mount,
    }) => {
        const styles = {width: 400, height: 120};
        const availableHeight = 28;
        const data: ChartData = {
            chart: {
                margin: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: styles.height - 10 - availableHeight,
                },
            },
            legend: {
                enabled: true,
                position: 'left',
                layout: 'vertical',
                width: 150,
                align: 'left',
                html: true,
            },
            series: {
                data: Array.from({length: 3}, (_, i) => ({
                    type: 'scatter',
                    name: `<div style="height:6px;line-height:6px;font-size:6px">Item ${i}</div>`,
                    symbolType: 'square',
                    legend: {symbol: {width: 6}},
                    data: [{x: i, y: i + 1}],
                })),
            },
        };
        const component = await mount(<ChartTestStory data={data} styles={styles} />);
        const labels = component.locator('.gcharts-legend__item-text-html');
        await expect(labels).toHaveCount(3);
        await expect(component.locator('.gcharts-legend__pagination-counter')).toHaveCount(0);
        await component.update(
            <ChartTestStory
                data={{...data, legend: {...data.legend, rowGap: 7}}}
                styles={styles}
            />,
        );
        const counter = component.locator('.gcharts-legend__pagination-counter');
        for (let page = 1; page <= 3; page++) {
            await expect(counter).toHaveText(`${page}/3`);
            await expect(labels).toHaveCount(1);
            await expect(labels).toHaveText(`Item ${page - 1}`);
            const label = await labels.boundingBox();
            const paginator = await counter.boundingBox();
            expect(label?.height).toBe(6);
            expect((label?.y ?? Infinity) + 6).toBeLessThanOrEqual(paginator?.y ?? -Infinity);
            await labels.click({trial: true});
            if (page < 3) {
                await component.locator('.gcharts-legend__pagination-arrow').last().click();
            }
        }
    });

    for (const html of [false, true]) {
        const output = html ? 'html' : 'svg';
        for (const layout of ['vertical', 'horizontal'] as const) {
            test(`spaces measured rows without changing label or symbol geometry (${layout}, ${output})`, async ({
                mount,
            }) => {
                const baseline = getData({layout, html, rowGap: 0});
                const styles = {width: 700, height: 500};
                const component = await mount(<ChartTestStory data={baseline} styles={styles} />);
                const items = component.locator('.gcharts-legend__item');
                await expect(items).toHaveCount(6);
                const tops = await getRowTops(component);
                expect(tops.length).toBe(layout === 'vertical' ? 6 : 3);
                const geometry = await getItemGeometry(component, html);
                const legend = component.locator('.gcharts-legend');
                const baselineHeight = Number(await legend.getAttribute('height'));
                const spaced = getData({layout, html, rowGap: '7px'});
                await component.update(<ChartTestStory data={spaced} styles={styles} />);
                await expect(legend).toHaveAttribute(
                    'height',
                    String(baselineHeight + (tops.length - 1) * 7),
                );
                const spacedTops = await getRowTops(component);
                spacedTops.forEach((top, i) => expect(top).toBeCloseTo(tops[i] + i * 7));
                const spacedGeometry = await getItemGeometry(component, html);
                for (const key of ['labels', 'symbols'] as const) {
                    spacedGeometry[key].forEach((box, i) => {
                        const before = geometry[key][i];
                        expect(box.x).toBeCloseTo(before.x);
                        expect(box.width).toBeCloseTo(before.width);
                        expect(box.height).toBeCloseTo(before.height);
                        expect(box.y - before.y).toBeCloseTo(
                            (layout === 'vertical' ? i : Math.floor(i / 2)) * 7,
                        );
                    });
                }
                await expect(component.locator('.gcharts-legend__pagination-counter')).toHaveCount(
                    0,
                );
                await expect(component).toHaveScreenshot();
            });
        }
    }
});
