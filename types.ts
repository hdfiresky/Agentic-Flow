export enum NodeType {
  START = 'START',
  AGENT = 'AGENT',
  END = 'END',
  CONDITIONAL_AGENT = 'CONDITIONAL_AGENT', // New type
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of chunks could be defined here if needed
}

export interface AgentNode {
  id: string;
  type: NodeType;
  description: string;
  x: number;
  y: number;
  output?: string;
  lastProcessedInput?: string;
  enableInternetSearch?: boolean; 
  groundingMetadata?: GroundingChunk[];
}

export interface AgentEdge {
  id: string;
  sourceId: string;
  targetId: string;
  conditionKeyword?: string; // New: For conditional routing
}

export interface ProcessLogEntry {
  timestamp: Date;
  message: string;
  nodeId?: string;
  status: 'info' | 'success' | 'error' | 'processing';
  groundingMetadata?: GroundingChunk[];
}