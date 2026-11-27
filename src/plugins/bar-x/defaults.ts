import type {ChartSeriesOptions} from '~core/types';

export const barXDefaults = {
    barMaxWidth: 50,
    barPadding: 0.2,
    groupPadding: 0.1,
    stackGap: 1,
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
} satisfies NonNullable<ChartSeriesOptions['bar-x']>;
