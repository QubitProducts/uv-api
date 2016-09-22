.PHONY: test, build, bootstrap

BIN = ./node_modules/.bin

node_modules:
	@npm install

test: node_modules
	@$(BIN)/standard
	@./node_modules/karma/bin/karma start --single-run=true

build: node_modules
	@node make-readme.js
