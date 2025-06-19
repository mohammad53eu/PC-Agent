import { RequestIntent, UserMessage } from "."
import { GeneratedContent } from "./content"
import { FileOperation } from "./operation"

export interface AgentStates {
  requestId: string
  currentStep: WorkflowStep
  userRequest: UserMessage[]
  analyzedIntent: RequestIntent
  fileOperations: FileOperation[]
  generatedContent: GeneratedContent[]
  errors: AgentError[]
  progress: ProgressTracker
  checkpoints: Checkpoint[]
}

export interface WorkflowStep {
  name: string
  status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
  output?: string
}

export interface ProgressTracker {
  totalSteps: number
  completedSteps: number
  currentStepName: string
  estimatedTimeRemaining: number
}

export interface AgentError {
  id: string
  step: string
  type: 'file_system' | 'llm' | 'validation' | 'system'
  message: string
  recoverable: boolean
  timestamp: Date
}
  
export interface Checkpoint {
  id: string
  stepName: string
  state: AgentStates
  timestamp: Date
  rollbackPossible: boolean
}