import sortBy from 'lodash/sortBy';

import type {LabelData, SeriesDataWithLabels, ShapeDataWithLabels} from '../../types';
import type {LabelRect} from '../shapes/types';

function isSvgLabel(rect: LabelRect): rect is LabelData {
    return 'textAnchor' in rect;
}

function getOverlapLeft(rect: LabelRect): number {
    if (!isSvgLabel(rect)) {
        return rect.x;
    }
    return getLeftPosition(rect);
}

export function getLeftPosition(label: LabelData) {
    switch (label.textAnchor) {
        case 'start': {
            return label.x;
        }
        case 'middle': {
            return label.x - label.size.width / 2;
        }
        case 'end': {
            return label.x - label.size.width;
        }
        default: {
            return label.x;
        }
    }
}

/** Normalize SVG and HTML labels to visible bounds with a top-left origin. */
export function getLabelRect(label: LabelRect): LabelRect {
    if (!isSvgLabel(label)) return label;
    return {
        x: getLeftPosition(label),
        y: label.y - (label.size.hangingOffset ?? 0),
        size: label.size,
    };
}

export function getLayerLabelRects(layers: Partial<ShapeDataWithLabels>[]): LabelRect[] {
    return layers.flatMap((layer) => [
        ...(layer.svgLabels ?? []).map(getLabelRect),
        ...(layer.htmlLabels ?? []),
    ]);
}

export function getOverlappingByX(rect1: LabelRect, rect2: LabelRect, gap = 0) {
    const left1 = getOverlapLeft(rect1);
    const right1 = left1 + rect1.size.width;
    const left2 = getOverlapLeft(rect2);
    const right2 = left2 + rect2.size.width;

    return Math.max(0, Math.min(right1, right2) - Math.max(left1, left2) + gap);
}

export function getOverlappingByY(rect1: LabelRect, rect2: LabelRect, gap = 0) {
    const isRect1Bounds = !isSvgLabel(rect1);
    const top1 = isRect1Bounds ? rect1.y : rect1.y - rect1.size.height;
    const bottom1 = isRect1Bounds ? rect1.y + rect1.size.height : rect1.y;

    const isRect2Bounds = !isSvgLabel(rect2);
    const top2 = isRect2Bounds ? rect2.y : rect2.y - rect2.size.height;
    const bottom2 = isRect2Bounds ? rect2.y + rect2.size.height : rect2.y;

    return Math.max(0, Math.min(bottom1, bottom2) - Math.max(top1, top2) + gap);
}

export function isLabelsOverlapping(label1: LabelRect, label2: LabelRect, padding = 0) {
    return Boolean(
        getOverlappingByX(label1, label2, padding) && getOverlappingByY(label1, label2, padding),
    );
}

export function filterOverlappingLabels<T extends LabelRect>(labels: T[], obstacles?: LabelRect[]) {
    const result: T[] = [];
    const sorted = sortBy(
        labels,
        (d) => d.y,
        (d) => getOverlapLeft(d),
    );
    sorted.forEach((label) => {
        if (
            !obstacles?.some((l) => isLabelsOverlapping(label, l)) &&
            !result.some((l) => isLabelsOverlapping(label, l))
        ) {
            result.push(label);
        }
    });

    return result;
}

export function filterLayerLabels<T extends SeriesDataWithLabels>(
    data: T[],
    otherLayers: ShapeDataWithLabels[],
): T[] {
    const otherLabels = getLayerLabelRects(otherLayers);
    const keptLabels: LabelRect[] = [];

    return data.map((d) => {
        let svgLabels = d.svgLabels;
        let htmlLabels = d.htmlLabels;
        if (!d.series.dataLabels.allowOverlap) {
            const obstacles = [...otherLabels, ...keptLabels];
            svgLabels = filterOverlappingLabels(
                svgLabels.map((label) => ({...getLabelRect(label), label})),
                obstacles,
            ).map(({label}) => label);
            htmlLabels = filterOverlappingLabels(htmlLabels, [
                ...obstacles,
                ...svgLabels.map(getLabelRect),
            ]);
        }
        keptLabels.push(...svgLabels.map(getLabelRect), ...htmlLabels);
        return {...d, svgLabels, htmlLabels};
    });
}

export function getSvgLabelConstraintedPosition(args: {
    boundsHeight: number;
    boundsWidth: number;
    height: number;
    width: number;
    x: number;
    y: number;
    hangingOffset: number;
}) {
    const {boundsHeight, boundsWidth, height, width, x, y, hangingOffset} = args;
    let resultX = x;
    let resultY = y - height / 2 + hangingOffset;

    if (x < 0) {
        resultX = 0;
    }

    if (x + width > boundsWidth) {
        resultX = boundsWidth - width;
    }

    if (resultY < 0) {
        resultY = 0;
    }

    if (resultY + height > boundsHeight) {
        resultY = boundsHeight - height + hangingOffset;
    }

    return {x: resultX, y: resultY};
}

export function getHtmlLabelConstraintedPosition(args: {
    boundsHeight: number;
    boundsWidth: number;
    height: number;
    width: number;
    x: number;
    y: number;
}) {
    const {boundsHeight, boundsWidth, height, width, x, y} = args;
    let resultX = x;
    let resultY = y;

    if (x < 0) {
        resultX = 0;
    }

    if (x + width > boundsWidth) {
        resultX = boundsWidth - width;
    }

    if (y < 0) {
        resultY = 0;
    }

    if (y + height > boundsHeight) {
        resultY = boundsHeight - height;
    }

    return {x: resultX, y: resultY};
}
