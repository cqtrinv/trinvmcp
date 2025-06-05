work :

create.container :
	jq . < package.json > /dev/null
	-rm -rf dist
	docker buildx build -t trinv/mcp .

create.local :
	jq . < package.json > /dev/null
	-rm -rf dist
	tsc && chmod +x dist/*.js

test.local : dist/index.js cdc-node-js.json
	cp -p cdc-node-js.json ~/.config/Claude/claude_desktop_config.json
	tail -f ~/.config/Claude/logs/mcp.log &
	claude-desktop

dist/index.js : src/index.ts
	-rm -rf dist
	tsc && chmod +x dist/*.js

save.claude.config :
	tar czf claude-config.tgz -C ../../.config/ Claude
	tar tzf claude-config.tgz
