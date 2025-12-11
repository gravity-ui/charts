import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {lineTwoYAxisData, scatterLinearXAxisData} from '../__stories__/__data__';
import type {ChartData, DeepPartial} from '../types';

import {dragElementByCalculatedPosition, getLocator, getLocatorBoundingBox} from './utils';

function getData(args: {basicData: ChartData; extraData?: DeepPartial<ChartData>}): ChartData {
    const {basicData, extraData} = args;
    const data = cloneDeep(basicData);
    const defaults: DeepPartial<ChartData> = {
        chart: {margin: {top: 10, right: 10, bottom: 10, left: 10}},
        legend: {enabled: false},
        title: {text: ''},
        xAxis: {
            labels: {enabled: false},
            maxPadding: 0,
            rangeSlider: {enabled: true},
            title: {text: ''},
            type: 'datetime',
        },
        yAxis: [{title: {text: ''}}, {title: {text: ''}}],
    };
    merge(data, defaults, extraData);

    return data;
}

test.describe('Range slider', () => {
    test('Basic actions', async ({mount, page}) => {
        const data = getData({basicData: lineTwoYAxisData});
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();

        // Drag left brush handle to the right
        await dragElementByCalculatedPosition({
            component,
            page,
            selector: '.gcharts-brush .handle--w',
            getDragOptions: ({boundingBox}) => {
                const startX = boundingBox.x + boundingBox.width / 2;
                const endX = startX + 100;
                const y = boundingBox.y + boundingBox.height / 2;
                return {from: [startX, y], to: [endX, y]};
            },
        });
        await expect(component.locator('svg')).toHaveScreenshot();

        // Drag right brush handle to the left
        await dragElementByCalculatedPosition({
            component,
            page,
            selector: '.gcharts-brush .handle--e',
            getDragOptions: ({boundingBox}) => {
                const startX = boundingBox.x + boundingBox.width / 2;
                const endX = startX - 100;
                const y = boundingBox.y + boundingBox.height / 2;
                return {from: [startX, y], to: [endX, y]};
            },
        });
        await expect(component.locator('svg')).toHaveScreenshot();

        // Drag selection to the right
        await dragElementByCalculatedPosition({
            component,
            page,
            selector: '.gcharts-brush .selection',
            getDragOptions: ({boundingBox}) => {
                const startX = boundingBox.x + boundingBox.width / 2;
                const endX = startX + 50;
                const y = boundingBox.y + boundingBox.height / 2;
                return {from: [startX, y], to: [endX, y]};
            },
        });
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Default range size duration', async ({mount}) => {
        const data = getData({
            basicData: lineTwoYAxisData,
            extraData: {xAxis: {rangeSlider: {defaultRange: {size: 'P1M'}}}},
        });
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Default range size number', async ({mount}) => {
        const data = getData({
            basicData: scatterLinearXAxisData,
            extraData: {xAxis: {rangeSlider: {defaultRange: {size: 1000}}, type: 'linear'}},
        });
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Hide series', async ({mount}) => {
        const data = getData({
            basicData: lineTwoYAxisData,
            extraData: {
                series: {
                    data: [{rangeSlider: {visible: false}}],
                },
            },
        });
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Height option', async ({mount}) => {
        const data = getData({
            basicData: lineTwoYAxisData,
            extraData: {xAxis: {rangeSlider: {height: 80}}},
        });
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Margin option', async ({mount}) => {
        const data = getData({
            basicData: lineTwoYAxisData,
            extraData: {xAxis: {rangeSlider: {margin: 30}}},
        });
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Overlay click', async ({mount, page}) => {
        const data = getData({
            basicData: lineTwoYAxisData,
            extraData: {xAxis: {rangeSlider: {defaultRange: {size: 'P1M'}}}},
        });
        const component = await mount(<ChartTestStory data={data} />);

        // Click on the overlay center
        const overlay = await getLocator({component, selector: '.gcharts-brush .overlay'});
        const boundingBox = await getLocatorBoundingBox(overlay);
        let x = boundingBox.x + boundingBox.width / 2;
        const y = boundingBox.y + boundingBox.height / 2;
        await page.mouse.click(x, y);
        await expect(component.locator('svg')).toHaveScreenshot();

        // Click on the overlay left edge
        x = boundingBox.x + 5;
        await page.mouse.click(x, y);
        await expect(component.locator('svg')).toHaveScreenshot();

        // Click on the overlay right edge
        x = boundingBox.x + boundingBox.width - 5;
        await page.mouse.click(x, y);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Overlay click with maxPadding (datetime)', async ({mount, page}) => {
        const data = getData({
            basicData: lineTwoYAxisData,
            extraData: {xAxis: {maxPadding: 0.2}},
        });
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();

        // Click on the overlay center right edge
        const overlay = await getLocator({component, selector: '.gcharts-brush .overlay'});
        const boundingBox = await getLocatorBoundingBox(overlay);
        const x = boundingBox.x + boundingBox.width - 5;
        const y = boundingBox.y + boundingBox.height / 2;
        await page.mouse.click(x, y);
        await expect(component.locator('svg')).toHaveScreenshot();
    });

    test('Overlay click with maxPadding (linear)', async ({mount, page}) => {
        const data = getData({
            basicData: scatterLinearXAxisData,
            extraData: {xAxis: {maxPadding: 0.2}},
        });
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component.locator('svg')).toHaveScreenshot();

        // Click on the overlay center right edge
        const overlay = await getLocator({component, selector: '.gcharts-brush .overlay'});
        const boundingBox = await getLocatorBoundingBox(overlay);
        const x = boundingBox.x + boundingBox.width - 5;
        const y = boundingBox.y + boundingBox.height / 2;
        await page.mouse.click(x, y);
        await expect(component.locator('svg')).toHaveScreenshot();
    });
});
