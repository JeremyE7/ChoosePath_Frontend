/**
 * TypeScript interfaces for the story generation API endpoints.
 * All request/response shapes are strictly typed.
 */

// ── Shared sub-types ─────────────────────────────────────────────────────────

export interface ChoiceShape {
  key: string;           // 'A', 'B', 'C'
  text: string;          // Choice display text
  nextNodeId: string;    // Semantic ID of the destination node (e.g. "taverna_b")
  deadly?: boolean;      // Whether this choice leads to death
}

export interface EventShape {
  type: 'enemy' | 'event' | 'warning' | 'mystery' | 'memory';
  who: string;           // Entity/character name
  description: string;  // Short event description
}

export interface NodeShape {
  label: string;         // Short label for the tree (max ~4 words)
  scene: string;         // Full narrative paragraph (HTML: <em> for emphasis)
  choices: ChoiceShape[];
  events: EventShape[];
  memoryKeys: string[];  // Keys referencing MemoryShape entries
  isDeath?: boolean;     // Whether this node is a death scene
}

export interface MemoryShape {
  key: string;           // Unique key (e.g. "met_capitana_serafina")
  who: string;           // Character/entity name
  text: string;          // One-line memory description
}

// ── /api/stories/generate ────────────────────────────────────────────────────

/** Body sent by the client to generate a brand-new story */
export interface GenerateRequest {
  theme: string;   // e.g. "pirates in a haunted sea"
  genre: string;   // e.g. "dark fantasy"
  tone: string;    // e.g. "mysterious and melancholic"
  language: string; // e.g. "es" | "en"
}

/** Full story with 3 levels of nodes returned from /generate */
export interface GenerateResponse {
  title: string;
  rootNodeId: string;
  nodes: Record<string, NodeShape>;
  memories: Record<string, MemoryShape>;
}

// ── /api/stories/continue ────────────────────────────────────────────────────

/** A visited node entry to provide AI full story context */
export interface VisitedNode {
  nodeId: string;
  label: string;
  scene: string;
  choiceTaken: string | null;  // Text of the choice the player picked (null if leaf)
}

/** Active memory the AI should be aware of */
export interface ActiveMemory {
  key: string;
  who: string;
  text: string;
}

/** Body sent to /continue to generate the next single node */
export interface ContinueRequest {
  storyTitle: string;
  theme: string;
  genre: string;
  tone: string;
  language: string;
  history: VisitedNode[];      // All visited nodes in order
  activeMemories: ActiveMemory[];
  parentNodeId: string;        // The node from which the player chose
  chosenText: string;          // The choice text that was selected
  targetNodeId: string;        // The node ID to generate (already defined in JSON as nextNodeId)
  depth: number;               // Current depth level (1-based)
  isDeath?: boolean;            // Whether the chosen option was deadly (generate death scene)
}

/** Single node + any new memories returned from /continue */
export interface ContinueResponse {
  nodeId: string;
  node: NodeShape;
  newMemories: Record<string, MemoryShape>;
}

// ── /api/stories/regenerate ──────────────────────────────────────────────────

/** Body sent to /regenerate to rewrite a branch from a given node */
export interface RegenerateRequest {
  storyTitle: string;
  theme: string;
  genre: string;
  tone: string;
  language: string;
  historyUpToBranch: VisitedNode[];  // History UP TO (not including) the branch node
  activeMemories: ActiveMemory[];
  branchNodeId: string;              // Node to regenerate from
  branchDepth: number;               // Depth of the branch node
  levels: number;                    // How many levels deep to regenerate (default: 3)
}

/** Subtree returned from /regenerate */
export interface RegenerateResponse {
  rootNodeId: string;
  nodes: Record<string, NodeShape>;
  newMemories: Record<string, MemoryShape>;
}

// ── Gemini HTTP API ──────────────────────────────────────────────────────────

export interface GeminiRequest {
  contents: { role: string; parts: { text: string }[] }[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
}
