import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createErrorResult,
  createErrorResultWithLogging,
  createSuccessResult,
  createSuccessResultWithLogging,
  getFormDataBoolean,
  getFormDataString,
  validateFormData,
  withErrorHandling,
  type FormValidationResult,
  type ServerActionError,
  type ServerActionResult,
} from "@/lib/actions/server-action-utils";

describe("server-action-utils", () => {
  describe("createErrorResult", () => {
    it("should create error result from string", () => {
      const result = createErrorResult("Something went wrong");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Something went wrong");
      expect(result.timestamp).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it("should create error result with details", () => {
      const result = createErrorResult("Validation failed", [
        "Field 1 is required",
        "Field 2 is invalid",
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation failed");
      expect(result.details).toEqual([
        "Field 1 is required",
        "Field 2 is invalid",
      ]);
    });

    it("should create error result from ServerActionError object", () => {
      const error: ServerActionError = {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: ["Name is required", "Email is invalid"],
      };

      const result = createErrorResult(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid input");
      expect(result.details).toEqual(["Name is required", "Email is invalid"]);
    });

    it("should prefer details from error object over parameter", () => {
      const error: ServerActionError = {
        code: "ERROR",
        message: "Test error",
        details: ["From object"],
      };

      const result = createErrorResult(error, ["From parameter"]);

      expect(result.details).toEqual(["From object"]);
    });

    it("should use parameter details when error object has none", () => {
      const error: ServerActionError = {
        code: "ERROR",
        message: "Test error",
      };

      const result = createErrorResult(error, ["From parameter"]);

      expect(result.details).toEqual(["From parameter"]);
    });

    it("should have valid ISO timestamp", () => {
      const before = new Date().toISOString();
      const result = createErrorResult("Error");
      const after = new Date().toISOString();

      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });
  });

  describe("createSuccessResult", () => {
    it("should create success result with data", () => {
      const data = { id: 1, name: "Test" };
      const result = createSuccessResult(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, name: "Test" });
      expect(result.timestamp).toBeDefined();
    });

    it("should create success result with message", () => {
      const result = createSuccessResult({ done: true }, "Operation completed");

      expect(result.success).toBe(true);
      expect(result.error).toBe("Operation completed");
    });

    it("should work with null data", () => {
      const result = createSuccessResult(null);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it("should work with array data", () => {
      const data = [1, 2, 3];
      const result = createSuccessResult(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it("should work with primitive data", () => {
      const result = createSuccessResult("simple string");

      expect(result.success).toBe(true);
      expect(result.data).toBe("simple string");
    });
  });

  describe("createErrorResultWithLogging", () => {
    it("should create error result and call logger", () => {
      const logger = {
        error: vi.fn(),
      };

      const result = createErrorResultWithLogging(
        "Error occurred",
        ["Detail 1"],
        logger,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error occurred");
      expect(logger.error).toHaveBeenCalledWith(
        "Server Action error",
        expect.objectContaining({
          code: "UNKNOWN",
          message: "Error occurred",
          details: ["Detail 1"],
        }),
      );
    });

    it("should work without logger", () => {
      const result = createErrorResultWithLogging("Error without logger");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error without logger");
    });

    it("should use error object code", () => {
      const logger = {
        error: vi.fn(),
      };
      const error: ServerActionError = {
        code: "CUSTOM_CODE",
        message: "Custom error",
      };

      createErrorResultWithLogging(error, undefined, logger);

      expect(logger.error).toHaveBeenCalledWith(
        "Server Action error",
        expect.objectContaining({
          code: "CUSTOM_CODE",
          message: "Custom error",
        }),
      );
    });

    it("should prefer parameter details over error object details", () => {
      const logger = {
        error: vi.fn(),
      };
      const error: ServerActionError = {
        code: "ERROR",
        message: "Test",
        details: ["Object detail"],
      };

      createErrorResultWithLogging(error, ["Param detail"], logger);

      expect(logger.error).toHaveBeenCalledWith(
        "Server Action error",
        expect.objectContaining({
          details: ["Param detail"],
        }),
      );
    });

    it("should use error object details when no parameter details", () => {
      const logger = {
        error: vi.fn(),
      };
      const error: ServerActionError = {
        code: "ERROR",
        message: "Test",
        details: ["Object detail"],
      };

      const result = createErrorResultWithLogging(error, undefined, logger);

      expect(result.details).toEqual(["Object detail"]);
    });
  });

  describe("createSuccessResultWithLogging", () => {
    it("should create success result and call logger", () => {
      const logger = {
        info: vi.fn(),
      };

      const result = createSuccessResultWithLogging(
        { id: 1 },
        "Created successfully",
        logger,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1 });
      expect(logger.info).toHaveBeenCalledWith(
        "Server Action success",
        expect.objectContaining({
          message: "Created successfully",
        }),
      );
    });

    it("should work without logger", () => {
      const result = createSuccessResultWithLogging({ done: true });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ done: true });
    });

    it("should use default message when none provided", () => {
      const logger = {
        info: vi.fn(),
      };

      createSuccessResultWithLogging({ data: "test" }, undefined, logger);

      expect(logger.info).toHaveBeenCalledWith(
        "Server Action success",
        expect.objectContaining({
          message: "Operation completed successfully",
        }),
      );
    });
  });

  describe("withErrorHandling", () => {
    it("should pass through successful result", async () => {
      const successAction = async () => createSuccessResult({ done: true });

      const wrapped = withErrorHandling(successAction);
      const result = await wrapped(null, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ done: true });
    });

    it("should catch and convert Error to error result", async () => {
      const failingAction = async (): Promise<ServerActionResult<unknown>> => {
        throw new Error("Something failed");
      };

      const wrapped = withErrorHandling(failingAction);
      const result = await wrapped(null, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("Something failed");
    });

    it("should handle non-Error throws", async () => {
      const failingAction = async (): Promise<ServerActionResult<unknown>> => {
        throw "string error";
      };

      const wrapped = withErrorHandling(failingAction);
      const result = await wrapped(null, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error occurred");
    });

    it("should pass previousState to action", async () => {
      const previousState: ServerActionResult<{ count: number }> = {
        success: true,
        data: { count: 5 },
        timestamp: new Date().toISOString(),
      };

      const action = vi
        .fn()
        .mockResolvedValue(createSuccessResult({ count: 6 }));
      const wrapped = withErrorHandling(action);

      await wrapped(previousState, { increment: 1 });

      expect(action).toHaveBeenCalledWith(previousState, { increment: 1 });
    });

    it("should pass input to action", async () => {
      const input = { name: "test", value: 123 };
      const action = vi.fn().mockResolvedValue(createSuccessResult({}));
      const wrapped = withErrorHandling(action);

      await wrapped(null, input);

      expect(action).toHaveBeenCalledWith(null, input);
    });
  });

  describe("getFormDataString", () => {
    let formData: FormData;

    beforeEach(() => {
      formData = new FormData();
    });

    it("should return trimmed string value", () => {
      formData.set("name", "  John Doe  ");

      const result = getFormDataString(formData, "name");

      expect(result).toBe("John Doe");
    });

    it("should return empty string for missing key", () => {
      const result = getFormDataString(formData, "nonexistent");

      expect(result).toBe("");
    });

    it("should return empty string for File value", () => {
      const file = new File(["content"], "test.txt");
      formData.set("file", file);

      const result = getFormDataString(formData, "file");

      expect(result).toBe("");
    });

    it("should handle empty string value", () => {
      formData.set("empty", "");

      const result = getFormDataString(formData, "empty");

      expect(result).toBe("");
    });

    it("should handle whitespace-only value", () => {
      formData.set("spaces", "   ");

      const result = getFormDataString(formData, "spaces");

      expect(result).toBe("");
    });
  });

  describe("getFormDataBoolean", () => {
    let formData: FormData;

    beforeEach(() => {
      formData = new FormData();
    });

    it('should return true for "true"', () => {
      formData.set("flag", "true");

      expect(getFormDataBoolean(formData, "flag")).toBe(true);
    });

    it('should return true for "on"', () => {
      formData.set("checkbox", "on");

      expect(getFormDataBoolean(formData, "checkbox")).toBe(true);
    });

    it('should return true for "1"', () => {
      formData.set("active", "1");

      expect(getFormDataBoolean(formData, "active")).toBe(true);
    });

    it('should return false for "false"', () => {
      formData.set("flag", "false");

      expect(getFormDataBoolean(formData, "flag")).toBe(false);
    });

    it('should return false for "0"', () => {
      formData.set("flag", "0");

      expect(getFormDataBoolean(formData, "flag")).toBe(false);
    });

    it("should return false for missing key", () => {
      expect(getFormDataBoolean(formData, "missing")).toBe(false);
    });

    it("should return false for empty string", () => {
      formData.set("empty", "");

      expect(getFormDataBoolean(formData, "empty")).toBe(false);
    });

    it("should return false for arbitrary string", () => {
      formData.set("random", "yes");

      expect(getFormDataBoolean(formData, "random")).toBe(false);
    });
  });

  describe("validateFormData", () => {
    let formData: FormData;

    beforeEach(() => {
      formData = new FormData();
    });

    describe("required validation", () => {
      it("should pass when required field is present", () => {
        formData.set("name", "John");

        const result = validateFormData<{ name: string }>(formData, {
          name: { required: true },
        });

        expect(result.success).toBe(true);
        expect(result.data?.name).toBe("John");
      });

      it("should fail when required field is empty", () => {
        formData.set("name", "");

        const result = validateFormData<{ name: string }>(formData, {
          name: { required: true },
        });

        expect(result.success).toBe(false);
        expect(result.errors).toContain("name is required");
      });

      it("should pass when optional field is empty", () => {
        formData.set("nickname", "");

        const result = validateFormData<{ nickname: string }>(formData, {
          nickname: { required: false },
        });

        expect(result.success).toBe(true);
      });
    });

    describe("email validation", () => {
      it("should pass for valid email", () => {
        formData.set("email", "test@example.com");

        const result = validateFormData<{ email: string }>(formData, {
          email: { type: "email" },
        });

        expect(result.success).toBe(true);
        expect(result.data?.email).toBe("test@example.com");
      });

      it("should fail for invalid email", () => {
        formData.set("email", "invalid-email");

        const result = validateFormData<{ email: string }>(formData, {
          email: { required: true, type: "email" },
        });

        expect(result.success).toBe(false);
        expect(result.errors).toContain("email must be a valid email address");
      });

      it("should skip email validation for empty optional field", () => {
        formData.set("email", "");

        const result = validateFormData<{ email: string }>(formData, {
          email: { type: "email" },
        });

        expect(result.success).toBe(true);
      });
    });

    describe("length validation", () => {
      it("should pass when length is within bounds", () => {
        formData.set("password", "secure123");

        const result = validateFormData<{ password: string }>(formData, {
          password: { minLength: 8, maxLength: 20 },
        });

        expect(result.success).toBe(true);
      });

      it("should fail when too short", () => {
        formData.set("password", "short");

        const result = validateFormData<{ password: string }>(formData, {
          password: { required: true, minLength: 8 },
        });

        expect(result.success).toBe(false);
        expect(result.errors).toContain(
          "password must be at least 8 characters long",
        );
      });

      it("should fail when too long", () => {
        formData.set("username", "a".repeat(51));

        const result = validateFormData<{ username: string }>(formData, {
          username: { required: true, maxLength: 50 },
        });

        expect(result.success).toBe(false);
        expect(result.errors).toContain(
          "username must be no more than 50 characters long",
        );
      });
    });

    describe("pattern validation", () => {
      it("should pass when pattern matches", () => {
        formData.set("phone", "123-456-7890");

        const result = validateFormData<{ phone: string }>(formData, {
          phone: { pattern: /^\d{3}-\d{3}-\d{4}$/ },
        });

        expect(result.success).toBe(true);
      });

      it("should fail when pattern does not match", () => {
        formData.set("phone", "not-a-phone");

        const result = validateFormData<{ phone: string }>(formData, {
          phone: { required: true, pattern: /^\d{3}-\d{3}-\d{4}$/ },
        });

        expect(result.success).toBe(false);
        expect(result.errors).toContain("phone format is invalid");
      });
    });

    describe("boolean type", () => {
      it("should convert boolean field correctly", () => {
        formData.set("subscribe", "true");

        const result = validateFormData<{ subscribe: boolean }>(formData, {
          subscribe: { type: "boolean" },
        });

        expect(result.success).toBe(true);
        expect(result.data?.subscribe).toBe(true);
      });

      it("should handle unchecked checkbox", () => {
        // Unchecked checkboxes are not sent in FormData
        const result = validateFormData<{ subscribe: boolean }>(formData, {
          subscribe: { type: "boolean" },
        });

        expect(result.success).toBe(true);
        expect(result.data?.subscribe).toBe(false);
      });
    });

    describe("multiple fields", () => {
      it("should validate all fields", () => {
        formData.set("name", "John");
        formData.set("email", "john@example.com");
        formData.set("message", "Hello world");

        const result = validateFormData<{
          name: string;
          email: string;
          message: string;
        }>(formData, {
          name: { required: true, minLength: 2 },
          email: { required: true, type: "email" },
          message: { required: true, minLength: 10 },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          name: "John",
          email: "john@example.com",
          message: "Hello world",
        });
      });

      it("should collect all validation errors", () => {
        formData.set("name", "");
        formData.set("email", "invalid");
        formData.set("message", "Hi");

        const result = validateFormData<{
          name: string;
          email: string;
          message: string;
        }>(formData, {
          name: { required: true },
          email: { required: true, type: "email" },
          message: { required: true, minLength: 10 },
        });

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(3);
        expect(result.errors).toContain("name is required");
        expect(result.errors).toContain("email must be a valid email address");
        expect(result.errors).toContain(
          "message must be at least 10 characters long",
        );
      });
    });
  });

  describe("type exports", () => {
    it("should have ServerActionResult type", () => {
      const result: ServerActionResult<string> = {
        success: true,
        data: "test",
        timestamp: new Date().toISOString(),
      };

      expect(result.success).toBe(true);
    });

    it("should have FormValidationResult type", () => {
      const result: FormValidationResult<{ name: string }> = {
        success: true,
        data: { name: "test" },
      };

      expect(result.success).toBe(true);
    });

    it("should have ServerActionError type", () => {
      const error: ServerActionError = {
        code: "TEST",
        message: "Test error",
      };

      expect(error.code).toBe("TEST");
    });
  });
});
