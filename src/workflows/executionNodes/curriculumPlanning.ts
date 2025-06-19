import { z } from "zod";
import { AgentState, AgentUpdate } from "../../core/stateManager";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { CourseStructure } from "../../types/content";

export async function curriculumPlanning(state: AgentState): Promise<AgentUpdate> {
  console.log("::::::::::::::curriculumPlanning::::::::::::::")

  const courseStructureSchema = z.object({
    title: z.string().describe("Course title"),
    description: z.string().describe("High-level course description"),
    chapters: z
      .array(
        z.object({
          id: z.string().describe("Must match the PlanStep.id for this chapter"),
          title: z.string().describe("Chapter title"),
          description: z.string().describe("Chapter description and what it covers")
        })
      )
      .optional()
      .describe("List of chapters for the course"),
    exams: z
      .array(
        z.object({
          id: z.string().describe("Must match the PlanStep.id for this exam"),
          title: z.string().describe("Exam title"),
          description: z.string().describe("Exam description and what it covers")
        })
      )
      .optional()
      .describe("List of exams for the course"),
    readme: z
      .array(
        z.object({
          id: z.string().describe("Must match the PlanStep.id for this readme"),
          title: z.string().describe("Readme title"),
          description: z.string().describe("Readme description and purpose")
        })
      )
      .optional()
      .describe("List of readme files for the course"),
    others: z
      .array(
        z.object({
          id: z.string().describe("Must match the PlanStep.id for this other content"),
          title: z.string().describe("Content title"),
          description: z.string().describe("Content description and purpose")
        })
      )
      .optional()
      .describe("List of other miscellaneous content for the course"),
    prerequisites: z
      .array(z.string().describe("Required prior knowledge for this course"))
      .describe("List of topics or skills the student should already have"),
    estimatedDuration: z
      .string()
      .describe("Total estimated duration for course delivery")
  });

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-preview-05-20",
    temperature: 0
  }).withStructuredOutput(courseStructureSchema as any);

  const messages = [
    {
      role: "system",
      content: `
You are an expert course designer. Given this ExecutionPlan:

${JSON.stringify(state.executionPlan, null, 2)}

Produce one single JSON object matching this CourseStructure schema exactly. 

IMPORTANT: For each step, check the stepType field exactly:
- stepType === 'Chapter' → add to chapters array
- stepType === 'exam' → add to exams array
- stepType === 'readme' → add to readme array  
- stepType === 'other' → add to others array
- stepType === 'folder' → skip completely

Example: If a step has stepType: 'Chapter' and id: '2', create {id: '2', title: '...', description: '...'} in the chapters array.
Each content item's id must match the corresponding step's id exactly.

${courseStructureSchema.toString()}
      `.trim()
    },
    {
      role: "user",
      content: "Generate the detailed CourseStructure now, using the stepType field from each execution plan step to categorize content correctly."
    }
  ];

  const courseStructure = await llm.invoke(messages) as CourseStructure

  console.log("course structure: ", courseStructure)
  return {
    courseStructre: courseStructure,
    currentStep: {
      name: "curriculum_planning",
      status: "completed",
      startTime: new Date(),
      endTime: new Date()
    }
  };
}