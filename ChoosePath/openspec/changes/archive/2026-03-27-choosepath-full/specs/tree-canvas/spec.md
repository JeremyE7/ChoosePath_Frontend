# Tree Canvas Specification

## Purpose

Interactive SVG tree visualization with zoom/pan controls and branch stubs for future nodes.

## Requirements

### Requirement: SVG Viewport

The system SHALL render an SVG canvas containing the story tree.

#### Scenario: Initial Render

- GIVEN a story with nodes
- WHEN TreeCanvas mounts
- THEN SVG SHALL contain node circles and connecting wires

#### Scenario: Empty State

- GIVEN no story loaded
- THEN TreeCanvas SHALL display placeholder message

### Requirement: Zoom Controls

The system SHALL support zoom in/out within bounds (0.5x to 2x).

#### Scenario: Zoom In

- GIVEN viewport at current zoom
- WHEN zoom in button clicked
- THEN scale SHALL increase by 0.1, max 2x

#### Scenario: Zoom Out

- GIVEN viewport at current zoom
- WHEN zoom out button clicked
- THEN scale SHALL decrease by 0.1, min 0.5x

### Requirement: Pan Navigation

The system SHALL allow drag to pan the viewport.

#### Scenario: Pan Canvas

- GIVEN mouse down on SVG background (not on node)
- WHEN mouse moves
- THEN viewport SHALL translate following cursor

### Requirement: Branch Stubs

The system SHALL display stub nodes at choice endpoints.

#### Scenario: Unexplored Branch

- GIVEN a choice with no child node
- WHEN tree renders
- THEN a dashed circle SHALL appear at expected position

### Requirement: Node Interaction

The system SHALL emit selection events when nodes are clicked.

#### Scenario: Select Node

- GIVEN rendered node
- WHEN node circle clicked
- THEN component SHALL emit `nodeSelected` event with node data

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| story | Story | Story data to render |
| currentNodeId | string | Currently selected node |
| (nodeSelected) | EventEmitter | Emits selected node |
