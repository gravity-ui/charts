import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../ChartStory';
import {treemapHtmlLabelsData, treemapPlaygroundData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Treemap',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const TreemapBasic = {
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
