import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../../components';
import {ChartStory} from '../../ChartStory';
import {
    barXDatePlotLineData,
    barXWithYAxisPlotLinesData,
    barYDatetimePlotLineData,
    barYPlotLinesData,
} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Plot Lines',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const BarYPlotLines = {
    name: 'Linear Y Plot Lines',
    args: {
        data: barXWithYAxisPlotLinesData,
    },
} satisfies Story;

export const BarXDatetimePlotLines = {
    name: 'Datetime Y Plot Lines',
    args: {
        data: barYDatetimePlotLineData,
    },
} satisfies Story;

export const BarXPlotLines = {
    name: 'Linear X Plot Lines',
    args: {
        data: barYPlotLinesData,
    },
} satisfies Story;

export const BarXDatePlotLines = {
    name: 'Datetime X Plot Lines',
    args: {
        data: barXDatePlotLineData,
    },
} satisfies Story;
