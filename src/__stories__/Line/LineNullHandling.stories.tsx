import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import type {ChartData} from '../../types';
import {ChartStory} from '../ChartStory';
import {
    lineNullModeConnectLinearXData,
    lineNullModeSkipLinearXData,
    lineNullModeZeroLinearXData,
} from '../__data__';

const LineNullHandlingComparison = () => {
    const skipData: ChartData = cloneDeep(lineNullModeSkipLinearXData);
    set(skipData, 'title', {text: 'nullMode: "skip" (default)'});
    set(skipData, 'series.data[0].dataLabels', {enabled: true});
    const connectData: ChartData = cloneDeep(lineNullModeConnectLinearXData);
    set(connectData, 'title', {text: 'nullMode: "connect"'});
    set(connectData, 'series.data[0].dataLabels', {enabled: true});
    const zeroData: ChartData = cloneDeep(lineNullModeZeroLinearXData);
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

export const LineNullHandlingComparisonStory: StoryObj<typeof LineNullHandlingComparison> = {
    name: 'Null modes',
};

export default {
    title: 'Line',
    component: LineNullHandlingComparison,
};
