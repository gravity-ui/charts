import {calculateCos, calculateSin} from '../math';
import {getTextWithElipsis} from '../text';
import type {getTextSizeFn} from '../text';

interface XAxisLabelGeometry {
    title?: string;
    content: {
        text: string;
        x: number;
        y: number;
        size: XAxisLabelGeometry['size'];
    }[];
    size: {
        width: number;
        height: number;
        hangingOffset: number;
        inkBounds?: {x: number; width: number};
    };
    x: number;
    y: number;
    angle: number;
}

export async function getXAxisLabelGeometry({
    getTextSize,
    text,
    rotation,
    labelHeight,
    labelMargin,
    top = 0,
    left,
    labelMaxWidth,
    axisWidth,
    leftOverflow,
    rightOverflow,
}: {
    getTextSize: ReturnType<typeof getTextSizeFn>;
    text: string;
    rotation: number;
    labelHeight: number;
    labelMargin: number;
    top?: number;
    left: number;
    labelMaxWidth: number;
    axisWidth: number;
    leftOverflow: number;
    rightOverflow: number;
}): Promise<XAxisLabelGeometry> {
    let rowText = text;
    let textSize = await getTextSize(text);
    const a = (360 + rotation) % 90;

    let textMaxWidth = Infinity;
    if (a === 0) {
        textMaxWidth = Math.min(
            labelMaxWidth,
            labelMaxWidth / 2 + axisWidth + rightOverflow - left,
            left + leftOverflow + labelMaxWidth / 2,
        );
    } else if (rotation > 0) {
        textMaxWidth = Math.min(
            labelHeight / calculateSin(a) - textSize.height * calculateSin(90 - a),
            (axisWidth - left) / calculateSin(a),
        );
    } else {
        textMaxWidth = Math.min(
            labelHeight / calculateSin(a) - textSize.height * calculateSin(90 - a),
            (leftOverflow + left) / calculateSin(a) - textSize.height / 2,
        );
    }

    if (textSize.width > textMaxWidth) {
        rowText = await getTextWithElipsis({
            text: rowText,
            getTextWidth: async (str) => (await getTextSize(str)).width,
            maxWidth: textMaxWidth,
        });
        textSize = await getTextSize(rowText);
    }

    const actualTextWidth = a
        ? textSize.width * calculateSin(90 - a) + textSize.height * calculateSin(a)
        : textSize.width;
    let x = 0;
    if (rotation === 0) {
        x = Math.min(left - actualTextWidth / 2, axisWidth - actualTextWidth);
    } else if (rotation < 0) {
        const xOffset = (textSize.width * calculateSin(90 - a)) / 2;
        x = left - actualTextWidth / 2 - xOffset;
        x = Math.min(x, axisWidth - actualTextWidth);
    } else {
        const xOffset = (textSize.width * calculateSin(90 - a)) / 2;
        x = left + actualTextWidth / 2 - xOffset;
    }
    const yOffset = rotation <= 0 ? textSize.width * calculateSin(a) : 0;
    const hOffset = textSize.hangingOffset;
    const y = top + yOffset + labelMargin + hOffset * calculateCos(rotation);
    x -= hOffset * calculateSin(rotation);

    return {
        title: rowText === text ? undefined : text,
        content: [{text: rowText, x: 0, y: 0, size: textSize}],
        size: textSize,
        x: Math.max(-leftOverflow, x),
        y,
        angle: rotation,
    };
}
