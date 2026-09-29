/** Share of a positive value in a positive total; zero for empty totals and non-positive values. */
export function getPositiveShare(value: number, total: number): number {
    return total > 0 && value > 0 ? value / total : 0;
}
