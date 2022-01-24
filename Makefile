.PHONY: test build bootstrap

bootstrap:
	@npm install

test:
	@npx standard
	@npx karma start --single-run=true

build: bootstrap
	@node make-readme.js
