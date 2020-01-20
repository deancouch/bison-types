should = require('should');
const sinon = require('sinon');

const preCompile = require(`${SRC}/preCompile`);
const Reader = require(`${SRC}/reader`);
const typeHelper = require(`${SRC}/type-helper`);

describe('Bison Reader', () => {
  beforeEach(() => sinon.spy(typeHelper, 'getTypeInfo'));

  afterEach(() => typeHelper.getTypeInfo.restore());

  it('should create a reader with a default options', () => {
    const buf = Buffer.alloc(8);
    const reader = new Reader(buf);
    reader.buffer.bigEndian.should.eql(false);
    reader.buffer.getOffset().should.eql(0);
  });

  it('should create a reader with a specified offset', () => {
    const buf = Buffer.alloc(8);
    const reader = new Reader(buf, null, { offset: 4 });
    reader.buffer.getOffset().should.eql(4);
  });

  it('should create a reader with a specified endian-ness', () => {
    const buf = Buffer.alloc(8);
    const reader = new Reader(buf, null, { bigEndian: true });
    reader.buffer.bigEndian.should.eql(true);
  });

  it('should read a UInt8', () => {
    const buf = Buffer.from([0x01]);
    const reader = new Reader(buf);
    reader.read('uint8').should.eql(1);
  });

  it('should read a UInt16', () => {
    const buf = Buffer.from([0x01, 0x02]);
    const reader = new Reader(buf);
    reader.read('uint16').should.eql(513);
  });

  it('should read a UInt32', () => {
    const buf = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    const reader = new Reader(buf);
    reader.read('uint32').should.eql(67305985);
  });

  it('should read a UInt64', () => {
    const buf = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
    const reader = new Reader(buf);
    reader.read('uint64').should.eql('578437695752307201');
  });

  it('should read max UInt8', () => {
    const buf = Buffer.from([0xFF]);
    const reader = new Reader(buf);
    reader.read('uint8').should.eql(255);
  });

  it('should read max UInt16', () => {
    const buf = Buffer.from([0xFF, 0xFF]);
    const reader = new Reader(buf);
    reader.read('uint16').should.eql(65535);
  });

  it('should read max UInt32', () => {
    const buf = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
    const reader = new Reader(buf);
    reader.read('uint32').should.eql(4294967295);
  });

  it('should read max UInt64', () => {
    const buf = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
    const reader = new Reader(buf);
    reader.read('uint64').should.eql('18446744073709551615');
  });

  it('should read Int8', () => {
    const buf = Buffer.from([0xFF]);
    const reader = new Reader(buf);
    reader.read('int8').should.eql(-1);
  });

  it('should read Int16', () => {
    const buf = Buffer.from([0xFF, 0xFF]);
    const reader = new Reader(buf);
    reader.read('int16').should.eql(-1);
  });

  it('should read Int32', () => {
    const buf = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
    const reader = new Reader(buf);
    reader.read('int32').should.eql(-1);
  });

  it('should read Int64', () => {
    const buf = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
    const reader = new Reader(buf);
    reader.read('int64').should.eql('-1');
  });

  it('should read Bool', () => {
    new Reader(Buffer.from([0x00])).read('bool').should.eql(false);
    new Reader(Buffer.from([0x01])).read('bool').should.eql(true);
    return new Reader(Buffer.from([0x5a])).read('bool').should.eql(true);
  });

  it('should read string', () => {
    const buf = Buffer.from([0x48, 0x45, 0x4C, 0x4C, 0x4F]);
    const reader = new Reader(buf);
    reader.read('utf-8', 5).should.eql('HELLO');
  });

  it('should read multi-byte string', () => {
    const buf = Buffer.from([0x48, 0xC3, 0x89, 0x4C, 0x4C, 0x4F]);
    const reader = new Reader(buf);
    reader.read('utf-8', 6).should.eql('HÉLLO');
  });

  it('should read string with latin1 encoding', () => {
    const buf = Buffer.from([0x48, 0xC9, 0x4C, 0x4C, 0x4F]);
    const reader = new Reader(buf);
    reader.read('latin1', 5).should.eql('HÉLLO');
  });

  it('should be able to define a simple type', () => {
    const buf = Buffer.from([0x01]);
    const reader = new Reader(buf, preCompile({ 'my-simple-type': 'uint8' }));
    reader.read('my-simple-type').should.eql(1);
  });

  it('should be able to define a complex type', () => {
    const buf = Buffer.from([0x01]);
    const types = preCompile({
      complex: {
        _read(val) { return this.buffer.getUInt8() * val; },
      },
    });
    const reader = new Reader(buf, types);

    reader.read('complex', 5).should.eql(5);
  });

  it('should be able to define a custom type', () => {
    const buf = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    const types = preCompile({
      custom: [
        { a: 'uint8' },
        { b: 'uint8' },
        { c: 'uint8' },
        { d: 'uint8' },
      ],
    });
    const reader = new Reader(buf, types);
    reader.read('custom').should.eql({
      a: 1, b: 2, c: 3, d: 4,
    });
  });

  it('should be able to skip', () => {
    const buf = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    const types = preCompile({
      custom: [
        { a: 'uint8' },
        { b: 'skip(2)' },
        { c: 'uint8' },
      ],
    });
    const reader = new Reader(buf, types);
    const res = reader.read('custom');
    return res.should.eql({ a: 1, b: undefined, c: 4 });
  });

  it('should be able to read bytes', () => {
    const buf = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    const types = preCompile({
      custom: [
        { a: 'bytes(2)' },
      ],
    });

    const reader = new Reader(buf, types);
    reader.read('custom').a.should.eql([0x01, 0x02]);
  });

  it('should be able to define a custom embedded type', () => {
    const buf = Buffer.from([0x01, 0x02, 0x03]);
    const types = preCompile({
      custom: [
        { a: 'uint8' },
        { b: 'uint8' },
        { c: 'embedded-type' },
      ],

      'embedded-type': [
        { d: 'uint8' },
      ],
    });

    const reader = new Reader(buf, types);
    reader.read('custom').should.eql({ a: 1, b: 2, c: { d: 3 } });
  });

  it('should be able to define a custom complex embedded type', () => {
    const buf = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    const types = preCompile({
      custom: [
        { a: 'uint8' },
        { b: 'uint8' },
        { c: 'embedded-type' },
      ],

      'embedded-type': [
        { d: 'uint8' },
        { e: 'uint8' },
      ],
    });

    const reader = new Reader(buf, types);
    reader.read('custom').should.eql({ a: 1, b: 2, c: { d: 3, e: 4 } });
  });

  it('should be able to define a custom complex embedded type within an embedded type', () => {
    const buf = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    const types = preCompile({
      custom: [
        { a: 'uint8' },
        { b: 'uint8' },
        { c: 'embedded-type' },
      ],

      'embedded-type': [
        { d: 'uint8' },
        { e: 'super-embedded-type' },
      ],

      'super-embedded-type': [
        { f: 'uint8' },
      ],
    });

    const reader = new Reader(buf, types);
    reader.read('custom').should.eql({ a: 1, b: 2, c: { d: 3, e: { f: 4 } } });
  });

  it('should be able to read a string of a certain length', () => {
    const buf = Buffer.from([0x48, 0x45, 0x4C, 0x4C, 0x4F]);
    const types = preCompile({
      custom: [
        { a: 'utf-8(5)' },
      ],
    });

    const reader = new Reader(buf, types);
    reader.read('custom').should.eql({ a: 'HELLO' });
  });

  it('should be able to use specify a parameter', () => {
    const buf = Buffer.from([0x02, 0x03]);
    const types = preCompile({
      mult: {
        _read(val) { return this.buffer.getUInt8() * val; },
      },

      custom: [
        { a: 'uint8' },
        { b: 'mult(4)' },
      ],
    });

    const reader = new Reader(buf, types);
    reader.read('custom').should.eql({ a: 2, b: 12 });
  });

  it('should be able to use previously resolved value', () => {
    const buf = Buffer.from([0x02, 0x03]);
    const types = preCompile({
      mult: {
        _read(val) { return this.buffer.getUInt8() * val; },
      },

      custom: [
        { a: 'uint8' },
        { b: 'mult(a)' },
      ],
    });

    const reader = new Reader(buf, types);
    reader.read('custom').should.eql({ a: 2, b: 6 });
  });

  it('should be able to read an array', () => {
    const buf = Buffer.from([0x03, 0x01, 0x02, 0x03]);
    const types = preCompile({
      object: [
        { c: 'uint8' },
      ],

      custom: [
        { a: 'uint8' },
        { b: 'object[a]' },
      ],
    });

    const reader = new Reader(buf, types);
    reader.read('custom').should.eql({
      a: 3,

      b: [
        { c: 1 },
        { c: 2 },
        { c: 3 },
      ],
    });
  });

  it('should be able to read an array of type that is defined with _read function', () => {
    const buf = Buffer.from([0x01, 0x02, 0x03]);

    const reader = new Reader(buf);
    reader.read('uint8[3]').should.eql([1, 2, 3]);
  });

  it('should only create type definition once per type', () => {
    const buf = Buffer.from([0x01, 0x02]);
    const types = preCompile({
      custom: [
        { a: 'uint8' },
        { b: 'uint8' },
      ],
    });

    const reader = new Reader(buf, types);
    reader.read('custom').should.eql({ a: 1, b: 2 });
    typeHelper.getTypeInfo.withArgs('uint8').callCount.should.eql(1);
  });

  it('should throw when reading past the buffer length', () => {
    const buf = Buffer.from([0x01]);
    const reader = new Reader(buf);
    reader.read('uint8').should.eql(1);
    (() => reader.read('uint8')).should.match(/TypeError|RangeError/);
  });

  it('should throw when setting properties which read past the buffer length', () => {
    const buf = Buffer.from([0x01]);
    const types = preCompile({
      custom: [
        { a: 'uint8' },
        { b: 'uint8' },
      ],
    });
    const reader = new Reader(buf, types);
    (() => reader.read('custom')).should.match(/TypeError|RangeError/);
  });
});
