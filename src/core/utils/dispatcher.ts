import {dispatch} from 'd3-dispatch';

export const EventType = {
    CLICK_CHART: 'click-chart',
    HOVER_SHAPE: 'hover-shape',
    LEGEND_TOOLTIP: 'legend-tooltip',
    POINTERMOVE_CHART: 'pointermove-chart',
};

export const getDispatcher = () => {
    return dispatch(...Object.values(EventType));
};
