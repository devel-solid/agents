.PHONY: setup tests

setup:
	npm ci
	npm run setup

tests:
	npm test
