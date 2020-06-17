import merge from 'merge-descriptors';

export function mergeDefault(source, mod) {
  merge(source, mod.default ? mod.default : mod);
}
