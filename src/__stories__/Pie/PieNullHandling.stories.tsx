import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';

import type {ChartData, PieSeriesData} from '../../types';
import {ChartStory} from '../ChartStory';
import {pieDataWithNulls} from '../__data__/pie/null-handling';

const PieNullHandlingComparison = ({dataWithNulls}: {dataWithNulls: PieSeriesData[]}) => {
    const filterData: ChartData = {
        title: {
            text: 'nullMode: "skip" (default)',
            style: {fontSize: '12px', fontWeight: 'normal'},
        },
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'pie',
                    data: dataWithNulls,
                    nullMode: 'skip',
                    minRadius: 0,
                },
            ],
        },
    };

    const replaceByZeroData: ChartData = {
        title: {
            text: 'nullMode: "zero"',
            style: {fontSize: '12px', fontWeight: 'normal'},
        },
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'pie',
                    data: dataWithNulls,
                    nullMode: 'zero',
                    minRadius: 0,
                },
            ],
        },
    };

    return (
        <Container spaceRow={5}>
            <Row space={3}>
                <Col s={12} m={6}>
                    <ChartStory data={filterData} />
                </Col>
                <Col s={12} m={6}>
                    <ChartStory data={replaceByZeroData} />
                </Col>
            </Row>
        </Container>
    );
};

export const PieNullHandlingComparisonStory: StoryObj<typeof PieNullHandlingComparison> = {
    name: 'Null Handling Comparison',
    args: {
        dataWithNulls: pieDataWithNulls,
    },
    argTypes: {
        dataWithNulls: {
            control: 'object',
            description: 'Array of pie series data with null values',
        },
    },
};

export default {
    title: 'Pie',
    component: PieNullHandlingComparison,
};
