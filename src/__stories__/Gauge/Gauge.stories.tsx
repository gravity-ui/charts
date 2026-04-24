import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {gaugeBasicData, gaugeGradientData, gaugeNeedleData, gaugeSolidData} from '../__data__';

const meta: Meta<typeof Chart> = {
    title: 'Gauge',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Gauge chart displays a single value on an arc with optional threshold zones, a pointer, and a target marker.`,
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const GaugeBasic = {
    name: 'Basic (marker, 3 thresholds, target)',
    args: {
        data: gaugeBasicData,
    },
} satisfies Story;

export const GaugeNeedle = {
    name: 'Needle pointer',
    args: {
        data: gaugeNeedleData,
    },
} satisfies Story;

export const GaugeSolid = {
    name: 'Solid pointer',
    args: {
        data: gaugeSolidData,
    },
} satisfies Story;

export const GaugeGradient = {
    name: 'Gradient track (continuous)',
    args: {
        data: gaugeGradientData,
    },
} satisfies Story;
