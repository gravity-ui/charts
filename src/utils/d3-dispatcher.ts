import {dispatch} from 'd3';

export const EventType = {
    CLICK_CHART: 'click-chart',
    HOVER_SHAPE: 'hover-shape',
    POINTERMOVE_CHART: 'pointermove-chart',
};

export const getD3Dispatcher = () => {
    return dispatch(EventType.CLICK_CHART, EventType.HOVER_SHAPE, EventType.POINTERMOVE_CHART);
};
