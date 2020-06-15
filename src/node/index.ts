import merge from 'merge-descriptors';
import object from './object';

const node = {};
merge(node, object);


export default merge({}, node);
