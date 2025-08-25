# mcp-trinv-server, a MCP server for TRINV

`mcp-trinv-server` (ou MCPTRINV) est un serveur de type MCP (Model
Context Protocol) qui est utilisé pour augmenter les ressources
d'assistant d'Intelligence Artificielle comme Claude ou Gemini.

MCPTRINV permet de rechercher des communes à partir d'un fragment de
leur nom puis de rechercher des parcelles cadastrales dans une commune
et ayant une surface donnée. Voici un
[exemple de conversation](https://youtu.be/Q7Q4PMpnmSw) que
procure MCPTRINV.

## Features

- **trinv-chercher-commune**: chercher des communes 
- **trinv-chercher-parcelle**: chercher des parcelles cadastrales

## Installation

```bash
npm install -g mcp-trinv-server
```

