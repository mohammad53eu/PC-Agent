import path from "path"
import fs from "fs/promises"
import { v4 as uuidv4 } from "uuid"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { createPdf } from "../../tools/createPdf"
import { mainResearch } from "../../tools/deepResearch"
import {
  ProgressTracker,
  WorkflowStep
} from "../../types/state"
import { GeneratedContent } from "../../types/content"
import { AgentState, AgentUpdate } from "../../core/stateManager"
import { FileOperation } from "../../types/operation"


export async function generateOther(state: AgentState): Promise<AgentUpdate> {
  const stepName = state.currentContentStepName!;
  const planStep = state.executionPlan.steps.find((s) => s.name === stepName)!

  if (!state.courseStructre.others) {
    throw new Error("No “others” array on courseStructure")
  }
  const otherMeta = state.courseStructre.others.find((o) => o.id === planStep.id)!

  const researchText = await mainResearch(otherMeta.description);
  console.log(researchText)
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-preview-05-20",
    temperature: 0.7
  })

  const messages = [
    {
      role: "system",
      content: `
You are an expert content generator.  
Given this metadata (title + description) and additional research text, produce a self‑contained HTML document (inline CSS) that presents:
  • A title page with "${otherMeta.title}"  
  • An introduction that weaves in the research findings  
  • Main content sections based on the description  
  • A conclusion or next‑steps section  

Return ONLY valid HTML starting with <!DOCTYPE html> and ending with </html>. No extra text.
`
    },
    {
      role: "user",
      content: JSON.stringify({
        metadata: otherMeta,
        research: researchText
      }, null, 2)
    }
  ]

  const aiResponse = await llm.invoke(messages)
  let html = aiResponse.content.toString().trim()

  if (!html.toLowerCase().startsWith("<!doctype")) {
    html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${otherMeta.title}</title></head><body>
${html}
</body></html>`
  }

  const root = state.executionPlan.outputStructure.rootFolder
  const targetFolder = planStep.targetFolder
  const outputDir = path.join(root, targetFolder)
  await fs.mkdir(outputDir, { recursive: true })

  const safeTitle = otherMeta.title.replace(/[^a-zA-Z0-9]/g, "_")
  const pdfPath = path.join(outputDir, `${safeTitle}.pdf`)
  const htmlPath = path.join(outputDir, `${safeTitle}.html`)

  await createPdf(otherMeta.title, html, pdfPath, htmlPath)

  const stats = await fs.stat(pdfPath);
  const op: FileOperation = {
    id: uuidv4(),
    type: "create",
    targetPath: pdfPath,
    status: "completed",
    metadata: {
      size: stats.size,
      type: "pdf",
      topics: [],
      lastModified: new Date()
    }
  }


  const gen: GeneratedContent = {
    id: uuidv4(),
    type: "other",
    subject: state.analyzedIntent.type,
    difficulty: "",
    content: html,
    filePath: pdfPath
  }

  const completed = (state.progress.completedSteps || 0) + 1;
  const progress: ProgressTracker = {
    totalSteps: state.progress.totalSteps,
    completedSteps: completed,
    currentStepName: "generate_other",
    estimatedTimeRemaining: state.progress.estimatedTimeRemaining
  }

  const step: WorkflowStep = {
    name: "generate_other",
    status: "completed",
    startTime: new Date(),
    endTime: new Date()
  }

  return {
    fileOperations: [op],
    generatedContent: [gen],
    progress,
    currentStep: step
  }
}
