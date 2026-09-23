import React from 'react';

import type {Meta} from '@storybook/react';

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
        layout: 'horizontal',
        html: false,
        position: 'bottom',
        align: 'center',
        verticalAlign: 'top',
        justifyContent: 'center',
        width: undefined,
    },
    argTypes: {
        layout: {control: 'inline-radio', options: ['horizontal', 'vertical']},
        html: {control: 'boolean'},
        enabled: {
            control: 'boolean',
        },
        width: {
            control: 'number',
        },
        position: {
            control: 'inline-radio',
            options: ['top', 'bottom', 'left', 'right'],
        },
        align: {
            control: 'inline-radio',
            options: ['left', 'center', 'right'],
        },
        verticalAlign: {
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
        layout: 'horizontal' | 'vertical';
        html: boolean;
        width?: number;
        position: 'top' | 'bottom' | 'left' | 'right';
        align: 'left' | 'center' | 'right';
        verticalAlign: 'top' | 'center' | 'bottom';
        justifyContent: 'start' | 'center';
    }) => {
        const data = {
            ...legendPositionData,
            legend: {
                enabled: args.enabled,
                layout: args.layout,
                html: args.html,
                width: args.width,
                position: args.position,
                align: args.align,
                verticalAlign: args.verticalAlign,
                justifyContent: args.justifyContent,
            },
        };
        return <ChartStory data={data} />;
    },
};
