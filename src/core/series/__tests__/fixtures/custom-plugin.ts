import type {SeriesShapeData} from '../../../shapes/types';
import {filterPoints} from '../../../zoom/filter-data';
import type {SeriesPlugin, SeriesPluginData} from '../../plugin';

export interface Sample {
    at: number;
    amount: number;
    caption: string;
}

export interface SampleSeries {
    type: 'sample';
    data: Sample[];
}

interface PreparedSampleSeries extends SampleSeries {
    id: string;
    name: string;
    color: string;
}

interface SampleShape extends SeriesShapeData {
    series: PreparedSampleSeries;
    samples: SampleLookup[];
}

interface SampleLookup {
    series: PreparedSampleSeries;
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

/** A complete contract fixture with no built-in series, prepared types, or payloads. */
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
    prepareSeries: ({series, colorScale}) =>
        series.map((s, index) => ({
            ...s,
            id: `sample-${index}`,
            name: 'Samples',
            color: colorScale('Samples'),
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
                    series: s,
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
        for (const shape of preparedData) {
            for (const lookup of shape.samples) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', String(lookup.x));
                circle.setAttribute('cy', String(lookup.y));
                circle.setAttribute('r', '1');
                plot.append(circle);
            }
        }
        return () => plot.replaceChildren();
    },
    interaction: {
        prepareNearestData: ({data}) =>
            data.map((p) => ({position: [p.x, p.y], item: {series: p.series, point: p.sample}})),
        getTargetElements: ({plot, preparedData}) =>
            preparedData.flatMap((shape) =>
                shape.samples.flatMap((lookup, index) => {
                    const element = plot.querySelectorAll('circle')[index];
                    return element
                        ? [{element, item: {series: lookup.series, point: lookup.sample}}]
                        : [];
                }),
            ),
        getClosestItem: ({series, data}) => ({series, point: data}),
    },
    tooltip: {
        prepareData: ({data}) => ({
            chunks: data.map((lookup) => ({
                series: lookup.series,
                data: lookup.sample,
                caption: lookup.sample.caption,
            })),
            xLookupPoints: data.map((lookup) => ({
                series: lookup.series,
                data: lookup.sample,
                x: lookup.x,
                y0: lookup.y,
                y1: lookup.y,
            })),
        }),
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
    return {renderData, tooltipData};
}
