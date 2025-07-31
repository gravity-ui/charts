import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {pieBasicData} from 'src/__stories__/__data__';
import type {ChartData} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

test.describe('Pie series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={pieBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('With special symbols', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'pie',
                        data: [
                            {name: 'Tom & Jerry', label: 'Tom & Jerry', value: 10},
                            {name: 'Tom &amp; Jerry', label: 'Tom &amp; Jerry', value: 10},
                        ],
                        dataLabels: {enabled: true},
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

    test.describe('With limited dimensions', () => {
        const testCases = [
            {
                dimension: 'width',
                styles: {width: '100px'},
                testName: 'With a limited width',
            },
            {
                dimension: 'height',
                styles: {height: '100px'},
                testName: 'With a limited height',
            },
        ] as const;

        for (const testCase of testCases) {
            test(testCase.testName, async ({mount}) => {
                const data: ChartData = {...pieBasicData};
                data.series.data[0].dataLabels = {enabled: false};
                data.legend = {enabled: false};
                data.tooltip = {enabled: false};
                data.title = undefined;
                const component = await mount(
                    <ChartTestStory data={data} styles={testCase.styles} />,
                );
                await component.locator('.gcharts-pie__segment').first().hover();
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        }
    });
});
