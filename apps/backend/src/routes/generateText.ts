import fastify from "fastify";
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import fastifyCors from "@fastify/cors";
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const app = fastify();
app.register(fastifyCors, { origin: "*", methods: ["GET", "POST"] });

app.post("/stream", async (request, reply) => {
    try {
        const { prompt } = request.body as { prompt: string };
        console.log("Processing prompt:", prompt);

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

        console.log('Starting generateText with automatic tool handling...');
        const result = await generateText({
            model: google('gemini-2.5-flash'),
            tools,
            prompt: prompt || 'Say hello world!',
            maxToolRoundtrips: 5,
        });

        console.log('Generation complete, closing MCP client...');
        await mcpClient.close();

        return reply.send({ response: result.text });

    } catch (error) {
        console.error("Error in /stream route:", error);
        await mcpClient?.close();
        return reply.status(500).send({ 
            error: "Internal Server Error", 
            message: error instanceof Error ? error.message : String(error) 
        });
    }
});

app.listen({ port: 5000 }).then(() => {
    console.log("Server is running on http://localhost:5000");
});