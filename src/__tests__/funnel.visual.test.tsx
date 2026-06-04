import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {
    funnelBasicData,
    funnelContinuousLegendData,
    funnelHtmlLabelsData,
    funnelMultilineLabelsData,
    funnelTrapezoidData,
    funnelTrapezoidWithConnectorsData,
} from 'src/__stories__/__data__';
import type {FunnelSeries} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

import {FunnelTooltipValueFormatStory} from './components/FunnelTooltipValueFormatStory';
import {getLocatorBoundingBox} from './utils';

test.describe('Funnel series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={funnelBasicData} />);
        await expect(component).toHaveScreenshot();
    });

    test('With continuous legend', async ({mount}) => {
        const component = await mount(<ChartTestStory data={funnelContinuousLegendData} />);
        await expect(component).toHaveScreenshot();
    });

    test('With HTML labels', async ({mount}) => {
        const component = await mount(<ChartTestStory data={funnelHtmlLabelsData} />);
        await expect(component).toHaveScreenshot();
    });

    test('With multiline labels (preserveLineBreaks: false)', async ({mount}) => {
        const noPreserveData = {
            ...funnelMultilineLabelsData,
            series: {
                data: funnelMultilineLabelsData.series.data.map((s) => ({
                    ...s,
                    dataLabels: {...(s as FunnelSeries).dataLabels, preserveLineBreaks: false},
                })),
            },
        };
        const component = await mount(<ChartTestStory data={noPreserveData} />);
        await expect(component).toHaveScreenshot();
    });

    test('With multiline labels', async ({mount}) => {
        const component = await mount(<ChartTestStory data={funnelMultilineLabelsData} />);
        await expect(component).toHaveScreenshot();
    });

    test('With multiline labels (HTML)', async ({mount}) => {
        const htmlData = {
            ...funnelMultilineLabelsData,
            series: {
                data: funnelMultilineLabelsData.series.data.map((s) => ({
                    ...s,
                    dataLabels: {...(s as FunnelSeries).dataLabels, html: true},
                })),
            },
        };
        const component = await mount(<ChartTestStory data={htmlData} />);
        await expect(component).toHaveScreenshot();
    });

    test('Trapezoid', async ({mount}) => {
        const component = await mount(<ChartTestStory data={funnelTrapezoidData} />);
        await expect(component).toHaveScreenshot();
    });

    test('Trapezoid with connectors', async ({mount}) => {
        const component = await mount(<ChartTestStory data={funnelTrapezoidWithConnectorsData} />);
        await expect(component).toHaveScreenshot();
    });

    test.describe('DataLabels', () => {
        const seriesData = [
            {value: 100, name: 'Visit'},
            {value: 87, name: 'Sign-up'},
            {value: 63, name: 'Selection'},
            {value: 27, name: 'Purchase'},
            {value: 12, name: 'Review'},
        ];

        function makeData(dataLabels: object) {
            return {
                series: {
                    data: [
                        {
                            type: 'funnel' as const,
                            name: 'Series 1',
                            data: seriesData,
                            dataLabels,
                        },
                    ],
                },
                legend: {enabled: false},
            };
        }

        test.describe('SVG labels', () => {
            test('align: center, inside: true', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={makeData({align: 'center', inside: true})} />,
                );
                await expect(component).toHaveScreenshot();
            });

            test('align: left, inside: true', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={makeData({align: 'left', inside: true})} />,
                );
                await expect(component).toHaveScreenshot();
            });

            test('align: right, inside: true', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={makeData({align: 'right', inside: true})} />,
                );
                await expect(component).toHaveScreenshot();
            });

            test('align: left, inside: false', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={makeData({align: 'left', inside: false})} />,
                );
                await expect(component).toHaveScreenshot();
            });

            test('align: right, inside: false', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={makeData({align: 'right', inside: false})} />,
                );
                await expect(component).toHaveScreenshot();
            });

            test.describe('reserveSpace: false', () => {
                test('align: left', async ({mount}) => {
                    const component = await mount(
                        <ChartTestStory data={makeData({align: 'left', reserveSpace: false})} />,
                    );
                    await expect(component).toHaveScreenshot();
                });

                test('align: right', async ({mount}) => {
                    const component = await mount(
                        <ChartTestStory data={makeData({align: 'right', reserveSpace: false})} />,
                    );
                    await expect(component).toHaveScreenshot();
                });
            });

            test.describe('anchor: shape', () => {
                test('align: left', async ({mount}) => {
                    const component = await mount(
                        <ChartTestStory data={makeData({align: 'left', anchor: 'shape'})} />,
                    );
                    await expect(component).toHaveScreenshot();
                });

                test('align: right', async ({mount}) => {
                    const component = await mount(
                        <ChartTestStory data={makeData({align: 'right', anchor: 'shape'})} />,
                    );
                    await expect(component).toHaveScreenshot();
                });
            });
        });

        test.describe('HTML labels', () => {
            test('align: center, inside: true', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={makeData({html: true, align: 'center', inside: true})} />,
                );
                await expect(component).toHaveScreenshot();
            });

            test('align: left, inside: true', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={makeData({html: true, align: 'left', inside: true})} />,
                );
                await expect(component).toHaveScreenshot();
            });

            test('align: right, inside: true', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={makeData({html: true, align: 'right', inside: true})} />,
                );
                await expect(component).toHaveScreenshot();
            });

            test('align: left, inside: false', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={makeData({html: true, align: 'left', inside: false})} />,
                );
                await expect(component).toHaveScreenshot();
            });

            test('align: right, inside: false', async ({mount}) => {
                const component = await mount(
                    <ChartTestStory data={makeData({html: true, align: 'right', inside: false})} />,
                );
                await expect(component).toHaveScreenshot();
            });

            test.describe('reserveSpace: false', () => {
                test('align: left', async ({mount}) => {
                    const component = await mount(
                        <ChartTestStory
                            data={makeData({html: true, align: 'left', reserveSpace: false})}
                        />,
                    );
                    await expect(component).toHaveScreenshot();
                });

                test('align: right', async ({mount}) => {
                    const component = await mount(
                        <ChartTestStory
                            data={makeData({html: true, align: 'right', reserveSpace: false})}
                        />,
                    );
                    await expect(component).toHaveScreenshot();
                });
            });

            test.describe('anchor: shape', () => {
                test('align: left', async ({mount}) => {
                    const component = await mount(
                        <ChartTestStory
                            data={makeData({html: true, align: 'left', anchor: 'shape'})}
                        />,
                    );
                    await expect(component).toHaveScreenshot();
                });

                test('align: right', async ({mount}) => {
                    const component = await mount(
                        <ChartTestStory
                            data={makeData({html: true, align: 'right', anchor: 'shape'})}
                        />,
                    );
                    await expect(component).toHaveScreenshot();
                });
            });
        });
    });

    test.describe('Tooltip', () => {
        test('Segment tooltip.valueFormat overrides chart tooltip.valueFormat', async ({
            mount,
            page,
        }) => {
            const component = await mount(<FunnelTooltipValueFormatStory />);
            const segment = component.locator('polygon').first();
            const box = await getLocatorBoundingBox(segment);
            await page.mouse.move(
                Math.round(box.x + box.width / 2),
                Math.round(box.y + box.height / 2),
            );
            const tooltip = page.locator('.gcharts-tooltip');
            await expect(tooltip.locator('.gcharts-tooltip__content-row-cell')).toHaveText([
                '',
                'Visit',
                'data:100',
            ]);
        });
    });
});
