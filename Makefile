.PHONY: test, build

BIN = ./node_modules/.bin

test:
	@$(BIN)/standard
	@./node_modules/karma/bin/karma start --single-run=true

build:
	$(BIN)/uglifyjs ./uv-api.js --mangle --compress --output ./uv-api.min.js
