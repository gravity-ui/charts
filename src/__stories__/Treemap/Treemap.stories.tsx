import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {treemapBasicData, treemapHtmlLabelsData, treemapPlaygroundData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Treemap',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const TreemapBasic = {
    name: 'Basic',
    args: {
        data: treemapBasicData,
    },
} satisfies Story;

export const TreemapWithHtmlLabels = {
    name: 'Html in labels',
    args: {
        data: treemapHtmlLabelsData,
    },
} satisfies Story;

export const TreemapPlayground = {
    name: 'Playground',
    args: {
        data: treemapPlaygroundData,
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;
