import type {BaseTextStyle, Halo} from '../../types';
import type {PointMarkerOptions} from '../../types/chart/marker';

export const DEFAULT_LEGEND_SYMBOL_SIZE = 8;

export const DEFAULT_LEGEND_SYMBOL_PADDING = 5;

export const DEFAULT_DATALABELS_PADDING = 5;

export const DEFAULT_DATALABELS_STYLE: BaseTextStyle = {
    fontSize: '11px',
    fontWeight: 'bold',
    fontColor: 'var(--gcharts-data-labels)',
};

export const DEFAULT_HALO_OPTIONS: Required<Halo> = {
    enabled: true,
    opacity: 0.25,
    size: 6,
};

export const DEFAULT_POINT_MARKER_OPTIONS: Omit<Required<PointMarkerOptions>, 'enabled'> = {
    radius: 4,
    borderColor: '',
    borderWidth: 0,
    symbol: 'circle',
};
