import { AgentState, AgentUpdate } from "../../core/stateManager";
import { ExecutionPlan, FolderStructure, PlanStep } from "../../types/plan";
import { getFolderStructure } from "../../tools/fileOperations";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod"

export async function analyzeInputFolder(state: AgentState): Promise<AgentUpdate> {
  const userRequest = state.userMessages;
  const path = userRequest[0].filePath
  const folderPath = path.trim();
  console.log(":::::::::::analyze input folder::::::::::::::::: ", folderPath)

  const entries = getFolderStructure(folderPath);
  const subfolders = entries?.subfolders as string[]
  const expectedFiles = entries?.expectedFiles as string[]

  const structure: FolderStructure = {
    rootFolder: folderPath,
    subfolders: subfolders,
    expectedFiles: expectedFiles
  };

  console.log("folder content: ", structure)

  return {
    inputStructure: structure,
    currentStep: {
      name: 'input_folder',
      status: 'completed',
      startTime: new Date(),
      endTime: new Date()
    }
  };
}


export async function createDetailedPlan(state: AgentState): Promise<AgentUpdate> {
 
  console.log(":::::::::::createDetailedPlan::::::::::" )
  const executionPlanSchema = z.object({
  summary: z.string().describe("A one- or two-sentence overview of the planned workflow"),
  steps: z
    .array(
      z.object({
        id: z.string().describe("Unique identifier for this plan step"),
        name: z.string().describe("the name of the folder that contains the step"),
        stepNumber: z.number().describe("Sequential position of this step in the plan"),
        description: z.string().describe("Detailed description of what this step will do"),
        targetFolder: z
          .string()
          .describe("Name of the subfolder where this step’s output will go"),
        estimatedDuration: z.string().describe("Human‑readable time estimate for this step"),
        dependencies: z
          .array(z.string().describe("IDs of steps that must complete first"))
          .describe("Prerequisite step IDs"),
        stepType: z
          .enum(["folder", "exam", "readme", "Chapter", "other"])
          .describe("Type of artifact: folder, exam‑PDF, chapter‑PDF, readme, or generic file"),
        operation: z
          .enum(["read","create","move","delete","analyze"])
          .describe("Filesystem operation required for this step")
      })
    )
    .describe("Ordered list of actionable steps to execute the plan"),
  estimatedTime: z
    .number()
    .describe("Total estimated time in minutes for executing the full plan"),
  outputStructure: z
    .object({
      rootFolder: z.string().describe("Path where all output will be written"),
      subfolders: z
        .array(z.string().describe("Names of subfolders to create"))
        .describe("List of planned subfolder names"),
      expectedFiles: z
        .array(z.string().describe("Relative paths of files to generate"))
        .describe("List of files expected once execution completes")
    })
    .describe("Blueprint of the folder/file structure this plan will produce"),
  requirements: z
    .array(
      z
        .enum(["read","create","move","delete","analyze"])
        .describe("Agent capability needed for this plan")
    )
    .describe("List of AgentCapabilities required to fulfill this plan"),
  risks: z
    .array(z.string().describe("Description of a potential risk"))
    .describe("Known risks associated with executing this plan")
});


  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-preview-05-20",
    temperature: 0
  }).withStructuredOutput(executionPlanSchema as any);

  const combinedMessages = state.userMessages
    .map(msg => msg.content)
    .join('\n\n');

const messages = [
  { role: "system",
    content: `
You are an expert AI assistant that generates executable plans for a desktop agent.
Given a user’s request, the detected folder structure, and this ExecutionPlan JSON schema,
you must return one and only one JSON object that exactly matches the schema and contains only actionable steps.

Rules:
- Each step must correspond to one filesystem action: creating a folder, generating a PDF (exam or chapter), or writing a README.md.
- All generated documents are PDFs except README.md.
- Do not include analysis‑only or conceptual steps.
- In content creation, include exams only if the user explicitly asked for them.
- Use the schema below for your output; return nothing else but valid JSON:

${executionPlanSchema.toString()}
    `.trim()},
  {
    role: "user",
    content: JSON.stringify({
      userRequest: combinedMessages,
      intent: state.analyzedIntent,
      inputStructure: state.inputStructure ?? { rootFolder: "", subfolders: [], expectedFiles: [] }
    })
  }
];

const plan = await llm.invoke(messages) as ExecutionPlan;
  

  console.log("execution plan: ", plan.outputStructure)

  return {
    executionPlan: plan,
    currentStep: {
      name: "detailed_planning",
      status: "completed",
      startTime: new Date(),
      endTime: new Date()
    }
  };
}

export async function presentPlanToUser(state: AgentState): Promise<AgentUpdate> {

  return {
    executionPlan: state.executionPlan,
    awaitingApproval: true,
    currentStep: {
      name: 'plan_presentation',
      status: 'completed',
      startTime: new Date(),
      endTime: new Date()
    }
  };
}

export function checkPlanApproval(state: AgentState): "approved" | "rejected" {
  
  console.log("::::::::::checkPlanApproval::::::::")
  state.planApproved == true
  // if (state.planApproved === true) {
  //   return "approved";
  // } else {
  //   return "rejected";
  // }
  return "approved"
}