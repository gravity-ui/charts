import React from 'react';

import type {Meta, StoryObj} from '@storybook/react-webpack5';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {Chart} from '../../../components';
import {ChartStory} from '../../ChartStory';
import {lineTwoYAxisData, scatterLinearXAxisData} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    component: Chart,
    render: ChartStory,
    tags: ['autodocs'],
    title: 'Other/RangeSlider',
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

const dateTimeData = cloneDeep(lineTwoYAxisData);
set(dateTimeData, 'rangeSlider', {enabled: true});
set(dateTimeData, 'legend', {enabled: true});
export const RangeSliderDateTime = {
    name: 'Datetime X axis',
    args: {
        data: dateTimeData,
        style: {
            height: 350,
        },
    },
} satisfies Story;

const linearTimeData = cloneDeep(scatterLinearXAxisData);
set(linearTimeData, 'rangeSlider', {enabled: true});
set(linearTimeData, 'legend', {enabled: true});
export const RangeSliderLinear = {
    name: 'Linear X axis',
    args: {
        data: linearTimeData,
        style: {
            height: 350,
        },
    },
} satisfies Story;

const linearWithDefaultRangeData1 = cloneDeep(scatterLinearXAxisData);
set(linearWithDefaultRangeData1, 'rangeSlider', {enabled: true, defaultMin: 3800});
set(linearWithDefaultRangeData1, 'legend', {enabled: true});
set(linearWithDefaultRangeData1, 'title', {
    text: 'With defaultMin (open-ended range to max)',
});

const linearWithDefaultRangeData2 = cloneDeep(scatterLinearXAxisData);
set(linearWithDefaultRangeData2, 'rangeSlider', {enabled: true, defaultMax: 3800});
set(linearWithDefaultRangeData2, 'legend', {enabled: true});
set(linearWithDefaultRangeData2, 'title', {
    text: 'With defaultMax (open-ended range from min)',
});

const linearWithDefaultRangeData3 = cloneDeep(scatterLinearXAxisData);
set(linearWithDefaultRangeData3, 'rangeSlider', {
    enabled: true,
    defaultMin: 3600,
    defaultMax: 4000,
});
set(linearWithDefaultRangeData3, 'legend', {enabled: true});
set(linearWithDefaultRangeData3, 'title', {
    text: 'With defaultMin and defaultMax (closed range)',
});

export const RangeSliderWithDefaultRange = {
    name: 'With defaultMin / defaultMax',
    render: () => (
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{height: 350}}>
                <Chart data={linearWithDefaultRangeData1} />
            </div>
            <div style={{height: 350}}>
                <Chart data={linearWithDefaultRangeData2} />
            </div>
            <div style={{height: 350}}>
                <Chart data={linearWithDefaultRangeData3} />
            </div>
        </div>
    ),
} satisfies Story;
