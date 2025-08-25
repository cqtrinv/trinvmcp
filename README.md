# mcp-trinv-server, un serveur MCP pour TRINV

`mcp-trinv-server` (ou MCPTRINV) est un serveur de type MCP (Model
Context Protocol) qui est utilisé pour augmenter les ressources
d'assistant d'Intelligence Artificielle comme Claude ou Gemini.

MCPTRINV permet de rechercher des communes à partir d'un fragment de
leur nom puis de rechercher des parcelles cadastrales dans une commune
ayant une surface donnée.
Il s'appuie sur le site [TRINV]{https://trinv.fr}.

## Outils

- **trinv-chercher-commune**: chercher des communes 
- **trinv-chercher-parcelle**: chercher des parcelles cadastrales

## Installation

```bash
npm install mcp-trinv-server
```

Il faut ensuite déclarer ce serveur dans votre assistant ce qui
dépend, entre autres, de l'assistant que vous utilisez, du système
d'exploitation sur lequel vous êtes, du répertoire où vous êtes.

## Usage

Voici un [exemple de conversation](https://youtu.be/Q7Q4PMpnmSw) mené
avec `mcp-trinv-server` et Claude.
