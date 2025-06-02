#!/usr/bin/env node

import { McpServer, ResourceTemplate }
 from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport }
 from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import z from "zod";

// Initialize the server
const server = new McpServer({
    name: "mcptrinv",
    version: "0.1.0",
});

// Add an addition tool
server.tool(
    "add",
    { a: z.number(), b: z.number() },
    async function ({ a, b }: { a: number; b: number }) {
        return {
            content: [{ type: "text", text: String(a + b) }]
        };
    }
);

/* Add a dynamic greeting resource
server.resource(
    "greeting",
    new ResourceTemplate("greeting://{name}", { list: undefined }),
    async function (uri: URL, { name }: { string }) {
        return {
            contents: [{
                uri: uri.href,
                text: `Hello, ${name}!`
            }]
        };
    }
    );
*/

server.prompt(
    "echo-code",
    { code: z.string() },
    function ({ code }) {
        return {
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: `Voici le texte que vous m'avez envoyé: ${code}`
                }
            }]
        };
    }
);

// Run the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
    console.error("server error", error);
});
