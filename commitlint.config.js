module.exports = { extends: ['@commitlint/config-conventional'], ignores: [message => /\[skip ci\]/m.test(message)] };
