import React from 'react';

import type {Meta} from '@storybook/react-webpack5';

import {ChartStory} from '../ChartStory';
import {lineBasicData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other',
    component: ChartStory,
};

export default meta;

export const LegendPosition = {
    name: 'Legend Position',
    args: {
        position: 'bottom',
    },
    argTypes: {
        position: {
            control: 'inline-radio',
            options: ['top', 'bottom'],
        },
    },
    render: (args: {position: 'top' | 'bottom'}) => {
        const data = {
            ...lineBasicData,
            legend: {
                enabled: true,
                position: args.position,
            },
        };
        return <ChartStory data={data} />;
    },
};
