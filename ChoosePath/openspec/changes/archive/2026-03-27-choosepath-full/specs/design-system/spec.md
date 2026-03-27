# Aurora Design System Specification

## Purpose

Glassmorphism design tokens and animations for immersive story experience.

## Requirements

### Requirement: Aurora Background

The system SHALL render animated aurora gradient background.

#### Scenario: Animated Gradient

- GIVEN app shell
- WHEN initial render completes
- THEN aurora background SHALL display with continuous animation

#### Scenario: Performance

- GIVEN aurora animation running
- WHEN GPU acceleration needed
- THEN animation SHALL use CSS `will-change: transform`

### Requirement: Glassmorphism Cards

The system SHALL style cards with blur backdrop and transparency.

#### Scenario: Card Styling

- GIVEN any card component
- WHEN card renders
- THEN card SHALL have: backdrop-filter blur, semi-transparent background, subtle border

#### Scenario: Elevated Cards

- GIVEN floating elements
- THEN elements SHALL have box-shadow for depth

### Requirement: CSS Design Tokens

The system SHALL define design tokens for consistent theming.

#### Scenario: Token Usage

- GIVEN components using design tokens
- THEN colors SHALL reference CSS variables for easy theming

#### Scenario: Dark Theme

- GIVEN aurora background
- THEN text SHALL maintain WCAG AA contrast (4.5:1 minimum)

### Requirement: GSAP Animations

The system SHALL implement entrance and interaction animations.

#### Scenario: Node Entrance

- GIVEN tree canvas rendering
- WHEN nodes appear
- THEN GSAP SHALL animate: scale 0→1, opacity 0→1, staggered by 50ms

#### Scenario: Wire Drawing

- GIVEN node connections
- WHEN tree renders
- THEN SVG paths SHALL draw from parent to child using stroke-dashoffset

## Design Token Reference

| Token | Value | Usage |
|-------|-------|-------|
| --aurora-primary | #6366f1 | Primary accent |
| --aurora-secondary | #8b5cf6 | Secondary accent |
| --aurora-tertiary | #ec4899 | Tertiary accent |
| --glass-bg | rgba(255,255,255,0.1) | Card backgrounds |
| --glass-border | rgba(255,255,255,0.2) | Card borders |
| --blur-amount | 12px | Backdrop blur |
| --shadow-soft | 0 8px 32px rgba(0,0,0,0.3) | Card shadows |
