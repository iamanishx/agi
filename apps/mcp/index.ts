import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

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

//stdio transport
const transport = new StdioServerTransport();
console.error('Starting MCP server with stdio transport...');
server.connect(transport).catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});