
const utils = require('../../lib/common/utils')
const assert = require('assert');

describe('test/utils.test.js', () => {
  it('ipv4 test', ()=> {
  	//first length is 3
  	assert.equal(utils._isIP("200.255.255.255"),true)
  	assert.equal(utils._isIP("223.255.255.255"),true)
  	assert.equal(utils._isIP("224.255.255.255"),true)
  	assert.equal(utils._isIP("192.0.0.1"),true)
  	assert.equal(utils._isIP("127.0.0.1"),true)
  	assert.equal(utils._isIP("100.0.0.1"),true)
  	assert.equal(utils._isIP("090.0.0.1"),true)
  	assert.equal(utils._isIP("009.0.0.1"),true)
  	assert.equal(utils._isIP("200.001.255.255"),true)

  	// first length is 1 or 2
  	assert.equal(utils._isIP("09.255.255.255"),true)
  	assert.equal(utils._isIP("90.255.255.255"),true)
  	assert.equal(utils._isIP("00.255.255.255"),true)
  	assert.equal(utils._isIP("-.0.0.1"),false)
  	assert.equal(utils._isIP("0.0.0.1"),true)
  	assert.equal(utils._isIP("1.0.0.1"),true)

  	// test last 3 byte
  	assert.equal(utils._isIP("200.0.255.255"),true)
  	assert.equal(utils._isIP("200.01.255.255"),true)
  	assert.equal(utils._isIP("200.10.255.255"),true)
  	assert.equal(utils._isIP("200.256.255.255"),false)
  	assert.equal(utils._isIP("200.001.255.255"),true)

  	assert.equal(utils._isIP("200.255.0.255"),true)
  	assert.equal(utils._isIP("200.255.01.255"),true)
  	assert.equal(utils._isIP("200.255.10.255"),true)
  	assert.equal(utils._isIP("200.255.256.255"),false)
  	assert.equal(utils._isIP("200.255.001.255"),true)

  	assert.equal(utils._isIP("200.255.255.0"),true)
  	assert.equal(utils._isIP("200.255.255.01"),true)
  	assert.equal(utils._isIP("200.255.255.10"),true)
  	assert.equal(utils._isIP("200.255.255.256"),false)
  	assert.equal(utils._isIP("200.255.255.001"),true)

  	//excetion 
  	assert.equal(utils._isIP("200.255.255.001"),true)
  	assert.equal(utils._isIP("200"),false)
  	assert.equal(utils._isIP("200.1"),false)
  	assert.equal(utils._isIP("200.1.1"),false)
  	assert.equal(utils._isIP("200.1.1.1.1"),false)
  })
  it("ipv6 test", () => {
  	assert.equal(utils._isIP("1:2:3:4:5:6:7::"),true)
  	assert.equal(utils._isIP("1:2:3:4:5:6:7:8"),true)
  	assert.equal(utils._isIP("1:2:3:4:5:6::"),true)
  	assert.equal(utils._isIP("1:2:3:4:5:6::8"),true)
  	assert.equal(utils._isIP("1:2:3:4:5::"),true)
  	assert.equal(utils._isIP("1:2:3:4:5::8"),true)
  	assert.equal(utils._isIP("1:2:3:4::"),true)
  	assert.equal(utils._isIP("1:2:3:4::8"),true)
  	assert.equal(utils._isIP("1:2:3::"),true)
  	assert.equal(utils._isIP("1:2:3::8"),true)
  	assert.equal(utils._isIP("1:2::"),true)
  	assert.equal(utils._isIP("1:2::8"),true)
  	assert.equal(utils._isIP("1::"),true)
  	assert.equal(utils._isIP("1::8"),true)
  	assert.equal(utils._isIP("::"),true)
  	assert.equal(utils._isIP("::8"),true)
  	assert.equal(utils._isIP("::7:8"),true)
  	assert.equal(utils._isIP("::6:7:8"),true)
  	assert.equal(utils._isIP("::5:6:7:8"),true)
  	assert.equal(utils._isIP("::4:5:6:7:8"),true)
  	assert.equal(utils._isIP("::3:4:5:6:7:8"),true)
  	assert.equal(utils._isIP("::2:3:4:5:6:7:8"),true)
  	assert.equal(utils._isIP("A:0f:0F:FFFF:5:6:7:8"),true)
  	assert.equal(utils._isIP("A:0f:0F:FFFF1:5:6:7:8"),false)
  	assert.equal(utils._isIP("G:0f:0F:FFFF:5:6:7:8"),false)
  })
})