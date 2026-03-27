import get from 'lodash/get';

import {getTextSizeFn} from '~core/utils';

import type {PreparedTitle} from '../../../hooks/types';
import type {BaseTextStyle, ChartData} from '../../../types';

const DEFAULT_TITLE_FONT_SIZE = '15px';
const TITLE_PADDINGS = 8 * 2;

export const getPreparedTitle = async ({
    title,
}: {
    title: ChartData['title'];
}): Promise<PreparedTitle | undefined> => {
    const titleText = get(title, 'text');
    const titleStyle: BaseTextStyle = {
        fontSize: title?.style?.fontSize ?? DEFAULT_TITLE_FONT_SIZE,
        fontWeight: title?.style?.fontWeight ?? 'var(--g-text-subheader-font-weight)',
        fontColor: title?.style?.fontColor ?? 'var(--g-color-text-primary)',
    };
    const titleHeight = titleText
        ? (await getTextSizeFn({style: titleStyle})(titleText)).height + TITLE_PADDINGS
        : 0;
    const preparedTitle: PreparedTitle | undefined = titleText
        ? {text: titleText, style: titleStyle, height: titleHeight, qa: title?.qa}
        : undefined;

    return preparedTitle;
};
