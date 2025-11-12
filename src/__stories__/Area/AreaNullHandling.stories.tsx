import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartStory} from '../ChartStory';
import {
    areaNullModeConnectLinearXData,
    areaNullModeSkipLinearXData,
    areaNullModeZeroLinearXData,
} from '../__data__';

const AreaNullHandlingComparison = () => {
    const skipData = cloneDeep(areaNullModeSkipLinearXData);
    set(skipData, 'title', {text: 'nullMode: "skip" (default)'});
    set(skipData, 'series.data[0].dataLabels', {enabled: true});
    const connectData = cloneDeep(areaNullModeConnectLinearXData);
    set(connectData, 'title', {text: 'nullMode: "connect"'});
    set(connectData, 'series.data[0].dataLabels', {enabled: true});
    const zeroData = cloneDeep(areaNullModeZeroLinearXData);
    set(zeroData, 'title', {text: 'nullMode: "zero"'});
    set(zeroData, 'series.data[0].dataLabels', {enabled: true});

    return (
        <Container spaceRow={5}>
            <Row space={3}>
                <Col s={12} m={4}>
                    <ChartStory data={skipData} />
                </Col>
                <Col s={12} m={4}>
                    <ChartStory data={connectData} />
                </Col>
                <Col s={12} m={4}>
                    <ChartStory data={zeroData} />
                </Col>
            </Row>
        </Container>
    );
};

export const AreaNullHandlingComparisonStory: StoryObj<typeof AreaNullHandlingComparison> = {
    name: 'Null modes',
};

export default {
    title: 'Area',
    component: AreaNullHandlingComparison,
};
