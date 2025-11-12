import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import type {ChartData} from '../../types';
import {ChartStory} from '../ChartStory';
import {heatmapNullModeSkipLinearXData, heatmapNullModeZeroLinearXData} from '../__data__';

const HeatmapNullHandlingComparison = () => {
    const skipData: ChartData = cloneDeep(heatmapNullModeSkipLinearXData);
    set(skipData, 'title', {text: 'nullMode: "skip" (default)'});
    set(skipData, 'series.data[0].dataLabels', {enabled: true});
    const zeroData: ChartData = cloneDeep(heatmapNullModeZeroLinearXData);
    set(zeroData, 'title', {text: 'nullMode: "zero"'});
    set(zeroData, 'series.data[0].dataLabels', {enabled: true});

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

export const HeatmapNullHandlingComparisonStory: StoryObj<typeof HeatmapNullHandlingComparison> = {
    name: 'Null modes',
};

export default {
    title: 'Heatmap',
    component: HeatmapNullHandlingComparison,
};
