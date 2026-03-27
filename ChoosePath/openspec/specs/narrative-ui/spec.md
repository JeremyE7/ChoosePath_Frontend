# Narrative UI Specification

## Purpose

Story content display with choice cards and typed event cards.

## Requirements

### Requirement: NarrativePanel Layout

The system SHALL display current node content with events and choices.

#### Scenario: Display Node Content

- GIVEN active node with content
- WHEN NarrativePanel renders
- THEN panel SHALL show: title, body text, event cards, choice cards

#### Scenario: Memory Echo Text

- GIVEN node content with memory keywords
- WHEN content renders
- THEN MemoryEchoPipe SHALL highlight keywords with `<mark>` tags

### Requirement: ChoiceCard Component

The system SHALL display draggable choice cards with physics.

#### Scenario: Card Display

- GIVEN a choice object
- WHEN ChoiceCard renders
- THEN card SHALL show: icon, text, difficulty indicator

#### Scenario: Drag to Commit

- GIVEN user dragging choice card
- WHEN card released over drop zone
- THEN choice SHALL be committed and navigation triggered

#### Scenario: Magnetic Snap Animation

- GIVEN card dragging near commit zone
- WHEN within 50px
- THEN GSAP SHALL animate card snapping to zone center

### Requirement: EventCard Component

The system SHALL display typed event cards with appropriate styling.

#### Scenario: Event Types

- GIVEN event with type enemy/event/warning/mystery/memory
- WHEN EventCard renders
- THEN card SHALL display type icon, value, and type-specific color

#### Scenario: Enemy Event

- GIVEN enemy event with damage value
- THEN card SHALL show red styling and damage number

#### Scenario: Memory Event

- GIVEN memory event
- THEN card SHALL trigger MemoryService registration on mount

## Component Summary

| Component | Purpose |
|-----------|---------|
| NarrativePanel | Container for current scene |
| ChoiceCard | Draggable decision cards |
| EventCard | Typed consequence display |
