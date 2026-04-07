# Coach Maya

AI Growth Companion for Vasco (age 12). A dedicated AI coach that lives on Vasco's desk — funny enough to keep him engaged, smart enough to know when to push, and relentless enough to never let him settle for less than his best.

## Stack

- **Frontend:** React 18 + Vite 5, React Router v6
- **AI:** Claude API (Anthropic) — optional, fallback templates work without it
- **Persistence:** localStorage (Phase 1), Supabase planned for Phase 2
- **PWA:** Web app manifest + meta tags for iOS standalone mode

## Commands

```bash
npm run dev      # Vite dev server at localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

## Environment Variables

Copy `.env.example` to `.env`:
- `VITE_ANTHROPIC_API_KEY` — Anthropic API key (optional — fallback templates work without it)

## Architecture

### 8-Agent System (4 active in Phase 1)

| # | Agent | Role | Status |
|---|-------|------|--------|
| 1 | Maya Core | Personality voice | ✅ Active |
| 2 | Lesson Analyst | Transcript → quiz | 🔜 Phase 2 |
| 3 | Schedule Conductor | When to speak | ✅ Active |
| 4 | Gamification Engine | XP, combos, grades | ✅ Active |
| 5 | Personality Learner | Pattern analysis | 🔜 Phase 2 |
| 6 | Parent Intelligence | Reports for Dad | 🔜 Phase 2 |
| 7 | Anti-Gaming Sentinel | Spot-checks | ✅ Active |
| 8 | Narrative Engine | Growth stories | 🔜 Phase 3 |

### File Structure

```
src/
├── main.jsx                          # Entry point
├── App.jsx                           # Router + MayaProvider
├── styles/global.css                 # CSS variables, reset, animations
└── features/maya/
    ├── MayaDashboard.jsx             # Main UI — tasks, stats, chat tabs
    ├── MayaSchedule.jsx              # Schedule builder — configure daily tasks
    ├── context/MayaContext.jsx        # State management + localStorage persistence
    └── agents/
        ├── mayaCore.js               # Agent 1: personality prompt + Claude API
        ├── scheduler.js              # Agent 3: nudge timing logic
        ├── gamification.js           # Agent 4: XP, combos, grades, levels
        ├── antiGaming.js             # Agent 7: spot-check system
        └── orchestrator.js           # Event routing between agents
```

## Design Patterns

- **Inline styles** — All styling via `style={{}}` props
- **No TypeScript** — Pure JSX/JS
- **Dark theme** — bg `#060c18`, surface `#0c1624`, accent teal `#2DD4BF`
- **Fonts** — IBM Plex Mono (body), Bebas Neue (display)
- **Mobile-first** — Max-width 430px, centered
- **Gamification** — XP/levels/combos/grades/achievements, all deterministic logic
- **Maya's voice** — Short, punchy, never lectures, uses humor as delivery vehicle
