import {getRectBorderPath, getRectPath} from '../../shapes/utils';

import type {PreparedBarYData} from './types';

function getBarYRadius(d: PreparedBarYData) {
    return d.isLastStackItem ? Math.min(d.height, d.width / 2, d.series.borderRadius) : 0;
}

export function getBarYRect(d: PreparedBarYData) {
    const radius = getBarYRadius(d);
    const halfBorder = d.borderWidth / 2;
    const outerRadius = radius ? radius + halfBorder : 0;
    return {
        x: d.x - halfBorder,
        y: d.y - halfBorder,
        width: d.width + d.borderWidth,
        height: d.height + d.borderWidth,
        borderRadius: [0, outerRadius, outerRadius, 0],
    };
}

export function getAdjustedRectPath(d: PreparedBarYData) {
    const borderRadius = getBarYRadius(d);

    // Fill should match the inner border dimensions to prevent color bleeding
    const halfBorder = d.borderWidth / 2;
    const innerBorderRadius = Math.max(borderRadius - halfBorder, 0);

    // Adjust fill position and size based on border width
    let fillX = d.x;
    let fillY = d.y;
    let fillWidth = d.width;
    let fillHeight = d.height;
    let fillBorderRadiusRight = borderRadius;

    if (d.borderWidth > 0) {
        // Inset fill by halfBorder on all sides
        fillX = d.x + halfBorder;
        fillY = d.y + halfBorder;
        fillWidth = d.width - d.borderWidth;
        fillHeight = d.height - d.borderWidth;
        fillBorderRadiusRight = innerBorderRadius;
    }

    const p = getRectPath({
        x: fillX,
        y: fillY,
        width: fillWidth,
        height: fillHeight,
        borderRadius: [0, fillBorderRadiusRight, fillBorderRadiusRight, 0],
    });

    return p.toString();
}

export function getAdjustedRectBorderPath(d: PreparedBarYData) {
    const borderRadius = getBarYRadius(d);

    return getRectBorderPath({
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
        borderWidth: d.borderWidth,
        borderRadius: [0, borderRadius, borderRadius, 0],
    });
}
