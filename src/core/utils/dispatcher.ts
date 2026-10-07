import {dispatch} from 'd3-dispatch';

export const EventType = {
    CLICK_CHART: 'click-chart',
    PLOTCLICK_CHART: 'plotclick-chart',
    HOVER_SHAPE: 'hover-shape',
    POINTERMOVE_CHART: 'pointermove-chart',
};

export const getDispatcher = () => {
    return dispatch(
        EventType.CLICK_CHART,
        EventType.PLOTCLICK_CHART,
        EventType.HOVER_SHAPE,
        EventType.POINTERMOVE_CHART,
    );
};
