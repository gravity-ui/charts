import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

import {xRangeBasicData, xRangeContinuousLegendData} from 'src/__stories__/__data__';
import type {ChartData, DeepPartial, XRangeSeriesData} from 'src/types';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';

import {dragElementByCalculatedPosition, getLocatorBoundingBox} from './utils';

function getRangeSliderData(extraData?: DeepPartial<ChartData>): ChartData {
    const data = cloneDeep(xRangeBasicData);
    const defaults: DeepPartial<ChartData> = {
        xAxis: {rangeSlider: {enabled: true}},
        chart: {zoom: {enabled: false}},
    };
    merge(data, defaults, extraData);
    return data;
}

test.describe('X-Range series', () => {
    test('Basic', async ({mount}) => {
        const component = await mount(<ChartTestStory data={xRangeBasicData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Tooltip', async ({mount, page}) => {
        const component = await mount(<ChartTestStory data={xRangeBasicData} />);
        const segment = component.locator('.gcharts-x-range__segment').first();
        const box = await getLocatorBoundingBox(segment);
        await page.mouse.move(
            Math.round(box.x + box.width / 2),
            Math.round(box.y + box.height / 2),
        );
        const tooltip = page.locator('.gcharts-tooltip');
        await expect(tooltip).toHaveScreenshot();
    });

    test('Continuous legend', async ({mount}) => {
        const component = await mount(<ChartTestStory data={xRangeContinuousLegendData} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test.describe('Range slider', () => {
        test('Basic', async ({mount}) => {
            const data = getRangeSliderData();
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Default range size', async ({mount}) => {
            const data = getRangeSliderData({xAxis: {rangeSlider: {defaultRange: {size: 'P1M'}}}});
            const component = await mount(<ChartTestStory data={data} />);
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Drag left handle', async ({mount, page}) => {
            const data = getRangeSliderData();
            const component = await mount(<ChartTestStory data={data} />);
            await dragElementByCalculatedPosition({
                component,
                page,
                selector: '.gcharts-brush .handle--w',
                getDragOptions: ({boundingBox}) => {
                    const startX = boundingBox.x + boundingBox.width / 2;
                    const endX = startX + 80;
                    const y = boundingBox.y + boundingBox.height / 2;
                    return {from: [startX, y], to: [endX, y]};
                },
            });
            await expect(component.locator('svg')).toHaveScreenshot();
        });

        test('Drag right handle', async ({mount, page}) => {
            const data = getRangeSliderData();
            const component = await mount(<ChartTestStory data={data} />);
            await dragElementByCalculatedPosition({
                component,
                page,
                selector: '.gcharts-brush .handle--e',
                getDragOptions: ({boundingBox}) => {
                    const startX = boundingBox.x + boundingBox.width / 2;
                    const endX = startX - 80;
                    const y = boundingBox.y + boundingBox.height / 2;
                    return {from: [startX, y], to: [endX, y]};
                },
            });
            await expect(component.locator('svg')).toHaveScreenshot();
        });
    });

    test('Zoom', async ({mount}) => {
        const zoomData: ChartData = {
            chart: {zoom: {enabled: true}},
            series: {data: xRangeBasicData.series.data},
            xAxis: xRangeBasicData.xAxis,
            yAxis: xRangeBasicData.yAxis,
            tooltip: {enabled: false},
        };
        const component = await mount(<ChartTestStory data={zoomData} />);

        const brushAreaLocator = component.locator('.gcharts-brush');
        const boundingBox = await brushAreaLocator.evaluate((el) => el.getBoundingClientRect());
        const startX = boundingBox.x + boundingBox.width / 10;
        const endX = boundingBox.x + (boundingBox.width / 10) * 2;
        const y = boundingBox.y + boundingBox.height / 2;
        await component.dragTo(brushAreaLocator, {
            sourcePosition: {x: startX, y},
            targetPosition: {x: endX, y},
        });
        await expect(component.locator('svg').first()).toHaveScreenshot();
    });

    test('Html data labels', async ({mount}) => {
        const chartData = {
            ...xRangeBasicData,
            series: {
                data: xRangeBasicData.series.data.map((s) => ({
                    ...s,
                    dataLabels: {enabled: true, html: true},
                    data: s.data.map((d) => ({
                        ...d,
                        label: `<pre>${String((d as XRangeSeriesData).label)}</pre>`,
                    })),
                })),
            },
        } as ChartData;
        const component = await mount(<ChartTestStory data={chartData} />);
        await expect(component).toHaveScreenshot();
    });
});
