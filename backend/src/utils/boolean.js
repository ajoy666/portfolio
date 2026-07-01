function toBoolean(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

module.exports = {
  toBoolean,
};
