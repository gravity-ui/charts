import {
    calculateNumericProperty,
    getLabelsSize,
    getTextSizeFn,
    getTextWithElipsis,
    wrapText,
} from '~core/utils';
import type {TextRow} from '~core/utils';

import type {TextRowData} from '../../../components/types';
import type {PreparedTitle} from '../../../hooks/types';
import type {BaseTextStyle, ChartData, ChartMargin} from '../../../types';

const DEFAULT_TITLE_FONT_SIZE = '15px';
const DEFAULT_TITLE_MARGIN = 10;
const DEFAULT_TITLE_MAX_HEIGH = '50%';

export const getPreparedTitle = async ({
    title,
    chartWidth,
    chartHeight,
    chartMargin,
}: {
    title: ChartData['title'];
    chartWidth: number;
    chartHeight: number;
    chartMargin?: Partial<ChartMargin>;
}): Promise<PreparedTitle | undefined> => {
    const titleText = title?.text;

    if (!titleText) {
        return undefined;
    }

    const chartMarginTop = chartMargin?.top ?? 0;
    const chartMarginLeft = chartMargin?.left ?? 0;
    const chartMarginRight = chartMargin?.right ?? 0;
    const titleStyle: BaseTextStyle = {
        fontSize: title?.style?.fontSize ?? DEFAULT_TITLE_FONT_SIZE,
        fontWeight: title?.style?.fontWeight ?? 'var(--g-text-subheader-font-weight)',
        fontColor: title?.style?.fontColor ?? 'var(--g-color-text-primary)',
    };

    const usableWidth = chartWidth - chartMarginLeft - chartMarginRight;
    const titleMargin = title?.margin ?? DEFAULT_TITLE_MARGIN;

    if (title?.html) {
        const titleSize = await getLabelsSize({
            labels: [titleText],
            style: {...titleStyle, maxWidth: `${usableWidth}px`},
            html: true,
        });
        const resolvedMaxHeight = calculateNumericProperty({
            value: title.maxHeight ?? DEFAULT_TITLE_MAX_HEIGH,
            base: chartHeight,
        });
        const titleHeight = resolvedMaxHeight
            ? Math.min(titleSize.maxHeight, resolvedMaxHeight)
            : titleSize.maxHeight;
        const qa = title?.qa;
        const qaAttr = qa ? ` data-qa="${qa}"` : '';
        const maxHeightStyle = resolvedMaxHeight ? ` max-height: ${resolvedMaxHeight}px;` : '';
        const htmlContent = `<div${qaAttr} style="max-width: ${usableWidth}px; overflow: hidden;${maxHeightStyle}">${titleText}</div>`;

        const titleWidth = Math.min(titleSize.maxWidth, usableWidth);

        return {
            text: titleText,
            style: titleStyle,
            height: titleHeight,
            margin: titleMargin,
            qa,
            html: true,
            htmlElements: [
                {
                    x: (chartWidth - titleWidth) / 2,
                    y: chartMarginTop,
                    content: htmlContent,
                    size: {width: titleWidth, height: titleHeight},
                    style: titleStyle,
                    scope: 'chart',
                },
            ],
        };
    }

    const xCenter = chartMarginLeft + usableWidth / 2;
    const getTitleTextSize = getTextSizeFn({style: titleStyle});
    const maxRowCount = title?.maxRowCount ?? 1;
    const contentRows: TextRowData[] = [];

    if (maxRowCount > 1) {
        let titleTextRows = await wrapText({
            text: titleText,
            style: titleStyle,
            width: usableWidth,
            getTextSize: getTitleTextSize,
        });

        titleTextRows = titleTextRows.reduce<TextRow[]>((acc, row, index) => {
            if (index < maxRowCount) {
                acc.push(row);
            } else {
                acc[maxRowCount - 1] = {
                    ...acc[maxRowCount - 1],
                    text: acc[maxRowCount - 1].text + row.text,
                };
            }
            return acc;
        }, []);

        for (let i = 0; i < titleTextRows.length; i++) {
            const textRow = titleTextRows[i];
            let textRowContent = textRow.text.trim();

            if (i === titleTextRows.length - 1) {
                textRowContent = await getTextWithElipsis({
                    text: textRowContent,
                    maxWidth: usableWidth,
                    getTextWidth: async (s) => (await getTitleTextSize(s)).width,
                });
            }
            const textRowSize = await getTitleTextSize(textRowContent);
            contentRows.push({
                text: textRowContent,
                x: xCenter,
                y: textRow.y + textRowSize.hangingOffset + chartMarginTop,
                size: textRowSize,
            });
        }
    } else {
        const truncatedText = await getTextWithElipsis({
            text: titleText,
            maxWidth: usableWidth,
            getTextWidth: async (s) => (await getTitleTextSize(s)).width,
        });
        const textSize = await getTitleTextSize(truncatedText);
        contentRows.push({
            text: truncatedText,
            x: xCenter,
            y: textSize.hangingOffset + chartMarginTop,
            size: textSize,
        });
    }

    const totalTextHeight = contentRows.reduce((acc, row) => acc + row.size.height, 0);

    return {
        text: titleText,
        style: titleStyle,
        height: totalTextHeight,
        margin: titleMargin,
        qa: title?.qa,
        contentRows,
    };
};
