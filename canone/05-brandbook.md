# Канон 05 — Brandbook та дизайн-бібліотека «Neo-Banking per il verde»

> Жива бібліотека компонентів — у застосунку за маршрутом **`/brandbook`**
> (`src/pages/Brandbook.tsx`). Цей документ — її письмова специфікація.
> Натхнення: найкращі fintech-застосунки (Revolut та подібні), адаптовано під
> облік роботи в зеленому господарстві на Ельбі.

## Ідея

Утилітарна, високо-контрастна система: **глибокий чорний**, **суцільні поверхні**,
рішуча типографіка, **динамічні акценти** (синій / зелений / червоний) і **fill-и
mesh-gradient + glow**. Кожна сутність — `lavoro`, `cliente`, `operaio`, `soldi` —
має **свою форму і свій колір**. Жодних прозорих стекол: ієрархія — контрастом,
відступом і кольором.

## Палітра

| Токен | Hex | Призначення |
|---|---|---|
| `nero` | `#000000` | абсолют, тінь |
| `fondo` | `#050505` | тло застосунку |
| `superficie` | `#111111` | первинні картки |
| `superficie-alta` | `#1c1c1c` | вторинні / hover |
| `superficie-3` | `#2a2a2a` | активний сегмент |
| `bordo` | `#1f1f1f` | тонкі роздільники |
| `bianco` | `#ffffff` | первинний текст і **кнопки** |
| `fumo` | `#a3a3a3` | вторинний текст |
| `fumo-2` | `#737373` | мікро-дані |
| **`blu`** | `#0a58ff` | бренд · `programmato` · в роботі |
| **`verde`** | `#00d15e` | позитив · `incassato` · `saldato` |
| **`rosso`** | `#ff3b30` | `da incassare` · прострочено · витрата |
| `viola` | `#4b0082` | кінець mesh-градієнта |

**Правило акценту:** насичений колір живе на **іконках, тексті, ілюстраціях,
mesh-fill-ах** — але **ніколи не є заливкою звичайної кнопки** (кнопки нейтральні:
біла / сіра). Виняток — одна акцентна дія (`bg-blu`) та небезпечна (`bg-rosso`).

## Типографіка

- **Inter** — усе: display (bold, `tracking-tighter`) для чисел-героїв (`€ 1.872`),
  semibold (`tracking-tight`) для заголовків, medium для секцій, regular для тіла.
- **JetBrains Mono** — дані: `codice parlante`, відсотки, дати, години.

Шкала: `56px` число-герой · `32px` заголовок сторінки · `20px` секція ·
`16px` тіло/voce · `13px` мікро-дані.

## Поверхні, радіуси, тіні

Радіуси **великі**: `chip 8px` · `btn 16px` · `card 24px` · `bolla 32px` · `pill ∞`.
Тінь — лише глибина (`shadow-vetro`), без світіння під блоками.

## Fill та градієнти

- **Mesh premium** (`.mesh-blu/.mesh-verde/.mesh-rosso/.mesh-notte`) + **glow-блоб**
  (розмитий кружок `blur-[40-60px]`, `mix-blend-overlay`) — hero-картки, empty-state.
- **Subtle glow** — `superficie` + кольоровий blur-блоб у кутку — активні стани.
- **WebGL `MeshGradient`** (`src/components/world/MeshGradient.tsx`, рушій `ogl`):
  анімований **metaball mesh** — блоби `blu/verde/viola/rosso` плавно перетікають і
  зливаються. Заповнює свій контейнер (hero-картка), а **не** весь екран. Тло
  застосунку лишається чорним із приглушеним кольоровим відблиском секції зверху
  (`World.tsx`). Fallback: якщо WebGL нема — лишається фон контейнера; reduced-motion
  → статичний кадр.

## Бібліотека компонентів

- **Кнопки:** primaria (біла) · secondaria (`superficie`) · accento (`bg-blu`) ·
  distruttiva (контур + `text-rosso`) · pill · кругла-іконка · action-row
  (кругла іконка + підпис).
- **Інпути:** текст (`superficie`, focus→`superficie-alta`) · search (pill) ·
  **amount-eroe** (`€ 800`, 64px) · segmented (`superficie` трек, `superficie-3` активний) ·
  toggle (`blu`) · selector-row (аватар + назва + chevron).
- **Індикатори:** status-пігулки (`Saldato`=verde, `In ritardo`=rosso,
  `Programmato`=blu, `Parziale`=ambra) · `codice` chip (mono, blu) · **аватари**
  (круглі ініціали, тоновані) і **AvatarStack** (перекриті −space) · progress-бар.
- **Іконки:** лише `lucide-react`, stroke 2 (активний 2.5). Набір для верду:
  `TreePine, Sprout, Leaf, HardHat, Hammer, PaintRoller, PenTool, Zap`.

## Сутність → форма (картки)

| Сутність / стан | Форма | Колір |
|---|---|---|
| `lavoro · programmato` | повна картка: іконка + назва + клієнт + час + AvatarStack | **blu** (ліва смуга + тінт) |
| `lavoro · svolto · da incassare` | повна картка: червона іконка + назва + **велика сума** + «Riscuoti» (біла) | **rosso** |
| `lavoro · svolto · pagato` | **компактний рядок**: зелене коло-✓ + клієнт + зелена сума | **verde** (приглушено) |
| `cliente` | рядок: аватар (ініціали) + назва + `codice` + сальдо | `rosso` якщо борг |
| `operaio` | рядок: аватар + ім'я + роль/тариф + сума до виплати | `rosso` |

## Мова руху

- **Sheet** знизу (`spring`, `damping 30/stiffness 300`), радіус `bolla`, плоский.
- **Riempimento/StampVivo** на підтвердженні `Incassa`/`Paga`.
- **NumberFlow** на дашбордах. **Press** `active:scale-[0.98]`. **Mesh** дихає.
- Усе поважає `prefers-reduced-motion`.

## Як користуватися

Дивись і копіюй з **`/brandbook`**. Токени — `src/index.css` (`@theme`); сумісність
збережено (старі назви класів `glass*`/`statocard*` лишилися, але стали суцільними).
Розширювати цю бібліотеку — далі, коли «обіграватимемо» кожен екран.
