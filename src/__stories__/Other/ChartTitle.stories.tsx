import React from 'react';

import {Col, Container, Row, Text} from '@gravity-ui/uikit';
import type {Meta, StoryObj} from '@storybook/react';

import type {ChartData} from '../../types';
import {ChartStory} from '../ChartStory';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Chart title',
    render: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

const longText =
    "One dollar and eighty-seven cents. That was all. And sixty cents of it was in pennies. Pennies saved one and two at a time by bulldozing the grocer and the vegetable man and the butcher until one's cheeks burned with the silent imputation of parsimony that such close dealing implied.";

const seriesData: ChartData['series'] = {
    data: [
        {
            type: 'line',
            name: 'Series 1',
            data: [
                {x: 1, y: 10},
                {x: 2, y: 100},
            ],
        },
    ],
};

const ChartTitleStoryContent = () => {
    return (
        <Container spaceRow={5}>
            <Row space={1}>
                <Text variant="subheader-3">Long title</Text>
            </Row>
            <Row space={3}>
                <Col s={6}>
                    <Text variant="body-2">Ellipsis (default)</Text>
                    <ChartStory
                        data={{
                            title: {text: longText},
                            series: seriesData,
                        }}
                    />
                </Col>
                <Col s={6}>
                    <Text variant="body-2">Multiline (maxRowCount: 3)</Text>
                    <ChartStory
                        data={{
                            title: {text: longText, maxRowCount: 3},
                            series: seriesData,
                        }}
                    />
                </Col>
            </Row>
        </Container>
    );
};

export const ChartTitleStory = {
    name: 'Chart title',
    render: ChartTitleStoryContent,
} satisfies Story;
