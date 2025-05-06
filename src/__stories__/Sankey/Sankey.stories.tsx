import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {sankeyPlaygroundData} from '../__data__';

const meta: Meta<typeof Chart> = {
    title: 'Sankey',
    render: ChartStory,
    component: Chart,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const SankeyPlayground = {
    name: 'Playground',
    args: {
        data: sankeyPlaygroundData,
        style: {height: 560},
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;
