import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {scatterBasicData} from '../__stories__/__data__';
import type {ChartMargin} from '../types';

const CHART_MARGIN: ChartMargin = {
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
};

test.describe('Y-axis', () => {
    test('min', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].min', 5);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('max', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].max', 8);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].min', 5);
        set(data, 'yAxis[0].max', 8);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('maxPadding=0', async ({mount}) => {
        const data = cloneDeep(scatterBasicData);
        set(data, 'yAxis[0].maxPadding', 0);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
