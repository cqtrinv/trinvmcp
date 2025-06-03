work :

create.container :
	jq . < package.json > /dev/null
	-rm -rf dist
	docker buildx build -t trinv/mcp .

create.local :
	jq . < package.json > /dev/null
	-rm -rf dist
	tsc && chmod +x dist/*.js

test.local : dist/index.js
	cp -p claude_desktop_config.json ~/.config/Claude/
	tail -f ~/.config/Claude/logs/mcp.log &
	claude-desktop

dist/index.js : src/index.ts
	-rm -rf dist
	tsc && chmod +x dist/*.js
