import type {PreparedHeatmapSeries} from '../../useSeries/types';

import type {HeatMapItem, PreparedHeatmapData} from './types';

type PrepareHeatmapDataArgs = {
    series: PreparedHeatmapSeries;
};

export function prepareHeatmapData({series}: PrepareHeatmapDataArgs) {
    // для осей - посчитать равные интервалы (общий множитель?) - можем рабоать только с категорийной осью (частный случай stacked bar) как по оси x, так и по y
    // считаем размер ячейки - bandWidth без отступов
    //
    // обводка - подойдет ли stroke?
    // возможно стоит рисовать линии на все (но из-за этого не получится сделать обводку на одину ячейку)
    //
    // цвет градиента - пробрасыается сверху (mvp), считать по оси (значение value)
    const preparedData: PreparedHeatmapData = {
        htmlElements: [],
        items: series.data.map(() => {
            const item: HeatMapItem = {
                x: 0,
                y: 0,
                color: '',
                width: 0,
                height: 0,
            };

            return item;
        }),
    };

    return preparedData;
}
