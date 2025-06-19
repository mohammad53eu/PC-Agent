import { AgentState, AgentUpdate } from "../../core/stateManager";

export async function routeExecutionNode(state: AgentState): Promise<AgentUpdate> {

    const currentStep = state.currentStep

    console.log(":::::::::::routeExecutionNode:::::::::::")
    console.log(currentStep)

    const totalSteps = state.executionPlan.steps.length

    return {
        currentStep: {
            name: 'routeExecution',
            status: 'completed',
            startTime: new Date(),
            endTime: new Date()
        },
        progress: {
          totalSteps: totalSteps,
          completedSteps: 0,
          currentStepName: "",
          estimatedTimeRemaining: 8
        }
    }
}

export function routeExecutionCondition(state: AgentState): 'file_processing' | 'content_creation' | 'hybrid' {
  console.log(":::::::::::routeExecutionCondition:::::::::::")

  switch (state.analyzedIntent.type) {
    case "file_processing":
      return "file_processing"

    case "content_creation":
      return "content_creation"

    case "hybrid": 
      return "hybrid"
  }
}
