# Zoom Rework Plan

## Контекст и мотивация

Текущая реализация zoom использует **фильтрацию данных** — точки вне zoom-диапазона исключаются из набора, по которому строится геометрия серий. Это вызывает три проблемы:

1. **Stacked серии работают некорректно** (bar-x, bar-y, area stacked) — агрегаты считаются по отфильтрованному набору вместо полного.
2. **Чарт после zoom выглядит сильно иначе** — теряется ощущение реального увеличения, потому что геометрия пересоздаётся с другим набором точек.
3. **Хак с соседними точками для line/area** — в `getZoomedSeriesData` сохраняются точки, которые формально вне диапазона, чтобы линия не обрывалась на границе viewport. Это усложняет код (`SERIES_TYPE_WITH_HIDDEN_POINTS`).

**Решение:** перейти на viewport-подход — zoom меняет `min/max` осей (domain), геометрия строится на полных данных, всё что вне видимой области обрезается через `clipPath`. Инфраструктура уже частично есть: `zoomStateX/Y` уже передаются как `minValues/maxValues` в `createXScale`/`createYScale`, и `clipPath` уже применяется ко всем сериям кроме scatter.

**Что меняется снаружи:** только визуал зума — он становится «честным» (масштаб реальный, относительные пропорции сохраняются, stacked-агрегаты корректны). Публичный API (`chart.zoom`, `axis.x.rangeSlider`) не меняется — публичных событий типа `onZoom`/`onRangeSliderChange` не существует.

## Архитектурные решения

- **Имена остаются `zoom*`** — рефакторинг ради переименования не делаем. Меняется реализация, не семантика.
- **Внутренние `zoomState` и `rangeSliderState` объединяются в один state** (вариант Б из обсуждения). Оба input'а (brush и slider) пишут в него. `getEffectiveXRange` и ручная синхронизация в `useChartInnerState` удаляются.
- **Mini-chart range slider'а рендерится со своим scale на полных данных** — не реагирует на zoom state. Поведение сохраняется как сейчас.
- **Hover/tooltip:** пост-фильтр результата hit-test по viewport (структура hit-test строится на полных данных, но точки вне viewport игнорируются при показе tooltip).
- **Scatter:** clipPath не подходит из-за крупных точек на границе. Используется рендерная фильтрация — точки вне viewport не отрисовываются (живёт в shape-модуле scatter, не в общем zoom-пути).

## Scope PR

Один большой PR с ломающими изменениями (только визуал, не API).

1. **Снять data-filtering из общего zoom-пути**
   - Удалить `SERIES_TYPE_WITH_HIDDEN_POINTS` и логику соседей в `src/core/zoom/zoom.ts`.
   - В `useChartInnerProps.ts` и других местах перейти на полные `series.data`.
   - `getZoomedSeriesData` либо удалить, либо урезать до простого viewport-фильтра для hover-слоя.

2. **`getZoomType` через декларации серий**
   - Вынести `supportedZoom: { x, y, default }` в декларацию каждого series-типа.
   - `getZoomType` становится агрегатором по сериям чарта.
   - Удалить hardcoded таблицу `ZOOM_BY_SERIES_TYPE` в `src/components/ChartInner/utils/zoom.ts`.

3. **`clipPath` по умолчанию у всех серий**
   - Удалить исключение `CLIP_PATH_BY_SERIES_TYPE` для scatter.
   - Для scatter добавить рендерную фильтрацию точек вне viewport в его shape-модуле.

4. **Hover/tooltip viewport-фильтр**
   - Найти, где строится hit-test структура (quadtree/voronoi/индекс).
   - Добавить пост-фильтр результата: если ближайшая точка вне viewport — не показывать tooltip.

5. **Stacked серии**
   - Убедиться, что stack-агрегация происходит на полных данных (до применения viewport).
   - Проверить порядок операций в pipeline.

6. **Объединить `zoomState` + `rangeSliderState` (вариант Б)**
   - Один внутренний state, оба input'а (brush на основном чарте и ручки slider'а) пишут в него.
   - Удалить `getEffectiveXRange` и ручную синхронизацию `setZoomState({})` при движении slider'а.
   - `RangeSliderState` тип — оставить экспорт как alias для совместимости (или deprecate в jsdoc).
   - Mini-chart использует свой scale через `useAxisScales({isRangeSlider: true})` — НЕ реагирует на объединённый state.

7. **Reset поведение**
   - Reset возвращает state в `undefined` → axis domain возвращается к user-defined `axis.x.min/max` (если задан в конфиге) или к `[dataMin, dataMax]`.
   - Тест: чарт с явно заданным `axis.x.min`, zoom, reset → возврат к пользовательскому min, не к dataMin.

## Валидация (внутри PR)

- **Категориальные оси + bar:** проверить, что `bandScale.step()` корректно реагирует на сужение domain (бары становятся шире при zoom).
- **Axis labels и ticks:** считаются от текущего (зумленного) domain — проверить.
- **Range slider + zoom:** mini-chart продолжает рисовать полные данные, основной чарт — viewport. Зум через slider и через brush приводят к одинаковому состоянию.
- **Прогнать существующие тесты:** `zoom.visual.test.tsx`, `range-slider--zoom.visual.test.tsx`, `area-series.visual.test.tsx` (stacking with range slider).

## Новые тесты

- **Visual:** stacked bar-x с zoom, stacked bar-y с zoom, stacked area с zoom.
- **Visual:** zoom одной точки в линии (бывший хак-кейс) — линия должна продолжаться от и до viewport.
- **Visual:** zoom scatter с крупными точками на границе — точки вне viewport не рендерятся.
- **Visual:** brush-zoom основного чарта → ручки slider'а съезжают; драг slider'а → mini-chart НЕ зумится; reset → возвращение к user min/max.
- **Unit:** новый агрегатор `getZoomType` с разными комбинациями серий.
- **Unit:** hit-test возвращает только точки внутри viewport.

## Со звёздочкой (вне PR, но зафиксировать)

- **Бенчмарк zoom-перфоманса** на 1k / 10k / 100k точек — baseline до и после. Не блокирует PR, запустить в первую неделю после мерджа для регрессии.
- **Smooth zoom-анимация** через интерполяцию domain — отдельный PR, как часть будущего animation-слоя.

## Открытые вопросы (решить по ходу имплементации)

- Где именно строится hit-test структура для hover (нужно найти в коде) — от этого зависит, как чисто сделать пункт 4.
- Есть ли в проекте decimation/упрощение path для очень больших line-серий — если есть, как оно реагирует на изменение domain.
- `RangeSliderState` тип — оставить как alias / deprecate / удалить — решить, когда увидим использование внутри проекта.
