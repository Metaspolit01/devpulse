# Design Brief: Developer Productivity MVP

**Theme:** Light (dark mode support via `.dark` class)  
**Primary Aesthetic:** Refined tech minimalism — clean, authoritative, clarity-focused.  
**Differentiation:** Metric-centric dashboard with color-coded health badges (green/amber/red) and no decorative elements.

## Palette

| Token | Light OKLCH | Dark OKLCH | Usage |
|-------|-------------|-----------|-------|
| Primary (Blue) | `0.54 0.18 258` | `0.72 0.22 142` | Interactive elements, accent highlights |
| Success | `0.72 0.22 142` | `0.72 0.22 142` | Healthy metrics badge |
| Warning | `0.65 0.22 40` | `0.65 0.22 40` | Caution metrics badge |
| Destructive (Red) | `0.59 0.24 24` | `0.68 0.2 24` | Problem metrics badge |
| Neutral Gray | `0.92 0 0` | `0.18 0 0` | Muted text, dividers |
| Background | `0.98 0 0` | `0.1 0 0` | Page background |
| Card | `1.0 0 0` | `0.15 0 0` | Metric cards, panels |

## Typography

| Tier | Font | Usage |
|------|------|-------|
| Display | General Sans (600) | Dashboard title, metric labels |
| Body | General Sans (400-500) | Card content, insight text, recommendations |
| Mono | Geist Mono (400) | Numeric values (optional emphasis) |

## Structural Zones

| Zone | Treatment | Detail |
|------|-----------|--------|
| Header | `bg-card border-b border-border` | Title, time-period selector |
| Metric Cards | `bg-card border border-border rounded-lg` | 3-column grid, 6px padding, subtle shadow on hover |
| Insight Panel | `bg-muted/20 border-l-4 border-primary` | Right sidebar explaining root cause |
| Recommendation Panel | `bg-secondary/40` | Below insights, actionable next steps |
| Footer | Subtle divider | Light gray border-top |

## Component Patterns

- **Metric Card:** Value (large bold), unit (small), trend sparkline (optional), health badge (color-coded)
- **Health Badge:** Rounded pill, semantic color (success/warning/destructive), 12px font
- **Insight Panel:** Left-aligned text with primary color accent bar
- **Recommendation:** List with checkmark icon, no external links

## Motion

- **Hover states:** Cards lift with `shadow-md`, text darkens slightly
- **Transition:** `transition-smooth` (0.3s cubic-bezier)
- **No animation:** Instant state changes, no skeletal loaders

## Responsive

- **Mobile (sm):** 1-column metric grid
- **Tablet (md):** 2-column grid
- **Desktop (lg):** 3-column grid

## Constraints

- No decorative gradients or illustrations
- No external API integrations (mock data only)
- Single developer view (no user management)
- Metrics and insights computed server-side
