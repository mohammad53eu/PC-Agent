import { Router } from "express"
import { chatRoutes } from "./chatRoutes"

const appRouter = Router()

appRouter.use('/chat', chatRoutes)

// appRouter.use('/update', agentUpdate)


export { appRouter }