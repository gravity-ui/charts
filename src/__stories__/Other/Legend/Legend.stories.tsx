import React from 'react';

import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../../ChartStory';
import {groupedLegend} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Legend',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const SharedLegend = {
    name: 'Shared legend',
    args: {
        data: groupedLegend,
    },
} satisfies Story;

export const ContentBasedWidth = {
    name: 'Content-based width',
    render: (args) => (
        <div
            style={{
                width: 700,
                height: 350,
                resize: 'horizontal',
                overflow: 'auto',
                minWidth: 200,
                maxWidth: '100%',
            }}
        >
            <ChartStory {...args} style={{width: '100%', height: '100%'}} />
        </div>
    ),
    args: {
        data: {
            legend: {
                enabled: true,
                position: 'left',
                width: 'auto',
                maxWidth: '30%',
                title: {text: 'Regions'},
            },
            series: {
                data: ['North', 'South', 'West', 'East', 'Central region with a long label'].map(
                    (name, i) => ({
                        type: 'line' as const,
                        name,
                        data: [
                            {x: 0, y: i + 1},
                            {x: 1, y: i + 3},
                            {x: 2, y: i + 2},
                        ],
                    }),
                ),
            },
        },
    },
} satisfies Story;
