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

async function createResponseStream(prompt: string): Promise<{ streamResult: any; mcpClient: any; }> {
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
    const streamResult = await streamText({
      model: google('gemini-2.5-flash'),
      tools,
      prompt: prompt || 'Say hello world!',
    });
    console.log('StreamText started; fullStream ready');
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
        
        console.log("Starting to consume fullStream events...");
        let chunkCount = 0;
        let toolTextFallback = '';
        try {
            const fullStream = (streamResult?.fullStream ?? streamResult?.stream ?? []) as AsyncIterable<any>;
            for await (const event of fullStream) {
                const type = (event as any)?.type ?? 'unknown';
                switch (type) {
                    case 'text-delta': {
                        const delta = (event as any)?.delta ?? (event as any)?.textDelta ?? '';
                        if (delta) {
                            chunkCount++;
                            reply.sse({ data: String(delta) });
                        }
                        break;
                    }
                    case 'tool-result': {
                        const result = (event as any)?.result ?? (event as any)?.toolResult;
                        if (result) {
                            const parts = Array.isArray(result.content) ? result.content : [];
                            const textParts = parts
                                .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
                                .filter(Boolean);
                            if (typeof result.text === 'string') {
                                textParts.push(result.text);
                            }
                            if (textParts.length) {
                                const combined = textParts.join('');
                                toolTextFallback += combined;
                                console.log('Buffered tool-result text:', combined);
                            }
                        }
                        break;
                    }
                    case 'error':
                    case 'response-error': {
                        const message = (event as any)?.error?.message ?? 'Unknown stream error';
                        throw new Error(message);
                    }
                    default:
                        console.log('Non-text stream event:', type, event);
                }
            }
        } finally {
            if (mcpClient && typeof (mcpClient as any).close === 'function') {
                await (mcpClient as any).close();
            }
        }

        if (chunkCount === 0 && toolTextFallback) {
            console.log('No assistant text emitted; streaming buffered tool text');
            reply.sse({ data: toolTextFallback });
            chunkCount = 1;
        }

        console.log(`Finished streaming ${chunkCount} text chunks`);
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