import get from 'lodash/get';

import type {ChartData, ChartSeries} from '../../types';

import type {PreparedChart, PreparedTitle} from './types';
import {getPreparedZoom} from './zoom';

const getMarginTop = (args: {chart: ChartData['chart']; preparedTitle?: PreparedTitle}) => {
    const {chart, preparedTitle} = args;
    let marginTop = get(chart, 'margin.top', 0);

    if (preparedTitle?.height) {
        marginTop += preparedTitle.height;
    }

    return marginTop;
};

const getMarginRight = (args: {chart: ChartData['chart']}) => {
    const {chart} = args;

    return get(chart, 'margin.right', 0);
};

export const getPreparedChart = (args: {
    chart: ChartData['chart'];
    seriesData: ChartSeries[];
    preparedTitle?: PreparedTitle;
}): PreparedChart => {
    const {chart, preparedTitle, seriesData} = args;
    const marginTop = getMarginTop({chart, preparedTitle});
    const marginBottom = get(chart, 'margin.bottom', 0);
    const marginLeft = get(chart, 'margin.left', 0);
    const marginRight = getMarginRight({chart});
    const zoom = getPreparedZoom({zoom: chart?.zoom, seriesData});

    return {
        margin: {
            top: marginTop,
            right: marginRight,
            bottom: marginBottom,
            left: marginLeft,
        },
        zoom,
    };
};
