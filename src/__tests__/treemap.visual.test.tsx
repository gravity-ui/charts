import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {treemapBasicData} from 'src/__stories__/__data__';
import type {ChartData} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Treemap series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={treemapBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With special symbols', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: '& | &amp;',
                        data: [
                            {name: 'Tom & Jerry', value: 1},
                            {name: 'Tom &amp; Jerry', value: 1},
                        ],
                    },
                ],
            },
            legend: {enabled: true},
            title: {
                text: 'Title: & | &amp;',
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Html labels with style', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: '',
                        data: [{name: 'Text', value: 1}],
                        dataLabels: {
                            html: true,
                            style: {
                                fontSize: '20px',
                            },
                        },
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
