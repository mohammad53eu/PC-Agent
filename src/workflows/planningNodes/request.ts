import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState, AgentUpdate } from "../../core/stateManager";
import { z } from "zod"
import "dotenv/config"

export async function analyzeRequest(state: AgentState): Promise<AgentUpdate> {
  const userMessages = state.userMessages;
  console.log("analyze intent for: ",userMessages)
  const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash-preview-05-20',
      temperature: 0,
  })
  // Combine all user messages into a single text for analysis
  const combinedMessages = userMessages
    .map(msg => msg.content)
    .join('\n\n');
  
  const requestIntentSchema = z.object({
  type: z.enum(['file_processing', 'content_creation', 'hybrid']).describe("The primary type of request based on user messages"),
  requiredCapabilities: z.array(z.enum(['read', 'create', 'move', 'delete', 'analyze'])).describe("List of operations needed to fulfill this request")
  });

  const structuredLlm = llm.withStructuredOutput(requestIntentSchema as any);

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert AI assistant that analyzes user requests for a PC file management agent.
      
      Your job is to classify the request and identify what capabilities are needed.
      
      Request Types:
      - file_processing: Operations on existing files/folders (reading, moving, deleting, organizing)
      - content_creation: Creating new content, files, or documents
      - hybrid: Combination of both processing existing files AND creating new content
      
      Available Capabilities:
      - read: Reading/accessing files or folders
      - create: Creating new files, folders, or content
      - move: Moving/relocating files or folders
      - delete: Removing files or folders
      - analyze: Examining file contents, structures, or patterns
      
      Analyze the user's request and return the appropriate classification and required capabilities.`
    ],
    [
      "human",
      combinedMessages
    ]
  ]);

  console.log("Request analysis result:", res);

  return {
    analyzedIntent: {
      type: res.type,
      requiredCapabilities: res.requiredCapabilities
    },
    currentStep: {
      name: 'request_analysis',
      status: 'completed',
      startTime: new Date(),
      endTime: new Date()
    }
  };
}
