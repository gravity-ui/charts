import React from 'react';

import {Col, Container, Row, Text} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';

import {ChartStory} from './ChartStory';
import {
    areaBasicData,
    areaNegativeValuesData,
    areaStakingNormalData,
    areaStakingPercentData,
    areaTwoYAxisData,
    barXBasicData,
    barXDataLabelsData,
    barXGroupedColumnsData,
    barXNegativeValuesData,
    barXStakingNormalData,
    barXStakingPercentData,
    barXTwoYAxisData,
    barYBasicData,
    barYGroupedColumnsData,
    barYNegativeValuesData,
    barYStakingNormalData,
    barYStakingPercentData,
    funnelBasicData,
    heatmapBasicData,
    lineBasicData,
    lineDataLabelsData,
    lineMarkersData,
    lineShapesData,
    lineTwoYAxisData,
    pieBasicData,
    pieDonutData,
    radarBasicData,
    sankeyPlaygroundData,
    scatterBasicData,
    scatterTwoYAxisData,
    treemapPlaygroundData,
    waterfallBasicData,
} from './__data__';

const ShowcaseStory = () => {
    return (
        <div style={{width: '100%', height: '100%'}}>
            <Container spaceRow={5}>
                <Row space={1}>
                    <Text variant="header-2">Line charts</Text>
                </Row>
                <Row space={3}>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Basic line chart</Text>
                        <ChartStory data={lineBasicData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">With markers</Text>
                        <ChartStory data={lineMarkersData} />
                    </Col>
                    <Col s={12} m={12} l={6}>
                        <Text variant="subheader-1">With data labels</Text>
                        <ChartStory data={lineDataLabelsData} />
                    </Col>
                    <Col s={12} m={6} l={6}>
                        <Text variant="subheader-1">Lines with different shapes</Text>
                        <ChartStory data={lineShapesData} />
                    </Col>
                    <Col s={12} m={6} l={6}>
                        <Text variant="subheader-1">Line with two Y axis</Text>
                        <ChartStory data={lineTwoYAxisData} />
                    </Col>
                </Row>
                <Row space={1}>
                    <Text variant="header-2">Area charts</Text>
                </Row>
                <Row space={3}>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Basic area chart</Text>
                        <ChartStory data={areaBasicData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Stacked area</Text>
                        <ChartStory data={areaStakingNormalData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Stacked percentage areas</Text>
                        <ChartStory data={areaStakingPercentData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Dual Y axis</Text>
                        <ChartStory data={areaTwoYAxisData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">With negative values</Text>
                        <ChartStory data={areaNegativeValuesData} />
                    </Col>
                </Row>
                <Row space={1}>
                    <Text variant="header-2">Bar-x charts</Text>
                </Row>
                <Row space={3}>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Basic column chart</Text>
                        <ChartStory data={barXBasicData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Grouped columns</Text>
                        <ChartStory data={barXGroupedColumnsData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Stacked columns(normal)</Text>
                        <ChartStory data={barXStakingNormalData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Stacked percentage column</Text>
                        <ChartStory data={barXStakingPercentData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Bar-x chart with data labels</Text>
                        <ChartStory data={barXDataLabelsData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Dual Y axis</Text>
                        <ChartStory data={barXTwoYAxisData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Bar-x chart with negative values</Text>
                        <ChartStory data={barXNegativeValuesData} />
                    </Col>
                </Row>
                <Row space={1}>
                    <Text variant="header-2">Bar-y charts</Text>
                </Row>
                <Row space={3}>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Basic bar chart</Text>
                        <ChartStory data={barYBasicData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Grouped bars</Text>
                        <ChartStory data={barYGroupedColumnsData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Stacked bars</Text>
                        <ChartStory data={barYStakingNormalData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Stacked percentage bars</Text>
                        <ChartStory data={barYStakingPercentData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Bar-y chart with negative values</Text>
                        <ChartStory data={barYNegativeValuesData} />
                    </Col>
                </Row>
                <Row space={1}>
                    <Text variant="header-2">Pie charts</Text>
                </Row>
                <Row space={3}>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Basic pie chart</Text>
                        <ChartStory data={pieBasicData} />
                    </Col>
                    <Col s={12} m={6}>
                        <Text variant="subheader-1">Donut chart</Text>
                        <ChartStory data={pieDonutData} />
                    </Col>
                </Row>
                <Row space={1}>
                    <Text variant="header-2">Scatter charts</Text>
                </Row>
                <Row space={3}>
                    <Col s={12} m={6} l={6}>
                        <Text variant="subheader-1">Basic scatter</Text>
                        <ChartStory data={scatterBasicData} />
                    </Col>
                    <Col s={12} m={6} l={6}>
                        <Text variant="subheader-1">Scatter chart with two Y axis</Text>
                        <ChartStory data={scatterTwoYAxisData} />
                    </Col>
                </Row>
                <Row space={1}>
                    <Text variant="header-2">Other</Text>
                </Row>
                <Row space={3}>
                    <Col s={12} m={6} l={6}>
                        <Text variant="subheader-1">Treemap</Text>
                        <ChartStory data={treemapPlaygroundData} />
                    </Col>
                    <Col s={12} m={6} l={6}>
                        <Text variant="subheader-1">Heatmap</Text>
                        <ChartStory data={heatmapBasicData} />
                    </Col>
                    <Col s={12} m={6} l={6}>
                        <Text variant="subheader-1">Sankey</Text>
                        <ChartStory data={sankeyPlaygroundData} />
                    </Col>
                    <Col s={12} m={6} l={6}>
                        <Text variant="subheader-1">Waterfall</Text>
                        <ChartStory data={waterfallBasicData} style={{marginTop: 24}} />
                    </Col>
                    <Col s={12} m={6} l={6}>
                        <Text variant="subheader-1">Radar</Text>
                        <ChartStory data={radarBasicData} />
                    </Col>
                    <Col s={12} m={6} l={6}>
                        <Text variant="subheader-1">Funnel</Text>
                        <ChartStory data={funnelBasicData} style={{margin: 24}} />
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export const GChartsShowcaseStory: StoryObj<typeof ShowcaseStory> = {
    name: 'Showcase',
};

export default {
    title: 'Showcase',
    component: ShowcaseStory,
};
