import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../../components';
import {ChartStory} from '../../ChartStory';
import {
    barXDatePlotBandsData,
    barXPlotBandsData,
    barXWithXAxisPlotBandsData,
    barXWithYLinearAxisPlotBandsData,
    barYDatetimePlotBandData,
    barYPlotBandsData,
} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Plot Bands',
    render: ChartStory,
    component: Chart,
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

export const BarYDatetimePlotBandData = {
    name: 'Datetime Y Plot Bands',
    args: {
        data: barYDatetimePlotBandData,
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
