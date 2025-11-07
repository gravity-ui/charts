import get from 'lodash/get';

import type {BaseTextStyle, ChartData} from '../../types';
import {getHorizontalSvgTextHeight} from '../../utils';

import type {PreparedTitle} from './types';

const DEFAULT_TITLE_FONT_SIZE = '15px';
const TITLE_PADDINGS = 8 * 2;

export const getPreparedTitle = ({
    title,
}: {
    title: ChartData['title'];
}): PreparedTitle | undefined => {
    const titleText = get(title, 'text');
    const titleStyle: BaseTextStyle = {
        fontSize: title?.style?.fontSize ?? DEFAULT_TITLE_FONT_SIZE,
        fontWeight: title?.style?.fontWeight,
        fontColor: title?.style?.fontColor ?? 'var(--g-color-text-primary)',
    };
    const titleHeight = titleText
        ? getHorizontalSvgTextHeight({text: titleText, style: titleStyle}) + TITLE_PADDINGS
        : 0;
    const preparedTitle: PreparedTitle | undefined = titleText
        ? {text: titleText, style: titleStyle, height: titleHeight}
        : undefined;

    return preparedTitle;
};
