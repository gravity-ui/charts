import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';

import type {AreaSeriesData, ChartData} from '../../types';
import {ChartStory} from '../ChartStory';
import {areaDataWithNulls} from '../__data__/area/null-handling';

const sharedChartData = {
    yAxis: [
        {
            title: {
                text: 'User score',
            },
        },
    ],
    xAxis: {
        type: 'datetime' as const,
        title: {
            text: 'Release dates',
        },
    },
};

const AreaNullHandlingComparison = ({dataWithNulls}: {dataWithNulls: AreaSeriesData[]}) => {
    const skipData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "skip" (default)'},
        series: {
            data: [
                {
                    type: 'area',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullMode: 'skip',
                },
            ],
        },
    };

    const connectData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "connect"'},
        series: {
            data: [
                {
                    type: 'area',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullMode: 'connect',
                },
            ],
        },
    };

    const zeroData: ChartData = {
        ...sharedChartData,
        title: {text: 'nullMode: "zero"'},
        series: {
            data: [
                {
                    type: 'area',
                    name: 'User Score',
                    data: dataWithNulls,
                    nullMode: 'zero',
                },
            ],
        },
    };

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

export const AreaNullHandlingComparisonStory: StoryObj<typeof AreaNullHandlingComparison> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: areaDataWithNulls,
    },
    argTypes: {
        dataWithNulls: {
            control: 'object',
            description: 'Array of area series data with null values',
        },
    },
};

export default {
    title: 'Area',
    component: AreaNullHandlingComparison,
};
