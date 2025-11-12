import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import type {ChartData} from '../../types';
import {ChartStory} from '../ChartStory';
import {scatterNullModeSkipLinearXData, scatterNullModeZeroLinearXData} from '../__data__';

const ScatterNullHandlingComparison = () => {
    const skipData: ChartData = cloneDeep(scatterNullModeSkipLinearXData);
    set(skipData, 'title', {text: 'nullMode: "skip" (default)'});
    const zeroData: ChartData = cloneDeep(scatterNullModeZeroLinearXData);
    set(zeroData, 'title', {text: 'nullMode: "zero"'});

    return (
        <Container spaceRow={5}>
            <Row space={3}>
                <Col s={12} m={6}>
                    <ChartStory data={skipData} />
                </Col>
                <Col s={12} m={6}>
                    <ChartStory data={zeroData} />
                </Col>
            </Row>
        </Container>
    );
};

export const ScatterNullHandlingComparisonStory: StoryObj = {
    name: 'Null modes',
};

export default {
    title: 'Scatter',
    component: ScatterNullHandlingComparison,
};
