import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../ChartStory';
import {lineBasicData, lineHtmlLabelsData, linePlaygroundData, lineSplitData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Line',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const LineBasic = {
    name: 'Basic',
    args: {
        data: lineBasicData,
    },
} satisfies Story;

export const LineHtmlLabels = {
    name: 'Html in labels',
    args: {
        data: lineHtmlLabelsData,
    },
} satisfies Story;

export const LineSplit = {
    name: 'Split',
    args: {
        data: lineSplitData,
        wrapperProps: {
            styles: {
                height: 560,
            },
        },
    },
} satisfies Story;

export const LinePlayground = {
    name: 'Playground',
    args: {
        data: linePlaygroundData,
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;
