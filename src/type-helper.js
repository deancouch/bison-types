/* eslint-disable no-multi-str */
const exp = new RegExp('\
^\
([a-z0-9_-]+)\
((\\(([a-z0-9._-]*)\\)+)|(\\[([a-z0-9._-]*)\\]+))?\
(\\=([a-z0-9._-]*))?\
$\
', 'i');

exports.getTypeInfo = (typeName, types) => {
  const result = typeName.match(exp);
  if (!result) {
    throw new Error(`${typeName} is not a valid type`);
  } else {
    return {
      isArray: (result[5] != null),
      isFunction: (result[3] != null) && (result[4] !== ''),
      isOverride: (result[7] != null),
      parameter: result[4],
      arraySize: result[6],
      name: result[1],
      value: types[result[1]],
      overrideValue: result[8],
    };
  }
};

exports.isNumber = (number) => !Number.isNaN(Number(number));

exports.getParameterFromResult = (value, result) => {
  if (exports.isNumber(value)) {
    return Number(value);
  } if ((typeof value === 'string') && (value.indexOf('.length') !== -1)) {
    const split = value.split('.length');
    if (result[split[0]] != null) {
      return result[split[0]].length;
    }
    throw new Error(`${value} is not a valid parameter`);
  } else if (result[value] != null) {
    return result[value];
  } else {
    throw new Error(`${value} is not a valid parameter`);
  }
};
