import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fastify from 'fastify';
import fastifySSEPlugin from 'fastify-sse-v2';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'dummy-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('Received tools/list request');
  const response = {
    tools: [
      {
        name: 'echo',
        description: 'Echoes the input message',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
          required: ['message'],
        },
      },
    ],
  };
  console.error('Sending tools/list response:', response);
  return response;
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error('Received tools/call request - Full request:', JSON.stringify(request, null, 2));
  
  try {
    const { name, arguments: args } = request.params;
    console.error(`Tool name: ${name}, arguments:`, args);
    
    if (name === 'echo') {
      const message = (args as any)?.message || 'no message';
      const response = {
        content: [{ type: 'text', text: `Echo: ${message}` }],
      };
      console.error('Sending tools/call response:', response);
      return response;
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    console.error('Error in tools/call handler:', error);
    throw error;
  }
});

//Streamable HTTP transport
const app = fastify();
app.register(fastifySSEPlugin);

const transports: Record<string, StreamableHTTPServerTransport> = {};

app.all('/mcp', async (request, reply) => {
  console.log(`Received ${request.method} request to /mcp`);

  try {
    // Check for existing session ID
    const sessionId = request.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && request.method === 'POST' && isInitializeRequest(request.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: sessionId => {
          // Store the transport by session ID when session is initialized
          console.log(`StreamableHTTP session initialized with ID: ${sessionId}`);
          transports[sessionId] = transport;
        }
      });

      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`Transport closed for session ${sid}, removing from transports map`);
          delete transports[sid];
        }
      };

      // Connect the transport to the MCP server
      await server.connect(transport);
    } else {
      // Invalid request - no session ID or not initialization request
      reply.status(400).send({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided'
        },
        id: null
      });
      return;
    }

    // Handle the request with the transport
    await transport.handleRequest(request.raw, reply.raw, request.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!reply.sent) {
      reply.status(500).send({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

console.error('Starting MCP server with Streamable HTTP transport...');
app.listen({ port: 3001 }).then(() => {
  console.log('MCP Streamable HTTP server is running on http://localhost:3001/mcp');
});