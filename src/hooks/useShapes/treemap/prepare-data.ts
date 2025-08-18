import {
    ascending,
    descending,
    sort,
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
import {getFormattedValue} from '../../../utils/chart/format';
import type {PreparedTreemapSeries} from '../../useSeries/types';

import type {PreparedTreemapData, TreemapLabelData} from './types';

const DEFAULT_PADDING = 1;

type LabelItem = HtmlItem | TreemapLabelData;

function getLabels(args: {
    data: HierarchyRectangularNode<TreemapSeriesData>[];
    options: PreparedTreemapSeries['dataLabels'];
}) {
    const {
        data,
        options: {html, padding, align, style},
    } = args;

    return data.reduce<LabelItem[]>((acc, d) => {
        const texts = Array.isArray(d.data.name) ? d.data.name : [d.data.name];
        const left = d.x0 + padding;
        const right = d.x1 - padding;
        const spaceWidth = Math.max(0, right - left);
        let availableSpaceHeight = Math.max(0, d.y1 - d.y0 - padding);

        let prevLabelsHeight = 0;
        texts.forEach((text) => {
            const label = getFormattedValue({value: text, ...args.options});
            const {maxHeight: labelMaxHeight, maxWidth: labelMaxWidth} =
                getLabelsSize({
                    labels: [label],
                    style: {
                        ...style,
                        maxWidth: `${spaceWidth}px`,
                        maxHeight: `${availableSpaceHeight}px`,
                    },
                    html,
                }) ?? {};

            let x = left;
            const y = prevLabelsHeight + d.y0 + padding;
            const labelWidth = Math.min(labelMaxWidth, spaceWidth);
            const labelHeight = Math.min(labelMaxHeight, availableSpaceHeight);

            if (!labelWidth || y > d.y1) {
                return;
            }

            switch (align) {
                case 'left': {
                    x = left;
                    break;
                }
                case 'center': {
                    x = Math.max(left, left + (spaceWidth - labelMaxWidth) / 2);
                    break;
                }
                case 'right': {
                    x = Math.max(left, right - labelMaxWidth);
                    break;
                }
            }

            const bottom = y + labelMaxHeight;
            if (!html && bottom > d.y1) {
                return;
            }

            const item: LabelItem = html
                ? {
                      content: label,
                      x,
                      y,
                      size: {width: labelWidth, height: labelHeight},
                  }
                : {
                      text: label,
                      x,
                      y,
                      width: labelWidth,
                      nodeData: d.data,
                  };

            acc.push(item);
            prevLabelsHeight += labelHeight;
            availableSpaceHeight = Math.max(0, availableSpaceHeight - labelHeight);
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

    const parentNodeValues: Record<string, number> = {};
    let dataWithRootNode = series.data.reduce<TreemapSeriesData[]>(
        (acc, d) => {
            const dataChunk = Object.assign({}, d);

            if (!dataChunk.parentId) {
                dataChunk.parentId = series.id;
            }

            if (dataChunk.parentId) {
                parentNodeValues[dataChunk.parentId] =
                    (parentNodeValues[dataChunk.parentId] ?? 0) + (dataChunk.value ?? 0);
            }

            acc.push(dataChunk);

            return acc;
        },
        [{name: series.name, id: series.id}],
    );

    if (series.sorting.enabled) {
        const getSortingValue = (d: TreemapSeriesData) => d.value ?? parentNodeValues[d.id ?? ''];
        const comparator = series.sorting.direction === 'desc' ? descending : ascending;
        dataWithRootNode = sort(dataWithRootNode, (a, b) =>
            comparator(getSortingValue(a), getSortingValue(b)),
        );
    }

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
        const {html, style: dataLabelsStyle} = series.dataLabels;
        const labels = getLabels({data: leaves, options: series.dataLabels});
        if (html) {
            const htmlItems = labels.map(
                (l) =>
                    ({
                        style: {
                            ...dataLabelsStyle,
                            maxWidth: (l as HtmlItem).size.width,
                            maxHeight: (l as HtmlItem).size.height,
                            overflow: 'hidden',
                        },
                        ...l,
                    }) as HtmlItem,
            );
            htmlElements.push(...htmlItems);
        } else {
            labelData = labels as TreemapLabelData[];
        }
    }

    return {labelData, leaves, series, htmlElements};
}
