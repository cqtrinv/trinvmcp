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
type Area = {
    name: string,
    area: number,
    latitude: number,
    longitude: number,
    address?: string
};
type AreasByCountyAndSurfaceResponse = {
    areascount: number,
    inseeid: string,
    areamin: number,
    areamax: number,
    status?: string,
    areas: [ Area ]
};

const fragment2countiesCache = new Map<string, [County]>();
const county2inseeidCache = new Map<string, string>();

// Add a tool: search counties with a fragment of their name
server.tool(
    "trinv-chercher-commune",
    `Cet outil permet de chercher des communes en France à partir
d'un fragment de leur nom (c'est-à-dire une série de lettres consécutives).
Ainsi, chercher BEURD conduit à trouver la commune de TREBEURDEN.
Il faut cependant être spécifique car chercher, par exemple, SAINT
mène à 4834 communes:un si grand nombre de résultats ne peut être listé.

Les communes trouvées sont accompagnées de leur code INSEE, de leurs
coordonnées (latitude, longitude). Certaines communes ont changé de
nom ou ont été regroupées avec d'autres.

Exemples de questions:
- Quelle est la commune nommée BEURD ?
- Dis-moi quelles sont les communes ayant DOUS dans leur nom ?

[Pour en savoir plus](https://doc.trinv.fr/trinv-mcp-server)
`,
    { fragment: z.string() },
    async function ({ fragment }: { fragment: string }) {
        //return await search_county(fragment);
        fragment = fragment.toUpperCase();
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
            fragment2countiesCache.set(fragment, json.counties);
            json.counties.forEach(c => {
                county2inseeidCache.set(c.name, c.inseeid);
            });
            if ( json.counties.length === 1 ) {
                const county : County = json.counties[0];
                // take care of .obsolete, .seealso, etc.
                text = `
Voici la commune concernée: ${county.name}
ainsi que son code INSEE: ${county.inseeid}.
`;
            } else {
                function formatCounty (c: County) : string {
                    return `- ${c.name} (code INSEE: ${c.inseeid}`;
                }
                text = `
Voici les communes de France ayant ce fragment de nom:
${json.counties.map(formatCounty)}
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

//   Allow Claude to use "trinv-chercher-commune"
// Questions:
// Cherche des communes avec RIAQ dans leur nom
//    => locmariaquer
// Y a-t-il des communes nommées DOUS
//    => 8 communes BEDOUS, BUROSSE-MENDOUSSE, ...

// Add a tool: search areas within county
server.tool(
    "trinv-chercher-parcelle",
    `Cet outil permet de rechercher des parcelles cadastrales ayant une
certaine surface au sein d'une commune de France. Cette recherche s'effectue,
le plus souvent, en deux phases.
1. Spécifier la commune qui vous intéresse
2. Indiquer la taille (en m²) de la parcelle recherchée.

Bien identifier la commune implique de connaître son code INSEE.

Exemples de questions:
- Y a t-il une parcelle de surface 247 m² dans BEDOUS
- Je cherche une parcelle dans BEURD faisant 333 m²

[Pour en savoir plus](https://doc.trinv.fr/trinv-mcp-server)
`,
    { fragment: z.string(), area: z.number() },
    async function ({ fragment, area }: { fragment: string, area: number }) {
        fragment = fragment.toUpperCase();
        let inseeid : string | undefined =
            county2inseeidCache.get(fragment);
        const counties = fragment2countiesCache.get(fragment);

        if ( ! inseeid ) {
            if ( ! counties ) {
                throw new Error(`Peut-être faut-il que vous m'indiquiez
plus précisément la commune que vous cherchez.`);
            } else if ( counties.length === 1 ) {
                fragment = counties[0].name;
                inseeid = counties[0].inseeid;
            } else {
                throw new Error(`Trop de communes ont ces lettres
dans leur nom!`);
            }
        }

        const url = `https://trinv.fr/api/areas.json?` +
              `inseeid=${inseeid}&` +
              `surfacemin=${area}`;
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        if ( response.ok ) {
            const json = await response.json() as
               AreasByCountyAndSurfaceResponse;
            let text = '' as string;
            if ( json.areas.length === 1 ) {
                const area = json.areas[0];
                const geourl = `https://trinv.fr/parcelle?cadastreid=${area.name}`;
                text = `
Voici la référence de la parcelle cadastrale concernée: ${area.name}.
${area.address ? `Son adresse est ${area.address}.` : ''}
Elle est située en [${area.latitude} ${area.longitude}]($geourl)
`;
            } else {
                function formatArea (area: Area): string {
                    return area.name;
                }
                text = `
Voici les parcelles cadastrales ayant cette surface:
${json.areas.map(formatArea)}
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

//   Allow Claude to use "trinv-chercher-parcelle"
// Questions:
// Y a t-il une parcelle de surface 247 m² dans BEDOUS
//    64104-000-A-626 Place de l'École, 64490 Bedous     # Screenshots/1.png
// Je cherche une parcelle dans BEURD faisant 333 m²
//    plusieurs dans TREBEURDEN                          # Screenshots/2.png
// Je cherche une parcelle dans DOUS faisant 333 m²
//    plusieurs communes avec DOUS                       # Screenshots/3.png
// Je cherche une parcelle dans XIT                      # Screenshots/4.png

// Tool trinv-localiser-parcelle




/*
  Prompts are help, triggered by the user, to help formulating a
  question to the assistant. 


server.prompt(
    "trinv-chercher-commune",
    { fragment: z.string() },
    function ({ fragment }) {
        return {
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: `Je cherche des communes en France
dont le nom comporte, dans l'ordre, les lettres suivantes:
\`${fragment}\` `
                }
            }]
        };
    }
);

server.prompt(
    "trinv-chercher-parcelle",
    { countyname: z.string(), area: z.number() },
    function ({ countyname, area }) {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Je cherche des parcelles cadastrales
ayant une surface de ${area} m² au sein de la commune \`${countyname}\`.`
                    }
                }
            ]
        };
    }
);

*/

///////////// FUTURE add --transport= option

// Run the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
    console.error("server error", error);
});
