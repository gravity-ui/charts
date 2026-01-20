import type {ChartData} from '../../types';

export type ChartInnerProps = {
    width: number;
    height: number;
    data: ChartData;
    onReady?: (args: {dimensions: {width: number; height: number}}) => void;
};
