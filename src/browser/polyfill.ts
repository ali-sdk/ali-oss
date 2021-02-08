// eslint-disable-next-line no-undef
(globalThis as any || window as any).process = require('../../shims/process');
// eslint-disable-next-line no-undef
(globalThis as any || window as any).Buffer = require('buffer').Buffer;