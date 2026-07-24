import type { Request, Response, NextFunction } from 'express';
import { type AnyZodObject } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace with parsed data so downstream handlers have typed/sanitized inputs
      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      
      if (parsed.query !== undefined) {
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
      
      if (parsed.params !== undefined) {
        Object.defineProperty(req, 'params', {
          value: parsed.params,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }

      next();
    } catch (error: unknown) {
      if (error && typeof error === "object" && "issues" in error) {
        const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;

        res.status(400).json({
          error: "Validation failed",
          details: issues.map((iss) => ({
            field: iss.path.join(".").replace(/^(body|query|params)\./, ""),
            message: iss.message,
          })),
        });
        return;
      }

      console.error("Validation error:", error);
      res.status(500).json({ error: "Internal server error during validation" });
    }
  };
};
