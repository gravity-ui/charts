# Plugin Architecture for Series Types

### ChartKit · Internal Review

---

## Slide 1 — Проблема

**Добавление нового типа серий затрагивало несколько мест одновременно:**

- `prepareSeries.ts` — ветка в switch по типу
- `useShapes/index.tsx` — ещё одна ветка
- `ChartSeries` union type — ещё одно место
- Рендерер — отдельный файл без явной связи с остальными

Каждый новый тип = четыре точки изменений, разбросанных по core.  
Нет единого места, где "живёт" тип серий.

---

## Slide 2 — Было: жёсткая связность

```
useShapes/index.tsx
  if (type === 'area')   → renderArea(...)
  if (type === 'bar-x')  → renderBarX(...)
  if (type === 'line')   → renderLine(...)
  ...

prepareSeries.ts
  switch (type) {
    case 'area':  return prepareArea(...)
    case 'bar-x': return prepareBarX(...)
    ...
  }
```

**Следствия:**

- Удалить тип нельзя без рисков — нет явных границ
- Добавить тип без знания internals — нельзя
- Протестировать тип изолированно — сложно

---

## Slide 3 — Контракт плагина

Каждый тип серий реализует один интерфейс:

```typescript
interface SeriesPlugin {
    type: string;

    // Фаза 1: raw data → подготовленная серия
    prepareSeries(args: SeriesPluginPrepareArgs): PreparedSeries[] | Promise<PreparedSeries[]>;

    // Фаза 2: подготовленная серия → данные для рисования
    prepareShapeData(args: SeriesPluginShapeArgs): SeriesPluginShapeResult | null | Promise<...>;

    // Тултип: из shapesData плагина → чанки для отображения
    getTooltipData(args: TooltipDataArgs): TooltipDataResult;

    // Конфиг SVG-рендеринга
    shape: ShapeConfig;
}

interface ShapeConfig {
    refs: ShapeRef[];                          // SVG-узлы, которые нужен плагину
    render(args: ShapeRenderArgs): () => void; // D3-рендер, возвращает cleanup
    getHtmlElements(data: unknown): HtmlItem[]; // HTML-лейблы
}
```

Всё, что нужно знать для добавления нового типа — это контракт выше.

---

## Slide 4 — Двухфазный pipeline

```
Входные данные пользователя
        │
        ▼
┌───────────────────┐
│  prepareSeries()  │  · нормализация цветов, легенды, дефолтов
│  (data phase)     │  · async (может ходить за размерами текста)
└────────┬──────────┘
         │  PreparedSeries[]
         ▼
┌────────────────────┐
│ prepareShapeData() │  · вычисление координат, scale-маппинг
│ (geometry phase)   │  · доступ к осям, zoom, split, otherLayers
└────────┬───────────┘
         │  SeriesPluginShapeResult
         ▼
┌──────────────────┐
│  shape.render()  │  · D3 joins на SVG-узлы
│  (render phase)  │  · возвращает cleanup
└──────────────────┘
         +
  getHtmlElements() → HTML-лейблы в отдельный слой
```

Каждая фаза независима и тестируется отдельно.

---

## Slide 5 — Разделение фаз: за и против

**Плюсы:**

- Разные триггеры пересчёта — ресайз и zoom не запускают фазу данных
- `prepareSeries` не зависит от DOM — работает на сервере, в воркере, до рендера
- `PreparedSeries[]` переиспользуется тултипом, легендой, range slider без пересчёта
- Фаза данных — чистая функция, тестируется без D3 и DOM

**Минусы:**

- `data: unknown` на стыке фаз — типизация теряется, внутри плагина всё равно кастинг
- Для простых серий (scatter, pie) разделение искусственное — тонкий `prepare-series.ts` ради структуры
- `otherLayers` в геометрической фазе ломает изоляцию: результат зависит от порядка вызова соседних плагинов
- Главный плюс (разные триггеры) пока теоретический — фазы пересчитываются вместе, раздельного кэширования нет

---

## Slide 6 — Registry

```typescript
// src/core/plugins/registry.ts
class PluginRegistry {
  private plugins = new Map<string, SeriesPlugin>();
  register(plugin: SeriesPlugin): void;
  get(type: string): SeriesPlugin | undefined;
  has(type: string): boolean;
}

export const pluginRegistry = new PluginRegistry();
```

```typescript
// src/plugins/index.ts  — side-effect import при инициализации
pluginRegistry.register(areaPlugin);
pluginRegistry.register(barXPlugin);
// ... 13 встроенных плагинов
```

Точки потребления (`prepareSeries.ts`, `useShapes/index.tsx`) делают только:

```typescript
const plugin = pluginRegistry.get(seriesType);
await plugin.prepareSeries(...)
await plugin.prepareShapeData(...)
```

---

## Slide 7 — Текущее состояние

**Что сделано:**

- Все 13 существующих типов (`area`, `bar-x`, `bar-y`, `funnel`, `heatmap`, `line`, `pie`, `radar`, `sankey`, `scatter`, `treemap`, `waterfall`, `x-range`) переведены на плагины
- Core (`prepareSeries`, `useShapes`) не знает ни о каком конкретном типе
- Каждый тип — самодостаточная папка из 5 файлов
- `getTooltipData` добавлен в контракт — тултипная логика живёт в плагине, не в `get-closest-data.ts`
- `ShapeData` — больше не ручной union из 13 типов, а `PreparedSeriesDataItem` (`{type: string}`); новый плагин не требует правки `useShapes`

**Что намеренно не сделано:**

- `pluginRegistry` и `SeriesPlugin` **не экспортируются** из публичного API (`src/index.ts`)
- Внешние пользователи библиотеки не могут регистрировать свои плагины
- Это сознательное решение — сначала обкатать внутри

---

## Slide 8 — Аналоги в индустрии

| Библиотека         | Подход                                                                                                                    | Открыт ли для внешних?                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Apache ECharts** | `echarts.use([BarChart, PieChart])` — явная регистрация компонентов, tree-shaking                                         | ✅ Публичный API с v5                          |
| **Grafana**        | `PanelPlugin<Options>` — React-компонент + options schema, отдельный build pipeline                                       | ✅ Публичный SDK                               |
| **Chart.js**       | Lifecycle hooks (`beforeDraw`, `afterDatasetDraw` и др.) — плагин подписывается на события рендера, а не регистрирует тип | ✅ Публичный, но поведенческий, не структурный |
| **uPlot**          | Pluggable path renderers — series.paths заменяется функцией, draw-хуки для наложений                                      | ✅ Публичный, минималистичный                  |

**ECharts** — ближайший аналог по подходу: явная регистрация типа + два шага (опции → рендер).  
Открыл API сразу с жёсткими semver-гарантиями, что заморозило часть внутренних решений.

**Chart.js** — принципиально другая модель: плагин не добавляет _тип_, а перехватывает _этапы_ отрисовки существующих типов. Гибко для декораторов, не подходит для новых геометрий.

**uPlot** — самый низкоуровневый: плагин получает canvas-контекст и рисует сам.  
Нет абстракции над данными — вся подготовка на стороне плагина.

**Наш подход** сочетает регистрацию типа (как ECharts) с явным разделением фаз данных и геометрии (чего нет ни у одного из аналогов).

---

## Slide 9 — Добавление нового типа (сейчас)

Создать папку `src/core/plugins/series/my-type/` с 4 файлами:

```
my-type/
├── types.ts          # PreparedMyTypeData, MyTypeItem — внутренние типы
├── prepare-series.ts # raw ChartSeries[] → PreparedMyTypeSeries[]
├── prepare-data.ts   # PreparedMyTypeSeries[] → PreparedMyTypeData (геометрия)
├── renderer.ts       # D3-рендер на SVG-узлы
└── plugin.ts         # SeriesPlugin + ShapeConfig — всё вместе
```

Зарегистрировать в `src/plugins/index.ts`:

```typescript
pluginRegistry.register(myTypePlugin);
```

**Больше ничего менять не нужно.** Core об этом типе не знает и знать не должен.

---

## Slide 10 — Ограничения текущего подхода

**1. Типизация между фазами — `unknown`**  
`prepareShapeData` принимает `PreparedSeries` и возвращает `data: unknown`.  
`shape.render` принимает `preparedData: unknown`.  
Внутри плагина приходится кастить. Дженерики пока не введены.

**2. Нет tree-shaking**  
Все 13 плагинов всегда в бандле. ECharts решает это через `echarts.use([...])`.  
Актуально, когда бандл станет критичен.

**3. Общий Dispatcher**  
D3 dispatcher для событий (hover, click) — один на всё приложение.  
Плагины не изолированы по событиям — потенциальные конфликты при сложных взаимодействиях.

**4. Нет версии контракта**  
Если `SeriesPluginShapeArgs` изменится — все плагины ломаются одновременно.  
Нет механизма deprecation или versioned interface.

**5. `otherLayers` как неявная зависимость между плагинами**  
Плагины (например, stacked area) читают данные других слоёв через `otherLayers`.  
Это implicit coupling — порядок вызова плагинов имеет значение.

**~~6. `ShapeData` union и tooltip switch — ручные перечисления типов~~ → решено**  
~~`get-closest-data.ts` содержал 494-строчный switch с импортами всех 13 типов.~~  
~~`useShapes` содержал union из 13 `PreparedXxxData` — новый тип требовал правки двух файлов.~~  
Тултипная логика вынесена в `getTooltipData` контракта плагина (`get-closest-data.ts` — 54 строки, не знает о типах).  
`ShapeData` заменён на `PreparedSeriesDataItem` (`{type: string}`) — достаточно, чтобы любой `PreparedXxxData` удовлетворял интерфейсу структурно.

---

## Slide 11 — Дальнейшие шаги

**Ближайшие (внутренняя обкатка):**

- [ ] Добавить 1–2 новых типа визуализаций как плагины — валидация DX и контракта
- [ ] Написать внутренний гайд "как написать плагин" (чеклист из 5 шагов)
- [ ] Добавить unit-тесты для фаз `prepareSeries` и `prepareShapeData` изолированно

**Среднесрочные (стабилизация контракта):**

- [ ] Убрать `unknown` — ввести дженерики в `SeriesPlugin<TData, TShapeResult>`
- [ ] Изолировать dispatcher per-plugin или ввести typed event bus
- [ ] Проработать tree-shaking: отдельные entrypoints для каждого плагина

**Долгосрочные (открытие публичного API):**

- [ ] Зафиксировать `SeriesPlugin` как стабильный контракт (semver)
- [ ] Открыть `pluginRegistry` + `SeriesPlugin` + `ShapeConfig` в `src/index.ts`
- [ ] Публичная документация + пример custom plugin
- [ ] Migration guide для тех, кто сейчас форкает рендереры
