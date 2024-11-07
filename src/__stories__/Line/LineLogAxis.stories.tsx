import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';
import {randomNormal} from 'd3';

import type {ChartKitWidgetData} from '../../types';
import {ChartStory} from '../ChartStory';

const LineWithLogarithmicAxis = () => {
    const randomY = randomNormal(0, 100);
    const widgetData: ChartKitWidgetData = {
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Line series',
                    data: new Array(25).fill(null).map((_, index) => ({
                        x: index,
                        y: Math.abs(randomY()),
                    })),
                },
            ],
        },
    };
    const lineWidgetData: ChartKitWidgetData = {...widgetData, title: {text: 'linear'}};
    const logarithmicWidgetData: ChartKitWidgetData = {
        ...widgetData,
        title: {text: 'logarithmic'},
        yAxis: [
            {
                type: 'logarithmic',
            },
        ],
    };

    return (
        <Container spaceRow={5}>
            <Row space={3}>
                <Col s={12} m={6}>
                    <ChartStory data={lineWidgetData} />
                </Col>
                <Col s={12} m={6}>
                    <ChartStory data={logarithmicWidgetData} />
                </Col>
            </Row>
        </Container>
    );
};

export const PerformanceIssueScatter: StoryObj<typeof LineWithLogarithmicAxis> = {
    name: 'Linear & Logarithmic Y axis',
};

export default {
    title: 'Line',
    component: LineWithLogarithmicAxis,
};
