import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {lineTwoYAxisData} from '../__stories__/__data__';
import type {ChartData, DeepPartial} from '../types';

import {dragElementByCalculatedPosition} from './utils';

function getData(args: {basicData: ChartData; extraData?: DeepPartial<ChartData>}): ChartData {
    const {basicData, extraData} = args;
    const data = cloneDeep(basicData);
    const defaults: DeepPartial<ChartData> = {
        chart: {margin: {top: 10, right: 10, bottom: 10, left: 10}},
        legend: {enabled: false},
        title: {text: ''},
        tooltip: {enabled: false},
        xAxis: {
            labels: {enabled: false},
            rangeSlider: {enabled: true},
            title: {text: ''},
            type: 'datetime',
        },
        yAxis: [{title: {text: ''}}, {title: {text: ''}}],
    };
    merge(data, defaults, extraData);

    return data;
}

test.describe('Range slider - Zoom', () => {
    test('Sync slider and zoom X', async ({mount, page}) => {
        const data = getData({
            basicData: lineTwoYAxisData,
            extraData: {chart: {zoom: {enabled: true, type: 'x'}}},
        });
        const component = await mount(<ChartTestStory data={data} />);
        await expect(component).toHaveScreenshot();

        // Zoom chart
        await dragElementByCalculatedPosition({
            component,
            page,
            selector: '.gcharts-chart__content .gcharts-brush .overlay',
            getDragOptions: ({boundingBox}) => {
                const startX = boundingBox.x + boundingBox.width * 0.25;
                const endX = boundingBox.x + boundingBox.width * 0.75;
                const y = boundingBox.y + boundingBox.height / 2;

                return {from: [startX, y], to: [endX, y]};
            },
        });
        await expect(component).toHaveScreenshot();

        // Drag range slider selection to the right
        await dragElementByCalculatedPosition({
            component,
            page,
            selector: '.gcharts-range-slider .gcharts-brush .selection',
            getDragOptions: ({boundingBox}) => {
                const startX = boundingBox.x + boundingBox.width * 0.5;
                const endX = boundingBox.x + boundingBox.width * 0.75;
                const y = boundingBox.y + boundingBox.height / 2;

                return {from: [startX, y], to: [endX, y]};
            },
        });
        await expect(component).toHaveScreenshot();
    });
});
