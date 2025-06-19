import { StateGraph } from "@langchain/langgraph"
import { agentAnnotation } from "./stateManager"
import { analyzeInputFolder, createDetailedPlan, presentPlanToUser } from "../workflows/planningNodes/planning"
import { analyzeRequest } from "../workflows/planningNodes/request" 
import { routeExecutionCondition, routeExecutionNode } from "../workflows/executionNodes/executionRouter"
import { createContent, hybridApproach, processFiles } from "../workflows/executionNodes/branches"
import { folderOrganization, folderOrganizationRouteCondition } from "../workflows/executionNodes/folderOrganization"
import { analyzeContent } from "../workflows/executionNodes/fileProcessing"
import { curriculumPlanning } from "../workflows/executionNodes/curriculumPlanning"
import { contentStepRouter, contentStepRouterCondition } from "../workflows/executionNodes/contentStepRouter"
import { generateExam } from "../workflows/executionNodes/generateExam"
import { generateReadme } from "../workflows/executionNodes/generateReadme"
import { generateOther } from "../workflows/executionNodes/generateOther"
import { generateRootDocumentation } from "../workflows/executionNodes/generateDocumentation"
import { generateChapter } from "../workflows/executionNodes/generateChapter"
import { chromadbIndexing } from "../workflows/executionNodes/chromadbIndexing"


export function createAgentWorkflow() {
  const workflow = new StateGraph(agentAnnotation)

    .addNode("request_analysis", analyzeRequest)
    .addNode("input_folder", analyzeInputFolder)
    .addNode("detailed_planning", createDetailedPlan)
    .addNode("plan_presentation", presentPlanToUser)

    .addNode("execution_router", routeExecutionNode)
    .addNode("file_processing_branch", processFiles)
    .addNode("content_creation_branch", createContent)
    .addNode("hybrid_branch", hybridApproach)
    .addNode("content_analysis", analyzeContent)
    .addNode("folder_organization", folderOrganization)
    .addNode("curriculum_planning", curriculumPlanning)
    .addNode("content_step_router", contentStepRouter)
    .addNode("generate_exam", generateExam)
    .addNode("generate_readme", generateReadme)
    .addNode("generate_chapter", generateChapter)
    .addNode("generate_other", generateOther)

    .addNode("rootDocumentationGeneration", generateRootDocumentation)
    .addNode("chromadb_indexing", chromadbIndexing)
    // .addNode("completion", finalizeWorkflow)
 
    .addEdge("__start__", "request_analysis")
    .addEdge("request_analysis", "input_folder")
    .addEdge("input_folder", "detailed_planning")
    .addEdge("detailed_planning", "plan_presentation")

    .addEdge("plan_presentation", "execution_router")

    .addConditionalEdges(
      "execution_router",
      routeExecutionCondition,
      {
        "file_processing": "file_processing_branch",
        "content_creation": "content_creation_branch",
        "hybrid": "hybrid_branch"
      }
    )
    .addEdge("content_creation_branch", "folder_organization")
    
    .addConditionalEdges(
      "folder_organization",
      folderOrganizationRouteCondition,
      {
      "file_processing": "content_analysis", 
      "content_creation": "curriculum_planning",
      "hybrid": "content_analysis"
      }
    )
  
    //  File processing flow
    // .addEdge("file_processing_branch", "folder_organization")
    // .addEdge("folder_organization", "content_analysis")
    // .addEdge("content_analysis", "exam_generation")
    // .addEdge("exam_generation", "documentation_generation")
    
    // // Content creation flow
    .addEdge("curriculum_planning", "content_step_router")
    .addConditionalEdges(
      "content_step_router",
      contentStepRouterCondition,
      {
        "exam":    "generate_exam",
        "readme":  "generate_readme",
        "Chapter": "generate_chapter",
        "other":   "generate_other",
        "done":    "rootDocumentationGeneration"
      }
    )
    .addEdge("generate_chapter", "content_step_router")
    .addEdge("generate_exam", "content_step_router")
    .addEdge("generate_readme", "content_step_router")
    .addEdge("generate_other", "content_step_router")

    .addEdge("rootDocumentationGeneration", "chromadb_indexing")
    .addEdge("chromadb_indexing", "__end__")

const graph = workflow.compile({

}
)
  return graph
}
