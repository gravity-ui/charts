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
set(dateTimeData, 'xAxis.rangeSlider', {enabled: true});
set(dateTimeData, 'legend', {enabled: true});
set(dateTimeData, 'title', {
    text: 'Without default range',
});

const dateTimeDataWithRange = cloneDeep(lineTwoYAxisData);
set(dateTimeDataWithRange, 'xAxis.rangeSlider', {enabled: true, defaultRange: {size: 'P1M'}});
set(dateTimeDataWithRange, 'legend', {enabled: true});
set(dateTimeDataWithRange, 'title', {
    text: 'With default range (1 month)',
});

export const RangeSliderDateTime = {
    name: 'Datetime X axis',
    render: () => (
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{height: 350}}>
                <Chart data={dateTimeData} />
            </div>
            <div style={{height: 350}}>
                <Chart data={dateTimeDataWithRange} />
            </div>
        </div>
    ),
} satisfies Story;

const linearData = cloneDeep(scatterLinearXAxisData);
set(linearData, 'xAxis.rangeSlider', {enabled: true});
set(linearData, 'legend', {enabled: true});
set(linearData, 'title', {
    text: 'Without default range',
});

const linearDataWithRange = cloneDeep(scatterLinearXAxisData);
set(linearDataWithRange, 'xAxis.rangeSlider', {enabled: true, defaultRange: {size: 1000}});
set(linearDataWithRange, 'legend', {enabled: true});
set(linearDataWithRange, 'title', {
    text: 'With default range (1000)',
});

export const RangeSliderLinear = {
    name: 'Linear X axis',
    render: () => (
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{height: 350}}>
                <Chart data={linearData} />
            </div>
            <div style={{height: 350}}>
                <Chart data={linearDataWithRange} />
            </div>
        </div>
    ),
} satisfies Story;
