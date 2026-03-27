# Skill Registry — ChoosePath

## Project Context

| Field | Value |
|-------|-------|
| Project | ChoosePath |
| Path | ChoosePath/ |
| Tech Stack | Angular 21, TypeScript, TailwindCSS 4, Vitest, SSR |
| Package Manager | pnpm |

## User-Level Skills

These skills are available globally and can be used in any project context.

| Skill | Trigger | Description |
|-------|---------|-------------|
| `sdd-init` | `/sdd-init`, `sdd init`, `openspec init` | Initialize Spec-Driven Development context |
| `sdd-explore` | `/sdd-explore <topic>` | Explore and investigate ideas before committing to a change |
| `sdd-propose` | `/sdd-propose <change-name>` | Create a change proposal with intent, scope, and approach |
| `sdd-spec` | `/sdd-spec <change-name>` | Write specifications with requirements and scenarios |
| `sdd-design` | `/sdd-design <change-name>` | Create technical design document |
| `sdd-tasks` | `/sdd-tasks <change-name>` | Break down a change into implementation tasks |
| `sdd-apply` | `/sdd-apply <change-name>` | Implement tasks from the change |
| `sdd-verify` | `/sdd-verify <change-name>` | Validate implementation against specs |
| `sdd-archive` | `/sdd-archive <change-name>` | Sync specs to main and archive completed change |
| `branch-pr` | PR creation, opening PR, preparing for review | PR creation workflow following issue-first enforcement |
| `issue-creation` | Creating GitHub issue, bug report, feature request | Issue creation workflow |
| `judgment-day` | `judgment day`, `doble review`, `juzgar` | Parallel adversarial review protocol |
| `web-design-expert` | Build, design, style, improve web interfaces | Expert UI/UX design system |
| `living-backgrounds` | Animated backgrounds, dynamic backgrounds | Living background techniques |
| `gsap-core` | GSAP, JavaScript animations, easing | GSAP core API |
| `gsap-react` | GSAP with React/Next.js | GSAP React integration |
| `gsap-landing-animations` | Landing page animations, ScrollTrigger | GSAP landing animations |
| `drawio` | Draw.io diagrams | Generate draw.io diagrams |
| `drawio-bpmn` | BPMN diagrams, flowcharts, swimlanes | BPMN professional diagrams |
| `cv-manager` | CV updates, job changes, certifications | CV management system |
| `skill-creator` | Create new AI skills | Agent skill creation |

## Project Conventions

### From AGENTS.md

**TypeScript Best Practices:**
- Strict type checking
- Prefer type inference when obvious
- Avoid `any`; use `unknown` when uncertain

**Angular Best Practices:**
- Standalone components (default in Angular v20+)
- Signals for state management
- `input()` and `output()` functions (not decorators)
- `ChangeDetectionStrategy.OnPush`
- Native control flow (`@if`, `@for`, `@switch`)
- Reactive forms over template-driven
- No `ngClass`/`ngStyle`; use `class`/`style` bindings
- `inject()` for dependency injection

**Accessibility:**
- Must pass AXE checks
- Must follow WCAG AA (focus management, color contrast, ARIA)

### Testing

- Vitest configured in project
- Run tests: `pnpm test`

### Styling

- TailwindCSS 4 (imported via `@import 'tailwindcss'` in styles.css)
- Prettier with 100 char print width, single quotes

### Build

- Angular 21 with SSR via @angular/ssr
- pnpm package manager
- Strict TypeScript configuration

## Scanning Notes

- **Project path**: ChoosePath/
- **Source root**: ChoosePath/src
- **Test command**: `pnpm test`
- **Build command**: `pnpm build`
- **Dev server**: `pnpm start`
