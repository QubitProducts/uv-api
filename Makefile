.PHONY: test

BIN = ./node_modules/.bin

test:
	@$(BIN)/jscs uv-api.js test/test-uv-api.js
	@$(BIN)/jshint uv-api.js test/test-uv-api.js
	@./node_modules/karma/bin/karma start --single-run=true