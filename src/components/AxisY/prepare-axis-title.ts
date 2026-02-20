import type {PreparedAxis} from 'src/hooks';

import {
    calculateCos,
    calculateSin,
    getLabelsSize,
    getTextSizeFn,
    getTextWithElipsis,
} from '../../utils';
import type {TextRowData} from '../types';
import {getMultilineTitleContentRows} from '../utils/axis-title';

import type {HtmlAxisTitleData, SvgAxisTitleData} from './types';

export async function prepareSvgYAxisTitle({
    axis,
    axisTop,
    axisHeight,
    axisWidth,
    axisLabelsWidth,
}: {
    axis: PreparedAxis;
    axisTop: number;
    axisHeight: number;
    axisWidth: number;
    axisLabelsWidth: number;
}): Promise<SvgAxisTitleData | null> {
    if (!axis.title.text || axis.title.html) {
        return null;
    }

    const getTitleTextSize = getTextSizeFn({style: axis.title.style});
    const rotateAngle = axis.title.rotation;
    const sin = Math.abs(calculateSin(rotateAngle));
    const cos = Math.abs(calculateCos(rotateAngle));

    const titleContent: TextRowData[] = [];
    const titleMaxWidth = rotateAngle === 0 ? axis.title.maxWidth : sin * axisHeight;

    if (axis.title.maxRowCount > 1) {
        titleContent.push(...(await getMultilineTitleContentRows({axis, titleMaxWidth})));
    } else {
        const text = await getTextWithElipsis({
            text: axis.title.text,
            maxWidth: titleMaxWidth,
            getTextWidth: async (s) => (await getTitleTextSize(s)).width,
        });
        titleContent.push({
            text,
            x: 0,
            y: 0,
            size: await getTitleTextSize(text),
        });
    }

    const originalTextSize = titleContent.reduce(
        (acc, item) => {
            acc.width = Math.max(acc.width, item.size.width);
            acc.height += item.size.height;
            return acc;
        },
        {width: 0, height: 0},
    );

    const rotatedTitleSize =
        rotateAngle === 0
            ? originalTextSize
            : {
                  width: sin * originalTextSize.height + cos * originalTextSize.width,
                  height: sin * originalTextSize.width + cos * originalTextSize.height,
              };

    const bottom = Math.max(0, calculateSin(rotateAngle) * originalTextSize.width);
    let y = 0;
    switch (axis.title.align) {
        case 'left': {
            y = -bottom + axisHeight;
            break;
        }
        case 'center': {
            y = -bottom + axisHeight / 2 + rotatedTitleSize.height / 2;
            break;
        }
        case 'right': {
            y = -bottom + rotatedTitleSize.height;
            break;
        }
    }

    const left =
        rotateAngle === 0
            ? Math.min(originalTextSize.width, axis.title.maxWidth)
            : Math.min(0, calculateCos(rotateAngle) * originalTextSize.width);
    const x =
        axis.position === 'left'
            ? -left - axisLabelsWidth - axis.labels.margin - axis.title.margin
            : axisWidth + axisLabelsWidth + axis.labels.margin + axis.title.margin;

    return {
        html: false,
        content: titleContent,
        style: axis.title.style,
        size: rotatedTitleSize,
        x,
        y: axisTop + y,
        rotate: rotateAngle,
        offset: -(originalTextSize.height / titleContent.length) * (titleContent.length - 1),
    };
}

export async function prepareHtmlYAxisTitle({
    axis,
    axisTop,
    axisHeight,
    axisWidth,
    axisLabelsWidth,
}: {
    axis: PreparedAxis;
    axisTop: number;
    axisHeight: number;
    axisWidth: number;
    axisLabelsWidth: number;
}): Promise<HtmlAxisTitleData | null> {
    if (!axis.title.text || !axis.title.html) {
        return null;
    }

    const content = axis.title.text;
    const rotateAngle = axis.title.rotation;
    const titleMaxWidth = rotateAngle === 0 ? axis.title.maxWidth : axisHeight;

    const labelSize = await getLabelsSize({
        labels: [content],
        html: true,
        style: {
            ...axis.title.style,
            whiteSpace: 'nowrap',
        },
    });
    const size = {width: labelSize.maxWidth, height: labelSize.maxHeight};
    const rotatedTitleSize = rotateAngle === 0 ? size : {width: size.height, height: size.width};

    let y = 0;
    switch (axis.title.align) {
        case 'left': {
            const yOffset = rotateAngle === 0 ? -rotatedTitleSize.height : 0;
            y = axisHeight + yOffset;
            break;
        }
        case 'center': {
            const yOffset =
                rotateAngle === 0 ? -rotatedTitleSize.height / 2 : rotatedTitleSize.height / 2;
            y = axisHeight / 2 + yOffset;
            break;
        }
        case 'right': {
            y = rotateAngle === 0 ? 0 : rotatedTitleSize.height;
            break;
        }
    }

    const x =
        axis.position === 'left'
            ? -Math.min(titleMaxWidth, rotatedTitleSize.width) -
              axisLabelsWidth -
              axis.labels.margin -
              axis.title.margin
            : axisWidth + axisLabelsWidth + axis.labels.margin + axis.title.margin;

    return {
        html: true,
        content: `<div style="max-width: ${titleMaxWidth}px; overflow: hidden; white-space: nowrap; transform-origin: 0 0; transform: rotate(${rotateAngle}deg);">${content}</div>`,
        style: axis.title.style,
        size: rotatedTitleSize,
        x,
        y: axisTop + y,
    };
}
