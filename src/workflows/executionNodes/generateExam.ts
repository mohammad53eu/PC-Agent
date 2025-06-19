import path from "path"
import fs from "fs/promises"
import { v4 as uuidv4 } from "uuid"
import { AgentState, AgentUpdate } from "../../core/stateManager"
import { FileOperation } from "../../types/operation"
import { GeneratedContent } from "../../types/content"
import { ProgressTracker, WorkflowStep } from "../../types/state"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { createPdf } from "../../tools/createPdf"


export async function generateExam(state: AgentState): Promise<AgentUpdate> {
  const stepName = state.currentContentStepName!
  const planStep = state.executionPlan.steps.find((s) => s.name === stepName)!
  
  if (!state.courseStructre.exams) throw new Error
  const exam = state.courseStructre.exams.find((e) => e.id === planStep.id)!

  console.log("exam data:", exam)
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-preview-05-20",
    temperature: 0.7
  })
  
  const messages = [
    {
      role: "system",
      content: `
You are an expert technical course author and assessment designer.
Given the following Exam metadata as JSON, produce a complete, self-contained HTML exam document (with inline CSS).
EXAM STRUCTURE REQUIREMENTS:

Total Length: 5-7 pages when printed
Question Distribution:

30% Multiple Choice Questions (4-5 options each)
25% Short Answer Questions (2-3 sentences expected)
25% Medium Answer Questions (paragraph-length responses)
20% Essay/Long Answer Questions (detailed responses)

DOCUMENT STRUCTURE:

Title Page (0.5 pages)

Course title, exam title, instructions
Time limit, scoring information
Academic integrity statement

Question Sections (3.5-4.5 pages)

Section A: Multiple Choice (15-20 questions)
Section B: Short Answer (8-12 questions)
Section C: Medium Answer (5-8 questions)
Section D: Essay Questions (2-4 questions)

Answer Key (1-2 pages)

Complete answers for all sections
Scoring rubrics for essay questions

FORMATTING REQUIREMENTS:

Use clear headings (h1, h2, h3) for sections
Number all questions consecutively
Provide adequate white space for handwritten answers
Include point values for each question/section
Use professional formatting with consistent spacing

TECHNICAL REQUIREMENTS:

Valid HTML5 with DOCTYPE declaration
Inline CSS only (no external stylesheets)
Print-friendly styling (readable fonts, appropriate margins)
Responsive design that works on standard paper sizes

IMPORTANT: Generate realistic, course-appropriate content based on the provided metadata.
 Return ONLY valid HTML starting with <!DOCTYPE html> and ending with </html>. 
 No markdown, no code blocks, no additional text or explanations.
`
    },
    {
      role: "user",
      content: JSON.stringify(exam, null, 2)
    }
  ]
 
  const aiResponse = await llm.invoke(messages);
  let html = aiResponse.content.toString();

  html = html.replace(/^```html\s*/gm, '').replace(/^```\s*$/gm, '')
  html = html.trim()


  if (!html.toLowerCase().startsWith('<!doctype')) {
    html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>${exam.title}</title>\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }

  console.log('HTML content length:', html.length)
  console.log('HTML starts with:', html.substring(0, 100))
  console.log('HTML ends with:', html.substring(html.length - 100))

  const root = state.executionPlan.outputStructure.rootFolder
  const examDir = path.join(root, planStep.targetFolder)
  
  await fs.mkdir(examDir, { recursive: true })
  
  const pdfPath = path.join(examDir, `${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
  
  const htmlPath = path.join(examDir, `${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`)

  const file = await createPdf(exam.title, html, pdfPath, htmlPath)

  console.log("exam created")
  
  const op: FileOperation = {
    id: uuidv4(),
    type: "create",
    targetPath: pdfPath,
    status: "completed",
    metadata: {
      size: (await fs.stat(pdfPath)).size,
      type: "pdf",
      topics: [],
      lastModified: new Date()
    }
  }

  const gen: GeneratedContent = {
    id: uuidv4(),
    type: "exam",
    subject: state.analyzedIntent.type,
    difficulty: "",
    content: html,
    filePath: pdfPath
  }

  const completed = (state.progress.completedSteps || 0) + 1;
  const progress: ProgressTracker = {
    totalSteps: state.progress.totalSteps,
    completedSteps: completed,
    currentStepName: "generate_exam",
    estimatedTimeRemaining: state.progress.estimatedTimeRemaining
  }

  const step: WorkflowStep = {
    name: "generate_exam",
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
