# Канон 07 — PRD редизайну «Officina digitale»

> Виконавча специфікація для бачення [`06`](06-visione-redesign.md) на матеріалах
> брендбуку [`05`](05-brandbook.md). На основі цього PRD встановлюються бібліотеки і
> повністю реалізується редизайн. **Логіка/домен/store/`lib` — недоторкані** (тільки skin+UX).

## 1. Бібліотеки

| Пакет | Навіщо | Статус |
|---|---|---|
| `framer-motion` | spring, stagger, shared-element, gesture | є |
| `ogl` | WebGL `MeshGradient` | є |
| `@number-flow/react` | числа-герої, що перетікають | є |
| `lucide-react` | іконки | є |
| `@radix-ui/*` | доступні примітиви (Dialog, Switch…) | є |
| **`vaul`** | bottom-sheet з snap-points/drag — система модалок | **встановити** |
| **`@use-gesture/react`** | swipe-дії на картках | **встановити** |
| **`sonner`** | тости підтверджень | **встановити** |

## 2. Інформаційна архітектура (екран → 4 регістри)

| Екран | TESTATA | RIEPILOGO | ELENCO | AZIONE |
|---|---|---|---|---|
| **Agenda** (`/`) | місяць-нав + число-герой дня | — | дні→записи за станом | nav+FAB |
| **Soldi** (`/soldi`) | сегмент Entrate/Uscite + тотал-герой (verde/rosso) | — | da incassare / incassati / da pagare | nav+FAB |
| **Dashboard** (`/dashboard`) | заголовок + період | 3 KPI-плитки (mesh на головній) | тренди / топ-клієнти / progress | nav |
| **Anagrafiche** (`/anagrafiche`) | сегмент Clienti/Operai + пошук | — | список з аватарами (storico-маркери) | nav+FAB |
| **Cliente/Operaio scheda** | hero-аватар + `codice` + сальдо | mini-stat | історія `lavori` | barra azione |
| **Crea** (`/nuovo`) | sheet `creazione` (візард) | — | — | — |
| **Cantiere/dettaglio** (`/lavoro/:id`) | hero запису + стан | conti (lordo/netto/incasso) | партиципанти / pagamenti / spese | azioni |
| **Impostazioni** | заголовок | — | групи налаштувань | nav |

## 3. Інвентар компонентів (atoms → organisms)

**Нові/перероблені примітиви (`src/components/ui` + `world`):**
- `Testata` — collapsing-header (scroll shrink) з слотами hero/число/контрол.
- `NumberHero` — NumberFlow + тон (verde/rosso/blu/bianco).
- `MeshStrip` — тонована WebGL-смуга (обгортка `MeshGradient`) для hero/шапок.
- `Avatar` + `AvatarStorico` (mesh-кільце) + `AvatarStack`.
- `StatePill` — пігулка стану (`Saldato/Da incassare/Programmato/Parziale/Storico`).
- `RecordCard` — базова картка запису; варіанти за станом (`programmato/incassare/parziale/pagato`) керують формою/кольором/щільністю.
- `Swipeable` — обгортка зі swipe-діями (`@use-gesture`).
- `ActionRow` — кругла-іконка+підпис ×N.
- `SectionHeader` — заголовок розділу + лічильник-пігулка.
- `EmptyState` — mesh + іконка + заклик.
- `StatTile` / `KpiTile` — плитки RIEPILOGO (з glow/mesh).
- `Progress` — смужка/кільце.
- `Sheet` система (на `vaul`): варіанти `info | dettaglio | azione(verde/blu) | creazione | pericolo` — кожен зі своєю шапкою/тоном/рухом (див. [`06` §5]).
- `Button` (готовий: primaria/secondaria/accento/utility), `Segmented`, `Codice`, `Toggle`, `Field`, `Search`.
- `Confetti/StampVivo` — сплеск на підтвердженні грошей; `toast` (sonner).

**Шелл:** `Layout` (4-регістровий каркас, safe-area, slot AZIONE), `BottomNav`
(плаваюча капсула, icon+lime active), `FAB` (морф у `creazione`), `World` (чорний
+ відблиск секції), `<Toaster/>`.

## 4. Специфікація модалок (система `Sheet`)

```
variant        header              overlay     motion                 snap
info           — (titolo)          black/50    slide-up 220ms         auto
dettaglio      titolo + avatar     black/55    spring d30 s300        [0.6, 1]
azione-incasso MeshStrip verde     verde/10    spring + Riempimento   auto
azione-pagam.  MeshStrip blu       blu/10      spring + Riempimento   auto
creazione      ossidiana + steps   black/60    FAB shared-element     full
pericolo       icona rosso-cerchio rosso/10    scale-in 180ms         auto
```
Спільне: радіус `bolla` згори, drag-handle на мобільному, `Esc`/тап-підкладка =
закрити, фокус-пастка, `aria`. На підтвердженні `azione` → `StampVivo` + `toast`.

## 5. Специфікація руху

- **TESTATA collapse:** `useScroll`→`useTransform` (height/opacity/y).
- **Список:** stagger reveal (`delay = i*0.04`, spring).
- **Картка:** `whileTap scale .98`, hover y-2 + glow; swipe-вліво відкриває дію.
- **Числа:** `NumberFlow` на всіх героях/тоталах.
- **FAB→creazione:** `layoutId` shared-element.
- **incasso/pagamento:** `Riempimento` (заливка пігулки) + `StampVivo` (сплеск) + mesh.
- Усе під `prefers-reduced-motion` (MotionConfig `reducedMotion="user"`), WebGL fallback CSS.

## 6. Поетапний план (P0–P7) — кожен етап = коміт, build+lint зелені

| # | Етап | Зміст | DoD |
|---|---|---|---|
| **P0** | Бібліотеки + примітиви | install (vaul/use-gesture/sonner); `Sheet`-система, `Testata`, `NumberHero`, `MeshStrip`, `Avatar(+storico)`, `StatePill`, `RecordCard`, `Swipeable`, `ActionRow`, `SectionHeader`, `EmptyState`, `StatTile` | вітрина `/brandbook` оновлена, build+lint |
| **P1** | Шелл | `Layout` 4-регістри, `BottomNav`, `FAB` морф, `World`, `Toaster` | nav/FAB/тости працюють |
| **P2** | Agenda | TESTATA collapse + число-герой дня + розділи-дні + `RecordCard` за станом + swipe | a video, числа вірні |
| **P3** | Soldi | TESTATA Entrate/Uscite + тотал-герой + розділи + **sheet azione-incasso** (mesh+Riempimento+StampVivo) | incasso/pagamento e2e |
| **P4** | Dashboard | KPI-плитки (mesh) + NumberFlow + тренди/progress | KPI вірні |
| **P5** | Anagrafiche + schede | списки з аватарами + `storico` + досьє-sheet; cliente/operaio scheda hero | a video |
| **P6** | Crea + Cantiere + Impostazioni | `creazione` візард-sheet (FAB shared-element); dettaglio записи; налаштування | flussi e2e |
| **P7** | Полір модалок + аудит | усі варіанти sheet, тональності, reduced-motion, контраст, фінал-верифікація | build+lint+test, скриншоти кожного екрана/модалки |

## 7. Верифікація

Після кожного етапу: `npm run build`, `npm run lint`, `npm test` зелені;
**a video** (headless Chrome `puppeteer-core`, WebGL `--use-gl=angle`) — скриншот
екрана/модалки, 0 помилок консолі; ключові flussi (crea/incassa/paga/converti) і
числа конта — вірні. Гілка `canone/nuovo-prodotto`, коміт за етап, **push лише на запит**.
