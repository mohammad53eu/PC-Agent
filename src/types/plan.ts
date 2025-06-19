import { AgentCapability } from "."

export interface ExecutionPlan {
  summary: string
  steps: PlanStep[]
  estimatedTime: number
  outputStructure: FolderStructure
  requirements: AgentCapability[]
  risks: string[]
}

export interface PlanStep {
  id: string
  name: string
  stepNumber: number
  description: string
  targetFolder: string
  estimatedDuration: string
  dependencies: string[]
  stepType: 'folder' | 'exam' | 'readme' | 'Chapter' | 'other'
  operation: 'read' | 'create' | 'move' | 'delete' | 'analyze'
}

export interface FolderStructure {
  rootFolder: string
  subfolders: string[]
  expectedFiles: string[]
}
