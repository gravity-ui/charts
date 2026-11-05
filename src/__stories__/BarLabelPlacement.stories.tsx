import React from 'react';

import type {Meta, StoryObj} from '@storybook/react';

import type {BarSeriesDataLabelPlacementOptions, ChartData} from '../types';

import {ChartStory} from './ChartStory';

interface Props extends BarSeriesDataLabelPlacementOptions {
    orientation: 'horizontal' | 'vertical';
    html: boolean;
    reversed: boolean;
    negative: boolean;
}

function BarLabelPlacementStory({orientation, html, reversed, negative, ...placement}: Props) {
    const vertical = orientation === 'vertical';
    const categories = ['Small', 'Medium', 'Large'];
    const values = [2, 40, 98].map((value) => (negative ? -value : value));
    const valueAxis = {
        min: negative ? -100 : 0,
        max: negative ? 0 : 100,
        order: reversed ? ('reverse' as const) : undefined,
        startOnTick: false,
        endOnTick: false,
        padding: {max: 0},
    };
    const categoryAxis = {type: 'category' as const, categories};
    const data: ChartData = {
        chart: {zoom: {enabled: true, type: 'xy'}},
        legend: {enabled: false},
        xAxis: vertical ? categoryAxis : valueAxis,
        yAxis: [vertical ? valueAxis : categoryAxis],
        series: {
            data: [
                {
                    type: vertical ? 'bar-x' : 'bar-y',
                    name: 'Orders',
                    data: values.map((value, i) =>
                        vertical ? {x: categories[i], y: value} : {x: value, y: categories[i]},
                    ),
                    dataLabels: {enabled: true, html, ...placement},
                },
            ],
        },
    };
    return <ChartStory data={data} style={{width: 360, height: 280}} />;
}

export default {
    title: 'Data labels/Bar placement',
    component: BarLabelPlacementStory,
    args: {
        orientation: 'horizontal',
        html: false,
        reversed: false,
        negative: false,
        placement: 'auto',
        placementFallback: 'show',
    },
    argTypes: {
        orientation: {control: 'radio', options: ['horizontal', 'vertical']},
        placement: {control: 'object'},
        placementFallback: {control: 'radio', options: ['show', 'hide']},
    },
} satisfies Meta<typeof BarLabelPlacementStory>;

type Story = StoryObj<typeof BarLabelPlacementStory>;

export const Adaptive: Story = {};
export const PreferInside: Story = {args: {placement: ['inside-end', 'outside']}};
export const Centered: Story = {args: {placement: ['inside-center'], placementFallback: 'hide'}};
