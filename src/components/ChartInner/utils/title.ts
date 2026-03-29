import get from 'lodash/get';

import {getTextSizeFn, getTextWithElipsis, wrapText} from '~core/utils';
import type {TextRow} from '~core/utils';

import type {TextRowData} from '../../../components/types';
import type {PreparedTitle} from '../../../hooks/types';
import type {BaseTextStyle, ChartData} from '../../../types';

const DEFAULT_TITLE_FONT_SIZE = '15px';
const DEFAULT_TITLE_MARGIN = 10;

export const getPreparedTitle = async ({
    title,
    chartWidth,
}: {
    title: ChartData['title'];
    chartWidth: number;
}): Promise<PreparedTitle | undefined> => {
    const titleText = get(title, 'text');
    const titleStyle: BaseTextStyle = {
        fontSize: title?.style?.fontSize ?? DEFAULT_TITLE_FONT_SIZE,
        fontWeight: title?.style?.fontWeight ?? 'var(--g-text-subheader-font-weight)',
        fontColor: title?.style?.fontColor ?? 'var(--g-color-text-primary)',
    };

    if (!titleText) {
        return undefined;
    }

    const getTitleTextSize = getTextSizeFn({style: titleStyle});
    const maxRowCount = title?.maxRowCount ?? 1;
    const contentRows: TextRowData[] = [];

    if (maxRowCount > 1) {
        let titleTextRows = await wrapText({
            text: titleText,
            style: titleStyle,
            width: chartWidth,
            getTextSize: getTitleTextSize,
        });

        titleTextRows = titleTextRows.reduce<TextRow[]>((acc, row, index) => {
            if (index < maxRowCount) {
                acc.push(row);
            } else {
                acc[maxRowCount - 1].text += row.text;
            }
            return acc;
        }, []);

        for (let i = 0; i < titleTextRows.length; i++) {
            const textRow = titleTextRows[i];
            let textRowContent = textRow.text.trim();

            if (i === titleTextRows.length - 1) {
                textRowContent = await getTextWithElipsis({
                    text: textRowContent,
                    maxWidth: chartWidth,
                    getTextWidth: async (s) => (await getTitleTextSize(s)).width,
                });
            }
            const textRowSize = await getTitleTextSize(textRowContent);
            contentRows.push({
                text: textRowContent,
                x: 0,
                y: textRow.y + textRowSize.hangingOffset,
                size: textRowSize,
            });
        }
    } else {
        const truncatedText = await getTextWithElipsis({
            text: titleText,
            maxWidth: chartWidth,
            getTextWidth: async (s) => (await getTitleTextSize(s)).width,
        });
        const textSize = await getTitleTextSize(truncatedText);
        contentRows.push({
            text: truncatedText,
            x: 0,
            y: textSize.hangingOffset,
            size: textSize,
        });
    }

    const totalTextHeight = contentRows.reduce((acc, row) => acc + row.size.height, 0);
    const titleHeight = totalTextHeight;

    return {
        text: titleText,
        style: titleStyle,
        height: titleHeight,
        margin: title?.margin ?? DEFAULT_TITLE_MARGIN,
        qa: title?.qa,
        contentRows,
    };
};
