work :

create.container :
	jq . < package.json > /dev/null
	-rm -rf dist
	docker buildx build -t trinv/mcp .
