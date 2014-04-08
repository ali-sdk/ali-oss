TESTS = $(shell ls -S `find test -type f -name "*.test.js" -print`)
REPORTER = tap
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


install:
	@npm install --registry=http://r.cnpmjs.org \
		--disturl=http://dist.cnpmjs.org

test: install
	@NODE_ENV=test $(BIN)mocha \
		--harmony-generators \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		--require co-mocha\
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov cov: install
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
	@$(BIN)cov coverage

contributors: install
	@$(BIN)contributors -f plain -o AUTHORS

autod: install
	@$(BIN)autod -w -e coverage,example.js
	@$(MAKE) install

.PHONY: test
