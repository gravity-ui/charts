import React from 'react';

import type {Meta} from '@storybook/react-webpack5';

import {ChartStory} from '../ChartStory';
import {legendPositionData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other',
    component: ChartStory,
};

export default meta;

export const LegendPosition = {
    name: 'Legend Position',
    args: {
        enabled: true,
        position: 'bottom',
        align: 'center',
        justifyContent: 'center',
    },
    argTypes: {
        enabled: {
            control: 'boolean',
        },
        position: {
            control: 'inline-radio',
            options: ['top', 'bottom', 'left', 'right'],
        },
        align: {
            control: 'inline-radio',
            options: ['left', 'center', 'right'],
        },
        justifyContent: {
            control: 'inline-radio',
            options: ['start', 'center'],
        },
    },
    render: (args: {
        enabled: boolean;
        position: 'top' | 'bottom' | 'left' | 'right';
        align: 'left' | 'center' | 'right';
        justifyContent: 'start' | 'center';
    }) => {
        const data = {
            ...legendPositionData,
            legend: {
                enabled: args.enabled,
                position: args.position,
                align: args.align,
                justifyContent: args.justifyContent,
            },
        };
        return <ChartStory data={data} />;
    },
};
