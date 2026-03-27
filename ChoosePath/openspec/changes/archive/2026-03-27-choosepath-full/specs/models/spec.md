# Data Models Specification

## Purpose

Core data structures for interactive story trees with branching narratives, memory tracking, and typed events.

## Requirements

### Requirement: StoryNode Model

The system SHALL define a `StoryNode` interface representing a single story moment with optional choices leading to child nodes.

#### Scenario: Basic Story Node

- GIVEN a story editor with an active story
- WHEN a new node is created without children
- THEN the node SHALL contain: `id`, `title`, `content`, `depth`, and empty `choices` array

#### Scenario: Choice Node with Children

- GIVEN a decision point in the story
- WHEN choices are added to a node
- THEN each choice SHALL reference a child node's `id` and display text

### Requirement: Event Model

The system SHALL define an `Event` interface with typed consequences affecting story state.

#### Scenario: Enemy Event

- GIVEN a story node with an enemy event attached
- WHEN the node renders in narrative panel
- THEN the event card SHALL display event type icon and damage value

#### Scenario: Memory Event

- GIVEN a story node with a memory event
- WHEN the node renders
- THEN the MemoryService SHALL register the memory for echo injection

### Requirement: Memory Model

The system SHALL track player memories with metadata for echo highlighting.

#### Scenario: Memory Registration

- GIVEN a memory event triggers
- WHEN the memory is registered
- THEN the MemoryService SHALL store: `id`, `keyword`, `description`, `timestamp`, and `intensity`

## Requirements Summary

| Model | Key Properties |
|-------|----------------|
| StoryNode | id, title, content, depth, choices[], events[] |
| Event | id, type (enemy/event/warning/mystery/memory), value, description |
| Memory | id, keyword, description, timestamp, intensity |
| Story | id, title, rootNodeId, metadata |
