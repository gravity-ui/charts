import type {Meta, StoryObj} from '@storybook/react-webpack5';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {
    areaBasicData,
    areaHtmlLabelsData,
    areaPlaygroundData,
    areaSplitData,
    areaStakingNormalData,
    areaStakingPercentData,
} from '../__data__';

const meta: Meta<typeof Chart> = {
    title: 'Area',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
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

export const AreaSplit = {
    name: 'Split',
    args: {
        data: areaSplitData,
        style: {height: 560},
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
