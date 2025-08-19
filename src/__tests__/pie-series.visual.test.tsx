import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import range from 'lodash/range';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {pieBasicData, piePlaygroundData} from '../__stories__/__data__';
import type {ChartData, PieSeries} from '../types';

function getModifiedData(
    data: ChartData,
    pieSeries: Partial<PieSeries>,
    chartData?: Partial<Omit<ChartData, 'series'>>,
) {
    const resultData = merge({}, data);
    merge(resultData.series.data[0], pieSeries);
    merge(resultData, chartData);

    return resultData;
}

test.describe('Pie series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={pieBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('legend.justifyContent = start', async ({mount}) => {
        const data = cloneDeep(pieBasicData);
        set(data, 'legend.justifyContent', 'start');
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Handle html', () => {
        const baseData: ChartData = {
            series: {
                data: [
                    {
                        type: 'pie',
                        dataLabels: {
                            enabled: true,
                        },
                        data: [
                            {
                                name: '<span style="background: #4fc4b7;color: #fff;padding: 4px;border-radius: 4px;">One</span>',
                                value: 2.007719752191679,
                                label: '<span style="background: #4fc4b7;color: #fff;padding: 4px;border-radius: 4px;">One</span>',
                                color: '#4fc4b7',
                            },
                            {
                                name: '<span style="background: #59abc9;color: #fff;padding: 4px;border-radius: 4px;">Two</span>',
                                value: 7.213946843338091,
                                label: '<span style="background: #59abc9;color: #fff;padding: 4px;border-radius: 4px;">Two</span>',
                                color: '#59abc9',
                            },
                            {
                                name: '<span style="background: #8ccce3;color: #fff;padding: 4px;border-radius: 4px;">Three</span>',
                                value: 6.672973787005758,
                                label: '<span style="background: #8ccce3;color: #fff;padding: 4px;border-radius: 4px;">Three</span>',
                                color: '#8ccce3',
                            },
                        ],
                    },
                ],
            },
        };

        test('dataLabels.html = true', async ({mount}) => {
            const data = getModifiedData(baseData, {
                dataLabels: {html: true},
            });
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('legend.html = true', async ({mount}) => {
            const data = getModifiedData(
                baseData,
                {dataLabels: {enabled: false}},
                {legend: {enabled: true, html: true}},
            );
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        // TODO: add case for `legend.html = false`

        test('tooltip.html = true', async ({mount}) => {
            const data = getModifiedData(
                baseData,
                {dataLabels: {enabled: false}},
                {tooltip: {html: true, valueFormat: {type: 'number', precision: 2}}},
            );
            const component = await mount(<ChartTestStory data={data} styles={{width: '400px'}} />);
            await component.locator('.gcharts-pie__segment').first().hover();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('tooltip.html = false', async ({mount}) => {
            const data = getModifiedData(
                baseData,
                {dataLabels: {enabled: false}},
                {tooltip: {valueFormat: {type: 'number', precision: 2}}},
            );
            const component = await mount(
                <ChartTestStory data={data} styles={{width: '1200px'}} />,
            );
            await component.locator('.gcharts-pie__segment').nth(2).hover();
            await expect(component.locator('svg')).toHaveScreenshot();
        });
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

    test('Should properly handle labels in case of limited width', async ({mount}) => {
        const data: ChartData = {...piePlaygroundData};
        data.legend = {enabled: false};
        const component = await mount(<ChartTestStory data={data} styles={{width: '200px'}} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Connectors should not intersect with circle', () => {
        const baseData: ChartData = {
            legend: {
                enabled: false,
            },
            series: {
                data: [
                    {
                        type: 'pie',
                        dataLabels: {
                            format: {
                                type: 'number',
                                precision: 2,
                            },
                        },
                        data: range(1, 70).map((i) => {
                            return {
                                name: `Name ${i}`,
                                value: Math.floor(1000 / i),
                            };
                        }),
                    },
                ],
            },
        };

        test('connectorShape=polyline, html=false', async ({mount}) => {
            const data = getModifiedData(baseData, {
                dataLabels: {connectorShape: 'polyline', html: false},
            });
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('connectorShape=straight-line, html=false', async ({mount}) => {
            const data = getModifiedData(baseData, {
                dataLabels: {connectorShape: 'straight-line', html: false},
            });
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('connectorShape=polyline, html=true', async ({mount}) => {
            const data = getModifiedData(baseData, {
                dataLabels: {connectorShape: 'polyline', html: true},
            });
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('connectorShape=straight-line, html=true', async ({mount}) => {
            const data = getModifiedData(baseData, {
                dataLabels: {connectorShape: 'straight-line', html: true},
            });
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Min radius', () => {
        const baseData: ChartData = {
            legend: {
                enabled: false,
            },
            series: {
                data: [
                    {
                        type: 'pie',
                        dataLabels: {
                            format: {
                                type: 'number',
                                precision: 2,
                            },
                        },
                        data: range(1, 5).map((i) => {
                            return {
                                name: `Name ${i}`,
                                value: Math.floor(1000 / i),
                            };
                        }),
                    },
                ],
            },
        };
        const style: React.CSSProperties = {width: '130px'};

        test('Without minRadius', async ({mount}) => {
            const component = await mount(<ChartTestStory data={baseData} styles={style} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Numeric minRadius', async ({mount}) => {
            const data = getModifiedData(baseData, {minRadius: 40});
            const component = await mount(<ChartTestStory data={data} styles={style} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Pixel minRadius', async ({mount}) => {
            const data = getModifiedData(baseData, {minRadius: '40px'});
            const component = await mount(<ChartTestStory data={data} styles={style} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Percent minRadius', async ({mount}) => {
            const data = getModifiedData(baseData, {minRadius: '70%'});
            const component = await mount(<ChartTestStory data={data} styles={style} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Pixel minRadius, pixel innerRadius', async ({mount}) => {
            const data = getModifiedData(baseData, {minRadius: '40px', innerRadius: '10px'});
            const component = await mount(<ChartTestStory data={data} styles={style} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Pixel minRadius, percent innerRadius', async ({mount}) => {
            const data = getModifiedData(baseData, {minRadius: '40px', innerRadius: '50%'});
            const component = await mount(<ChartTestStory data={data} styles={style} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });
});
