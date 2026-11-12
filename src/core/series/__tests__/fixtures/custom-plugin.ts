import {select} from 'd3-selection';

import type {SeriesShapeData} from '../../../shapes/types';
import type {BaseSeries, BaseSeriesLegend} from '../../../types';
import {getInteractionElements} from '../../../utils/chart-interaction';
import {filterPoints} from '../../../zoom/filter-data';
import type {SeriesPlugin, SeriesPluginData} from '../../plugin';
import {prepareSeriesMetadata} from '../../prepare-series-metadata';
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

interface SampleShape extends SeriesShapeData {
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

interface SampleInteraction {
    series: PreparedSampleSeries;
    point: Sample;
}

interface SampleOptions {
    sample?: {offset?: number};
}

interface SamplePluginData extends SeriesPluginData<'sample'> {
    prepared: PreparedSampleSeries;
    shape: SampleShape;
    tooltipItem: SampleLookup;
    interaction: SampleInteraction;
    options: SampleOptions;
    preparedOptions: SampleOptions;
    allRaw: SampleSeries;
    allPrepared: PreparedSampleSeries;
}

interface SampleFormatContext {
    value: unknown;
    caption: string;
}

/** Contract fixture using common metadata and otherwise independent plugin-owned data. */
export const samplePlugin: SeriesPlugin<
    SampleSeries,
    SampleChunk,
    SampleFormatContext,
    SamplePluginData
> = {
    type: 'sample',
    defaults: {offset: 4},
    axes: {
        x: {getData: ({series}) => ({values: series.flatMap((s) => s.data.map((p) => p.at))})},
        y: {getData: ({series}) => ({values: series.flatMap((s) => s.data.map((p) => p.amount))})},
    },
    getLayerKey: ({series, seriesKey}) => `${series.type}:${seriesKey}`,
    getClipPath: () => 'bounds',
    zoom: {
        types: ['x', 'xy'],
        filterData: ({series, viewport}) =>
            filterPoints(series.data, viewport, {getX: (p) => p.at, getY: (p) => p.amount}),
    },
    validate: ({series, allSeries}) => {
        if (!allSeries.includes(series) || series.data.some((p) => !Number.isFinite(p.amount))) {
            throw new Error('Invalid sample data');
        }
    },
    prepareSeries: ({series, colorScale, legend}) =>
        series.map((s) => ({
            ...prepareSeriesMetadata({
                series: {...s, name: s.name ?? 'Samples'},
                color: colorScale(s.name ?? 'Samples'),
                legend,
            }),
            type: s.type,
            data: s.data,
        })),
    axisPadding: {
        getXDomainReserve: (series) => series.data.length,
        getPaintExtents: ({series, xScale, yScale}) => {
            const y = yScale[0];
            if (!('invert' in xScale) || !y || !('invert' in y)) return [];
            return series.flatMap((s) =>
                s.data.map((p) => ({
                    x: xScale(p.at),
                    y: y(p.amount),
                    yAxis: 0,
                    left: 1,
                    right: 1,
                    top: 1,
                    bottom: 1,
                })),
            );
        },
    },
    getColorValue: (point) => point.amount,
    prepareShapeData: ({series, seriesOptions, allSeries = series}) => {
        const offset = seriesOptions.sample?.offset ?? 0;
        const shapes = series.map(
            (s): SampleShape => ({
                series: s,
                samples: s.data.map((sample) => ({
                    sample,
                    owner: s,
                    x: sample.at + offset,
                    y: sample.amount,
                })),
                htmlLabels: [],
                markers: [],
                annotations: [],
                getHoverMarkers: () => [],
            }),
        );
        // The mixed-layer context also retains the plugin's declared prepared type.
        return {
            renderData: shapes,
            tooltipItems: allSeries.length ? shapes.flatMap((s) => s.samples) : [],
        };
    },
    prepareGradientGeometry: ({series}) =>
        series.map((s) => ({id: s.id, points: [], strokeBBox: null})),
    renderShapes: ({plot, preparedData}) => {
        select(plot)
            .selectAll<SVGCircleElement, SampleLookup>('circle')
            .data(preparedData.flatMap((shape) => shape.samples))
            .join('circle')
            .attr('cx', (lookup) => lookup.x)
            .attr('cy', (lookup) => lookup.y)
            .attr('r', 1);
        return () => plot.replaceChildren();
    },
    interaction: {
        prepareNearestData: ({data}) =>
            data.map((p) => ({position: [p.x, p.y], item: {series: p.owner, point: p.sample}})),
        getTargetElements: ({plot}) =>
            getInteractionElements<SampleLookup, SampleInteraction>(plot, 'circle', (lookup) => ({
                series: lookup.owner,
                point: lookup.sample,
            })),
        getClosestItem: ({series, data}) => ({series, point: data}),
    },
    tooltip: {
        prepareData: ({data, position, measureDistance}) => {
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
};

// These compile-time checks must fail if a hook loses its associated payload type.
export function checkAssociatedTypes(shape: SampleShape, lookup: SampleLookup) {
    // @ts-expect-error Lookup items belong to tooltip preparation, not render-layer data.
    const renderData: Parameters<typeof samplePlugin.renderShapes>[0]['preparedData'] = [lookup];
    // @ts-expect-error A render-layer item cannot replace a tooltip lookup item.
    const tooltipData: Parameters<typeof samplePlugin.tooltip.prepareData>[0]['data'] = [shape];
    // @ts-expect-error Core requires metadata even for a plugin without a visible legend.
    const prepared: SeriesPluginData<'sample'>['prepared'] = {type: 'sample'};
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
    return {renderData, tooltipData, prepared, tooltipResult, missingContext};
}
