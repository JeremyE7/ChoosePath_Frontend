# App Shell Specification

## Purpose

Supporting UI components for story management and progress indication.

## Requirements

### Requirement: StorySidebar Component

The system SHALL display saved stories list.

#### Scenario: Load Stories

- GIVEN stories exist in storage
- WHEN StorySidebar mounts
- THEN list SHALL display all saved stories with titles

#### Scenario: Select Story

- GIVEN story items in list
- WHEN story item clicked
- THEN StoryService.loadStory() SHALL be invoked

#### Scenario: Create New Story

- GIVEN sidebar with stories
- WHEN new story button clicked
- THEN StoryService SHALL create story and navigate to editor

#### Scenario: Empty State

- GIVEN no saved stories
- THEN sidebar SHALL show "Create your first story" prompt

### Requirement: DepthIndicator Component

The system SHALL show chapter/progress bar based on current depth.

#### Scenario: Display Progress

- GIVEN current node depth and max depth
- WHEN DepthIndicator renders
- THEN progress bar SHALL fill proportionally (depth / maxDepth)

#### Scenario: Update on Navigation

- GIVEN progress indicator at certain level
- WHEN user navigates to deeper node
- THEN progress bar SHALL update to reflect new depth

#### Scenario: Chapter Labels

- GIVEN configurable chapter thresholds
- WHEN depth crosses threshold
- THEN label SHALL display chapter number

## Component Props

| Component | Inputs | Outputs |
|-----------|--------|---------|
| StorySidebar | - | storySelected, newStory |
| DepthIndicator | depth, maxDepth, chapters | - |
