import React from 'react';

import type {Meta, StoryObj} from '@storybook/react';

import type {ChartData} from '../../types';
import {ChartStory} from '../ChartStory';

const data: ChartData = {
    xAxis: {padding: {min: 'auto', max: 'auto'}},
    yAxis: [{min: 0, padding: {max: 'auto'}, endOnTick: true}],
    series: {
        data: [
            {
                type: 'line',
                name: 'Revenue',
                marker: {enabled: true, radius: 10},
                data: [
                    {x: 0, y: 40},
                    {x: 1, y: 100},
                    {x: 2, y: 60},
                ],
            },
        ],
    },
};

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Axis padding',
    component: ChartStory,
    args: {data},
    render: (args) => <ChartStory {...args} />,
};
export default meta;
type Story = StoryObj<typeof ChartStory>;
export const Automatic: Story = {};
export const ExplicitMaximum: Story = {
    args: {data: {...data, yAxis: [{min: 0, max: 100, padding: {max: 'auto'}}]}},
};
export const PixelsAndPercentages: Story = {
    args: {data: {...data, xAxis: {padding: {min: 20, max: '10%'}}}},
};
export const Reversed: Story = {
    args: {
        data: {
            ...data,
            xAxis: {...data.xAxis, order: 'reverse'},
            yAxis: [{...data.yAxis?.[0], order: 'reverse'}],
        },
    },
};
export const Zoom: Story = {args: {data: {...data, chart: {zoom: {enabled: true, type: 'xy'}}}}};
export const RangeSlider: Story = {
    args: {data: {...data, xAxis: {...data.xAxis, rangeSlider: {enabled: true}}}},
};
