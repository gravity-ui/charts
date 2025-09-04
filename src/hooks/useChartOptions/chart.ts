import get from 'lodash/get';

import type {ChartData, ChartZoom} from '../../types';

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

function getPreparedZoom(zoom?: ChartZoom): PreparedZoom | null {
    if (!zoom) {
        return null;
    }

    return {
        type: zoom.type ?? 'x',
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
    preparedTitle?: PreparedTitle;
}): PreparedChart => {
    const {chart, preparedTitle} = args;
    const marginTop = getMarginTop({chart, preparedTitle});
    const marginBottom = get(chart, 'margin.bottom', 0);
    const marginLeft = get(chart, 'margin.left', 0);
    const marginRight = getMarginRight({chart});
    const zoom = getPreparedZoom(chart?.zoom);

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
