work :

create.container :
	jq . < package.json > /dev/null
	-rm -rf dist
	docker buildx build -t trinv/mcp .

create.local :
	jq . < package.json > /dev/null
	-rm -rf dist
	tsc && chmod +x dist/src/*.js

test.local : dist/src/index.js
	cp -p claude_desktop_config.json ~/.config/Claude/
	tail -f ~/.config/Claude/logs/mcp.log &
	claude-desktop

dist/src/index.js :
	tsc
