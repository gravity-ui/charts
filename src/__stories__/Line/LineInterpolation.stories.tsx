import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import type {ChartData} from '../../types';
import {ChartStory} from '../ChartStory';

const DATA_POINTS = [
    {x: 0, y: 10},
    {x: 1, y: 60},
    {x: 2, y: 20},
    {x: 3, y: 80},
    {x: 4, y: 30},
    {x: 5, y: 70},
    {x: 6, y: 40},
];

const baseData: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Series',
                data: DATA_POINTS,
                lineWidth: 2,
                marker: {enabled: true},
            },
        ],
    },
    xAxis: {type: 'linear'},
};

const LineInterpolationComparison = () => {
    const linearData: ChartData = cloneDeep(baseData);
    set(linearData, 'title', {text: 'Linear (default)'});

    const monotoneData: ChartData = cloneDeep(baseData);
    set(monotoneData, 'title', {text: 'Monotone'});
    set(monotoneData, 'series.data[0].interpolation', {type: 'monotone'});

    const cardinalData: ChartData = cloneDeep(baseData);
    set(cardinalData, 'title', {text: 'Cardinal (tension 0.5)'});
    set(cardinalData, 'series.data[0].interpolation', {type: 'cardinal', tension: 0.5});

    return (
        <Container spaceRow={5}>
            <Row space={3}>
                <Col s={12} m={4}>
                    <ChartStory data={linearData} />
                </Col>
                <Col s={12} m={4}>
                    <ChartStory data={monotoneData} />
                </Col>
                <Col s={12} m={4}>
                    <ChartStory data={cardinalData} />
                </Col>
            </Row>
        </Container>
    );
};

export const LineInterpolationComparisonStory: StoryObj<typeof LineInterpolationComparison> = {
    name: 'Interpolation types',
};

export default {
    title: 'Line',
    component: LineInterpolationComparison,
};
