import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {areaRangeBasicData, areaRangeDataLabelsData, areaRangeWithLineData} from '../__data__';

const meta: Meta<typeof Chart> = {
    title: 'Area range',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'An area range chart displays the interval between two y-axis values for every point on the x-axis.',
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const AreaRangeBasic = {
    name: 'Basic',
    args: {data: areaRangeBasicData},
} satisfies Story;

export const AreaRangeWithLine = {
    name: 'With line',
    args: {data: areaRangeWithLineData},
    parameters: {
        docs: {
            description: {
                story: 'A forecast line drawn over a translucent expected range. Hover to compare the forecast with both range boundaries.',
            },
        },
    },
} satisfies Story;

export const AreaRangeDataLabels = {
    name: 'Data labels',
    args: {data: areaRangeDataLabelsData},
    parameters: {
        docs: {
            description: {
                story: 'Labels format both boundaries independently. An explicit point label replaces the interval text.',
            },
        },
    },
} satisfies Story;
