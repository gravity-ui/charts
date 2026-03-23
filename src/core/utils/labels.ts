import sortBy from 'lodash/sortBy';

import type {HtmlItem, LabelData} from '../../types';

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

export function getOverlappingByX(
    rect1: LabelData | HtmlItem,
    rect2: LabelData | HtmlItem,
    gap = 0,
) {
    const left1 = 'textAnchor' in rect1 ? getLeftPosition(rect1) : rect1.x;
    const right1 = left1 + rect1.size.width;
    const left2 = 'textAnchor' in rect2 ? getLeftPosition(rect2) : rect2.x;
    const right2 = left2 + rect2.size.width;

    return Math.max(0, Math.min(right1, right2) - Math.max(left1, left2) + gap);
}

export function getOverlappingByY(
    rect1: LabelData | HtmlItem,
    rect2: LabelData | HtmlItem,
    gap = 0,
) {
    const top1 = rect1.y - rect1.size.height;
    const bottom1 = rect1.y;
    const top2 = rect2.y - rect2.size.height;
    const bottom2 = rect2.y;

    return Math.max(0, Math.min(bottom1, bottom2) - Math.max(top1, top2) + gap);
}

export function isLabelsOverlapping<T extends LabelData | HtmlItem>(
    label1: T,
    label2: T,
    padding = 0,
) {
    return Boolean(
        getOverlappingByX(label1, label2, padding) && getOverlappingByY(label1, label2, padding),
    );
}

export function filterOverlappingLabels<T extends LabelData | HtmlItem>(labels: T[]) {
    const result: T[] = [];
    const sorted = sortBy(
        labels,
        (d) => d.y,
        (d) => ('textAnchor' in d ? getLeftPosition(d) : d.x),
    );
    sorted.forEach((label) => {
        if (!result.some((l) => isLabelsOverlapping(label, l))) {
            result.push(label);
        }
    });

    return result;
}

export function getSvgLabelConstraintedPosition(args: {
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

    if (y - height < 0) {
        resultY = 0;
    }

    if (y > boundsHeight) {
        resultY = boundsHeight;
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
