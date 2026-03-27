/**
 * Core data models for ChoosePath interactive story editor
 * 
 * These interfaces define the structure of story nodes, choices, events, and memories.
 */

/**
 * A single choice/decision that leads to another node
 */
export interface Choice {
  key: string;           // Letter key: 'A', 'B', 'C'
  text: string;          // Full choice text
  nextNodeId: string | null;  // Template node to create (null = not yet written)
}

/**
 * Event that occurs at a node - represents consequences or information
 */
export interface EventItem {
  type: 'enemy' | 'event' | 'warning' | 'mystery' | 'memory';
  who: string;          // Character or entity involved
  description: string;  // Description of the event
}

/**
 * A single node in the story tree
 */
export interface StoryNode {
  id: string;            // Unique identifier
  label: string;         // Short label shown on tree node
  scene: string;         // Narrative text (HTML supported)
  choices: Choice[];      // Available choices at this node
  events: EventItem[];   // Events that occurred at this node
  memoryKeys: string[];   // Keys for memories triggered by this node
  childIds: string[];    // IDs of child nodes (created after choice)
}

/**
 * Memory entry stored when player makes certain choices
 */
export interface Memory {
  key: string;           // Unique key (e.g., 'drace_agente_kael')
  who: string;          // Character name
  text: string;          // Memory description
  nodeId: string;       // Node ID where memory was triggered
}

/**
 * Tree node position for SVG rendering
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * SVG ViewBox configuration
 */
export interface ViewBox {
  x: number;      // Left position
  y: number;      // Top position  
  w: number;      // Viewport width (alias for width)
  h: number;      // Viewport height (alias for height)
  width?: number;   // Viewport width (optional for compatibility)
  height?: number;  // Viewport height (optional for compatibility)
}

/**
 * Stats for the current story
 */
export interface StoryStats {
  nodeCount: number;     // Total nodes created
  maxDepth: number;     // Deepest level reached
  branchCount: number;  // Total choices made
}

/**
 * A node template as stored in the story JSON.
 * Does not include runtime fields (id, childIds) which are managed by StoryService.
 */
export interface StoryNodeTemplate {
  label: string;
  scene: string;
  choices: Choice[];
  events: EventItem[];
  memoryKeys: string[];
}

/**
 * Complete story data structure loaded from JSON/API.
 */
export interface StoryData {
  title: string;
  rootNodeId: string;
  nodes: Record<string, StoryNodeTemplate>;
}

/**
 * Event type colors for UI
 */
export const EVENT_COLORS: Record<EventItem['type'], { color: string; background: string }> = {
  enemy: { color: '#f0567a', background: 'rgba(240,86,122,.07)' },
  event: { color: '#4a7cf7', background: 'rgba(74,124,247,.07)' },
  warning: { color: '#f59e0b', background: 'rgba(245,158,11,.07)' },
  mystery: { color: '#8b5cf6', background: 'rgba(139,92,246,.07)' },
  memory: { color: '#10b981', background: 'rgba(16,185,129,.07)' },
};

/**
 * Tree node visual colors by depth level
 */
export const DEPTH_COLORS = [
  { fill: 'rgba(74,124,247,.12)', stroke: '#4a7cf7', text: '#2556e0' },
  { fill: 'rgba(14,184,160,.1)', stroke: '#0eb8a0', text: '#087060' },
  { fill: 'rgba(139,92,246,.1)', stroke: '#8b5cf6', text: '#6030c0' },
  { fill: 'rgba(245,158,11,.1)', stroke: '#f59e0b', text: '#a06000' },
  { fill: 'rgba(240,86,122,.1)', stroke: '#f0567a', text: '#b03050' },
  { fill: 'rgba(16,185,129,.1)', stroke: '#10b981', text: '#077050' },
];

/**
 * Tree layout configuration
 */
export const TREE_CONFIG = {
  nodeWidth: 122,
  nodeHeight: 33,
  horizontalGap: 42,
  verticalGap: 70,
  snapRadius: 80,
  rootX: 150,
  rootY: 100,
};
