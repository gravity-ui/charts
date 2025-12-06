import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartStory} from '../ChartStory';
import {
    barYNullModeSkipCategoryYData,
    barYNullModeSkipLinearXData,
    barYNullModeZeroCategoryYData,
    barYNullModeZeroLinearXData,
} from '../__data__';

const BarYNullHandlingComparison = () => {
    const skipData = cloneDeep(barYNullModeSkipLinearXData);
    set(skipData, 'title', {text: 'nullMode: "skip" (default) - Linear X-axis'});
    const zeroData = cloneDeep(barYNullModeZeroLinearXData);
    set(zeroData, 'title', {text: 'nullMode: "zero" - Linear X-axis'});

    const skipDataCategory = cloneDeep(barYNullModeSkipCategoryYData);
    set(skipDataCategory, 'title', {text: 'nullMode: "skip" (default) - Category Y-axis'});
    const zeroDataCategory = cloneDeep(barYNullModeZeroCategoryYData);
    set(zeroDataCategory, 'title', {text: 'nullMode: "zero" - Category Y-axis'});

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
            <Row space={3}>
                <Col s={12} m={6}>
                    <ChartStory data={skipDataCategory} />
                </Col>
                <Col s={12} m={6}>
                    <ChartStory data={zeroDataCategory} />
                </Col>
            </Row>
        </Container>
    );
};

export const BarYNullHandlingComparisonStory: StoryObj<typeof BarYNullHandlingComparison> = {
    name: 'Null modes',
};

export default {
    title: 'Bar-Y',
    component: BarYNullHandlingComparison,
};
