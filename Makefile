TESTS = $(shell ls -S `find test -type f -name "*.test.js" -print`)
REPORTER = spec
TIMEOUT = 30000
MOCHA_OPTS =
BIN = node_modules/.bin/
SRC = $(wildcard lib/*.js)
BUILD = $(subst lib/,build/,$(SRC))

build:
	@mkdir -p build
	@$(MAKE) $(BUILD)

build/%.js: lib/%.js
	@$(BIN)regenerator --include-runtime $< > $@

test:
	@NODE_ENV=test $(BIN)mocha \
		--harmony \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		--require co-mocha\
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov cov:
	@NODE_ENV=test node --harmony \
		node_modules/.bin/istanbul cover --preserve-comments \
		$(BIN)_mocha \
		-- -u exports \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		--require co-mocha\
		$(MOCHA_OPTS) \
		$(TESTS)

test-travis:
		@NODE_ENV=test \
		node --harmony \
		node_modules/.bin/istanbul cover --preserve-comments \
		node_modules/.bin/_mocha \
		--report lcovonly \
		-- \
		--reporter dot \
		--timeout $(TIMEOUT) \
		--require should \
		--require co-mocha \
		$(MOCHA_OPTS) \
		$(TESTS)

contributors:
	@$(BIN)contributors -f plain -o AUTHORS

autod:
	@$(BIN)autod -w --prefix="~" \
	-e build,coverage,callback_example.js,example.js \

clean:
	@rm -rf build

.PHONY: test clean
