import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import range from 'lodash/range';
import set from 'lodash/set';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {groupedLegend, pieHtmlLegendData} from '../__stories__/__data__';
import type {ChartData, ChartLegend} from '../types';

const pieOverflowedLegendItemsData: ChartData = {
    legend: {
        enabled: true,
    },
    series: {
        data: [
            {
                type: 'pie',
                dataLabels: {enabled: false},
                data: [
                    {
                        name: 'Lorem ipsum',
                        value: 2,
                    },
                    {
                        name: 'Lorem ipsum dolor',
                        value: 3,
                    },
                    {
                        name: 'Lorem ipsum dolor sit amet consectetur adipiscing elit',
                        value: 8,
                    },
                ],
            },
        ],
    },
};

const piePaginatedLegendData: ChartData = {
    legend: {
        enabled: true,
        type: 'discrete',
    },
    series: {
        data: [
            {
                type: 'pie',
                dataLabels: {enabled: false},
                data: range(1, 40).map((i) => ({
                    name: `Label ${i + 1}`,
                    value: i,
                })),
            },
        ],
    },
};

test.describe('Legend', () => {
    test.describe('Discrete', () => {
        test('Pagination svg', async ({mount}) => {
            const component = await mount(
                <ChartTestStory data={piePaginatedLegendData} styles={{width: '150px'}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
            const arrowNext = component.getByText('▼');
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Pagination html', async ({mount}) => {
            const component = await mount(
                <ChartTestStory data={pieHtmlLegendData} styles={{width: '225px'}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
            const arrowNext = component.getByText('▼');
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
            await arrowNext.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('With overflowed legend items', async ({mount}) => {
            const component = await mount(
                <ChartTestStory data={pieOverflowedLegendItemsData} styles={{width: '270px'}} />,
            );
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('With overflowed html legend items', async ({mount}) => {
            const data = cloneDeep(pieOverflowedLegendItemsData);
            set(data, 'legend.html', true);
            const component = await mount(<ChartTestStory data={data} styles={{width: '270px'}} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('By clicking on the legend item, a series is selected', async ({mount}) => {
            const data: ChartData = {
                legend: {
                    enabled: true,
                },
                series: {
                    data: [
                        {
                            type: 'pie',
                            dataLabels: {enabled: false},
                            data: new Array(3).fill(null).map((_d, i) => ({
                                name: `${i + 1}`,
                                value: 1,
                            })),
                        },
                    ],
                },
            };

            const component = await mount(<ChartTestStory data={data} />);

            const legendItem = component.locator('.gcharts-legend__item text').first();
            await legendItem.click();

            await expect(component.locator('svg')).toHaveScreenshot();

            // When clicking on the legend again, the chart should return to its original state.
            await legendItem.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        const positions = ['top', 'bottom', 'left', 'right'] as const;

        positions.forEach((position) => {
            test.describe(`Position ${position}`, () => {
                test('Basic', async ({mount}) => {
                    const data = cloneDeep(pieOverflowedLegendItemsData);
                    set(data, 'legend.position', position);
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: '270px'}} />,
                    );
                    await expect(component.locator('svg')).toHaveScreenshot();
                });

                test('With html', async ({mount}) => {
                    const data = cloneDeep(pieOverflowedLegendItemsData);
                    set(data, 'legend.position', position);
                    set(data, 'legend.html', true);
                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: '270px'}} />,
                    );
                    await expect(component.locator('svg')).toHaveScreenshot();
                });

                test('Paginated', async ({mount}) => {
                    const data = cloneDeep(piePaginatedLegendData);
                    set(data, 'legend.position', position);

                    const component = await mount(
                        <ChartTestStory data={data} styles={{width: '150px'}} />,
                    );
                    await expect(component.locator('svg')).toHaveScreenshot();

                    const arrowNext = component.getByText('▼');
                    await arrowNext.click();
                    await expect(component.locator('svg')).toHaveScreenshot();
                    await arrowNext.click();
                    await expect(component.locator('svg')).toHaveScreenshot();
                });
            });
        });

        test('Grouped legend items', async ({mount}) => {
            const component = await mount(<ChartTestStory data={groupedLegend} />);

            await expect(component.locator('svg')).toHaveScreenshot();

            const legendItem = component.locator('.gcharts-legend__item text').first();
            await legendItem.click();
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test.describe('Continuous', () => {
        const legendAlign: ChartLegend['align'][] = ['left', 'right', 'center'];
        legendAlign.forEach((align) => {
            test(`Chart margin should be taken into account when positioning the legend (align="${align}")`, async ({
                mount,
            }) => {
                const chartData: ChartData = {
                    chart: {margin: {left: 10, right: 10}},
                    legend: {
                        enabled: true,
                        type: 'continuous',
                        align,
                        colorScale: {
                            colors: ['#348bdc', '#348bdc'],
                        },
                        width: 100,
                    },
                    series: {
                        data: [
                            {
                                type: 'pie',
                                dataLabels: {enabled: false},
                                data: [{value: 10, name: 'Data'}],
                            },
                        ],
                    },
                };
                const component = await mount(
                    <ChartTestStory data={chartData} styles={{width: 200}} />,
                );
                await expect(component.locator('svg')).toHaveScreenshot();
            });
        });
    });
});
