import type {BaseTextStyle} from './base';

export interface ChartTitle {
    text: string;
    style?: Partial<BaseTextStyle>;
    /** Can be used for the UI automated test.
     * It is assigned as a data-qa attribute to an element. */
    qa?: string;
}
