import path from "path"
import fs from "fs/promises"
import { v4 as uuidv4 } from "uuid"
import { AgentState, AgentUpdate } from "../../core/stateManager"
import { FileOperation } from "../../types/operation"
import { GeneratedContent } from "../../types/content"
import { ProgressTracker, WorkflowStep } from "../../types/state"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { createPdf } from "../../tools/createPdf"


export async function generateChapter(state: AgentState): Promise<AgentUpdate> {
  const stepName = state.currentContentStepName!
  const planStep = state.executionPlan.steps.find((s) => s.name === stepName)!

  if (!state.courseStructre.chapters) throw new Error
  
  const chapter = state.courseStructre.chapters.find((c) => c.id === planStep.id)!

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-preview-05-20",
    temperature: 0.7
  })
  
  const messages = [
    {
      role: "system",
      content: `
You are an expert technical course author and web designer.
Given the following Chapter metadata as JSON, produce a complete, self-contained HTML document (with inline CSS).
CHAPTER STRUCTURE REQUIREMENTS:

Total Length: 15-20 pages when printed
Content Distribution:

5% Title Page and Introduction
70% Main Chapter Content (concepts, explanations, examples)
15% Practice Exercises Section
10% Final Project Section



DOCUMENT STRUCTURE:

Title Page & Introduction (1 page)

Chapter title, number, and learning objectives
Brief chapter overview and prerequisites
Estimated completion time


Main Chapter Content (12-14 pages)

Section 1: Core Concepts (3-4 pages)

Fundamental theory and principles
Key definitions and terminology
Visual diagrams or illustrations (described in text)


Section 2: Detailed Explanations (4-5 pages)

Step-by-step processes and methodologies
Real-world applications and use cases
Code examples or technical demonstrations


Section 3: Advanced Topics (3-4 pages)

Complex scenarios and edge cases
Integration with other concepts
Best practices and common pitfalls


Section 4: Summary and Key Takeaways (1-2 pages)

Chapter recap and main points
Connection to next chapter topics




Practice Exercises Section (2-3 pages)

8-12 varied exercises including:

Basic comprehension questions
Hands-on practice problems
Critical thinking challenges
Application scenarios


Clear instructions and expected outcomes


Final Project Section (1-2 pages)

Comprehensive project that integrates chapter concepts
Detailed requirements and deliverables
Assessment criteria and rubric
Extension activities for advanced learners



CONTENT REQUIREMENTS:


FORMATTING REQUIREMENTS:

Professional academic layout with clear typography
Hierarchical heading structure (h1, h2, h3, h4)
Consistent spacing and margins for readability
Code blocks or technical content in monospace fonts
Proper paragraph breaks and section divisions
Print-friendly color scheme (high contrast, readable)

TECHNICAL REQUIREMENTS:

Valid HTML5 with complete document structure
All CSS styling inline (no external dependencies)
Responsive design optimized for both screen and print
Semantic HTML elements for accessibility
Professional fonts and spacing for academic content

IMPORTANT: Generate comprehensive, educational content based on the provided metadata.
 Ensure the content is substantive, technically accurate, and pedagogically sound. 
 Return ONLY valid HTML starting with <!DOCTYPE html> and ending with </html>. No markdown, no code blocks, no additional text or explanations.
`
    },
    {
      role: "user",
      content: JSON.stringify(chapter, null, 2)
    }
  ]
  
  const aiResponse = await llm.invoke(messages);
  let html = aiResponse.content.toString();

  html = html.replace(/^```html\s*/gm, '').replace(/^```\s*$/gm, '')
  html = html.trim()


  if (!html.toLowerCase().startsWith('<!doctype')) {
    html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>${chapter.title}</title>\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }

  console.log('HTML content length:', html.length)
  console.log('HTML starts with:', html.substring(0, 100))
  console.log('HTML ends with:', html.substring(html.length - 100))

  const root = state.executionPlan.outputStructure.rootFolder
  const chapterDir = path.join(root, planStep.targetFolder)
  
  await fs.mkdir(chapterDir, { recursive: true })
  
  const pdfPath = path.join(chapterDir, `${chapter.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
  
  const htmlPath = path.join(chapterDir, `${chapter.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`)

  const file = await createPdf(chapter.title, html, pdfPath, htmlPath)

  console.log("file created")
  
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
    type: "Chapter",
    subject: state.analyzedIntent.type,
    difficulty: "",
    content: html,
    filePath: pdfPath
  }

  const completed = (state.progress.completedSteps || 0) + 1;
  const progress: ProgressTracker = {
    totalSteps: state.progress.totalSteps,
    completedSteps: completed,
    currentStepName: "generate_chapter",
    estimatedTimeRemaining: state.progress.estimatedTimeRemaining
  }

  const step: WorkflowStep = {
    name: "generate_chapter",
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