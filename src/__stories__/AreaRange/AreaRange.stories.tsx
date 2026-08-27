import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {areaRangeBasicData} from '../__data__';

const meta: Meta<typeof Chart> = {
    title: 'Area range',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'An area range chart displays the interval between a low and a high value for every point on the x-axis.',
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
