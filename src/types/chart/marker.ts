import type {SymbolType} from '../../constants';

export type PointMarkerOptions = {
    /** Enable or disable the point marker */
    enabled?: boolean;
    /** The radius of the point marker */
    radius?: number;
    /** The color of the point marker's border */
    borderColor?: string;
    /** The width of the point marker's border */
    borderWidth?: number;
    symbol?: `${SymbolType}`;
};
