J1NnICYwPjEqProOZXiiQgmEfT9yEhl9KgGoo0HYTx7IbQRX#5kx1hpE1naUAjzocgduYuqheiawyRYAi9t-XYEirbRE# Nimehime Feedback System
_Last updated: 2025-10-18_

## Overview
This document defines how Nimehime’s in-app feedback, XP, and reward systems should behave across micro, session, and macro interactions.  
The goal is to make rewards feel meaningful, rhythmic, and identity-building — not spammy or fatiguing.

---

## 1. Design Philosophy

| Principle | Description |
|------------|-------------|
| **Sparse → Significant** | No XP for trivial actions. Only for combos, quests, and badges. |
| **Visible → Contextual** | Feedback appears where user attention already is. |
| **Rhythmic → Predictable** | XP cadence tied to session rhythm (entry → engagement → closure). |

---

## 2. Feedback Tiers

| Tier | Trigger | Feedback Type | Example Copy | Goal |
|------|----------|---------------|---------------|------|
| **Tier 1 – Combo Toast** | 3+ ratings within 60s | Floating pop-up | 🔥 `Combo x3! +30 EXP` | Reinforce streaks |
| **Tier 2 – Quest Completion** | Quest completion | Mid-screen modal | 🎯 `Quest complete! Rated 3 Horror titles → +50 EXP` | Reward progression |
| **Tier 3 – Badge Unlock** | Badge/level-up | Animated modal | 🌟 `New Badge: Horror Connoisseur!` | Celebrate mastery |
| **Tier 4 – Session Summary** | App exit or idle | Compact modal | ✨ `You earned 80 EXP today. Keep it up!` | Closure and return cue |

**Silent accumulation only:** watchlist adds, likes, and comments. Shown later in session summary.

---

## 3. Behavioral Economy (XP Tuning)

| Action | Frequency | XP | Notes |
|---------|------------|----|-------|
| Add to Watchlist | High | +0 | Passive action |
| Rate Anime | Medium | +10 | Primary feedback unit |
| Review Anime | Low | +30 | Deep engagement |
| Finish Quest | – | +50 | Milestone |
| Daily Streak | – | +15 → +100 | Scales with day count |

---

## 4. Feedback Rhythm

| Stage | User State | Element | Example | Emotional Outcome |
|--------|-------------|----------|----------|-------------------|
| **Entry** | Curiosity | Welcome Toast | “Welcome back, JJ 👋” | Warm re-entry |
| **Early** | Exploration | Silent XP tally | None visible | Focus |
| **Mid** | Engagement | Combo Toast | “🔥 Combo! +30 EXP” | Flow |
| **Late** | Achievement | Quest Modal | “🎯 Quest Complete!” | Closure |
| **Exit** | Reflection | Session Summary | “✨ You earned 120 EXP” | Satisfaction |

---

## 5. Implementation Notes

- **Frontend**
  - `FeedbackManager.tsx` – central handler for toasts, combos, badges.
  - `useComboTracker()` – hook for streak detection.
  - `QuestModal.tsx` – animated quest celebration screen.

- **Backend**
  - Table: `user_xp_events` (`id`, `user_id`, `action`, `xp_value`, `timestamp`)
  - Table: `quests_progress` (`user_id`, `quest_id`, `progress`, `completed`)
  - Edge Function: aggregates per session for summaries.

---

## 6. Summary

The feedback system forms a three-tier rhythm:
**Action → Feedback → Progress → Identity → Next Quest.**

Goal: consistent micro-joy, without fatigue.