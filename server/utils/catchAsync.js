/**
 * Async error handler wrapper for Express controllers
 * Replaces try/catch blocks by forwarding caught errors to next()
 * @param {Function} fn - Async Express request handler
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
