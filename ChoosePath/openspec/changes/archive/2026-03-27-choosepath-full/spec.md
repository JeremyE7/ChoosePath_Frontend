# choosepath-full — Delta Specification

## ADDED Requirements

### Requirement: Data Models

The system MUST define TypeScript interfaces for StoryNode, Event, Memory, and Story with strict typing (no `any`).

#### Scenario: StoryNode Structure
- GIVEN story editor active
- WHEN node created
- THEN node contains: id, title, content, depth, choices[], events[]

#### Scenario: Event Types
- GIVEN event card renders
- THEN event SHALL display type icon (enemy/event/warning/mystery/memory) with type-specific styling

### Requirement: Core Services

The system MUST provide StoryService, MemoryService, DragService, and TreeLayoutService with signals-based state.

#### Scenario: Story Navigation
- GIVEN active story
- WHEN user selects choice
- THEN StoryService updates current node and depth via signal

#### Scenario: Memory Registration
- GIVEN memory event triggers
- WHEN MemoryService.registerMemory() called
- THEN memory stored with timestamp, keyword, intensity

#### Scenario: Drag Physics
- GIVEN card being dragged
- WHEN near drop zone (<50px)
- THEN GSAP animates magnetic snap

### Requirement: TreeCanvas Component

The system MUST render SVG tree with zoom/pan and emit node selection events.

#### Scenario: Tree Render
- GIVEN story with nodes
- WHEN canvas mounts
- THEN SVG displays nodes, wires, branch stubs

#### Scenario: Zoom Bounds
- GIVEN zoom control
- THEN zoom SHALL stay within 0.5x–2x range

### Requirement: NarrativePanel Component

The system MUST display current node content with memory-echo highlighting.

#### Scenario: Echo Injection
- GIVEN text with memory keywords
- WHEN rendered through MemoryEchoPipe
- THEN keywords wrapped in `<mark>` tags

### Requirement: ChoiceCard Draggable

The system MUST enable drag-to-commit choices with GSAP physics.

#### Scenario: Drag Commit
- GIVEN card dragged to drop zone
- WHEN mouse released
- THEN choice committed, navigation triggered

### Requirement: MemoryNotification RPG Popup

The system MUST display popup notifications that auto-dismiss after 3 seconds.

#### Scenario: Memory Popup
- GIVEN memory event
- THEN notification appears with fade-in, auto-dismisses after 3s

### Requirement: Aurora Glassmorphism Design

The system MUST implement animated aurora background with glassmorphism cards.

#### Scenario: Glass Effect
- GIVEN any card component
- THEN card has backdrop-filter blur, semi-transparent bg, subtle border

#### Scenario: GSAP Entrance
- GIVEN tree canvas render
- THEN nodes animate scale 0→1, opacity 0→1, staggered 50ms

### Requirement: StorySidebar Component

The system MUST display saved stories and create new stories.

#### Scenario: Story Selection
- GIVEN story items in list
- WHEN item clicked
- THEN StoryService.loadStory() invoked

### Requirement: DepthIndicator Component

The system MUST show progress bar based on current depth.

#### Scenario: Progress Update
- GIVEN depth changes
- THEN progress bar fills proportionally to maxDepth

## Technical Constraints

- All components MUST use `ChangeDetectionStrategy.OnPush`
- All models MUST avoid `any` types; use `unknown` when uncertain
- All services MUST use `providedIn: 'root'` and `inject()` function
- GSAP MUST import only required plugins (core + Draggable)
- Aurora background MUST use `will-change: transform` for GPU acceleration

## Success Criteria

| Criterion | Validation |
|-----------|------------|
| TreeCanvas zoom/pan | Interactive within 0.5x–2x |
| Drag physics | GSAP magnetic snap functional |
| Memory notifications | Auto-dismiss at 3s |
| MemoryEchoPipe | Keywords highlighted with `<mark>` |
| Aurora background | Smooth 60fps animation |
| Accessibility | Passes AXE checks |
