const assert = require('assert');
const { omit } = require('../../../lib/common/utils/omit');

describe('omit test case', () => {
  const originObject = {
    name: 'man',
    age: '38',
    sex: 'male',
    children: {
      name: 'child',
      age: '18'
    }
  };

  it('should return new object', () => {
    const newObject = omit(originObject, []);
    assert(newObject !== originObject);
  });
  it('should remove properties', () => {
    const newObject = omit(originObject, ['age']);
    assert.equal(newObject.age, undefined);
  });
  it('should not remove children node name', () => {
    const newObject = omit(originObject, ['name']);
    assert.equal(newObject.name, undefined);
    assert.equal(newObject.children.name, 'child');
  });
});
