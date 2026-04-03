import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {CategoryAxisExample} from '../../docs/examples/src/charts/axis-types/category';
import {DatetimeAxisExample} from '../../docs/examples/src/charts/axis-types/datetime';
import {LinearAxisExample} from '../../docs/examples/src/charts/axis-types/linear';
import {LogarithmicAxisExample} from '../../docs/examples/src/charts/axis-types/logarithmic';

const CONTAINER_STYLE: React.CSSProperties = {
    width: 600,
    height: 320,
    display: 'inline-block',
};

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
