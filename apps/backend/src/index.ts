import fastify from "fastify";
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import fastifySSEPlugin from 'fastify-sse-v2';
import fastifyCors from "@fastify/cors";
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai';
import { initDatabase } from './drizzle/client';

const app = fastify();
app.register(fastifySSEPlugin);

const corsOptions = {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
};

app.register(fastifyCors, corsOptions);

// function createMCPClientInstance(uri:string) {
// }

async function createResponseStream(prompt: string): Promise<{ streamResult: any; mcpClient: any; }> {
    const mcpClient = await createMCPClient({
        transport: new StreamableHTTPClientTransport(new URL('http://localhost:3001/mcp'))
    });
    const tools = await mcpClient.tools();
    const myAgent = await new Agent({
      model: google('gemini-2.5-flash'),
      tools,
      stopWhen: stepCountIs(20),
    });
    const streamResult = await myAgent.stream({
      prompt: prompt || 'Say hello world!',
    });
    return { streamResult, mcpClient };
}

app.post("/stream", async (request, reply) => {
    try {
        const {prompt} = request.body as {prompt: string};
        const accept = request.headers["accept"];
        console.log("Creating response stream for prompt:", prompt);
        const { streamResult, mcpClient } = await createResponseStream(prompt);
        console.log("Stream result received; configuring SSE response");
        
        reply.headers({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        });
        
        console.log("Starting to consume agent stream...");
        for await (const chunk of streamResult.textStream) {
            reply.sse({ data: chunk });
        }
        console.log("Stream finished");
        reply.sse({ data: '[DONE]' });
        return reply;
    } catch (error) {
        console.error("Error in /stream route:", error);
        return reply.status(500).send({ 
            error: "Internal Server Error", 
            message: error instanceof Error ? error.message : String(error) 
        });
    }
});

app.listen({ port: 5000 }).then(async () => {
    await initDatabase().catch((e) => console.error('DB init error:', e));
    console.log("Server is running on http://localhost:5000");
});