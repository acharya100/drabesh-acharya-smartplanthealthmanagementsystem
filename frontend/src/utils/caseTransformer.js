/**
 * utility to transform object keys between snake_case and camelCase recursively.
 */

export const snakeToCamel = (str) =>
  str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );

export const camelToSnake = (str) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export const transformKeys = (obj, transformer, keepOriginal = false) => {
  if (Array.isArray(obj)) {
    return obj.map((v) => transformKeys(v, transformer, keepOriginal));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => {
        const transformedKey = transformer(key);
        const transformedValue = transformKeys(obj[key], transformer, keepOriginal);
        
        const newResult = { ...result, [transformedKey]: transformedValue };
        
        if (keepOriginal && key !== transformedKey) {
          newResult[key] = transformedValue;
        }
        
        return newResult;
      },
      {}
    );
  }
  return obj;
};

export const toCamel = (obj) => transformKeys(obj, snakeToCamel, true);
export const toSnake = (obj) => transformKeys(obj, camelToSnake, false);
