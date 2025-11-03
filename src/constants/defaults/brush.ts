import type {ChartBrush, DeepRequired} from '../../types';

const DEFAULT_BORDER_COLOR = 'rgb(153, 153, 153)';

export const brushDefaults: DeepRequired<ChartBrush> = {
    borderColor: DEFAULT_BORDER_COLOR,
    borderWidth: 1,
    handles: {
        borderColor: DEFAULT_BORDER_COLOR,
        borderWidth: 1,
        enabled: true,
        height: 15,
        width: 8,
    },
    style: {
        fillOpacity: 1,
    },
};
