const isPlainObject = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

const deepMerge = (target = {}, source = {}) => {
  if (!isPlainObject(target)) {
    return source;
  }

  if (!isPlainObject(source)) {
    return source;
  }

  return Object.keys(source).reduce((merged, key) => {
    const targetValue = merged[key];
    const sourceValue = source[key];

    // Зливаємо тільки вкладені об'єкти; масиви навмисно замінюються повністю.
    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      return {
        ...merged,

        [key]: deepMerge(targetValue, sourceValue),
      };
    }

    return {
      ...merged,
      [key]: sourceValue,
    };
  }, { ...target });
};

module.exports = deepMerge;
