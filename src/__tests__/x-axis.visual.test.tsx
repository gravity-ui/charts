import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {barYBasicData} from '../__stories__/__data__';

test.describe('X-axis', () => {
    test('min', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.min', 60);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('max', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.max', 120);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.min', 60);
        set(data, 'xAxis.max', 120);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
