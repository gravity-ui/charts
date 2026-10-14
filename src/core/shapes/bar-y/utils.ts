import {getRectBorderPath, getRectPath} from '../../shapes/utils';

import type {PreparedBarYData} from './types';

export function getBarYRect(
    d: Pick<PreparedBarYData, 'x' | 'y' | 'width' | 'height' | 'isLastStackItem'> & {
        series: Pick<PreparedBarYData['series'], 'borderRadius'>;
    },
) {
    const radius = d.isLastStackItem ? Math.min(d.height, d.width / 2, d.series.borderRadius) : 0;
    return {x: d.x, y: d.y, width: d.width, height: d.height, borderRadius: [0, radius, radius, 0]};
}

export function getAdjustedRectPath(d: PreparedBarYData) {
    const rect = getBarYRect(d);
    const borderRadius = rect.borderRadius[1];

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
    return getRectBorderPath({...getBarYRect(d), borderWidth: d.borderWidth});
}

export function getBarYOuterRect(d: Parameters<typeof getBarYRect>[0] & {borderWidth: number}) {
    const rect = getBarYRect(d);
    const halfBorder = d.borderWidth / 2;
    return {
        x: rect.x - halfBorder,
        y: rect.y - halfBorder,
        width: rect.width + d.borderWidth,
        height: rect.height + d.borderWidth,
        borderRadius: rect.borderRadius.map((radius) => (radius ? radius + halfBorder : 0)),
    };
}
