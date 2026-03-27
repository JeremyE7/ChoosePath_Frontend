# Memory System Specification

## Purpose

RPG-style memory notifications and accumulated memory tracking with echo injection.

## Requirements

### Requirement: MemoryNotification Component

The system SHALL display popup notifications for memory events.

#### Scenario: Memory Triggered

- GIVEN a memory event occurs
- WHEN MemoryNotification receives memory data
- THEN notification SHALL appear with fade-in animation

#### Scenario: Auto-dismiss

- GIVEN notification visible
- WHEN 3 seconds elapse
- THEN notification SHALL fade out and auto-dismiss

#### Scenario: Stack Multiple

- GIVEN notification already visible
- WHEN new memory triggers
- THEN new notification SHALL stack below previous

### Requirement: MemoryLog Component

The system SHALL display accumulated memories in sidebar.

#### Scenario: List Memories

- GIVEN memories registered
- WHEN MemoryLog renders
- THEN memories SHALL display in reverse chronological order

#### Scenario: Filter by Intensity

- GIVEN memories with different intensities
- WHEN filter toggled
- THEN list SHALL show only matching intensity level

#### Scenario: Empty State

- GIVEN no memories registered
- THEN MemoryLog SHALL show "No memories yet" message

### Requirement: MemoryEchoPipe

The system SHALL inject memory context into narrative text.

#### Scenario: Keyword Highlight

- GIVEN text "You enter the dark forest" with memory "dark forest"
- WHEN pipe transforms text
- THEN output SHALL be "You enter the <mark>dark forest</mark>"

#### Scenario: Multiple Keywords

- GIVEN text with multiple memory matches
- THEN ALL matching keywords SHALL be wrapped in `<mark>`

## Memory Flow

1. EventCard with memory type mounts
2. MemoryService.registerMemory() called
3. MemoryNotification displays popup
4. MemoryLog updates sidebar
5. NarrativePanel re-renders with MemoryEcho applied

## Pipe Signature

```typescript
MemoryEchoPipe.transform(value: string): string
// Returns HTML with <mark> tags for matched keywords
```
