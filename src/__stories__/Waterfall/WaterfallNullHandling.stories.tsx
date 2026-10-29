import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import {ChartStory} from '../ChartStory';
import {waterfallNullModeSkipData, waterfallNullModeZeroData} from '../__data__';

const WaterfallNullHandlingComparison = () => {
    const skipData = cloneDeep(waterfallNullModeSkipData);
    set(skipData, 'title', {text: 'nullMode: "skip" (default)'});
    set(skipData, 'series.data[0].dataLabels', {enabled: true});
    const zeroData = cloneDeep(waterfallNullModeZeroData);
    set(zeroData, 'title', {text: 'nullMode: "zero"'});
    set(zeroData, 'series.data[0].dataLabels', {enabled: true});

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
        </Container>
    );
};

export const WaterfallNullHandlingComparisonStory: StoryObj = {
    name: 'Null modes',
};

export default {
    title: 'Waterfall',
    component: WaterfallNullHandlingComparison,
};
