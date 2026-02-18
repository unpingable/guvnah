SHELL := /bin/bash
PM ?= npm

.PHONY: test lint build ci

test:
	$(PM) test

lint:
	$(PM) run -s lint

build:
	$(PM) run -s build

ci: lint test build
