import { vi } from "vitest";

// Mock Zod validation library
const createMockZodString = () => {
  const mockString = {
    min: vi.fn(() => mockString),
    max: vi.fn(() => mockString),
    trim: vi.fn(() => mockString),
    or: vi.fn(() => mockString),
    email: vi.fn(() => mockString),
    url: vi.fn(() => mockString),
    regex: vi.fn(() => mockString),
    optional: vi.fn(() => mockString),
    nullable: vi.fn(() => mockString),
    default: vi.fn(() => mockString),
    transform: vi.fn(() => mockString),
    refine: vi.fn(() => mockString),
    overwrite: vi.fn(() => mockString),
    parse: vi.fn((value) => value),
    safeParse: vi.fn((value) => ({ success: true, data: value })),
  };
  return mockString;
};

const createMockZodNumber = () => {
  const mockNumber = {
    min: vi.fn(() => mockNumber),
    max: vi.fn(() => mockNumber),
    int: vi.fn(() => mockNumber),
    positive: vi.fn(() => mockNumber),
    negative: vi.fn(() => mockNumber),
    nonnegative: vi.fn(() => mockNumber),
    nonpositive: vi.fn(() => mockNumber),
    finite: vi.fn(() => mockNumber),
    optional: vi.fn(() => mockNumber),
    nullable: vi.fn(() => mockNumber),
    default: vi.fn(() => mockNumber),
    transform: vi.fn(() => mockNumber),
    refine: vi.fn(() => mockNumber),
    parse: vi.fn((value) => value),
    safeParse: vi.fn((value) => ({ success: true, data: value })),
  };
  return mockNumber;
};

const createMockZodBoolean = () => {
  const mockBoolean = {
    optional: vi.fn(() => mockBoolean),
    nullable: vi.fn(() => mockBoolean),
    default: vi.fn(() => mockBoolean),
    transform: vi.fn(() => mockBoolean),
    refine: vi.fn(() => mockBoolean),
    parse: vi.fn((value) => value),
    safeParse: vi.fn((value) => ({ success: true, data: value })),
  };
  return mockBoolean;
};

const createMockZodArray = () => {
  const mockArray = {
    min: vi.fn(() => mockArray),
    max: vi.fn(() => mockArray),
    length: vi.fn(() => mockArray),
    nonempty: vi.fn(() => mockArray),
    optional: vi.fn(() => mockArray),
    nullable: vi.fn(() => mockArray),
    default: vi.fn(() => mockArray),
    transform: vi.fn(() => mockArray),
    refine: vi.fn(() => mockArray),
    parse: vi.fn((value) => value),
    safeParse: vi.fn((value) => ({ success: true, data: value })),
  };
  return mockArray;
};

const createMockZodObject = () => {
  const mockObject = {
    shape: {},
    extend: vi.fn(() => mockObject),
    merge: vi.fn(() => mockObject),
    pick: vi.fn(() => mockObject),
    omit: vi.fn(() => mockObject),
    partial: vi.fn(() => mockObject),
    deepPartial: vi.fn(() => mockObject),
    required: vi.fn(() => mockObject),
    passthrough: vi.fn(() => mockObject),
    strict: vi.fn(() => mockObject),
    strip: vi.fn(() => mockObject),
    catchall: vi.fn(() => mockObject),
    optional: vi.fn(() => mockObject),
    nullable: vi.fn(() => mockObject),
    default: vi.fn(() => mockObject),
    transform: vi.fn(() => mockObject),
    refine: vi.fn(() => mockObject),
    parse: vi.fn((value) => value),
    safeParse: vi.fn((value) => ({ success: true, data: value })),
  };
  return mockObject;
};

vi.mock("zod", () => ({
  z: {
    string: vi.fn(() => createMockZodString()),
    number: vi.fn(() => createMockZodNumber()),
    boolean: vi.fn(() => createMockZodBoolean()),
    date: vi.fn(() => createMockZodString()),
    array: vi.fn(() => createMockZodArray()),
    object: vi.fn(() => createMockZodObject()),
    union: vi.fn(() => createMockZodObject()),
    discriminatedUnion: vi.fn(() => createMockZodObject()),
    intersection: vi.fn(() => createMockZodString()),
    tuple: vi.fn(() => createMockZodArray()),
    record: vi.fn(() => createMockZodObject()),
    map: vi.fn(() => createMockZodObject()),
    set: vi.fn(() => createMockZodArray()),
    function: vi.fn(() => createMockZodString()),
    lazy: vi.fn(() => createMockZodString()),
    literal: vi.fn(() => createMockZodString()),
    enum: vi.fn(() => createMockZodString()),
    nativeEnum: vi.fn(() => createMockZodString()),
    promise: vi.fn(() => createMockZodString()),
    any: vi.fn(() => createMockZodString()),
    unknown: vi.fn(() => createMockZodString()),
    never: vi.fn(() => createMockZodString()),
    void: vi.fn(() => createMockZodString()),
    undefined: vi.fn(() => createMockZodString()),
    null: vi.fn(() => createMockZodString()),
    optional: vi.fn(() => createMockZodString()),
    nullable: vi.fn(() => createMockZodString()),
    coerce: {
      string: vi.fn(() => createMockZodString()),
      number: vi.fn(() => createMockZodNumber()),
      boolean: vi.fn(() => createMockZodBoolean()),
      date: vi.fn(() => createMockZodString()),
    },
  },
  ZodError: class MockZodError extends Error {
    constructor(issues: any[]) {
      super("Validation error");
      this.name = "ZodError";
      this.issues = issues;
    }
    issues: any[];
    format = vi.fn();
    flatten = vi.fn();
  },
  ZodIssueCode: {
    invalid_type: "invalid_type",
    invalid_literal: "invalid_literal",
    custom: "custom",
    invalid_union: "invalid_union",
    invalid_union_discriminator: "invalid_union_discriminator",
    invalid_enum_value: "invalid_enum_value",
    unrecognized_keys: "unrecognized_keys",
    invalid_arguments: "invalid_arguments",
    invalid_return_type: "invalid_return_type",
    invalid_date: "invalid_date",
    invalid_string: "invalid_string",
    too_small: "too_small",
    too_big: "too_big",
    invalid_intersection_types: "invalid_intersection_types",
    not_multiple_of: "not_multiple_of",
    not_finite: "not_finite",
  },
}));
