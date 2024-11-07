import get from 'lodash/get';

import type {BaseTextStyle, ChartKitWidgetData} from '../../types';
import {getHorisontalSvgTextHeight} from '../../utils';

import type {PreparedTitle} from './types';

const DEFAULT_TITLE_FONT_SIZE = '15px';
const TITLE_PADDINGS = 8 * 2;

export const getPreparedTitle = ({
    title,
}: {
    title: ChartKitWidgetData['title'];
}): PreparedTitle | undefined => {
    const titleText = get(title, 'text');
    const titleStyle: BaseTextStyle = {
        fontSize: get(title, 'style.fontSize', DEFAULT_TITLE_FONT_SIZE),
        fontWeight: get(title, 'style.fontWeight'),
    };
    const titleHeight = titleText
        ? getHorisontalSvgTextHeight({text: titleText, style: titleStyle}) + TITLE_PADDINGS
        : 0;
    const preparedTitle: PreparedTitle | undefined = titleText
        ? {text: titleText, style: titleStyle, height: titleHeight}
        : undefined;

    return preparedTitle;
};
