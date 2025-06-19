export interface RequestIntent {
  type: 'file_processing' | 'content_creation' | 'hybrid'
  requiredCapabilities: AgentCapability[]
}

export type AgentCapability = 'read' | 'create' | 'move' | 'delete' | 'analyze'

export interface UserRequest {
  requestId: string
  userMessages: UserMessage[]
}

export type UserAction = 
    'approve'
  | 'reject'
  | 'modify'

export interface UserMessage {
  id: string
  content: string
  filePath: string
  timestamp: Date
  actions?: UserAction[]
}
