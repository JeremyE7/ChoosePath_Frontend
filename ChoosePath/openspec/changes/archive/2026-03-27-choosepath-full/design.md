# Design: choosepath-full — Complete Interactive Story Editor

## Technical Approach

Build a modular Angular 21 application using standalone components with signals-based state. Follow the dependency order from the proposal: Models → Services → Core Components → UI Components → Design System.

## Architecture Decisions

### Decision: GSAP Plugin Selection

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Full GSAP bundle | SSR issues, large bundle | — |
| Motion library | Different API, less control | — |
| **gsap core + Draggable** | Minimal SSR issues, precise drag control | ✅ Selected |

**Rationale**: TreeCanvas uses CSS transforms for pan/zoom (no plugin needed). Draggable handles card physics. Wire drawing uses stroke-dashoffset animation (pure CSS).

### Decision: SVG vs Canvas for Tree

| Option | Tradeoff | Decision |
|--------|----------|----------|
| HTML Canvas | Lose Angular change detection integration | — |
| D3.js | Additional dependency for simple tree | — |
| **SVG** | Native Angular integration, built-in events | ✅ Selected |

**Rationale**: Angular's change detection works naturally with SVG DOM. Interactive nodes benefit from built-in event delegation. No additional library needed for this scale (<100 nodes).

### Decision: Custom Drag vs Angular CDK

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Angular CDK DragDrop | Requires valid drop zones only | — |
| ngDraggable | Outdated, no Angular 21 support | — |
| **Custom mouse + GSAP Draggable** | Full magnetic snap control | ✅ Selected |

**Rationale**: Angular CDK drag emits `cdkDragEnded` only on valid drop zones. Our UX requires magnetic pull anywhere near the commit area. GSAP Draggable provides `onDrag` callback for distance calculations.

### Decision: Service Injection Pattern

**Choice**: `providedIn: 'root'` with `inject()` function
**Alternatives**: Module-based providers, manual singleton creation
**Rationale**: Tree-shaking friendly, works with Angular 21 standalone defaults. `inject()` enables lazy service initialization.

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ StorySidebar│────▶│ StoryService │────▶│   TreeCanvas    │
└─────────────┘     │  (signal)   │     └────────┬────────┘
                    └──────┬───────┘              │
                           │                      ▼
┌─────────────┐     ┌──────▼───────┐     ┌─────────────────┐
│DepthIndicator│◀────│ NarrativePanel│◀────│   TreeLayout   │
└─────────────┘     └──────┬───────┘     │   (computed)   │
                           │                      │
                    ┌──────▼───────┐              │
                    │MemoryService │◀─────────────┘
                    │   (signal)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐     ┌─────────────────┐
                    │MemoryLog     │     │ MemoryEchoPipe │
                    └──────────────┘     └────────┬────────┘
                                                   │
                    ┌──────────────┐     ┌────────▼────────┐
                    │MemoryNotification│◀──│  EventCard    │
                    └──────────────┘     └─────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/models/story.model.ts` | Create | StoryNode, Event, Memory, Story interfaces |
| `src/app/services/story.service.ts` | Create | Story state + navigation via signals |
| `src/app/services/memory.service.ts` | Create | Memory registry + echo context |
| `src/app/services/drag.service.ts` | Create | GSAP Draggable wrapper + magnetic snap |
| `src/app/services/tree-layout.service.ts` | Create | Depth-first layout calculator |
| `src/app/pipes/memory-echo.pipe.ts` | Create | Keyword highlighting pipe |
| `src/app/components/tree-canvas/` | Create | SVG tree with zoom/pan |
| `src/app/components/narrative-panel/` | Create | Scene container |
| `src/app/components/choice-card/` | Create | Draggable choice cards |
| `src/app/components/event-card/` | Create | Typed event cards |
| `src/app/components/memory-notification/` | Create | RPG popup notifications |
| `src/app/components/memory-log/` | Create | Memories sidebar |
| `src/app/components/story-sidebar/` | Create | Stories list |
| `src/app/components/depth-indicator/` | Create | Progress bar |
| `src/styles.css` | Modify | Aurora design tokens + glassmorphism |
| `src/app/app.ts` | Modify | Root shell with layout |

## Interfaces / Contracts

```typescript
// src/app/models/story.model.ts
export interface StoryNode {
  id: string;
  title: string;
  content: string;
  depth: number;
  choices: Choice[];
  events: Event[];
}

export interface Choice {
  id: string;
  text: string;
  targetNodeId: string | null; // null = branch stub
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
}

export interface Event {
  id: string;
  type: 'enemy' | 'event' | 'warning' | 'mystery' | 'memory';
  value: number;
  description: string;
}

export interface Memory {
  id: string;
  keyword: string;
  description: string;
  timestamp: number;
  intensity: 1 | 2 | 3;
}

export interface Story {
  id: string;
  title: string;
  rootNodeId: string;
  nodes: Map<string, StoryNode>;
  maxDepth: number;
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Models, Pipes, Services | Vitest with `signal()` testing utilities |
| Component | Each component in isolation | Test host with signal inputs |
| Integration | StoryService → TreeCanvas | Component testing with mock services |
| E2E | Full user flow | Playwright: create story → make choices → see memory |

## Migration / Rollout

No migration required. Greenfield implementation. Phased approach per proposal's dependency order.

## Open Questions

- [ ] Should StoryService persist to localStorage? (Proposal says "stub only")
- [ ] Do we need undo/redo for choice navigation?
- [ ] What's the max tree depth for reasonable layout calculation?
