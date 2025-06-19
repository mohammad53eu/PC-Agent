import { RequestIntent, UserMessage, UserRequest } from "../types"
import { CourseStructure, GeneratedContent } from "../types/content"
import { FileOperation } from "../types/operation"
import { Checkpoint, AgentError, WorkflowStep, ProgressTracker  } from "../types/state"
import { Annotation } from "@langchain/langgraph"
import { ExecutionPlan, FolderStructure } from "../types/plan"

export const agentAnnotation = Annotation.Root({
  requestId:   Annotation<string>(),
  userMessages:  Annotation<UserMessage[]>({
  reducer: (existing, update) => [...existing, ...update]
  }),
  analyzedIntent: Annotation<RequestIntent>(),
  // thanksMessage: Annotation<string>(),

  inputStructure: Annotation<FolderStructure>(),
  executionPlan: Annotation<ExecutionPlan>(),
  planApproved: Annotation<boolean>(),
  awaitingApproval: Annotation<boolean>(),
  courseStructre: Annotation<CourseStructure>(),

  currentStep: Annotation<WorkflowStep>(),

  contentStepIndex: Annotation<number>(),
  currentContentStepName: Annotation<string | null>(),

  fileOperations: Annotation<FileOperation[]>({
    reducer: (existing, update) => [...existing, ...update]
  }),
  generatedContent: Annotation<GeneratedContent[]>({
    reducer: (existing, update) => [...existing, ...update]
  }),
  errors: Annotation<AgentError[]>({
    reducer: (existing, update) => [...existing, ...update]
  }),
  progress: Annotation<ProgressTracker>(),
  checkpoints: Annotation<Checkpoint[]>()
})

export type AgentState = typeof agentAnnotation.State
export type AgentUpdate = typeof agentAnnotation.Update
