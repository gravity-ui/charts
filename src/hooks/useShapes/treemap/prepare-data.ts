import {
    stratify,
    treemap,
    treemapBinary,
    treemapDice,
    treemapSlice,
    treemapSliceDice,
    treemapSquarify,
} from 'd3';
import type {HierarchyRectangularNode} from 'd3';

import {LayoutAlgorithm} from '../../../constants';
import type {HtmlItem, TreemapSeriesData} from '../../../types';
import {getLabelsSize} from '../../../utils';
import type {PreparedTreemapSeries} from '../../useSeries/types';

import type {PreparedTreemapData, TreemapLabelData} from './types';

const DEFAULT_PADDING = 1;

type LabelItem = HtmlItem | TreemapLabelData;

function getLabels(args: {
    data: HierarchyRectangularNode<TreemapSeriesData>[];
    html: boolean;
    padding: number;
    align: PreparedTreemapSeries['dataLabels']['align'];
}) {
    const {data, html, padding, align} = args;

    return data.reduce<LabelItem[]>((acc, d) => {
        const texts = Array.isArray(d.data.name) ? d.data.name : [d.data.name];

        texts.forEach((text, index) => {
            const {maxHeight: lineHeight, maxWidth: labelWidth} =
                getLabelsSize({labels: [text], html}) ?? {};
            const left = d.x0 + padding;
            const right = d.x1 - padding;
            const width = Math.max(0, right - left);
            let x = left;
            const y = index * lineHeight + d.y0 + padding;

            switch (align) {
                case 'left': {
                    x = left;
                    break;
                }
                case 'center': {
                    x = Math.max(left, left + (width - labelWidth) / 2);
                    break;
                }
                case 'right': {
                    x = Math.max(left, right - labelWidth);
                    break;
                }
            }

            const item: LabelItem = html
                ? {
                      content: text,
                      x,
                      y,
                      size: {width, height: lineHeight},
                  }
                : {
                      text,
                      x,
                      y,
                      width,
                      nodeData: d.data,
                  };

            acc.push(item);
        });

        return acc;
    }, []);
}

export function prepareTreemapData(args: {
    series: PreparedTreemapSeries;
    width: number;
    height: number;
}): PreparedTreemapData {
    const {series, width, height} = args;
    const dataWithRootNode = getSeriesDataWithRootNode(series);
    const hierarchy = stratify<TreemapSeriesData>()
        .id((d) => {
            if (d.id) {
                return d.id;
            }

            return Array.isArray(d.name) ? d.name.join() : d.name;
        })
        .parentId((d) => d.parentId)(dataWithRootNode)
        .sum((d) => d.value || 0);
    const treemapInstance = treemap<TreemapSeriesData>();

    switch (series.layoutAlgorithm) {
        case LayoutAlgorithm.Binary: {
            treemapInstance.tile(treemapBinary);
            break;
        }
        case LayoutAlgorithm.Dice: {
            treemapInstance.tile(treemapDice);
            break;
        }
        case LayoutAlgorithm.Slice: {
            treemapInstance.tile(treemapSlice);
            break;
        }
        case LayoutAlgorithm.SliceDice: {
            treemapInstance.tile(treemapSliceDice);
            break;
        }
        case LayoutAlgorithm.Squarify: {
            treemapInstance.tile(treemapSquarify);
            break;
        }
    }

    const root = treemapInstance.size([width, height]).paddingInner((d) => {
        const levelOptions = series.levels?.find((l) => l.index === d.depth + 1);
        return levelOptions?.padding ?? DEFAULT_PADDING;
    })(hierarchy);
    const leaves = root.leaves();
    let labelData: TreemapLabelData[] = [];
    const htmlElements: HtmlItem[] = [];

    if (series.dataLabels?.enabled) {
        const {html, padding, align} = series.dataLabels;
        const labels = getLabels({html, padding, align, data: leaves});
        if (html) {
            htmlElements.push(...(labels as HtmlItem[]));
        } else {
            labelData = labels as TreemapLabelData[];
        }
    }

    return {labelData, leaves, series, htmlElements};
}

function getSeriesDataWithRootNode(series: PreparedTreemapSeries) {
    return series.data.reduce<TreemapSeriesData[]>(
        (acc, d) => {
            const dataChunk = Object.assign({}, d);

            if (!dataChunk.parentId) {
                dataChunk.parentId = series.id;
            }

            acc.push(dataChunk);

            return acc;
        },
        [{name: series.name, id: series.id}],
    );
}
