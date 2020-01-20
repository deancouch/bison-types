const writeUInt64 = (value) => {
  // ref treats leading zeros as denoting octal numbers, so we want to strip
  // them out to prevent this behaviour
  if (typeof value === 'number' || typeof value === 'bigint') {
    value = value.toString();
  }
  // console.log(`hello: ${value}`);
  if (!/^\d+$/.test(value)) {
    throw new RangeError('"value" argument is out of bounds');
  }
  value = value.replace(/^0+(\d)/, '$1');
  console.log(value);
};
