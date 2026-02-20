import type {PreparedAxis} from '../../hooks';
import type {TextRow} from '../../utils';
import {getTextSizeFn, getTextWithElipsis, wrapText} from '../../utils';
import type {TextRowData} from '../types';

export async function getMultilineTitleContentRows({
    axis,
    titleMaxWidth,
}: {
    axis: PreparedAxis;
    titleMaxWidth: number;
}) {
    const titleContent: TextRowData[] = [];
    const getTitleTextSize = getTextSizeFn({style: axis.title.style});
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

    return titleContent;
}
