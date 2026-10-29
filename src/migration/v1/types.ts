import type {FormatNumberOptions} from '../../libs/format-number/types';
import type {
    ChartData,
    ChartInteractionItem,
    ChartXAxis,
    ChartYAxis,
    MeaningfulAny,
} from '../../types';

export interface FormatNumberOptionsV1 extends FormatNumberOptions {
    unit?: 'auto' | 'k' | 'm' | 'b' | 't' | null;
}

// Keep callbacks and application-owned payloads opaque. Only chart configuration is widened.
type WithV1Options<T> = T extends (...args: never[]) => unknown
    ? T
    : T extends object
      ? {
            [K in keyof T]: K extends 'custom'
                ? T[K]
                : K extends 'numberFormat'
                  ? FormatNumberOptionsV1 | undefined
                  : K extends 'ticks'
                    ? T[K] & {pixelInterval?: number}
                    : K extends 'dataLabels'
                      ? T extends {type: 'bar-x' | 'bar-y'}
                          ? WithV1Options<T[K]> & {inside?: boolean}
                          : WithV1Options<T[K]>
                      : WithV1Options<T[K]>;
        } & (T extends {type: 'number'} ? Pick<FormatNumberOptionsV1, 'unit'> : unknown)
      : T;

interface LegacyAxisOptions {
    maxPadding?: number;
}

/** Input accepted by the v1 adapter, including aliases removed in v2. */
export interface ChartDataV1<
    T = MeaningfulAny,
    TItem extends ChartInteractionItem = ChartInteractionItem,
> extends Omit<WithV1Options<ChartData<T, TItem>>, 'xAxis' | 'yAxis'> {
    xAxis?: WithV1Options<ChartXAxis> & LegacyAxisOptions;
    yAxis?: (WithV1Options<ChartYAxis> & LegacyAxisOptions)[];
}

/** Structured, localizable diagnostic. Paths address the input, including array indices. */
export interface MigrationV1Warning {
    code: string;
    path: (string | number)[];
    message: string;
    /** Automatic rules are applied by migrateChartDataV1; review rules leave the option intact. */
    resolution: 'automatic' | 'review';
    replacement?: string;
}

export interface MigrationV1Result<
    T = MeaningfulAny,
    TItem extends ChartInteractionItem = ChartInteractionItem,
> {
    data: ChartData<T, TItem>;
    warnings: MigrationV1Warning[];
}
