import type {Meta, StoryObj} from '@storybook/react-webpack5';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {
    lineBasicData,
    lineHtmlLabelsData,
    linePlaygroundData,
    lineSplitData,
    lineTwoYAxisData,
} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Line',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const LineBasic = {
    name: 'Basic',
    args: {
        data: lineBasicData,
    },
} satisfies Story;

export const LineTwoYAxis = {
    name: 'Line with two Y axes',
    args: {
        data: lineTwoYAxisData,
    },
} satisfies Story;

export const LineHtmlLabels = {
    name: 'Html in labels',
    args: {
        data: lineHtmlLabelsData,
    },
} satisfies Story;

export const LineSplit = {
    name: 'Split',
    args: {
        data: lineSplitData,
        style: {height: 560},
    },
} satisfies Story;

export const LinePlayground = {
    name: 'Playground',
    args: {
        data: linePlaygroundData,
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;
