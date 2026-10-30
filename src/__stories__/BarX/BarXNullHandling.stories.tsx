import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartStory} from '../ChartStory';
import {
    barXNullModeSkipCategoryXData,
    barXNullModeSkipLinearXData,
    barXNullModeZeroCategoryXData,
    barXNullModeZeroLinearXData,
} from '../__data__';

const BarXNullHandlingComparison = () => {
    const skipData = cloneDeep(barXNullModeSkipLinearXData);
    set(skipData, 'title', {text: 'nullMode: "skip" (default) - Linear X-axis'});
    set(skipData, 'series.data[0].dataLabels', {enabled: true, placement: ['inside-center']});
    const zeroData = cloneDeep(barXNullModeZeroLinearXData);
    set(zeroData, 'title', {text: 'nullMode: "zero" - Linear X-axis'});
    set(zeroData, 'series.data[0].dataLabels', {enabled: true, placement: ['inside-center']});

    const skipDataCategory = cloneDeep(barXNullModeSkipCategoryXData);
    set(skipDataCategory, 'title', {text: 'nullMode: "skip" (default) - Category X-axis'});
    const zeroDataCategory = cloneDeep(barXNullModeZeroCategoryXData);
    set(zeroDataCategory, 'title', {text: 'nullMode: "zero" - Category X-axis'});

    return (
        <Container rowGap="spacing-5">
            <Row gap="spacing-3">
                <Col size={{xs: 12, m: 6}}>
                    <ChartStory data={skipData} />
                </Col>
                <Col size={{xs: 12, m: 6}}>
                    <ChartStory data={zeroData} />
                </Col>
            </Row>
            <Row gap="spacing-3">
                <Col size={{xs: 12, m: 6}}>
                    <ChartStory data={skipDataCategory} />
                </Col>
                <Col size={{xs: 12, m: 6}}>
                    <ChartStory data={zeroDataCategory} />
                </Col>
            </Row>
        </Container>
    );
};

export const BarXNullHandlingComparisonStory: StoryObj<typeof BarXNullHandlingComparison> = {
    name: 'Null Modes',
};

export default {
    title: 'Bar-X',
    component: BarXNullHandlingComparison,
};
