import fs from "fs/promises"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { v4 as uuidv4 } from "uuid"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { Chroma } from "@langchain/community/vectorstores/chroma"
import { AgentState, AgentUpdate } from "../../core/stateManager"
import { FileOperation } from "../../types/operation"
import { ProgressTracker, WorkflowStep } from "../../types/state"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"

export async function chromadbIndexing(state: AgentState): Promise<AgentUpdate> {
  console.log("::::::::::::::chromadbIndexing:::::::::::::::")
  const ops: FileOperation[] = []
  let completed = state.progress.completedSteps || 0
  const total = state.progress.totalSteps

  for (const content of state.generatedContent) {

    const { filePath, id: contentId, type } = content
    if(!filePath.endsWith(".pdf")) continue

    const pdfLoader = new PDFLoader(filePath)
    const pdfDocument = await pdfLoader.load()


    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splitDocs = await splitter.splitDocuments(pdfDocument)

    const docsToAdd = splitDocs.map(doc => ({
      pageContent: doc.pageContent,
      metadata: {
        filePath,
        type,   
        chunkIndex: doc.metadata?.pageNumber ?? 0
        }
    }))

    console.log("docs: ", docsToAdd[0])

    try {
      // const embeddings = new OllamaEmbeddings({ model: "nomic-embed-text:latest", baseUrl: "http://localhost:11434" })
      const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      })

      const vectorStore = new Chroma(embeddings, { url: "http://localhost:8000", collectionName: "agent-workflow"})
      const x = await vectorStore.addDocuments(docsToAdd)
      console.log("embeddings:",x)
    } catch (error) {
      console.log("error saving files to database", error)
    }

    const stats = await fs.stat(filePath)
    ops.push({
      id: uuidv4(),
      type: "analyze",
      targetPath: filePath,
      status: "completed",
      metadata: {
        size: stats.size,
        type: type === "Chapter" || type === "exam" ? "pdf" : "text",
        topics: [],
        lastModified: stats.mtime
      }
    })

    completed++
  }

  const progress: ProgressTracker = {
    totalSteps: total,
    completedSteps: completed,
    currentStepName: "chromadb_indexing",
    estimatedTimeRemaining: 0
  }

  const step: WorkflowStep = {
    name: "chromadb_indexing",
    status: "completed",
    startTime: new Date(),
    endTime: new Date()
  }

  return {
    fileOperations: ops,
    progress,
    currentStep: step
  }
}
