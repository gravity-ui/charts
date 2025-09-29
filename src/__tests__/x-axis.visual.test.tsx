import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {barYBasicData} from '../__stories__/__data__';
import type {ChartData, ChartMargin} from '../types';

const CHART_MARGIN: ChartMargin = {
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
};

test.describe('X-axis', () => {
    test('min', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.min', 60);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('max', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.max', 120);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('min-max', async ({mount}) => {
        const data = cloneDeep(barYBasicData);
        set(data, 'xAxis.min', 60);
        set(data, 'xAxis.max', 120);
        set(data, 'chart.margin', CHART_MARGIN);
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('formatted labels', async ({mount}) => {
        const chartData: ChartData = {
            ...barYBasicData,
            xAxis: {
                labels: {
                    numberFormat: {
                        unit: 'k',
                    },
                },
            },
        };
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
