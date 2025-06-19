import { Router, Request, Response } from "express"
import { createAgentWorkflow } from "../core/workflowEngine"
import { v4 as uuidv4 } from "uuid"
import { UserMessage, UserAction } from "../types"

const chatRoutes = Router()

const activeSessions = new Map<string, any>()

function makeMessage(
  content: string,
  filePath: string,
  actions?: UserAction[]
): UserMessage {
  return {
    id: uuidv4(),
    content,
    filePath,
    timestamp: new Date(),
    actions
  }
}

const newChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, filePath } = req.body
    
    if (!content || !filePath) {
      res.status(400).json({ 
        error: 'Missing required fields: content and filePath' 
      })
      return
    }

    const graph = createAgentWorkflow()
    const requestId = uuidv4()

    const userMessage = makeMessage(content, filePath)

    const response = await graph.invoke({
      requestId,
      userMessages: [userMessage]
    },{ recursionLimit: 100 })

    activeSessions.set(requestId, {
      requestId,
      graph,
      lastResponse: response.executionPlan.steps,
      filePath
    })

    res.json({
      requestId,
      plan: response.executionPlan.outputStructure,
      status: 'awaiting_approval'
    })

  } catch (error) {
    console.error('Error in new chat:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

const planApproval = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params
    const { action, feedback } = req.body

    if (!action || !['approve', 'reject', 'modify'].includes(action)) {
      res.status(400).json({ 
        error: 'Invalid action. Must be: approve, reject, or modify' 
      })
      return
    }

    const session = activeSessions.get(requestId)
    if (!session) {
      res.status(404).json({ error: 'Session not found or expired' })
      return
    }

    const { graph, filePath } = session

    if (action === 'approve') {
      const approvalMessage = makeMessage("approve", filePath, ["approve"])
      
      const finalResponse = await graph.invoke({
        requestId,
        userMessages: [approvalMessage]
      })

      // Clean up session after completion
      activeSessions.delete(requestId)

      res.json({
        requestId,
        status: 'completed',
        message: finalResponse.thanksMessage || 'Task completed successfully!',
        fileOperations: finalResponse.fileOperations || [],
        generatedContent: finalResponse.generatedContent || []
      })

    } else if (action === 'reject') {
      // User rejected - clean up session
      activeSessions.delete(requestId)
      
      res.json({
        requestId,
        status: 'rejected',
        message: 'Task cancelled by user'
      })

    } else if (action === 'modify') {
      // User wants modifications - send feedback and get new plan
      const feedbackContent = feedback || 'Please revise the plan'
      const modifyMessage = makeMessage(feedbackContent, filePath, ["modify"])
      
      const revisedResponse = await graph.invoke({
        requestId,
        userMessages: [modifyMessage]
      })

      // Update session with new response
      session.lastResponse = revisedResponse

      res.json({
        requestId,
        plan: revisedResponse.plan || revisedResponse.message || revisedResponse,
        status: 'awaiting_approval',
        message: 'Plan revised based on your feedback'
      })
    }

  } catch (error) {
    console.error('Error in approval handler:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}


chatRoutes.post('/', newChat)
chatRoutes.post('/approval/:requestId', planApproval)

export { chatRoutes }
