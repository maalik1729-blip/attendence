const ApiError = require('../utils/ApiError');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const details = Object.fromEntries(
        error.details.map((d) => [d.path.join('.'), d.message])
      );
      return next(new ApiError(400, 'Validation failed', 'VALIDATION', details));
    }
    req[source] = value;
    return next();
  };
}

module.exports = validate;
