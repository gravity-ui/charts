import {select} from 'd3-selection';

import {CHART_ERROR_CODE, ChartError} from '../../../../libs';
import type {BaseSeries, BaseSeriesLegend, ChartInteractionItem} from '../../../types';
import {getInteractionElements} from '../../../utils/chart-interaction';
import type {GetTooltipDataResult} from '../../../utils/tooltip-helpers';
import type {
    PrepareLayerArgs,
    SeriesPlugin,
    SeriesPluginInteraction,
    SeriesPluginTypes,
} from '../../plugin';
import {prepareSeriesMetadata} from '../../prepare-series-metadata';
import {registerSeriesPlugin} from '../../seriesRegistry';
import type {BasePreparedSeries} from '../../types';

export interface Sample {
    at: number;
    amount: number;
    caption: string;
}

export interface SampleSeries extends BaseSeries {
    type: 'sample';
    data: Sample[];
    id?: string;
    name?: string;
    legend?: BaseSeriesLegend;
}

interface PreparedSampleSeries extends BasePreparedSeries {
    type: 'sample';
    data: Sample[];
}

interface SampleShape {
    series: PreparedSampleSeries;
    samples: SampleLookup[];
}

interface SampleLookup {
    owner: PreparedSampleSeries;
    sample: Sample;
    x: number;
    y: number;
}

interface SampleChunk {
    series: PreparedSampleSeries;
    data: Sample;
    caption: string;
}

interface SampleTypes extends SeriesPluginTypes {
    raw: SampleSeries;
    prepared: PreparedSampleSeries;
    shape: SampleShape;
    options: {sample?: {offset?: number}};
}

interface SamplePluginTypes extends SampleTypes {
    lookupItem: SampleLookup;
    tooltipChunk: SampleChunk;
    formatContext: {value: unknown; caption: string};
}

/** Contract fixture using common metadata and otherwise independent plugin-owned data. */
export const sampleShapesPlugin = {
    type: 'sample',
    series: {
        optionsDefaults: {offset: 4},
        prepare: ({series, colorScale, legend}) =>
            series.map((s) => ({
                ...prepareSeriesMetadata({
                    series: {...s, name: s.name ?? 'Samples'},
                    color: colorScale(s.name ?? 'Samples'),
                    legend,
                }),
                type: s.type,
                data: s.data,
            })),
    },
    layers: {
        prepareData: ({series, seriesOptions}) => {
            const offset = seriesOptions.sample?.offset ?? 0;
            return {
                renderData: series.map((s) => ({
                    series: s,
                    samples: s.data.map((sample) => ({
                        sample,
                        owner: s,
                        x: sample.at + offset,
                        y: sample.amount,
                    })),
                })),
            };
        },
        render: ({plot, renderData}) => {
            select(plot)
                .selectAll<SVGCircleElement, SampleLookup>('circle')
                .data(renderData.flatMap((shape) => shape.samples))
                .join('circle')
                .attr('cx', (lookup) => lookup.x)
                .attr('cy', (lookup) => lookup.y)
                .attr('r', 1)
                .attr('fill', (lookup) => lookup.owner.color);
            return () => plot.replaceChildren();
        },
    },
} satisfies SeriesPlugin<SampleTypes>;

export const samplePlugin = {
    ...sampleShapesPlugin,
    series: {
        ...sampleShapesPlugin.series,
        validate: ({series}) => {
            if (
                series.data.some(
                    (sample) => !Number.isFinite(sample.at) || !Number.isFinite(sample.amount),
                )
            ) {
                throw new ChartError({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: 'Sample positions must be finite',
                });
            }
        },
    },
    layers: {
        ...sampleShapesPlugin.layers,
        getKey: ({seriesKey}) => seriesKey,
        prepareData: (args) => {
            const result = sampleShapesPlugin.layers.prepareData(args);
            return {...result, lookupItems: result.renderData.flatMap((shape) => shape.samples)};
        },
    },
    interaction: {
        prepareNearestData: ({data}) =>
            data.map((p) => ({position: [p.x, p.y], item: {series: p.owner, point: p.sample}})),
        getTargetElements: ({plot}) =>
            getInteractionElements(plot, 'circle', (lookup: SampleLookup) => ({
                series: lookup.owner,
                point: lookup.sample,
            })),
        getClosestItem: ({series, data}) => ({series, point: data}),
    },
    tooltip: {
        prepareData: ({data, position, measureDistance}): GetTooltipDataResult<SampleChunk> => {
            let nearest: SampleLookup | undefined;
            let distance = Infinity;
            for (const lookup of data) {
                const current = Math.hypot(lookup.x - position[0], lookup.y - position[1]);
                if (current < distance) {
                    nearest = lookup;
                    distance = current;
                }
            }
            return {
                chunks: nearest
                    ? [
                          {
                              series: nearest.owner,
                              data: nearest.sample,
                              caption: nearest.sample.caption,
                              closest: true,
                              distance: measureDistance ? Math.max(0, distance - 1) : undefined,
                          },
                      ]
                    : [],
            };
        },
        getValue: ({item}) => item.data.amount,
        header: {getValue: ({item}) => item.data.at, axis: 'x'},
        getValueFormatContext: (item) => ({caption: item.caption}),
        rows: (chunk) => [
            {
                id: chunk.caption,
                cells: [
                    {
                        id: 'value',
                        source: ({item}) => item.data.amount,
                        formatValue: ({item}) => item.caption,
                    },
                ],
            },
        ],
    },
} satisfies SeriesPlugin<SamplePluginTypes>;

// These compile-time checks must fail if a hook loses its associated payload type.
export function checkAssociatedTypes(
    shape: SampleShape,
    lookup: SampleLookup,
    args: Parameters<SeriesPlugin<SamplePluginTypes>['layers']['prepareData']>[0],
    defaultArgs: PrepareLayerArgs<PreparedSampleSeries>,
) {
    // @ts-expect-error Lookup items belong to tooltip preparation, not render-layer data.
    const renderData: Parameters<typeof samplePlugin.layers.render>[0]['renderData'] = [lookup];
    // @ts-expect-error A render-layer item cannot replace a tooltip lookup item.
    const tooltipData: Parameters<typeof samplePlugin.tooltip.prepareData>[0]['data'] = [shape];
    // @ts-expect-error Core requires metadata even for a plugin without a visible legend.
    const prepared: SeriesPluginTypes['prepared'] = {type: 'sample'};
    // @ts-expect-error Returning both strategies duplicates the selected sample.
    const tooltipResult: ReturnType<typeof samplePlugin.tooltip.prepareData> = {
        chunks: [],
        xLookupPoints: [],
    };
    type XLookupPoint = NonNullable<
        ReturnType<typeof samplePlugin.tooltip.prepareData>['xLookupPoints']
    >[number];
    const incompletePoint = {
        series: lookup.owner,
        data: lookup.sample,
        x: lookup.x,
        y0: lookup.y,
        y1: lookup.y,
    };
    // @ts-expect-error X lookup points must carry the chunk's formatter context too.
    const missingContext: XLookupPoint = incompletePoint;
    // @ts-expect-error A plugin's options do not expose unrelated built-in namespaces.
    const unrelatedOptions = args.seriesOptions.line;
    // @ts-expect-error Other plugins' prepared data stays opaque without allPrepared.
    const otherData = args.allSeries?.[0].data;
    registerSeriesPlugin({
        ...sampleShapesPlugin,
        series: {
            ...sampleShapesPlugin.series,
            // @ts-expect-error Registration must enforce metadata without a separate satisfies check.
            prepare: () => [{type: 'sample'}],
        },
    });
    registerSeriesPlugin({
        ...sampleShapesPlugin,
        series: {
            ...sampleShapesPlugin.series,
            // @ts-expect-error Registration must not infer any and accept raw series as prepared output.
            prepare: ({series}) => series,
        },
    });
    const invalidChunk: NonNullable<SeriesPluginTypes['tooltipChunk']> = {
        data: lookup.sample,
        // @ts-expect-error Custom chunks must retain the series identity used by core.
        series: {type: 'sample'},
    };
    // @ts-expect-error Standalone hook arguments do not expose built-in option namespaces by default.
    const builtinOptions = defaultArgs.seriesOptions.line;
    const tooltip: NonNullable<
        SeriesPlugin<
            SampleTypes & {
                tooltipChunk: NonNullable<SeriesPluginTypes['tooltipChunk']>;
            }
        >['tooltip']
    > = {
        prepareData: () => ({
            // @ts-expect-error Even a broadly declared chunk must belong to this plugin's raw type.
            chunks: [{data: lookup.sample, series: {...lookup.owner, type: 'line'}}],
        }),
        rows: [],
    };
    // Optional capabilities retain custom series types without joining built-in unions.
    const capabilities = {
        axes: {
            x: {
                getData: ({series}) => ({
                    values: series.flatMap((s) => s.data.map((p) => p.at)),
                }),
            },
            padding: {getXDomainReserve: (series) => series.data[0]?.at ?? 0},
        },
        zoom: {types: ['x'], filterData: ({series}) => ({data: series.data})},
        layers: {
            ...sampleShapesPlugin.layers,
            prepareGradientGeometry: ({series}) =>
                series.map((s) => ({id: s.id, points: [], strokeBBox: null})),
        },
    } satisfies Pick<SeriesPlugin<SamplePluginTypes>, 'axes' | 'zoom' | 'layers'>;
    return {
        renderData,
        tooltipData,
        prepared,
        tooltipResult,
        missingContext,
        unrelatedOptions,
        otherData,
        capabilities,
        invalidChunk,
        builtinOptions,
        tooltip,
    };
}

// Without an explicit type map, interaction results still accept opaque object points.
export function checkDefaultInteractionTypes(item: ChartInteractionItem) {
    const interaction: SeriesPluginInteraction = {
        prepareNearestData: () => [{position: [0, 0], item}],
        getTargetElements: () => [],
        getClosestItem: () => item,
    };
    return interaction;
}
