# Proposal: choosepath-full — Complete Interactive Story Editor

## Intent

Implement the complete ChoosePath application: an Angular 21 visual editor for interactive stories featuring an SVG decision tree, GSAP-powered drag-and-drop physics, RPG-style memory notifications, and aurora glassmorphism design. Deliver production-ready components, services, and styling.

## Scope

### In Scope
- TreeCanvasComponent — Interactive SVG tree with zoom/pan and branch stubs
- NarrativePanelComponent — Scene display with event cards and choice cards
- ChoiceCardComponent — Draggable decision cards with GSAP physics
- EventCardComponent — Typed consequence cards (enemy/event/warning/mystery/memory)
- MemoryNotificationComponent — RPG-style popup notifications
- MemoryLogComponent — Accumulated memories sidebar
- StorySidebarComponent — Saved stories list
- DepthIndicatorComponent — Chapter progress bar
- StoryService, MemoryService, DragService, TreeLayoutService
- MemoryEchoPipe — Injects memory context into narrative text
- Aurora glassmorphism design system with CSS tokens
- GSAP animations: node entrance, wire drawing, drag physics, snap magnetic

### Out of Scope
- Backend API integration (stub services only)
- Persistence/localStorage (stub only)
- SSR optimization (future enhancement)
- Accessibility audit (separate task)

## Approach

1. **Core data layer first**: Models (node, story, memory, event) + StoryService + MemoryService
2. **Tree visualization**: TreeCanvasComponent with SVG rendering + TreeLayoutService
3. **Drag system**: DragService with GSAP + ChoiceCardComponent
4. **Narrative UI**: NarrativePanelComponent + EventCardComponent
5. **Memory system**: MemoryNotificationComponent + MemoryLogComponent + MemoryEchoPipe
6. **Supporting components**: StorySidebar, DepthIndicator
7. **Polish**: Aurora background, animations, responsive design

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/models/` | New | Data models for story tree, nodes, memories, events |
| `src/app/services/` | New | StoryService, MemoryService, DragService, TreeLayoutService |
| `src/app/components/tree-canvas/` | New | SVG tree with zoom/pan and branch stubs |
| `src/app/components/narrative-panel/` | New | Scene + events + choices display |
| `src/app/components/choice-card/` | New | Draggable choice cards |
| `src/app/components/event-card/` | New | Typed event cards |
| `src/app/components/memory-notification/` | New | RPG popup notifications |
| `src/app/components/memory-log/` | New | Memories sidebar |
| `src/app/components/story-sidebar/` | New | Stories list |
| `src/app/components/depth-indicator/` | New | Progress bar |
| `src/app/pipes/memory-echo.pipe.ts` | New | Memory context injection |
| `src/styles.css` | Modified | Aurora glassmorphism design tokens |
| `src/app/app.ts` | Modified | Root component orchestration |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| GSAP bundle size | Medium | Import only needed plugins (gsap core only) |
| SVG performance at scale | Low | Virtualize off-screen nodes for trees >100 nodes |
| Angular CDK drag conflicts | Low | Use custom mouse events (no native drag) |

## Rollback Plan

```bash
git checkout HEAD~1 -- src/app/ src/styles.css
```
Single revert commit restores clean state.

## Dependencies

- Angular 21 (already installed)
- GSAP ^3.12.5 (already installed)
- No new external dependencies

## Success Criteria

- [ ] All 9 components implemented with OnPush change detection
- [ ] TreeCanvas renders SVG tree with zoom/pan working
- [ ] Drag-and-drop commits choices with GSAP physics
- [ ] Memory notifications appear with correct timing
- [ ] MemoryEchoPipe correctly highlights relevant memories
- [ ] Aurora glassmorphism background renders smoothly
- [ ] No `any` types in models/services
- [ ] All components pass AXE accessibility checks
- [ ] `pnpm build` succeeds without warnings
