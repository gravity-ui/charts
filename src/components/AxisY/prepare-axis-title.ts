import type {PreparedAxis} from 'src/hooks';

import type {TextRow} from '../../utils';
import {
    calculateCos,
    calculateSin,
    getLabelsSize,
    getTextSizeFn,
    getTextWithElipsis,
    wrapText,
} from '../../utils';

import type {HtmlAxisTitleData, SvgAxisTitleData, TextRowData} from './types';

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
        let titleTextRows = await wrapText({
            text: axis.title.text,
            style: axis.title.style,
            width: titleMaxWidth,
            getTextSize: getTitleTextSize,
        });

        titleTextRows = titleTextRows.reduce<TextRow[]>((acc, row, index) => {
            if (index < axis.title.maxRowCount) {
                acc.push(row);
            } else {
                acc[axis.title.maxRowCount - 1].text += row.text;
            }
            return acc;
        }, []);

        for (let i = 0; i < titleTextRows.length; i++) {
            const textRow = titleTextRows[i];
            let textRowContent = textRow.text.trim();

            if (i === titleTextRows.length - 1) {
                textRowContent = await getTextWithElipsis({
                    text: textRowContent,
                    maxWidth: titleMaxWidth,
                    getTextWidth: async (s) => (await getTitleTextSize(s)).width,
                });
            }
            const textRowSize = await getTitleTextSize(textRowContent);

            titleContent.push({
                text: textRowContent,
                x: 0,
                y: textRow.y,
                size: textRowSize,
            });
        }
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
            : -left + axisWidth + axisLabelsWidth + axis.labels.margin + axis.title.margin;

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
    const rotateAngle = axis.position === 'left' ? -90 : 90;

    const labelSize = await getLabelsSize({
        labels: [content],
        html: true,
        style: axis.labels.style,
    });
    const size = {width: labelSize.maxWidth, height: labelSize.maxHeight};

    let y = 0;
    switch (axis.title.align) {
        case 'left': {
            y = axisHeight;
            break;
        }
        case 'center': {
            y = axisHeight / 2 + size.height / 2;
            break;
        }
        case 'right': {
            y = size.height;
            break;
        }
    }

    const x =
        axis.position === 'left'
            ? -axisLabelsWidth - axis.labels.margin - axis.title.margin - size.height
            : axisWidth + axisLabelsWidth + axis.labels.margin + axis.title.margin + size.height;

    return {
        html: true,
        content: `<div style="white-space: nowrap; transform-origin: 0 0; transform: rotate(${rotateAngle}deg);">${content}</div>`,
        style: axis.title.style,
        size,
        x,
        y: axisTop + y,
    };
}
