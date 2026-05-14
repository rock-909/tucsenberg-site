const BIGINT_ZERO = 0n;
const BIGINT_ONE = 1n;
const BIGINT_FOUR = 4n;
const IPV4_VERSION = 4;
const IPV6_VERSION = 6;
const IPV4_BITS_PER_OCTET = 8;
const IPV4_OCTET_COUNT = 4;
const IPV4_MAX_OCTET = 255;
const IPV4_MAX_PREFIX = 32;
const IPV4_SEGMENT_MASK = 0xffff;
const IPV6_BITS_PER_SEGMENT = 16;
const IPV6_SEGMENT_COUNT = 8;
const IPV6_MAX_BITS = 128;
const CHAR_CODE_0 = 48;
const CHAR_CODE_9 = 57;
const CHAR_CODE_A = 97;
const CHAR_CODE_F = 102;
const HEX_ALPHA_OFFSET = 87;

function parseIPv6Segment(segment: string): bigint | null {
  if (segment.length < 1 || segment.length > 4) {
    return null;
  }

  let value = BIGINT_ZERO;

  for (const char of segment) {
    const digit = parseHexDigit(char);
    if (digit === null) {
      return null;
    }

    value = (value << BIGINT_FOUR) + BigInt(digit);
  }

  return value;
}

function parseHexDigit(char: string): number | null {
  const code = char.toLowerCase().charCodeAt(0);

  if (code >= CHAR_CODE_0 && code <= CHAR_CODE_9) {
    return code - CHAR_CODE_0;
  }

  if (code >= CHAR_CODE_A && code <= CHAR_CODE_F) {
    return code - HEX_ALPHA_OFFSET;
  }

  return null;
}

function splitIPv6Side(side: string): string[] {
  return side === "" ? [] : side.split(":");
}

export function ipv4ToInteger(ip: string): number | null {
  const segments = ip.split(".");
  if (segments.length !== IPV4_OCTET_COUNT) return null;

  let value = 0;
  for (const segment of segments) {
    if (!/^\d+$/u.test(segment)) return null;

    const octet = Number.parseInt(segment, 10);
    if (octet > IPV4_MAX_OCTET) {
      return null;
    }

    value = (value << IPV4_BITS_PER_OCTET) + octet;
  }

  return value >>> 0;
}

export function ipv4ToBigInt(ip: string): bigint | null {
  const value = ipv4ToInteger(ip);
  return value === null ? null : BigInt(value);
}

export function normalizeIPv6Segments(segments: string[]): string[] | null {
  const lastSegment = segments.at(-1);
  if (lastSegment?.includes(".")) {
    const ipv4Value = ipv4ToInteger(lastSegment);
    if (ipv4Value === null) return null;

    const normalized = segments.slice(0, -1);
    normalized.push(
      ((ipv4Value >>> IPV6_BITS_PER_SEGMENT) & IPV4_SEGMENT_MASK).toString(16),
    );
    normalized.push((ipv4Value & IPV4_SEGMENT_MASK).toString(16));
    return normalized;
  }

  return segments;
}

export function ipv6ToBigInt(ip: string): bigint | null {
  const compressionIndex = ip.indexOf("::");
  const hasCompression = compressionIndex !== -1;

  const leftRaw = hasCompression ? ip.slice(0, compressionIndex) : ip;
  const rightRaw = hasCompression ? ip.slice(compressionIndex + 2) : "";

  const leftSegments = normalizeIPv6Segments(splitIPv6Side(leftRaw));
  const rightSegments = normalizeIPv6Segments(splitIPv6Side(rightRaw));

  if (leftSegments === null || rightSegments === null) return null;

  const totalProvided = leftSegments.length + rightSegments.length;
  const missingSegments = IPV6_SEGMENT_COUNT - totalProvided;
  const validCount = hasCompression
    ? missingSegments > 0
    : missingSegments === 0;
  if (!validCount) return null;

  const segments = hasCompression
    ? [
        ...leftSegments,
        ...Array.from({ length: missingSegments }, () => "0"),
        ...rightSegments,
      ]
    : leftSegments;

  return segments.reduce<bigint | null>((accumulator, segment) => {
    if (accumulator === null) return null;

    const value = parseIPv6Segment(segment);
    if (value === null) {
      return null;
    }

    return (accumulator << BigInt(IPV6_BITS_PER_SEGMENT)) + value;
  }, BIGINT_ZERO);
}

type ParsedIP = {
  version: typeof IPV4_VERSION | typeof IPV6_VERSION;
  value: bigint;
};

function parseIP(ip: string): ParsedIP | null {
  const ipv4Value = ipv4ToBigInt(ip);
  if (ipv4Value !== null) {
    return { version: IPV4_VERSION, value: ipv4Value };
  }

  const ipv6Value = ipv6ToBigInt(ip);
  if (ipv6Value !== null) {
    return { version: IPV6_VERSION, value: ipv6Value };
  }

  return null;
}

export function ipToBigInt(ip: string): bigint | null {
  const parsed = parseIP(ip);
  return parsed === null ? null : parsed.value;
}

export function createIPv4Mask(prefixLength: number): bigint {
  const hostBits = IPV4_MAX_PREFIX - prefixLength;
  const fullMask =
    (BIGINT_ONE << BigInt(IPV4_OCTET_COUNT * IPV4_BITS_PER_OCTET)) - BIGINT_ONE;
  return (fullMask << BigInt(hostBits)) & fullMask;
}

export function createIPv6Mask(prefixLength: number): bigint | null {
  if (prefixLength === 0) {
    return null;
  }

  const fullMask = (BIGINT_ONE << BigInt(IPV6_MAX_BITS)) - BIGINT_ONE;
  return (fullMask << BigInt(IPV6_MAX_BITS - prefixLength)) & fullMask;
}

type ParsedCidr = {
  network: string;
  prefixLength: number;
};

function parseCidr(cidr: string): ParsedCidr | null {
  const cidrParts = cidr.split("/");
  if (cidrParts.length !== 2) return null;

  const network = cidrParts[0]!;
  const prefixLengthValue = cidrParts[1]!;
  if (!/^\d+$/u.test(prefixLengthValue)) return null;

  return {
    network,
    prefixLength: Number.parseInt(prefixLengthValue, 10),
  };
}

function isValidPrefixLength(
  version: ParsedIP["version"],
  prefixLength: number,
): boolean {
  return (
    prefixLength <= (version === IPV4_VERSION ? IPV4_MAX_PREFIX : IPV6_MAX_BITS)
  );
}

export function isIPInCIDRRange(ip: string, cidr: string): boolean {
  const parsedCidr = parseCidr(cidr);
  if (!parsedCidr) return false;

  const parsedIP = parseIP(ip);
  const parsedNetwork = parseIP(parsedCidr.network);

  if (!parsedIP || !parsedNetwork) {
    return false;
  }

  if (parsedIP.version !== parsedNetwork.version) {
    return false;
  }

  const { prefixLength } = parsedCidr;
  if (!isValidPrefixLength(parsedIP.version, prefixLength)) {
    return false;
  }

  if (parsedIP.version === IPV4_VERSION) {
    const mask = createIPv4Mask(prefixLength);
    return (parsedIP.value & mask) === (parsedNetwork.value & mask);
  }

  const mask = createIPv6Mask(prefixLength);
  if (mask === null) {
    return true;
  }

  return (parsedIP.value & mask) === (parsedNetwork.value & mask);
}

export function isTrustedCdnSource(
  sourceIP: string | null,
  cdnIpRanges?: string[],
): boolean {
  if (!cdnIpRanges || cdnIpRanges.length === 0) {
    return true;
  }

  if (!sourceIP) {
    return false;
  }

  return cdnIpRanges.some((cidr) => isIPInCIDRRange(sourceIP, cidr));
}
