import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import type {ChartData} from '../../types';
import {randomString} from '../../utils';
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

export const TreemapPerformance = {
    name: 'Performance',
    args: {
        data: (() => {
            const items = new Array(1000).fill(null).map(() => ({
                name: randomString(5, '0123456789abcdefghijklmnopqrstuvwxyz'),
                value: 10,
            }));
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'treemap',
                            name: '',
                            data: items,
                            dataLabels: {enabled: true},
                        },
                    ],
                },
            };

            return data;
        })(),
        style: {width: 1000, height: 1000},
    },
    argTypes: {
        data: {
            control: 'object',
        },
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
