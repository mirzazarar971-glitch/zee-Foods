import { ApiError } from './auth.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issue = result.error.issues[0];
    return next(
      new ApiError(422, issue?.message || 'Invalid request.', {
        field: issue?.path?.join('.'),
      })
    );
  }
  req[source] = result.data;
  return next();
};

export const sanitizeInputs = (req, _res, next) => {
  const clean = (value) => {
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !key.startsWith('$') && !key.includes('.'))
          .map(([key, val]) => [key, clean(val)])
      );
    }
    return value;
  };
  for (const key of ['body', 'query', 'params']) {
    if (req[key] && typeof req[key] === 'object') {
      try {
        req[key] = clean(req[key]);
      } catch {
        /* ignore read-only request properties */
      }
    }
  }
  return next();
};
