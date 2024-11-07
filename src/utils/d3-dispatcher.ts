import {dispatch} from 'd3';

export const getD3Dispatcher = () => {
    return dispatch('hover-shape', 'click-chart');
};
