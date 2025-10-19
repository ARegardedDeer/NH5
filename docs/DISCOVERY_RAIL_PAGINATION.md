# Nimehime Discovery & Home Rail Pagination
_Last updated: 2025-10-18_

## Overview
This document outlines how discovery and home feeds should behave using **Rail Pagination** — a finite-scroll system where each section ends with an action, insight, or invitation.  
This design avoids infinite-scroll fatigue while promoting meaningful engagement.

---

## 1. Concept Summary

Each feed consists of multiple “rails” (sections), each:
- Limited to ~8–12 cards.
- Ends with a “soft quest” or “see more” CTA.
- Encourages rating, discovery, or community interaction.

---

## 2. Discover Screen Structure

| Section | Content | End Pattern | UX Goal |
|----------|----------|--------------|---------|
| **Trending Now** | Top anime of the week | → See More | Familiarity & trust |
| **Top by Genre** | Rails for Horror, Romance, Slice of Life | → “Rate 3 to unlock personalized rail” | Data input funnel |
| **Creator Lists** | Influencer/Youtuber Top 5s | → “View Creator Profile” | Social discovery |
| **Hidden Gems** | Curated niche titles | → “Rate to refine recs” | Curiosity hook |
| **End-of-Feed Card** | Soft Quest card | “🎯 Want better recs? Rate 3 more titles.” | Encourage contribution |

---

## 3. Home Screen Structure

| Section | Content | End Pattern | UX Goal |
|----------|----------|-------------|---------|
| **Continue Watching/Rating** | Recently interacted titles | → “Complete review” | Resume context |
| **Because You Watched** | Personalized suggestions | → “Discover more like this” | Reinforce personalization |
| **Badges & Quests** | XP bar + active quest previews | → “Claim rewards” | Retention driver |
| **Community Highlights** | Peer reviews / trending posts | → “Join discussion” | Foster belonging |

---

## 4. Interaction Logic

- **Vertical scroll** = navigation between rails.
- **Horizontal scroll** = exploration within a rail.
- **End cards** = context-aware “soft quests” that invite action.
- **Combo/Quest overlays** appear *inline* (not as pop-ups).

---

## 5. Implementation Guidelines

- `RailSection.tsx` → reusable horizontal scroll component with `endCard` slot.
- `SoftQuestCard.tsx` → configurable CTA (quest, discovery, or social).
- `FeedbackManager` integrates combo triggers from rating activity.

---

## 6. Design Principles

| Principle | Description |
|------------|-------------|
| **Finite exploration** | Keeps each session meaningful and measurable. |
| **Narrative continuity** | Each rail feels like a self-contained “story arc.” |
| **Identity scaffolding** | Quests and badges tie exploration to user identity. |
| **Minimal disruption** | End-cards look like part of the feed, not ads. |

---

## 7. Example Flow (Session Cadence)

1. User opens app → sees personalized Home rails.  
2. Rates 3 titles → triggers Combo Toast (+30 EXP).  
3. Completes “Horror” rail → Quest modal appears.  
4. Scrolls to bottom → sees “Rate 3 to unlock Romance picks.”  
5. Exits → Session Summary shows +80 EXP, 1 quest complete.

---

## 8. Outcome

- Higher data density per session.  
- Reduced fatigue from infinite scroll.  
- Predictable, satisfying progression loop.  