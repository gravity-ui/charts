import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import BarXWidthExample from '../../docs/examples/src/charts/series-types/bar-x-width';
import BarYWidthExample from '../../docs/examples/src/charts/series-types/bar-y-width';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {DEFAULT_PALETTE} from '../core/constants';

import {getLocatorBoundingBox} from './utils';

for (const type of ['bar-x', 'bar-y'] as const) {
    const vertical = type === 'bar-x';

    test(`${type} guide shows independent width limits`, async ({mount}) => {
        const component = await mount(
            <div style={{width: 600, height: 360}}>
                {vertical ? <BarXWidthExample /> : <BarYWidthExample />}
            </div>,
        );
        const bars = component.locator(`.gcharts-${type}__segment`);
        await expect(bars).toHaveCount(2);
        const plan = await getLocatorBoundingBox(bars.nth(0));
        const actual = await getLocatorBoundingBox(bars.nth(1));
        expect(vertical ? plan.width : plan.height).toBeCloseTo(80);
        expect(vertical ? actual.width : actual.height).toBeCloseTo(24);
        const start = vertical ? actual.x : actual.y;
        const end = vertical ? plan.x + plan.width : plan.y + plan.height;
        expect(start).toBeGreaterThan(end);
        await expect(component).toHaveScreenshot();
    });

    test(`${type} wide grouped bars fit the plot with zero padding`, async ({mount}) => {
        const component = await mount(
            <ChartTestStory
                styles={{width: 600, height: 360}}
                data={{
                    series: {
                        data: Array.from({length: 4}, (_, index) => ({
                            type,
                            name: `Series ${index + 1}`,
                            barPadding: 0,
                            barMaxWidth: 1000,
                            data: [vertical ? {x: 'Q1', y: 50} : {y: 'Q1', x: 50}],
                        })),
                    },
                    xAxis: vertical ? {type: 'category', categories: ['Q1']} : undefined,
                    yAxis: vertical ? undefined : [{type: 'category', categories: ['Q1']}],
                }}
            />,
        );
        const bars = component.locator(`.gcharts-${type}__segment`);
        await expect(bars).toHaveCount(4);
        const limit = Number(
            await component
                .locator('clipPath rect')
                .first()
                .getAttribute(vertical ? 'width' : 'height'),
        );
        const bounds = await bars.evaluateAll((elements) =>
            elements.map((element) => {
                const box = (element as SVGGraphicsElement).getBBox();
                return {x: box.x, y: box.y, width: box.width, height: box.height};
            }),
        );
        for (const box of bounds) {
            const start = vertical ? box.x : box.y;
            const end = start + (vertical ? box.width : box.height);
            expect(start).toBeGreaterThanOrEqual(0);
            expect(end).toBeLessThanOrEqual(limit);
        }
    });

    test(`${type} stack width survives legend toggles`, async ({mount}) => {
        const component = await mount(
            <ChartTestStory
                styles={{width: 600, height: 360}}
                data={{
                    series: {
                        data: [
                            {name: 'Base', value: 50, barMaxWidth: 80},
                            {name: 'Top', value: 25, barMaxWidth: 20},
                        ].map(({value, ...series}) => ({
                            ...series,
                            type,
                            stacking: 'normal',
                            data: [vertical ? {x: 'Q1', y: value} : {y: 'Q1', x: value}],
                        })),
                    },
                    xAxis: vertical ? {type: 'category', categories: ['Q1']} : undefined,
                    yAxis: vertical ? undefined : [{type: 'category', categories: ['Q1']}],
                }}
            />,
        );
        const base = component.locator(`.gcharts-${type}__segment[fill="${DEFAULT_PALETTE[0]}"]`);
        const top = component.locator(`.gcharts-${type}__segment[fill="${DEFAULT_PALETTE[1]}"]`);
        await expect(base).toHaveCount(1);
        await expect(top).toHaveCount(1);
        const before = await getLocatorBoundingBox(base);
        const topBox = await getLocatorBoundingBox(top);
        expect(vertical ? before.width : before.height).toBeCloseTo(20);
        expect(vertical ? topBox.width : topBox.height).toBeCloseTo(20);
        const toggle = component.locator('.gcharts-legend__item').filter({hasText: 'Top'});
        await toggle.click({modifiers: ['Control']});
        await expect(top).toHaveCount(0);
        const hidden = await getLocatorBoundingBox(base);
        expect(vertical ? hidden.width : hidden.height).toBeCloseTo(20);
        await toggle.click({modifiers: ['Control']});
        await expect(top).toHaveCount(1);
        expect(await getLocatorBoundingBox(base)).toEqual(before);
    });
}

test('bar-x range slider keeps the limit of an excluded stack series', async ({mount}) => {
    const component = await mount(
        <ChartTestStory
            styles={{width: 600, height: 400}}
            data={{
                series: {
                    data: [
                        {name: 'Base', value: 50, barMaxWidth: 80},
                        {name: 'Top', value: 25, barMaxWidth: 20, rangeSlider: {visible: false}},
                    ].map(({value, ...series}) => ({
                        ...series,
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [{x: 1, y: value}],
                    })),
                },
                xAxis: {type: 'linear', min: 0, max: 2, rangeSlider: {enabled: true}},
                yAxis: [{min: 0, max: 100}],
            }}
        />,
    );
    const slider = component.locator('.gcharts-range-slider');
    const bars = component.locator(`.gcharts-bar-x__segment[fill="${DEFAULT_PALETTE[0]}"]`);
    await expect(bars).toHaveCount(2);
    await expect(slider.locator('.gcharts-bar-x__segment')).toHaveCount(1);
    for (const bar of await bars.all()) {
        expect((await getLocatorBoundingBox(bar)).width).toBeCloseTo(20);
    }
});
