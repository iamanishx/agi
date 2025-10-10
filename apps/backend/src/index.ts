import fastify from "fastify";
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import fastifySSEPlugin from 'fastify-sse-v2';
import fastifyCors from "@fastify/cors";
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

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

async function createResponseStream(prompt: string) {
    console.log('Creating MCP client with stdio transport...');
    const mcpClient = await createMCPClient({
        transport: new StdioClientTransport({
            command: 'bun',
            args: ['run', 'C:\\Users\\manis\\chat\\apps\\mcp\\index.ts']
        })
    });
    console.log('MCP client created, getting tools...');
    const tools = await mcpClient.tools();
    console.log('Tools retrieved:', Object.keys(tools));
    console.log('Starting streamText...');
    const { textStream } = await streamText({
      model: google('gemini-2.5-flash'),
      tools: tools,
      prompt: prompt || 'Say hello world!',
    onFinish: async () => {
    await mcpClient.close();
  },
    });
    console.log('StreamText started', textStream);
    return textStream;
}

app.post("/stream", async (request, reply) => {
    try {
        const {prompt} = request.body as {prompt: string};
        const accept = request.headers["accept"];
        console.log("Creating response stream for prompt:", prompt);
        const textStream = await createResponseStream(prompt);
        console.log("Text stream created");
        
        reply.headers({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        });
        
        console.log("Starting to read from textStream...");
        let chunkCount = 0;
        for await (const chunk of textStream){
            chunkCount++;
            console.log(`Chunk ${chunkCount}:`, chunk);
            reply.sse({ data: chunk });
        }
        console.log(`Finished streaming ${chunkCount} chunks`);
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

app.listen({ port: 5000 }).then(() => {
  console.log("Server is running on http://localhost:5000");
});