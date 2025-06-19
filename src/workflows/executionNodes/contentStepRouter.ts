import { PlanStep } from "../../types/plan";
import { AgentState, AgentUpdate } from "../../core/stateManager";

export function contentStepRouter(state: AgentState): AgentUpdate {
  console.log(":::::::::::::contentStepRouter::::::::::::")
  const actionableSteps: PlanStep[] = state.executionPlan.steps.filter(
    (step) =>
      step.operation === "create" &&
      ["exam", "readme", "Chapter", "other"].includes(step.stepType)
  );
  console.log("the actionableSteps are: ", actionableSteps)
  const idx = state.contentStepIndex ?? 0;

  console.log("idx value: ", idx)

  if (idx >= actionableSteps.length) {
    return {
      currentContentStepName: null,
      currentStep: {
        name: "content_step_router",
        status: "completed",
        startTime: new Date(),
        endTime: new Date(),
        output: "done"
      }
    };
  }

  const next = actionableSteps[idx]

  console.log("in contentStepRouter, the next step: \n",idx+1, "\n\n", next.stepType,"\n\n", next.stepNumber, "\n\n", next.stepNumber)
  return {
    contentStepIndex: idx + 1,
    currentContentStepName: next.name,
    currentStep: {
      name: "content_step_router",
      status: "completed",
      startTime: new Date(),
      endTime: new Date(),
      output: next.stepType
    }
  };
}


export function contentStepRouterCondition(
  state: AgentState
): 
"exam" | "readme" | "Chapter" | "other" | "done"{
  console.log(":::::::::::::::::::contentStepRouterCondition::::::::::::::::::::")
  console.log("current step output: ", state.currentStep.output)
  console.log("current content step: ", state.currentContentStepName)
  console.log("current step name: ", state.currentStep.name)

  state.currentStep.output === "chapter"? console.log("yes it is :D"): console.log("nope it isn't")

  const stepIndex = state.contentStepIndex
  console.log("stepIndex: ", stepIndex)
  const currentStep = state.executionPlan.steps.find((s) => s.stepNumber === stepIndex)
  console.log("stepIndex: ", stepIndex)
  const stepOutput = state.currentStep.output as "exam" | "readme" | "Chapter" | "other"
  stepOutput === "Chapter"? console.log("it is now :D"): console.log("nope still isn't")

  console.log(stepOutput)
  switch (stepOutput) {
    case "exam":
      return "exam"

    case "readme":
      return "readme"

    case "Chapter": 
      return "Chapter"
    
    case "other": 
      return "other"
    
    default:
      return "done"
  }
}