import React from 'react';

import type {Meta} from '@storybook/react-webpack5';

import {ChartStory} from '../../ChartStory';
import {legendPositionData} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Legend',
    component: ChartStory,
};

export default meta;

export const LegendPosition = {
    name: 'Position',
    args: {
        enabled: true,
        position: 'bottom',
        align: 'center',
        alignVertical: 'top',
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
        alignVertical: {
            control: 'inline-radio',
            options: ['top', 'center', 'bottom'],
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
        alignVertical: 'top' | 'center' | 'bottom';
        justifyContent: 'start' | 'center';
    }) => {
        const data = {
            ...legendPositionData,
            legend: {
                enabled: args.enabled,
                position: args.position,
                align: args.align,
                alignVertical: args.alignVertical,
                justifyContent: args.justifyContent,
            },
        };
        return <ChartStory data={data} />;
    },
};
