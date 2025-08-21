import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import range from 'lodash/range';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {pieBasicData, piePlaygroundData} from '../__stories__/__data__';
import type {ChartData, PieSeries} from '../types';

function getModifiedData(data: ChartData, pieSeries: Partial<PieSeries>) {
    const resultData = merge({}, data);
    merge(resultData.series.data[0], pieSeries);

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

    test('Html dataLabels', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'pie',
                        dataLabels: {
                            enabled: true,
                            html: true,
                        },
                        data: [
                            {
                                name: 'One',
                                value: 2.007719752191679,
                                label: '<span style="background: #4fc4b7;color: #fff;padding: 4px;border-radius: 4px;display: inline-block;line-height: normal;">One</span>',
                                color: '#4fc4b7',
                            },
                            {
                                name: 'Two',
                                value: 7.213946843338091,
                                label: '<span style="background: #59abc9;color: #fff;padding: 4px;border-radius: 4px;display: inline-block;line-height: normal;">Two</span>',
                                color: '#59abc9',
                            },
                            {
                                name: 'Three',
                                value: 6.672973787005758,
                                label: '<span style="background: #8ccce3;color: #fff;padding: 4px;border-radius: 4px;display: inline-block;line-height: normal;">Three</span>',
                                color: '#8ccce3',
                            },
                        ],
                    },
                ],
            },
        };
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Html dataLabels with overflow', async ({mount}) => {
        const data: ChartData = {
            series: {
                data: [
                    {
                        type: 'pie',
                        dataLabels: {
                            enabled: true,
                            html: true,
                        },
                        data: [
                            {
                                name: '1',
                                label: '<span>Long span with text overflow</span>',
                                value: 1,
                                color: '#4fc4b7',
                            },
                            {
                                name: '2',
                                label: '<div>Long div with text overflow</div>',
                                value: 2,
                                color: '#59abc9',
                            },
                        ],
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 200, height: 200}} />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Html dataLabels with overflow and chart margin', async ({mount}) => {
        const data: ChartData = {
            chart: {
                margin: {
                    top: 20,
                    left: 20,
                    right: 20,
                    bottom: 20,
                },
            },
            series: {
                data: [
                    {
                        type: 'pie',
                        minRadius: '50%',
                        dataLabels: {
                            enabled: true,
                            html: true,
                        },
                        data: [
                            {
                                name: '1',
                                label: '<span>Long span with text overflow</span>',
                                value: 3,
                                color: '#4fc4b7',
                            },
                            {
                                name: '2',
                                label: '<div>Long div with text overflow</div>',
                                value: 2,
                                color: '#59abc9',
                            },
                        ],
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={data} styles={{width: 215, height: 260}} />,
        );
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

    test('Donut with small center text', async ({mount}) => {
        const chartData: ChartData = {
            chart: {
                margin: {
                    top: 20,
                    left: 20,
                    right: 20,
                    bottom: 20,
                },
            },
            legend: {
                justifyContent: 'start',
                itemDistance: 24,
                itemStyle: {
                    fontSize: '13px',
                },
                enabled: true,
            },
            series: {
                data: [
                    {
                        type: 'pie',
                        minRadius: '50%',
                        dataLabels: {
                            padding: 10,
                            enabled: true,
                            style: {
                                fontSize: '12px',
                                fontWeight: '500',
                            },
                        },
                        data: [
                            {
                                name: 'Copiers',
                                label: '2198.941644556382',
                                color: '#4DA2F1',
                                value: 2198.941644556382,
                            },
                            {
                                name: 'Machines',
                                label: '1645.5533119035804',
                                color: '#FF3D64',
                                value: 1645.5533119035804,
                            },
                            {
                                name: 'Tables',
                                label: '648.7947784232496',
                                color: '#8AD554',
                                value: 648.7947784232496,
                            },
                            {
                                name: 'Chairs',
                                label: '532.3324250077505',
                                color: '#FFC636',
                                value: 532.3324250077505,
                            },
                            {
                                name: 'Bookcases',
                                label: '503.85963542001286',
                                color: '#FFB9DD',
                                value: 503.85963542001286,
                            },
                            {
                                name: 'Phones',
                                label: '371.211537086253',
                                color: '#84D1EE',
                                value: 371.211537086253,
                            },
                            {
                                name: 'Storage',
                                label: '264.5905536072192',
                                color: '#FF91A1',
                                value: 264.5905536072192,
                            },
                            {
                                name: 'Supplies',
                                label: '245.6501960766943',
                                color: '#54A520',
                                value: 245.6501960766943,
                            },
                            {
                                name: 'Appliances',
                                label: '230.75571087373683',
                                color: '#DB9100',
                                value: 230.75571087373683,
                            },
                            {
                                name: 'Accessories',
                                label: '215.9746056526707',
                                color: '#BA74B3',
                                value: 215.9746056526707,
                            },
                            {
                                name: 'Binders',
                                label: '133.56056045002634',
                                color: '#1F68A9',
                                value: 133.56056045002634,
                            },
                            {
                                name: 'Furnishings',
                                label: '95.82566774339885',
                                color: '#ED65A9',
                                value: 95.82566774339885,
                            },
                            {
                                name: 'Envelopes',
                                label: '64.86772391176599',
                                color: '#0FA08D',
                                value: 64.86772391176599,
                            },
                            {
                                name: 'Paper',
                                label: '57.28409198757506',
                                color: '#FF7E00',
                                value: 57.28409198757506,
                            },
                            {
                                name: 'Labels',
                                label: '34.30305509580361',
                                color: '#E8B0A4',
                                value: 34.30305509580361,
                            },
                            {
                                name: 'Art',
                                label: '34.068834228282',
                                color: '#52A6C5',
                                value: 34.068834228282,
                            },
                            {
                                name: 'Fasteners',
                                label: '13.936774256042622',
                                color: '#BE2443',
                                value: 13.936774256042622,
                            },
                        ],
                        innerRadius: '50%',
                        legend: {
                            symbol: {
                                padding: 8,
                                width: 10,
                                height: 10,
                            },
                        },
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory
                data={chartData}
                styles={{height: 260, width: 250}}
                customShape={{text: '229,86', padding: 36}}
            />,
        );
        await expect(component).toHaveScreenshot();
    });

    test('Transform: scale', async ({mount}) => {
        const chartData = {
            series: {
                data: [
                    {
                        type: 'pie',
                        data: [
                            {name: '1', value: 1},
                            {name: '2', value: 2},
                        ],
                    },
                ],
            },
        };
        const component = await mount(
            <ChartTestStory data={chartData} styles={{transform: 'scale(0.5)'}} />,
        );
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
