import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { AgentState, AgentUpdate } from "../../core/stateManager"
import { FileOperation } from "../../types/operation";
import { GeneratedContent } from "../../types/content";
import { ProgressTracker, WorkflowStep } from "../../types/state";

export async function generateRootDocumentation(
  state: AgentState
): Promise<AgentUpdate> {
  console.log(":::::::::::::::::generateRootDocumentation::::::::::::::::::")
  const root = state.executionPlan.outputStructure.rootFolder;
  const readmePath = path.join(root, "README.md");

  const lines: string[] = [];

  lines.push(`# Execution Summary\n`);
  lines.push(`**Plan Overview**\n`);
  lines.push(`> ${state.executionPlan.summary}\n`);

  lines.push(`\n**Generated Files:**\n`);
  for (const content of state.generatedContent) {
    lines.push(`- \`${path.relative(root, content.filePath)}\``);
  }
  lines.push(`\n**Next Steps**\n`);
  lines.push(`- Review each generated file for accuracy and completeness.`);
  lines.push(`- Provide feedback or request revisions if needed.\n`);

  const markdown = lines.join("\n");

  await fs.writeFile(readmePath, markdown, "utf-8");

  const fileOp: FileOperation = {
    id: uuidv4(),
    type: "create",
    targetPath: readmePath,
    status: "completed",
    metadata: {
      size: Buffer.byteLength(markdown, "utf-8"),
      type: "readme",
      topics: [],
      lastModified: new Date()
    }
  };

  const genContent: GeneratedContent = {
    id: uuidv4(),
    type: "readme",
    subject: state.analyzedIntent.type,
    difficulty: "n/a",
    content: markdown,
    filePath: readmePath
  };

  const completed = (state.progress.completedSteps || 0) + 1;
  const total = state.progress.totalSteps;
  const progress: ProgressTracker = {
    totalSteps: total,
    completedSteps: completed,
    currentStepName: "rootDocumentationGeneration",
    estimatedTimeRemaining: state.progress.estimatedTimeRemaining
  };

  const step: WorkflowStep = {
    name: "rootDocumentationGeneration",
    status: "completed",
    startTime: new Date(),
    endTime: new Date()
  };
  console.log(":::::::::::::::::generateRootDocumentation :::::::finished:::::::::::")
  console.log("generated at: ", readmePath)
  console.log("workflowstep: ", step)

  return {
    fileOperations: [fileOp],
    generatedContent: [genContent],
    progress,
    currentStep: step
  };
}
