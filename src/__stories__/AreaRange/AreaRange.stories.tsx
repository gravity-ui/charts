import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import {
    Controls,
    Description,
    Primary,
    Stories,
    Subtitle,
    Title,
} from '@storybook/addon-docs/blocks';
import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {
    areaRangeBasicData,
    areaRangeNullModeConnectData,
    areaRangeNullModeSkipData,
    areaRangeWithLineData,
} from '../__data__';

const meta: Meta<typeof Chart> = {
    title: 'Area range',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            page: () => (
                <React.Fragment>
                    <Title />
                    <Subtitle />
                    <Description />
                    <Primary />
                    <Controls />
                    <Stories includePrimary={false} />
                </React.Fragment>
            ),
            description: {
                component:
                    'An area range chart displays the interval between two y-axis values for every point on the x-axis.',
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const AreaRangeBasic = {
    name: 'Basic',
    args: {data: areaRangeBasicData},
} satisfies Story;

export const AreaRangeWithLine = {
    name: 'With line',
    args: {data: areaRangeWithLineData},
    parameters: {
        docs: {
            description: {
                story: 'A forecast line drawn over a translucent expected range. Hover to compare the forecast with both range boundaries.',
            },
        },
    },
} satisfies Story;

export const AreaRangeNullHandlingComparisonStory = {
    name: 'Null modes',
    render: () => (
        <Container>
            <Row space={3}>
                <Col s={12} m={6}>
                    <ChartStory data={areaRangeNullModeSkipData} />
                </Col>
                <Col s={12} m={6}>
                    <ChartStory data={areaRangeNullModeConnectData} />
                </Col>
            </Row>
        </Container>
    ),
    parameters: {
        docs: {
            description: {
                story: 'The March point has a null upper boundary. The whole point is incomplete: skip leaves a gap, while connect joins February to April.',
            },
        },
    },
} satisfies Story;
