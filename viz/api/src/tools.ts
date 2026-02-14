import type { Request, Response } from "express";

/**
 * Narrows environment variables to string using errors.
 *
 * @param raw - Raw environment variable.
 * @returns Environment variable if it is defined.
 * @throws {TypeError} If environment variable is undefined.
 */
export function forceEnvVar(raw: string | undefined): string {
  if (raw === undefined) {
    throw new TypeError("Undefined environment variable.");
  }
  return raw;
}

/**
 * Takes a expressJS HTTP handler function and wraps it in a try catch
 * error context then returns the wrapped function.
 *
 * @param handler - Function which takes in HTTP
 *                  request/response and returns/errors out.
 *                  Used in expressJS
 * @param errorMsg - Http response error to present if `handler` errors out.
 * @returns - A new version of `handler` wrapped with error handling.
 */
export function wrapHandler(
  handler: (req: Request, res: Response) => Promise<unknown>,
  errorMsg: string
): ((req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      // If the handler has already sent the response, do nothing.
      if (res.headersSent) {
        return;
      }
      res.status(500).json({ ok: false, error: errorMsg });
    }
  };
}
