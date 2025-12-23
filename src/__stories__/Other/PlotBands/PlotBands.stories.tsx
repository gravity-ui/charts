import type {Meta, StoryObj} from '@storybook/react-webpack5';

import {Chart} from '../../../components';
import {ChartStory} from '../../ChartStory';
import {
    barXDatePlotBandsData,
    barXPlotBandsData,
    barXWithXAxisPlotBandsData,
    barXWithXAxisPlotBandsInfinityData,
    barXWithYLinearAxisPlotBandsData,
    barXWithYLinearAxisPlotBandsInfinityData,
    barYPlotBandsData,
    barYWithXLinearAxisPlotBandsInfinityData,
    barYWithYAxisPlotBandsInfinityData,
    lineDatetimePlotBandData,
} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Plot Bands',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const BarYPlotBands = {
    name: 'Category Y Plot Bands',
    args: {
        data: barYPlotBandsData,
    },
} satisfies Story;

export const BarXWithYLinearAxisPlotBandsData = {
    name: 'Linear Y Plot Bands',
    args: {
        data: barXWithYLinearAxisPlotBandsData,
    },
} satisfies Story;

export const LineDatetimePlotBandData = {
    name: 'Datetime Y Plot Bands',
    args: {
        data: lineDatetimePlotBandData,
    },
} satisfies Story;

export const BarXPlotBands = {
    name: 'Linear X Plot Bands',
    args: {
        data: barXPlotBandsData,
    },
} satisfies Story;

export const BarXDateTimePlotBands = {
    name: 'Datetime X Plot Bands',
    args: {
        data: barXDatePlotBandsData,
    },
} satisfies Story;

export const BarXWithXAxisPlotBandsData = {
    name: 'Category X Plot Bands',
    args: {
        data: barXWithXAxisPlotBandsData,
    },
} satisfies Story;

export const BarXWithYLinearAxisPlotBandsInfinityData = {
    name: 'Linear Y Plot Bands Infinity',
    args: {
        data: barXWithYLinearAxisPlotBandsInfinityData,
    },
} satisfies Story;

export const BarXWithXAxisPlotBandsInfinityData = {
    name: 'Category X Plot Bands Infinity',
    args: {
        data: barXWithXAxisPlotBandsInfinityData,
    },
} satisfies Story;

export const BarYWithYAxisPlotBandsInfinityData = {
    name: 'Category Y Plot Bands Infinity',
    args: {
        data: barYWithYAxisPlotBandsInfinityData,
    },
} satisfies Story;

export const BarYWithXLinearAxisPlotBandsInfinityData = {
    name: 'Linear X Plot Bands Infinity',
    args: {
        data: barYWithXLinearAxisPlotBandsInfinityData,
    },
} satisfies Story;
