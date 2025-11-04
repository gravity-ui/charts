import React from 'react';

import {Col, Container, Row} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react';
import {groups} from 'd3';

import type {ChartData, PieSeriesData} from '../../types';
import {ChartStory} from '../ChartStory';
import nintendoGames from '../__data__/nintendoGames';

// Create default data with intentional null gaps (every 5th item)
const createDataWithNulls = (): PieSeriesData[] => {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
    return gamesByPlatform.map(([platform, games], index) => ({
        name: platform,
        value: index % 5 === 0 ? null : games.length,
    }));
};

const PieNullHandlingComparison = ({dataWithNulls}: {dataWithNulls: PieSeriesData[]}) => {
    const breakData: ChartData = {
        title: {
            text: 'nullHandling: "break" (default)',
            style: {fontSize: '12px', fontWeight: 'normal'},
        },
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'pie',
                    data: dataWithNulls,
                    nullHandling: 'break',
                    minRadius: 0,
                },
            ],
        },
    };

    const replaceByZeroData: ChartData = {
        title: {
            text: 'nullHandling: "replaceByZero"',
            style: {fontSize: '12px', fontWeight: 'normal'},
        },
        legend: {enabled: true},
        series: {
            data: [
                {
                    type: 'pie',
                    data: dataWithNulls,
                    nullHandling: 'replaceByZero',
                    minRadius: 0,
                },
            ],
        },
    };

    return (
        <Container spaceRow={5}>
            <Row space={3}>
                <Col s={12} m={6}>
                    <ChartStory data={breakData} />
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
        dataWithNulls: createDataWithNulls(),
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
