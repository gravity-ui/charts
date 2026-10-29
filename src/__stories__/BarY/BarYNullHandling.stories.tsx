import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';
import {cloneDeep, set} from 'es-toolkit/compat';

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

export const BarYNullHandlingComparisonStory: StoryObj<typeof BarYNullHandlingComparison> = {
    name: 'Null modes',
};

export default {
    title: 'Bar-Y',
    component: BarYNullHandlingComparison,
};
