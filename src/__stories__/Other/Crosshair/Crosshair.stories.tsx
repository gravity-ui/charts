import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../../components';
import {ChartStory} from '../../ChartStory';
import {
    barXBasicCrosshairData,
    barYCrosshairData,
    barYCrosshairNotSnapData,
    crosshairTwoYAxisData,
    crosshairTwoYAxisDataNotSnap,
    lineSplitCrosshairData,
    lineSplitCrosshairNotSnapData,
    scatterBasicCrosshairData,
} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Crosshair',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const BarXBasicCrosshair = {
    name: 'Bar X Basic Crosshair',
    args: {
        data: barXBasicCrosshairData,
    },
} satisfies Story;

export const ScatterBasicCrosshair = {
    name: 'Custom Crosshair',
    args: {
        data: scatterBasicCrosshairData,
    },
} satisfies Story;

export const BarYCrosshair = {
    name: 'Bar Y Crosshair',
    args: {
        data: barYCrosshairData,
    },
} satisfies Story;

export const BarYCrosshairNotSnap = {
    name: 'Bar Y Crosshair Not Snap',
    args: {
        data: barYCrosshairNotSnapData,
    },
} satisfies Story;

export const LineTwoYAxisWithCrosshair = {
    name: 'Line Two Y axis with crosshair',
    args: {
        data: crosshairTwoYAxisData,
    },
} satisfies Story;

export const LineTwoYAxisWithCrosshairNotSnap = {
    name: 'Line Two Y axis with crosshair Not Snap',
    args: {
        data: crosshairTwoYAxisDataNotSnap,
    },
} satisfies Story;

export const LineSplitCrosshair = {
    name: 'Split Crosshair',
    args: {
        data: lineSplitCrosshairData,
        style: {height: 560},
    },
} satisfies Story;

export const LineSplitCrosshairNotSnap = {
    name: 'Split Crosshair Not Snap',
    args: {
        data: lineSplitCrosshairNotSnapData,
        style: {height: 560},
    },
} satisfies Story;
