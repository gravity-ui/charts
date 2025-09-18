import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../../components';
import {ChartStory} from '../../ChartStory';
import {barYStakingNormalData, lineTwoYAxisData, scatterBasicData} from '../../__data__';

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

export const ZoomXY = {
    name: 'Type XY',
    args: {
        data: {
            ...scatterBasicData,
            chart: {
                zoom: {
                    enabled: true,
                    type: 'xy',
                },
            },
        },
    },
} satisfies Story;
