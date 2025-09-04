import get from 'lodash/get';

import type {ChartData, ChartSeries, ChartZoom} from '../../types';
import {isAxisRelatedSeries} from '../../utils/chart';

import type {PreparedChart, PreparedTitle, PreparedZoom} from './types';

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

function getPreparedZoom(args: {series: ChartSeries[]; zoom?: ChartZoom}): PreparedZoom {
    const {series, zoom} = args;
    const hasAxisRelatedSeries = series.some(isAxisRelatedSeries);
    let enabled: boolean;

    if (hasAxisRelatedSeries) {
        enabled = zoom?.enabled ?? true;
    } else {
        enabled = false;
    }

    return {
        enabled,
        type: zoom?.type ?? 'x',
        brush: {
            style: {
                fill: 'rgba(51, 92, 173, 0.25)',
                fillOpacity: 1,
                ...zoom?.brush?.style,
            },
        },
    };
}

export const getPreparedChart = (args: {
    chart: ChartData['chart'];
    series: ChartSeries[];
    preparedTitle?: PreparedTitle;
}): PreparedChart => {
    const {chart, preparedTitle, series} = args;
    const marginTop = getMarginTop({chart, preparedTitle});
    const marginBottom = get(chart, 'margin.bottom', 0);
    const marginLeft = get(chart, 'margin.left', 0);
    const marginRight = getMarginRight({chart});
    const zoom = getPreparedZoom({series, zoom: chart?.zoom});

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
