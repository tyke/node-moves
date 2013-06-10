MOCHA=./node_modules/mocha/bin/_mocha
FLAGS=--reporter spec

all: test-cov

test-cov:
	node node_modules/istanbul/lib/cli.js --print=detail cover $(MOCHA) -- $(FLAGS)

test:
	$(MOCHA) $(FLAGS) ./test/*.test.js

.PHONY: all test-cov test
