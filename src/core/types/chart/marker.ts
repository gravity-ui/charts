import type {SymbolType} from '../../constants';

export interface PointMarkerOptions {
    /** The color of the point marker's border */
    borderColor?: string;
    /** The width of the point marker's border */
    borderWidth?: number;
    /** Fill color of the marker */
    color?: string;
    /** Enable or disable the point marker */
    enabled?: boolean;
    /** The radius of the point marker */
    radius?: number;
    symbol?: `${SymbolType}`;
}
