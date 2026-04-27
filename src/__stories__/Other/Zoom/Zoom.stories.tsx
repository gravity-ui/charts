import React from 'react';

import type {Meta, StoryObj} from '@storybook/react';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

import {Chart} from '../../../components';
import {ChartStory} from '../../ChartStory';
import {
    barXStakingNormalData,
    barYStakingNormalData,
    lineTwoYAxisData,
    scatterBasicData,
} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Zoom',
    render: ChartStory,
    component: Chart,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const ZoomX = {
    name: 'Type X',
    args: {
        data: {
            ...lineTwoYAxisData,
            chart: {
                zoom: {
                    enabled: true,
                },
            },
        },
    },
} satisfies Story;

export const ZoomY = {
    name: 'Type Y',
    args: {
        data: {
            ...barYStakingNormalData,
            chart: {
                zoom: {
                    enabled: true,
                },
            },
        },
    },
} satisfies Story;

const scatterXY = merge(cloneDeep(scatterBasicData), {
    chart: {zoom: {enabled: true, type: 'xy'}},
    title: {text: 'Scatter'},
});
const barXStackedXY = merge(cloneDeep(barXStakingNormalData), {
    chart: {zoom: {enabled: true, type: 'xy'}},
    title: {text: 'Bar-x stacked'},
});
const barYStackedXY = merge(cloneDeep(barYStakingNormalData), {
    chart: {zoom: {enabled: true, type: 'xy'}},
    title: {text: 'Bar-y stacked'},
});

export const ZoomXY = {
    name: 'Type XY',
    render: () => (
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{height: 300}}>
                <Chart data={scatterXY} />
            </div>
            <div style={{height: 300}}>
                <Chart data={barXStackedXY} />
            </div>
            <div style={{height: 300}}>
                <Chart data={barYStackedXY} />
            </div>
        </div>
    ),
} satisfies Story;
