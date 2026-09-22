import React from 'react';

import type {Meta} from '@storybook/react';

import type {ChartLegend} from '../../../types';
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
        verticalAlign: 'top',
        justifyContent: 'center',
        width: undefined,
    },
    argTypes: {
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
        width?: ChartLegend['width'];
        position: 'top' | 'bottom' | 'left' | 'right';
        align: 'left' | 'center' | 'right';
        verticalAlign: 'top' | 'center' | 'bottom';
        justifyContent: 'start' | 'center';
    }) => {
        const data = {
            ...legendPositionData,
            legend: {
                enabled: args.enabled,
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

export const PercentageWidth = {
    ...LegendPosition,
    name: 'Percentage width',
    args: {
        ...LegendPosition.args,
        position: 'left',
        width: '25%',
    },
    argTypes: {
        ...LegendPosition.argTypes,
        width: {
            control: 'text',
            description:
                'Percentage of chart width excluding left/right margins (e.g. 25%). Values above 100% are capped at 100%.',
        },
    },
};

export const PixelStringWidth = {
    ...PercentageWidth,
    name: 'Pixel string width',
    args: {
        ...PercentageWidth.args,
        width: '200px',
    },
    argTypes: {
        ...PercentageWidth.argTypes,
        width: {
            control: 'text',
            description: 'Pixel strings (e.g. 200px) behave identically to numeric pixel widths.',
        },
    },
};
