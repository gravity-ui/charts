import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartStory} from '../ChartStory';
import {
    barYNullModeSkipCategoryYData,
    barYNullModeSkipGroupedData,
    barYNullModeZeroCategoryYData,
    barYNullModeZeroGroupedData,
} from '../__data__';

const BarYNullHandlingComparison = () => {
    const skipSingle = cloneDeep(barYNullModeSkipCategoryYData);
    set(skipSingle, 'title', {text: 'nullMode: "skip" — single series'});
    const zeroSingle = cloneDeep(barYNullModeZeroCategoryYData);
    set(zeroSingle, 'title', {text: 'nullMode: "zero" — single series'});

    const skipGrouped = cloneDeep(barYNullModeSkipGroupedData);
    set(skipGrouped, 'title', {text: 'nullMode: "skip" — grouped multi-series'});
    const zeroGrouped = cloneDeep(barYNullModeZeroGroupedData);
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

export const BarYNullHandlingComparisonStory: StoryObj<typeof BarYNullHandlingComparison> = {
    name: 'Null modes',
};

export default {
    title: 'Bar-Y',
    component: BarYNullHandlingComparison,
};
