import type {BaseTextStyle} from './base';

export interface ChartTitle {
    text: string;
    style?: Partial<BaseTextStyle>;
    /**
     * Maximum number of text rows. If the text exceeds this limit, it is truncated with an ellipsis.
     * Default: 1
     */
    maxRowCount?: number;
    /**
     * Space between the title and the chart area (in pixels).
     * Default: 10
     */
    margin?: number;
    /**
     * Can be used for the UI automated test.
     * It is assigned as a data-qa attribute to an element.
     */
    qa?: string;
}
