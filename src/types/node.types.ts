export type NodeType =
  | 'opening'
  | 'hook'
  | 'discovery'
  | 'qualification'
  | 'presentation'
  | 'cta'
  | 'objections'
  | 'response-positive'
  | 'response-neutral'
  | 'response-negative'
  | 'followup';

export type MethodologyType = 'SPIN' | 'GPCT' | 'BANT';

export interface MindMapNodeData {
  id: string;
  type: NodeType;
  methodology?: MethodologyType;
  title: string;
  content: string;
  phase?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  children?: string[];
  isCollapsed?: boolean;
  level?: number;
}

export interface ProspectInfo {
  name?: string;
  company?: string;
  role?: string;
  industry?: string;
  painPoints?: string[];
}

export interface Message {
  role: 'sdr' | 'prospect' | 'ai-suggestion';
  content: string;
  phase: string;
  timestamp: Date;
}

export interface ConversationContext {
  templateId: string;
  currentPhase: string;
  conversationHistory: Message[];
  prospectInfo: ProspectInfo;
  previousResponses: string[];
}
