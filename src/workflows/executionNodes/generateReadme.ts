import { AgentState, AgentUpdate } from "../../core/stateManager";
import { ProgressTracker } from "../../types/state";

export async function generateReadme(state: AgentState): Promise<AgentUpdate> {
    console.log(":::::::::::::::::generateReadme:::::::::::::::::::")
    
    const completed = (state.progress.completedSteps || 0) + 1
          const total = state.progress.totalSteps
          const progress: ProgressTracker = {
            totalSteps: total,
            completedSteps: completed,
        currentStepName: "generate_chapter",
        estimatedTimeRemaining: state.progress.estimatedTimeRemaining
      }
    return {
     progress
    }
}