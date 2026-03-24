# Design Audit — "Осознанная жизнь"

> Живой документ. Дополняется по мере развития приложения.
> Последнее обновление: 2026-03-24

---

## 1. Главные ценности пользователя

Целевая аудитория — люди, практикующие осознанность и саморефлексию. Что для них критически важно:

| # | Ценность | Почему важна | Текущий статус |
|---|----------|-------------|----------------|
| 1 | **Минимум трения** | Логирование настроения/активностей должно быть 2-3 тапа, иначе бросят через неделю | ⚠️ Средне — grid хорош, но mood logging требует много шагов |
| 2 | **Мягкость без давления** | Wellness-app не должен вызывать чувство вины за пропуски | ⚠️ Streak badge с огнём — это pressure-паттерн |
| 3 | **Инсайты, а не просто данные** | Пользователь хочет понять себя, не просто записать цифры | ❌ Инсайты — статичные mock-данные, нет персонализации |
| 4 | **Красота и атмосфера** | Wellness-app = убежище от хаоса. Должен быть визуально тёплым | ⚠️ Функционально, но generic — Inter, нейтральные цвета |
| 5 | **Быстрая ценность** | Пользователь должен увидеть пользу в первый же день | ❌ Нет onboarding, нет empty states, нет "первого инсайта" |
| 6 | **Приватность данных** | Рефлексия — интимный процесс | ✅ Всё локально, нет отправки данных |
| 7 | **Ритуальность** | Утренний intent + вечерний review = привычка | ✅ Evening page, Morning intent с линзами |

---

## 2. Сравнение с референсами

| Критерий | Осознанная жизнь | Daylio | Reflectly | Moodistory | Bearable | Calm |
|----------|-----------------|--------|-----------|------------|----------|------|
| **Скорость записи** | ~5 тапов (grid + events + mood) | 2 тапа | 3 тапа + AI-промпт | 1 свайп + тапы | 5+ тапов | N/A |
| **Типографика** | Inter (generic) | Custom sans | Rounded sans | SF Pro | System | Custom serif + sans |
| **Brand identity** | Нет accent-цвета | Жёлтый + тёмный | Градиенты | Цветовые темы | Фиолетовый | Тёмно-синий + звёзды |
| **Empty states** | Нет | Иллюстрации | AI-подсказки | Текст-подсказки | Подсказки | Анимации природы |
| **Year in Pixels** | Нет | Да | Нет | Да (главная фича) | Нет | Нет |
| **AI/Smart insights** | Mock-данные | Корреляции | AI-рефлексия | Паттерны | Корреляции | Персонализация |
| **Анимации** | Базовые | Минимальные | Плавные | Минимальные | Минимальные | Роскошные |
| **Onboarding** | Нет | 3 экрана | AI-диалог | Быстрый | Подробный | Красивый flow |
| **Dark theme** | Есть (с багами) | Есть | Есть | Есть | Есть | Всегда тёмный |
| **Философская глубина** | Линзы, архетипы, добродетели | Нет | Минимальная | Нет | Нет | Медитации |

**Уникальное преимущество "Осознанной жизни"**: Ни одно приложение не сочетает трекинг активностей + настроения + философские линзы (Юнг, стоики, ACT, PERMA). Это USP — его нужно подчеркнуть визуально.

---

## 3. Аудит по категориям

### 3.1 Типографика

**Текущее состояние**: Inter (300-700) + Lora (400-700)

**Проблема**: Inter — самый распространённый шрифт в AI-сгенерированных интерфейсах. Он функционален, но не создаёт идентичности. Lora подключена, но почти не используется в UI.

**Рекомендация**: Заменить на пару с характером:

| Вариант | Display font | Body font | Настроение |
|---------|-------------|-----------|------------|
| A (рекомендуется) | **Fraunces** (optical size serif) | **Plus Jakarta Sans** | Тёплый, умный, organic |
| B | **DM Serif Display** | **DM Sans** | Элегантный, editorial |
| C | **Playfair Display** | **Source Sans 3** | Классический, literary |
| D | **Instrument Serif** | **Instrument Sans** | Современный, refined |

**Файлы**: `src/styles/fonts.css`, возможно `src/styles/theme.css`

**Приоритет**: 🟡 Important — сильно влияет на восприятие

---

### 3.2 Цветовая палитра

**Текущее состояние**:
```
Light: bg #fafaf8, fg #1a1a2e, primary #2d3436 (почти чёрный)
Dark: oklch ахроматические значения
Accent = secondary = #f0eeeb (тот же бежевый)
```

**Проблема**: Нет brand-цвета. Primary = тёмно-серый. Accent = фон. Всё сливается в "бежевую кашу". Нет цветовой точки фокуса.

**Рекомендация**: Добавить один яркий accent + оставить тёплую базу:

| Вариант | Brand accent | Ассоциация |
|---------|-------------|------------|
| A (рекомендуется) | **Sage green** `#6B8F71` | Рост, природа, спокойствие |
| B | **Warm terracotta** `#C17755` | Земля, тепло, уют |
| C | **Soft indigo** `#7C83DB` | Мудрость, глубина, сознание |
| D | **Golden amber** `#D4A843` | Свет, осознанность |

**Применение accent**: primary buttons, active tab indicator, streak badge, progress bars, brand mark

**Файлы**: `src/styles/theme.css`

**Приоритет**: 🔴 Critical — определяет бренд

---

### 3.3 Навигация и информационная архитектура

**Текущее состояние**:
```
Bottom nav: Сейчас | Лента | Инсайты | Профиль
Скрытые: /evening (через кнопку), /day/:date (через ленту)
```

**Проблемы**:
1. Нет quick-action (быстрая запись настроения / начать активность с любого экрана)
2. Evening page скрыта — пользователь может забыть про вечерний ритуал
3. NowPage перегружена — activities grid + events + mood + timeline + streaks = всё подряд
4. Tab labels `text-[10px]` — слишком мелкий шрифт, ниже минимума читаемости

**Рекомендации**:
- Добавить FAB (floating action button) или центральную кнопку "+" в навигации для quick mood check
- Группировать секции NowPage визуально: hero zone (mood + active) / action zone (grid) / history zone (timeline)
- Увеличить label до `text-xs` (12px) — стандарт iOS/Android

**Файлы**: `src/app/components/Layout.tsx`, `src/app/pages/NowPage.tsx`

**Приоритет**: 🔴 Critical — UX core

---

### 3.4 NowPage (Главная)

**Что хорошо**:
- Streak badge
- Activity grid с drag-and-drop и jiggle-анимацией
- Mood snapshots с timeline
- Events с intensity levels
- Active activity chips с таймером

**Проблемы**:

| # | Проблема | Где | Серьёзность |
|---|---------|-----|-------------|
| 1 | **Информационная перегрузка** — ~8 секций подряд без иерархии | Весь файл (986 строк) | 🔴 |
| 2 | **Однообразная вёрстка** — каждая секция = `px-5` + заголовок + контент | Все секции | 🟡 |
| 3 | **Hardcoded цвета**: `bg-orange-50`, `text-orange-600` | Streak badge, строка ~313 | 🟡 |
| 4 | **Нет welcome / greeting** — пользователь не чувствует персонализации | Header section | 🟡 |
| 5 | **Event chips мелкие** — `px-3 py-1.5` < 44px touch target | renderEventChip | 🟡 |
| 6 | **Timeline controls перегружены** — ±1m / ±5m / ±30m / "сейчас" = 7 кнопок на строку | Timeline entry editor | 🟡 |
| 7 | **Нет page-load анимации** — контент появляется мгновенно, без rhythm | Return JSX | 🟢 |
| 8 | **#fff hardcode** в inline styles event chips | renderEventChip, строка ~206 | 🟡 |

**Рекомендации**:
- Визуальная иерархия: hero card (текущее настроение + активные), collapsible sections для остального
- Greeting: "Доброе утро, [имя]" / "Добрый вечер" по времени суток
- Staggered reveal при загрузке страницы
- Заменить hardcoded цвета на design tokens

---

### 3.5 FeedPage (Лента)

**Что хорошо**:
- Три вида (неделя / месяц / активности)
- Segmented control — чистый и стандартный
- Donut chart для активностей

**Проблемы**:

| # | Проблема | Серьёзность |
|---|---------|-------------|
| 1 | **Нет Year in Pixels** — самый запрашиваемый feature в mood trackers | 🟡 |
| 2 | **Календарь месяца утилитарный** — нет visual storytelling | 🟡 |
| 3 | **Нет "история дня"** — тап на день ведёт к сухому detail page | 🟢 |
| 4 | **Weekly summary** — полезно, но текст без визуального акцента | 🟢 |

**Рекомендации**:
- Добавить Year in Pixels как 4-й вид (или заменить Month view)
- Каждый день в календаре — mood-цветная точка + emoji самой частой активности
- Weekly summary → card с мини-графиком тренда настроения

---

### 3.6 EveningPage (Вечерний ритуал)

**Что хорошо**:
- Step-by-step flow
- Detect-линзы (автоопределение архетипа)
- Reflection textarea

**Проблемы**:

| # | Проблема | Серьёзность |
|---|---------|-------------|
| 1 | **Длинная форма** — review step содержит ~8 подсекций | 🟡 |
| 2 | **Нет celebration** — после завершения дня нет "ура!" момента | 🟡 |
| 3 | **Нет прогресс-бара** внутри step'ов | 🟢 |
| 4 | **Reflection — plain textarea** — нет AI-промптов или подсказок | 🟢 |

**Рекомендации**:
- Confetti-анимация при завершении (canvas-confetti уже установлен!)
- Разбить review step на sub-steps с progress indicator
- Добавить reflection prompts: "Что тебя удивило сегодня?", "За что благодарен?"

---

### 3.7 InsightsPage

**Проблемы**:

| # | Проблема | Серьёзность |
|---|---------|-------------|
| 1 | **Все инсайты = mock-данные** — нет реальных корреляций | 🔴 |
| 2 | **Locked insights** занимают слишком много места — давят paywall'ом | 🟡 |
| 3 | **Нет "главный инсайт дня/недели"** — всё одинакового веса | 🟡 |

**Рекомендации**:
- Показывать max 2 locked как тизер, остальные скрыть за "Показать ещё"
- Хотя бы базовые инсайты генерировать из реальных данных (средний mood, корреляция mood ↔ activity)
- Hero insight наверху — "На этой неделе ты чувствуешь себя лучше, когда..."

---

### 3.8 ProfilePage

**Проблема**: 679 строк — Activities CRUD + Goals + Lenses config + Settings + Top activities — всё в одном scrollable page.

**Рекомендация**: Разделить на секции-accordion или отдельные sub-pages:
- Мои активности (edit/reorder)
- Мои линзы (config)
- Цели
- Настройки

**Приоритет**: 🟡 Important

---

### 3.9 Motion / Animations

**Текущее состояние**: Framer Motion подключён. AnimatePresence в drawers. Jiggle-анимация для edit mode. Но нет:

| Отсутствует | Влияние |
|-------------|---------|
| Page-load staggered reveal | Страницы "появляются" мгновенно — нет ритма |
| Mood logging celebration | Нет фидбэка "записано!" |
| Tab switch transition | Переход между табами мгновенный |
| Card hover/press states | Нет тактильной обратной связи |
| Number animations | Статистика появляется без count-up |

**Рекомендации**: Добавить 3 ключевых анимации:
1. Staggered fade-in при загрузке NowPage (каждая секция с delay +50ms)
2. Spring-анимация при сохранении mood snapshot (scale bounce)
3. Confetti при завершении evening ritual

**Файлы**: `src/app/pages/NowPage.tsx`, `src/app/pages/EveningPage.tsx`

**Приоритет**: 🟡 Important — отличает "приятное" от "утилитарного"

---

### 3.10 Empty States и Tone of Voice

**Текущее состояние**: Нет проработанных empty states. Новый пользователь видит пустые списки.

**Проблемы**:
- Первый запуск = пустая NowPage без подсказок
- Нет onboarding flow
- Тексты утилитарные: "Активности", "События", "Инсайты"
- Нет тёплого тона — приложение "молчит"

**Рекомендации**:
- Empty state для NowPage: "Начни день с одной активности" + illustration/emoji
- Welcome screen при первом запуске: имя, 3 цели, выбор линз
- Тёплый tone of voice: "Как проходит твой день?" вместо "Состояние"
- Micro-copy подсказки: "Тапни на активность, чтобы начать отслеживать"

**Приоритет**: 🔴 Critical — определяет retention нового пользователя

---

### 3.11 Mobile UX

| Проблема | Где | Рекомендация |
|---------|-----|-------------|
| Touch target < 44px | Event chips `px-3 py-1.5` | Увеличить до `px-4 py-2` min |
| Слишком мелкий текст | Nav labels `text-[10px]` | Увеличить до `text-xs` (12px) |
| Перегружен timeline editor | ±1m/5m/30m кнопки | Заменить на drag gesture или simplified ±5m/±30m |
| Нет pull-to-refresh | NowPage | Добавить gesture |
| Нет haptic feedback | Mood slider | Добавить vibration на key values (0, 5, 10) |

**Приоритет**: 🟡 Important

---

### 3.12 Dark Theme

**Hardcoded цвета, ломающие dark theme**:

| Что | Где | Hardcode | Замена |
|-----|-----|---------|--------|
| Streak badge bg | NowPage ~313 | `bg-orange-50` | `bg-orange-500/10` |
| Streak badge text | NowPage ~313 | `text-orange-600` | `text-orange-500` |
| Event chip active | NowPage ~206 | `color: '#fff'` | `color: 'var(--color-primary-foreground)'` |
| Delete button | Event chips | `bg-red-500` | Ок, но добавить `dark:bg-red-600` |
| Mood colors | Multiple | `#ef4444` etc inline | Допустимо (semantic), но стоит вынести в CSS vars |

**Приоритет**: 🟡 Important

---

## 4. Таблица приоритетов

### 🔴 Critical (делать первым)

| # | Задача | Влияние |
|---|--------|---------|
| 1 | Brand accent цвет — добавить идентичность | Бренд, запоминаемость |
| 2 | Empty states + welcome flow | Retention новых пользователей |
| 3 | NowPage — visual hierarchy, секции с разным весом | Core UX |
| 4 | Quick-action для mood check (FAB или central tab) | Снижение трения |

### 🟡 Important (следующая итерация)

| # | Задача | Влияние |
|---|--------|---------|
| 5 | Типографика — заменить Inter на характерную пару | Идентичность, "не-AI" feel |
| 6 | Dark theme fixes — hardcoded цвета | Качество |
| 7 | Анимации — staggered load, mood celebration, confetti | Delight |
| 8 | ProfilePage — разделить на секции | UX навигации |
| 9 | Touch targets + nav label size | Mobile usability |
| 10 | Evening completion celebration | Ритуальность |
| 11 | Tone of voice — тёплые тексты | Эмоциональная связь |

### 🟢 Nice to have (polish)

| # | Задача | Влияние |
|---|--------|---------|
| 12 | Year in Pixels в FeedPage | Engagement |
| 13 | Reflection prompts в Evening | Глубина рефлексии |
| 14 | Number count-up анимации | Visual polish |
| 15 | Pull-to-refresh | Mobile convention |
| 16 | Real insights from user data | Core value (но сложная задача) |

---

## 5. Референсы и вдохновение

### Приложения для изучения

| Приложение | Что взять |
|-----------|----------|
| **[Daylio](https://daylio.net/)** | 2-tap logging, Year in Pixels, корреляции |
| **[Reflectly](https://reflectly.app/)** | AI-prompted journaling, gradient aesthetics |
| **[Moodistory](https://moodistory.com/)** | Year in Pixels, privacy-first, кастомные цветовые темы |
| **[Calm](https://calm.com/)** | Атмосфера "sanctuary", анимации природы, dark-first |
| **[Headspace](https://headspace.com/)** | Иллюстрации, чёткая навигация, Ebb chatbot |
| **[Bearable](https://bearable.app/)** | Детальный health tracking, корреляции данных |
| **[Ten Percent Happier](https://www.tenpercent.com/)** | Bold accent на нейтральной базе (lavender + red) |
| **[Ahead](https://ahead-app.com/)** | Emotional intelligence coaching, clean UX |

### Дизайн-галереи

- [Dribbble — Wellness App](https://dribbble.com/tags/wellness-app)
- [Dribbble — Mood Tracker](https://dribbble.com/tags/mood-tracker-app)
- [Behance — Health App UI](https://www.behance.net/search/projects/health%20app%20ui)
- [DesignRush — Best Health & Wellness Apps](https://www.designrush.com/best-designs/apps/health-wellness)
- [Figma Community — Wellness Tracker](https://www.figma.com/community/file/1223655474809237656)

### Тренды 2025-2026

- **AI-персонализация** — адаптация контента под паттерны пользователя
- **Dark mode first** — glassmorphism, subtle glows
- **Micro-animations** — spring physics, staggered reveals
- **Organic shapes** — blob backgrounds, мягкие градиенты вместо sharp cards
- **Voice/conversational UI** — AI-ассистент для рефлексии

---

## 6. Следующие шаги

> Заполняется по мере работы. Отмечай выполненное ✅

- [ ] Выбрать brand accent цвет
- [ ] Выбрать типографическую пару
- [ ] Спроектировать welcome/onboarding flow
- [ ] Переделать NowPage layout (visual hierarchy)
- [ ] Добавить empty states
- [ ] Fix dark theme hardcodes
- [ ] Добавить page-load animations
- [ ] Добавить celebration при завершении evening ritual
- [ ] Проработать tone of voice (тексты)
- [ ] Year in Pixels для FeedPage
