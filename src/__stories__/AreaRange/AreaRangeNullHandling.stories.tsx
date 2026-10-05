import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';

import {ChartStory} from '../ChartStory';
import {areaRangeNullModeConnectData, areaRangeNullModeSkipData} from '../__data__';

const AreaRangeNullHandlingComparison = () => (
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
);

export const AreaRangeNullHandlingComparisonStory: StoryObj<
    typeof AreaRangeNullHandlingComparison
> = {
    name: 'Null modes',
    parameters: {
        docs: {
            description: {
                story: 'The March point has a null upper boundary. The whole point is incomplete: skip leaves a gap, while connect joins February to April.',
            },
        },
    },
};

export default {
    title: 'Area range',
    component: AreaRangeNullHandlingComparison,
};
