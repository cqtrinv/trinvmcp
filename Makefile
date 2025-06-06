work :

create.container :
	jq . < package.json > /dev/null
	-rm -rf dist
	docker buildx build -t trinv/mcp .

create.local :
	jq . < package.json > /dev/null
	-rm -rf dist
	tsc && chmod +x dist/*.js

MAC_CONFIG_DIR=~/Library/'Application Support'/Claude

test.local : dist/index.js cdc-node-js.json
	[ -d ${MAC_CONFIG_DIR} ] && \
	  cp -p cdc-node-js.json ${MAC_CONFIG_DIR}/claude_desktop_config.json
	cp -p cdc-node-js.json ~/.config/Claude/claude_desktop_config.json
	tail -f ~/.config/Claude/logs/mcp.log &
	claude-desktop

dist/index.js : src/index.ts
	-rm -rf dist
	tsc && chmod +x dist/*.js

save.claude.config :
	tar czf claude-config.tgz -C ../../.config/ Claude
	tar tzf claude-config.tgz

copy2bibou :
	rsync -avu . bibou:TRINV/MCP/
