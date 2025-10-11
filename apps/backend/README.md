# About the project

- I have aimed to build this project as general purpose chat-bot with proper memory that will work despite of model change on fly
- Additionally, the project includes an MCP client capable of connecting to any MCP server via HTTP Streaming and SSE.
- PostgreSQL will be used to store conversation history, with pgvector serving as the vector database extension. Redis will be utilized for caching and implementing rate-limiting mechanisms.
- Brave search will used as the search option .

# To install dependencies

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.23. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
