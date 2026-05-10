import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartStory} from '../ChartStory';
import {
    barXNullModeSkipCategoryXData,
    barXNullModeSkipGroupedData,
    barXNullModeZeroCategoryXData,
    barXNullModeZeroGroupedData,
} from '../__data__';

const BarXNullHandlingComparison = () => {
    const skipSingle = cloneDeep(barXNullModeSkipCategoryXData);
    set(skipSingle, 'title', {text: 'nullMode: "skip" — single series'});
    const zeroSingle = cloneDeep(barXNullModeZeroCategoryXData);
    set(zeroSingle, 'title', {text: 'nullMode: "zero" — single series'});

    const skipGrouped = cloneDeep(barXNullModeSkipGroupedData);
    set(skipGrouped, 'title', {text: 'nullMode: "skip" — grouped multi-series'});
    const zeroGrouped = cloneDeep(barXNullModeZeroGroupedData);
    set(zeroGrouped, 'title', {text: 'nullMode: "zero" — grouped multi-series'});

    return (
        <Container spaceRow={5}>
            <Row space={3}>
                <Col s={12} m={6}>
                    <ChartStory data={skipSingle} />
                </Col>
                <Col s={12} m={6}>
                    <ChartStory data={zeroSingle} />
                </Col>
            </Row>
            <Row space={3}>
                <Col s={12} m={6}>
                    <ChartStory data={skipGrouped} />
                </Col>
                <Col s={12} m={6}>
                    <ChartStory data={zeroGrouped} />
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
