/**
 * Airtable Service - Create Operations Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AirtableBaseLike,
  AirtableServicePrivate,
} from "@/test/test-types";
import type { AirtableService as AirtableServiceType } from "../airtable/service";
import {
  configureServiceForTesting,
  createMockBase,
} from "./mocks/airtable-test-helpers";

const mockCreate = vi.fn();
const mockSelectAll = vi.fn();
const mockSelect = vi.fn().mockReturnValue({
  all: mockSelectAll,
  firstPage: vi.fn(),
});
const mockUpdate = vi.fn();
const mockDestroy = vi.fn();

const createMockRecord = (data: Record<string, unknown>) => ({
  id: data.id || "rec123456",
  fields: data.fields || {},
  createdTime: data.createdTime || "2023-01-01T00:00:00Z",
  get: vi.fn((field: string) => {
    return (data.fields as Record<string, unknown>)?.[field];
  }),
});

const mockTable = vi.fn().mockReturnValue({
  create: mockCreate,
  select: mockSelect,
  update: mockUpdate,
  destroy: mockDestroy,
});

const tableFactory: AirtableBaseLike["table"] = (_name) => {
  return mockTable() as ReturnType<AirtableBaseLike["table"]>;
};

const mockBase = vi.fn(() => createMockBase(tableFactory));
const mockConfigure = vi.fn();

const setServiceReady = (service: unknown) =>
  configureServiceForTesting(
    service as AirtableServicePrivate,
    createMockBase(tableFactory),
  );

vi.mock("airtable", () => ({
  default: {
    configure: mockConfigure,
    base: mockBase,
  },
}));

vi.mock("@/lib/env", async () => {
  const mockEnv = await import("./mocks/airtable-env");
  return mockEnv;
});

vi.mock("@/lib/logger", async () => {
  const mockLogger = await import("./mocks/logger");
  return mockLogger;
});

vi.mock("./validations", async () => {
  const mockValidations = await import("./mocks/airtable-validations");
  return mockValidations;
});

describe("Airtable Service - Create Operations Tests", () => {
  let AirtableServiceClass: typeof AirtableServiceType;

  beforeEach(async () => {
    mockCreate.mockReset();
    mockSelectAll.mockReset();
    mockSelect.mockReset().mockReturnValue({
      all: mockSelectAll,
      firstPage: vi.fn(),
    });
    mockUpdate.mockReset();
    mockDestroy.mockReset();
    mockTable.mockClear().mockReturnValue({
      create: mockCreate,
      select: mockSelect,
      update: mockUpdate,
      destroy: mockDestroy,
    });
    mockBase.mockClear();
    mockConfigure.mockClear();

    const module = await import("../airtable/service");
    AirtableServiceClass = module.AirtableService as typeof AirtableServiceType;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const validLeadData = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    message: "This is a test message",
    productName: "ABS Flood Barriers",
    catalogProductId: "abs-flood-barriers",
  };

  describe("createLead (product inquiry)", () => {
    it("creates a product inquiry record successfully", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);

      mockCreate.mockResolvedValue([
        createMockRecord({
          id: "rec123456",
          fields: validLeadData,
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ]);

      const result = await service.createLead(validLeadData);

      expect(result).toEqual({ id: "rec123456" });
      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": "John",
            "Last Name": "Doe",
            Email: "john.doe@example.com",
            Message: "This is a test message",
            "Product Name": "ABS Flood Barriers",
            "Product Slug": "abs-flood-barriers",
            Status: "New",
            Source: "Product Inquiry",
            "Submitted At": expect.any(String),
          }),
        },
      ]);
    });

    it("writes a validated plus-addressed email without text-field escaping", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);
      mockCreate.mockResolvedValue([
        createMockRecord({
          id: "rec-plus-address",
          fields: {},
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ]);

      await service.createLead({
        ...validLeadData,
        email: "buyer+rfq@example.com",
      });

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            Email: "buyer+rfq@example.com",
          }),
        },
      ]);
    });

    it("maps split full names and optional requirements into canonical Airtable fields", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);

      mockCreate.mockResolvedValue([
        createMockRecord({
          id: "rec123456",
          fields: {},
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ]);

      await service.createLead({
        firstName: "Smoke",
        lastName: "Test",
        email: "smoke@example.com",
        message: "This is a smoke test message.",
        productName: "General RFQ",
        requirements: "Need custom height",
        referenceId: "PRO-test-123",
      });

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": "Smoke",
            "Last Name": "Test",
            Email: "smoke@example.com",
            Message: "This is a smoke test message.",
            Requirements: "Need custom height",
            "Reference ID": "PRO-test-123",
            Source: "Product Inquiry",
          }),
        },
      ]);
    });

    it("neutralizes spreadsheet formula prefixes in product lead text fields", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);

      mockCreate.mockResolvedValue([
        createMockRecord({
          id: "recProductFormula",
          fields: {},
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ]);

      await service.createLead({
        firstName: "=Buyer",
        lastName: "+One",
        email: "buyer@example.com",
        message: "=message",
        productName: "+Product",
        catalogProductId: "-product-slug",
        requirements: "=requirements",
        referenceId: "PROD-formula-123",
      });

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": "'=Buyer",
            "Last Name": "'+One",
            Message: "'=message",
            "Product Name": "'+Product",
            "Product Slug": "'-product-slug",
            Requirements: "'=requirements",
          }),
        },
      ]);
    });

    it("throws error when service is not configured", async () => {
      const service = new AirtableServiceClass();
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      vi.spyOn(
        service as AirtableServicePrivate,
        "ensureReady",
      ).mockImplementation(async () => {});

      await expect(service.createLead(validLeadData)).rejects.toThrow(
        "Airtable service is not configured",
      );
    });

    it("handles creation errors gracefully", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);
      mockCreate.mockRejectedValue(new Error("Creation failed"));

      await expect(service.createLead(validLeadData)).rejects.toThrow(
        "Failed to create lead record",
      );
    });

    it("handles special characters in lead data", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);

      const specialLeadData = {
        firstName: "José",
        lastName: "García-López",
        email: "jose.garcia@example.com",
        message: 'Message with "quotes" and special chars: @#$%',
        productName: "Widget & Co.",
      };

      mockCreate.mockResolvedValue([
        createMockRecord({
          id: "rec123456",
          fields: specialLeadData,
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ]);

      const result = await service.createLead(specialLeadData);

      expect(result).toEqual({ id: "rec123456" });
      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": "José",
            "Last Name": "García-López",
            Email: "jose.garcia@example.com",
            Message: 'Message with "quotes" and special chars: @#$%',
            "Product Name": "Widget & Co.",
            Source: "Product Inquiry",
          }),
        },
      ]);
    });
  });
});
