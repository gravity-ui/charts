import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import type {Locator} from '@playwright/test';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

import {getLocatorBoundingBox} from './utils';

function labelIsOnTop(label: Locator) {
    return label.evaluate((element) => {
        const text = element as SVGTextElement;
        const previous = text.style.pointerEvents;
        // Enable hit-testing on labels to check paint order.
        text.style.pointerEvents = 'bounding-box';
        const bounds = text.getBoundingClientRect();
        const hit = document.elementFromPoint(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
        );
        text.style.pointerEvents = previous;
        return hit === text || (hit !== null && text.contains(hit));
    });
}

const marker = {enabled: true, radius: 30, borderWidth: 0};
const dataLabels = {enabled: true};
const cases: {name: string; series: ChartData['series']}[] = [
    ...(['line', 'area'] as const).map((type) => ({
        name: type,
        series: {
            data: [{type, name: 'Series', data: [{x: 5, y: 50}], marker, dataLabels}],
        },
    })),
    {
        name: 'scatter',
        series: {
            data: [{type: 'scatter', name: 'Series', data: [{x: 5, y: 50}], dataLabels}],
        },
    },
    {
        name: 'area-range',
        series: {
            data: [
                {
                    type: 'area-range',
                    name: 'Series',
                    data: [{x: 5, y0: 45, y1: 50, label: '50'}],
                    marker,
                    dataLabels,
                },
            ],
        },
    },
    {
        name: 'radar',
        series: {
            data: [
                {
                    type: 'radar',
                    name: 'Series',
                    categories: [{key: 'A'}, {key: 'B'}, {key: 'C'}],
                    data: [{value: 100}, {value: 100}, {value: 100}],
                    marker,
                    dataLabels,
                },
            ],
        },
    },
];

for (const {name, series} of cases) {
    test(`${name}: labels stay above overlapping normal and hover markers`, async ({
        mount,
        page,
    }) => {
        const data: ChartData = {
            legend: {enabled: false},
            tooltip: {enabled: false},
            xAxis: {min: 0, max: 10},
            yAxis: [{min: 0, max: 100}],
            series: {
                ...series,
                options: {
                    [name]: {states: {hover: {marker: {radius: 40, borderWidth: 0}}}},
                },
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        const labels = component.locator(`.gcharts-${name}__label`);
        const label = labels.first();
        await expect(label).toBeVisible();
        const labelBounds = await getLocatorBoundingBox(label);
        const symbol = component.locator('.gcharts-marker__symbol').first();
        const markerBounds = await getLocatorBoundingBox(symbol);
        const labelCenter = {
            x: labelBounds.x + labelBounds.width / 2,
            y: labelBounds.y + labelBounds.height / 2,
        };

        expect(await labelIsOnTop(label)).toBe(true);
        await page.mouse.move(
            markerBounds.x + markerBounds.width / 2,
            markerBounds.y + markerBounds.height / 2,
        );
        await expect
            .poll(() =>
                component
                    .locator('.gcharts-marker__symbol')
                    .evaluateAll((elements) =>
                        Math.max(
                            ...elements.map((element) => element.getBoundingClientRect().width),
                        ),
                    ),
            )
            .toBe(80);
        const hoverBounds = await component
            .locator('.gcharts-marker__symbol')
            .evaluateAll((elements) => {
                const bounds = elements.map((element) => element.getBoundingClientRect());
                return bounds.sort((a, b) => b.width - a.width)[0].toJSON();
            });
        expect(labelCenter.x).toBeGreaterThan(hoverBounds.x);
        expect(labelCenter.x).toBeLessThan(hoverBounds.x + hoverBounds.width);
        expect(labelCenter.y).toBeGreaterThan(hoverBounds.y);
        expect(labelCenter.y).toBeLessThan(hoverBounds.y + hoverBounds.height);
        expect(await labelIsOnTop(label)).toBe(true);
        expect(await getLocatorBoundingBox(label)).toEqual(labelBounds);

        await component.update(
            <ChartTestStory
                data={{
                    ...data,
                    series: {
                        ...data.series,
                        data: data.series.data.map((item) => ({
                            ...item,
                            dataLabels: {enabled: false},
                        })),
                    },
                }}
            />,
        );
        await expect(labels).toHaveCount(0);
    });
}

test('line labels stay below an overlapping area in a higher layer', async ({mount}) => {
    const data: ChartData = {
        legend: {enabled: false},
        tooltip: {enabled: false},
        xAxis: {min: 0, max: 10},
        yAxis: [{min: 0, max: 100}],
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Line',
                    data: [{x: 5, y: 50}],
                    marker,
                    dataLabels,
                },
                {
                    type: 'area',
                    name: 'Area',
                    data: [
                        {x: 0, y: 80},
                        {x: 10, y: 80},
                    ],
                    opacity: 1,
                },
            ],
        },
    };
    const component = await mount(<ChartTestStory data={data} />);
    const label = component.locator('.gcharts-line__label');
    await expect(label).toBeVisible();
    await expect(component.locator('.gcharts-area__region')).toBeVisible();
    expect(await labelIsOnTop(label)).toBe(false);

    await component.update(
        <ChartTestStory data={{...data, series: {data: [...data.series.data].reverse()}}} />,
    );
    await expect.poll(() => labelIsOnTop(label)).toBe(true);
});
