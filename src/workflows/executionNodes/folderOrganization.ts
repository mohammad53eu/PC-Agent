import fs from "fs/promises";
import path from "path";
import { ProgressTracker } from "../../types/state";
import { v4 as uuidv4 } from "uuid";
import { AgentState, AgentUpdate } from "../../core/stateManager";
import { FileOperation } from "../../types/operation";

export async function folderOrganization(state: AgentState): Promise<AgentUpdate> {
    console.log("::::::::::::::folderOrganization::::::::::::::")
    const root = state.inputStructure.rootFolder
    const errors = state.errors

    const createFolders = state.executionPlan.steps.filter(
        (step) => step.stepType === "folder" && step.operation === "create"
    )
    
    const ops: FileOperation[] = []
    let completed = state.progress.completedSteps || 0
    const totalSteps = state.progress.totalSteps
    
    for (const step of createFolders) {
        const dirPath = path.join(root, step.name)

        try {
            await fs.mkdir(dirPath, {recursive: true})

            ops.push({
                id: uuidv4(),
                type: 'create',
                targetPath: dirPath,
                status: 'completed',
                metadata: {
                    size: 0,
                    type: "folder",
                    topics: [],
                    lastModified: new Date()
                }
            })

            completed++
        } catch (error) {
            ops.push({
                id: uuidv4(),
                type: "create",
                targetPath: dirPath,
                status: "failed",
                metadata: {
                    size: 0,
                    type: "folder",
                    topics: [],
                    lastModified: new Date()
                }
            })
            errors.push({
                id: uuidv4(),
                step: step.name,
                type: 'file_system',
                message: 'failed to create the folder',
                recoverable: true,
                timestamp: new Date()
            })
        }
    }

    const progress: ProgressTracker = {
        totalSteps,
        completedSteps: completed,
        currentStepName: "folder_organization",
        estimatedTimeRemaining: state.progress.estimatedTimeRemaining
    };

    return {
        fileOperations: ops,
        progress,
        currentStep: {
            name: "folder_organization",
            status: "completed",
            startTime: new Date(),
            endTime: new Date()
        }
    }
}

export function folderOrganizationRouteCondition(state: AgentState): "file_processing" | "content_creation" | "hybrid" {
  console.log(":::::::::::::::::::folderOrganizationRouteCondition::::::::::::::::::::")
    
    
    switch (state.analyzedIntent.type) {
    case "file_processing":
      return "file_processing"

    case "content_creation":
      return "content_creation"

    case "hybrid": 
      return "hybrid"
  }
}