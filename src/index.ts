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

type County = {
    name: string,
    inseeid: string,
    postalid: string,
    departmentid: string,
    latitude: number,
    longitude: number
};
type CountyByFragmentResponse = {
    fragment: string,
    counties: [ County ]
};

// Add a tool
server.tool(
    "trinv-search-county",
    { fragment: z.string() },
    async function ({ fragment }: { fragment: string }) {
        //return await search_county(fragment);
        const url = `https://trinv.fr/api/countybyfragment.json`;
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fragment })
        });
        if ( response.ok ) {
            const json = await response.json() as CountyByFragmentResponse;
            let text = '' as string;
            if ( json.counties.length === 1 ) {
                text = `
Voici la commune concernée: ${json.counties[0].name}
ainsi que son code INSEE: ${json.counties[0].inseeid}`;
            } else {
                text = `
Voici les communes de France ayant ce fragment de nom:
${json.counties.map(c => c.name)}
`;
            }
            return {
                content: [{ type: "text", text }]
            };
        } else {
            console.error(response);
            throw new Error('probleme');
        }
    }
);

//   Allow Claude to use "trinv-search-county"
// Questions:
// Cherche des communes avec RIAQ dans leur nom
//    => locmariaquer
// Y a-t-il des communes nommées DOUS
//    => 8 communes BEDOUS, BUROSSE-MENDOUSSE, ...


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
    "trinv-search-county",
    { fragment: z.string() },
    function ({ fragment }) {
        return {
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: `Chercher des communes en France
dont le nom comporte, dans l'ordre, les lettres suivantes:
${fragment}`
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
