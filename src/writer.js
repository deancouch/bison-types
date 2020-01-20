/* eslint-disable no-multi-assign */
/* eslint-disable no-prototype-builtins */
const _ = require('lodash');
const { CleverBufferWriter } = require('clever-buffer');

const preCompile = require('./preCompile');
const typeHelper = require('./type-helper');

class Writer {
  constructor(buffer, typeSet, options) {
    let localOptions = options;
    this.processObject = this.processObject.bind(this);
    this.typeSet = typeSet;
    if (localOptions == null) { localOptions = {}; }
    this.buffer = new CleverBufferWriter(buffer, localOptions);
    if (!this.typeSet) {
      this.typeSet = preCompile({});
    }
  }

  processObject(definition, valueToWrite, parameter) {
    if (definition.hasOwnProperty('_write')) { return definition._write.apply(this, [valueToWrite, parameter]); }
    return _.each(definition, (value) => {
      const key = Object.keys(value)[0];
      try {
        return this.write(value[key], valueToWrite[key], parameter, valueToWrite);
      } catch (err) {
        throw new Error(`'${key}': ${err.message}`);
      }
    });
  }

  write(typeName, valueToWrite, parameter, result) {
    let localValueToWrite = valueToWrite;
    let localParameter = parameter;
    let localResult = result;

    if (localResult == null) { localResult = {}; }
    let type = this.typeSet.definitions[typeName];
    if (!type) {
      type = (this.typeSet.definitions[typeName] = typeHelper.getTypeInfo(typeName, this.typeSet.types));
    }

    if (type.isFunction) { localParameter = typeHelper.getParameterFromResult(type.parameter, localResult); }
    if (type.isOverride) { localValueToWrite = typeHelper.getParameterFromResult(type.overrideValue, localResult); }

    switch (typeof type.value) {
      case 'undefined':
        throw new Error(`${type.name} isn't a valid type`);
      case 'string':
        return this.write(type.value, localValueToWrite, localParameter, localResult);
      case 'function':
        return type.value.apply(this, [localParameter]);
      case 'object':
        if (type.isArray) {
          return _.each(_.range(0, Math.floor(typeHelper.getParameterFromResult(type.arraySize, localResult)), false), (value, key) => this.processObject(type.value, localValueToWrite[key], localParameter));
        }
        return this.processObject(type.value, localValueToWrite, localParameter);
      default:
    }
  }

  rawBuffer() {
    return this.buffer.buffer;
  }
}

module.exports = Writer;
