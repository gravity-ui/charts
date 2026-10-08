import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData} from '../types';

const mixed: ChartData = {
    legend: {enabled: false},
    xAxis: {type: 'category', categories: ['A', 'B']},
    series: {
        data: [
            {
                type: 'line',
                name: 'line1',
                color: 'red',
                data: [
                    {x: 0, y: 1},
                    {x: 1, y: 5},
                ],
            },
            {
                type: 'bar-x',
                name: 'bar1.1',
                stacking: 'normal',
                stackId: 'stack',
                data: [{x: 0, y: 2}],
            },
            {
                type: 'bar-x',
                name: 'bar1.2',
                stacking: 'normal',
                stackId: 'stack',
                data: [{x: 0, y: 3}],
            },
            {
                type: 'line',
                name: 'line2',
                color: 'blue',
                data: [
                    {x: 0, y: 5},
                    {x: 1, y: 1},
                ],
            },
            {type: 'bar-x', name: 'bar2', data: [{x: 0, y: 4}]},
        ],
    },
};

test('Mixed series retain one bar layer between independent line layers', async ({mount}) => {
    const component = await mount(<ChartTestStory data={mixed} />);
    const layers = component.locator(
        '.gcharts-chart__content > .gcharts-line, .gcharts-chart__content > .gcharts-bar-x',
    );
    await expect(layers).toHaveCount(3);
    await expect(layers.nth(0).locator('path[stroke="red"]')).toHaveCount(1);
    await expect(layers.nth(1)).toHaveClass('gcharts-bar-x');
    await expect(layers.nth(2).locator('path[stroke="blue"]')).toHaveCount(1);

    await component.update(
        <ChartTestStory
            data={{
                ...mixed,
                series: {
                    data: mixed.series.data.map((s, index) =>
                        index === 0 ? {...s, visible: false} : s,
                    ),
                },
            }}
        />,
    );
    await expect(layers).toHaveCount(2);
    await expect(layers.nth(0)).toHaveClass('gcharts-bar-x');
    await expect(layers.nth(1).locator('path[stroke="blue"]')).toHaveCount(1);

    await component.update(<ChartTestStory data={mixed} styles={{width: 600}} />);
    await expect(layers).toHaveCount(3);
    await expect(layers.nth(0).locator('path[stroke="red"]')).toHaveCount(1);
    await expect(layers.nth(2).locator('path[stroke="blue"]')).toHaveCount(1);
});

test('Main lines reference independent clip regions and switch to bounds with explicit Y limits', async ({
    mount,
}) => {
    const component = await mount(
        <div>
            <ChartTestStory data={mixed} />
            <ChartTestStory data={mixed} />
        </div>,
    );
    const lines = component.locator('.gcharts-chart__content > .gcharts-line');
    await expect(lines).toHaveCount(4);
    const clips = await lines.evaluateAll((elements) =>
        elements.map((element) => {
            const reference = element.getAttribute('clip-path') ?? '';
            const id = reference.slice(5, -1);
            const rect = document.getElementById(id)?.querySelector('rect');
            return {id, y: rect?.getAttribute('y'), height: rect?.getAttribute('height')};
        }),
    );
    expect(
        clips.every(
            (clip) =>
                clip.id.endsWith('-horizontal') && Number(clip.y) < 0 && Number(clip.height) > 0,
        ),
    ).toBe(true);
    expect(clips[0].id).not.toBe(clips[2].id);

    const bounded = {...mixed, yAxis: [{min: 0, max: 10}]};
    await component.update(
        <div>
            <ChartTestStory data={bounded} />
            <ChartTestStory data={bounded} />
        </div>,
    );
    await expect
        .poll(() =>
            lines.evaluateAll(
                (elements) =>
                    elements.length === 4 &&
                    elements.every((element) => {
                        const reference = element.getAttribute('clip-path') ?? '';
                        const rect = document
                            .getElementById(reference.slice(5, -1))
                            ?.querySelector('rect');
                        return (
                            rect?.getAttribute('y') === '0' &&
                            Number(rect.getAttribute('height')) > 0
                        );
                    }),
            ),
        )
        .toBe(true);
});

test('Scatter uses plot clipping only in the range-slider preview', async ({mount}) => {
    const data: ChartData = {
        legend: {enabled: false},
        xAxis: {type: 'linear', rangeSlider: {enabled: true}},
        series: {
            data: [
                {
                    type: 'scatter',
                    name: 'scatter',
                    data: [
                        {x: 0, y: 0},
                        {x: 1, y: 1},
                    ],
                },
            ],
        },
    };
    const component = await mount(<ChartTestStory data={data} />);
    const main = component.locator('.gcharts-chart__content > .gcharts-scatter');
    const preview = component.locator('.gcharts-range-slider__shapes > .gcharts-scatter');
    await expect(main.locator('path')).not.toHaveCount(0);
    await expect(main).not.toHaveAttribute('clip-path');
    await expect(preview).toHaveAttribute('clip-path', /url\(#.+\)/);
    const clip = await preview.evaluate((element) => {
        const id = (element.getAttribute('clip-path') ?? '').slice(5, -1);
        const rect = document.getElementById(id)?.querySelector('rect');
        const slider = element.closest('.gcharts-range-slider');
        return {
            width: rect?.getAttribute('width'),
            height: rect?.getAttribute('height'),
            sliderWidth: slider?.getAttribute('width'),
            sliderHeight: slider?.getAttribute('height'),
        };
    });
    expect(Number(clip.width)).toBeGreaterThan(0);
    expect(Number(clip.height)).toBeGreaterThan(0);
    expect(clip.width).toBe(clip.sliderWidth);
    expect(clip.height).toBe(clip.sliderHeight);
});
