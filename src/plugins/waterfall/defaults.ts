import type {ChartSeriesOptions} from '~core/types';

export const waterfallDefaults = {
    barMaxWidth: 50,
    barPadding: 0.2,
    states: {
        hover: {
            enabled: true,
            brightness: 0.3,
        },
        inactive: {
            enabled: false,
            opacity: 0.5,
        },
    },
} satisfies NonNullable<ChartSeriesOptions['waterfall']>;
