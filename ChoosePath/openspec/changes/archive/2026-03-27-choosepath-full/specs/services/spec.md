# Services Specification

## Purpose

Business logic services for story management, memory tracking, drag interactions, and tree layout calculation.

## Requirements

### Requirement: StoryService

The system SHALL provide a StoryService managing story state and navigation.

#### Scenario: Load Story

- GIVEN no active story
- WHEN `loadStory(id)` is called
- THEN the service SHALL fetch story data and set active node

#### Scenario: Navigate to Choice

- GIVEN an active story with current node
- WHEN user selects a choice
- THEN the service SHALL update current node and depth

### Requirement: MemoryService

The system SHALL track memories and provide echo text injection.

#### Scenario: Register Memory

- GIVEN a memory event triggers
- WHEN `registerMemory(memory)` is called
- THEN memories array SHALL include new memory with timestamp

#### Scenario: Get Echo Context

- GIVEN existing memories
- WHEN `getEchoContext(text)` is called
- THEN the returned text SHALL highlight memory keywords with markers

### Requirement: DragService

The system SHALL handle drag physics with GSAP integration.

#### Scenario: Initialize Card Drag

- GIVEN a ChoiceCard component mounted
- WHEN mouse down on card
- THEN DragService SHALL create GSAP Draggable instance

#### Scenario: Magnetic Snap

- GIVEN card being dragged near drop zone
- WHEN distance < magnetic threshold (50px)
- THEN GSAP SHALL animate card to snap position

### Requirement: TreeLayoutService

The system SHALL calculate SVG positions for tree nodes.

#### Scenario: Calculate Node Positions

- GIVEN a story tree with nodes
- WHEN `calculateLayout(root)` is called
- THEN each node SHALL have `x`, `y` coordinates based on depth-first layout

## Services Summary

| Service | Responsibility |
|---------|----------------|
| StoryService | Story CRUD, current node, navigation |
| MemoryService | Memory registry, echo injection |
| DragService | GSAP drag physics, magnetic snap |
| TreeLayoutService | Tree layout algorithm, position calculation |
