import express from "express"
import "dotenv/config"
import morgan from "morgan"
import { appRouter } from "./routes"
import cors from "cors"

const PORT = process.env.PORT

const app = express()


app.use(cors())
app.use(express.json())
app.use(morgan("dev"))
app.use('/api', appRouter)

if (!PORT) throw new Error("no port number found")

app.listen(PORT, () => {
    console.log("Agent is running and listening for requests on port: ", PORT)
})
