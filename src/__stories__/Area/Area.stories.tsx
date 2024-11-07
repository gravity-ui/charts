import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../ChartStory';
import {
    areaBasicData,
    areaHtmlLabelsData,
    areaPlaygroundData,
    areaStakingNormalData,
    areaStakingPercentData,
} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Area',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const AreaBasic = {
    name: 'Basic',
    args: {
        data: areaBasicData,
    },
} satisfies Story;

export const AreaStakingNormal = {
    name: 'Staking normal',
    args: {
        data: areaStakingNormalData,
    },
} satisfies Story;

export const AreaStakingPercent = {
    name: 'Staking percent',
    args: {
        data: areaStakingPercentData,
    },
} satisfies Story;

export const AreaHtmlLabels = {
    name: 'Html in labels',
    args: {
        data: areaHtmlLabelsData,
    },
} satisfies Story;

export const AreaPlayground = {
    name: 'Playground',
    args: {
        data: areaPlaygroundData,
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;
