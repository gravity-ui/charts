import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {scatterBasicData} from '../__stories__/__data__';

test.describe('Y-axis', () => {
    test('min', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].min', 5);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('max', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].max', 8);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].min', 5);
        set(data, 'yAxis[0].max', 8);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
