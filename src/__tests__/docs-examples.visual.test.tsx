import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {AxisLabelFontSizeExample} from '../../docs/examples/src/charts/axis-labels/font-size';
import {CategoryAxisExample} from '../../docs/examples/src/charts/axis-types/category';
import {DatetimeAxisExample} from '../../docs/examples/src/charts/axis-types/datetime';
import {LinearAxisExample} from '../../docs/examples/src/charts/axis-types/linear';
import {LogarithmicAxisExample} from '../../docs/examples/src/charts/axis-types/logarithmic';
import {DataLabelsPlacementAutoExample} from '../../docs/examples/src/charts/data-labels/placement-auto';
import {DataLabelsPlacementFallbackHideExample} from '../../docs/examples/src/charts/data-labels/placement-fallback-hide';
import {DataLabelsPlacementFixedExample} from '../../docs/examples/src/charts/data-labels/placement-fixed';
import {BarXSeriesExample} from '../../docs/examples/src/charts/series-types/bar-x';
import {BarYSeriesExample} from '../../docs/examples/src/charts/series-types/bar-y';

const CONTAINER_STYLE: React.CSSProperties = {
    width: 600,
    height: 320,
    display: 'inline-block',
};

test.describe('Docs examples: Axis Labels', () => {
    test('custom font size', async ({mount}) => {
        const component = await mount(
            <div style={CONTAINER_STYLE}>
                <AxisLabelFontSizeExample />
            </div>,
        );
        await expect(component.locator('svg')).toBeVisible();
    });
});

test.describe('Docs examples: Axis Types', () => {
    test('linear axis', async ({mount}) => {
        const component = await mount(
            <div style={CONTAINER_STYLE}>
                <LinearAxisExample />
            </div>,
        );
        await expect(component.locator('svg')).toBeVisible();
    });

    test('logarithmic axis', async ({mount}) => {
        const component = await mount(
            <div style={CONTAINER_STYLE}>
                <LogarithmicAxisExample />
            </div>,
        );
        await expect(component.locator('svg')).toBeVisible();
    });

    test('datetime axis', async ({mount}) => {
        const component = await mount(
            <div style={CONTAINER_STYLE}>
                <DatetimeAxisExample />
            </div>,
        );
        await expect(component.locator('svg')).toBeVisible();
    });

    test('category axis', async ({mount}) => {
        const component = await mount(
            <div style={CONTAINER_STYLE}>
                <CategoryAxisExample />
            </div>,
        );
        await expect(component.locator('svg')).toBeVisible();
    });
});

test.describe('Docs examples: Data Labels', () => {
    test('automatic placement', async ({mount}) => {
        const component = await mount(
            <div style={CONTAINER_STYLE}>
                <DataLabelsPlacementAutoExample />
            </div>,
        );
        await expect(component.locator('svg')).toBeVisible();
    });

    test('fixed position', async ({mount}) => {
        const component = await mount(
            <div style={CONTAINER_STYLE}>
                <DataLabelsPlacementFixedExample />
            </div>,
        );
        await expect(component.locator('svg')).toBeVisible();
    });

    test('hide fallback', async ({mount}) => {
        const component = await mount(
            <div style={CONTAINER_STYLE}>
                <DataLabelsPlacementFallbackHideExample />
            </div>,
        );
        await expect(component.locator('svg')).toBeVisible();
    });
});

test.describe('Docs examples: Series Types', () => {
    test('bar-x appearance', async ({mount}) => {
        const component = await mount(
            <div style={CONTAINER_STYLE}>
                <BarXSeriesExample />
            </div>,
        );
        await expect(component.locator('.gcharts-bar-x__segment')).toHaveCount(6);
    });

    test('bar-y appearance', async ({mount}) => {
        const component = await mount(
            <div style={CONTAINER_STYLE}>
                <BarYSeriesExample />
            </div>,
        );
        await expect(component.locator('.gcharts-bar-y__segment')).toHaveCount(6);
    });
});
