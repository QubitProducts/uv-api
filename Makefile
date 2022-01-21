.PHONY: test build bootstrap

bootstrap:
	@npm install

test: bootstrap
	@npx standard
	@npx karma start --single-run=true

build: bootstrap
	@node make-readme.js
