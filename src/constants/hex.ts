// 直接定义基础常量，避免循环依赖（移除未使用的占位常量）

/**
 * 十六进制相关常量
 *
 * 🎯 用途：文件签名、掩码、字节操作等十六进制常量
 * 🔒 安全：主要用于文件类型检测和安全验证
 */

// ============================================================================
// 基础十六进制常量
// ============================================================================

export const HEX_BYTE_MAX = 255; // 255
export const HEX_NIBBLE_MAX = 15; // 15

// ============================================================================
// 位掩码常量
// ============================================================================

export const HEX_MASK_6_BITS = 63 as const; // 63
export const HEX_MASK_BIT_6 = 64 as const; // 64
export const HEX_MASK_HIGH_BIT = 128 as const; // 128
export const HEX_MASK_LOW_NIBBLE = 15 as const; // 15

// ============================================================================
// 文件签名常量 - PNG
// ============================================================================

export const HEX_PNG_SIGNATURE_1 = 0x89 as const; // PNG signature byte 1
export const HEX_PNG_SIGNATURE_2 = 0x50 as const; // PNG signature byte 2 ('P')
export const HEX_PNG_SIGNATURE_3 = 0x4e as const; // PNG signature byte 3 ('N')
export const HEX_PNG_SIGNATURE_4 = 0x47 as const; // PNG signature byte 4 ('G')
export const HEX_PNG_SIGNATURE_5 = 0x0d as const; // PNG signature byte 5
export const HEX_PNG_SIGNATURE_6 = 0x0a as const; // PNG signature byte 6

// ============================================================================
// 文件签名常量 - JPEG
// ============================================================================

export const HEX_JPEG_MARKER_1 = 0xff as const; // JPEG marker start
export const HEX_JPEG_SOI = 0xd8 as const; // JPEG Start of Image

// ============================================================================
// 文件签名常量 - PDF
// ============================================================================

export const HEX_PDF_MARKER = 0x25 as const; // PDF marker '%'
export const HEX_PDF_SIGNATURE_1 = 0x50 as const; // PDF signature 'P'

// ============================================================================
// 文件签名常量 - ZIP
// ============================================================================

export const HEX_ZIP_SIGNATURE = 0x50 as const; // ZIP signature 'P'

// ============================================================================
// ZIP 文件签名常量
// ============================================================================

/** ZIP local file header version needed (PK\x03\x04 byte 3) */
export const HEX_ZIP_LOCAL_HEADER_3 = 0x03 as const;
/** ZIP local file header version extract (PK\x03\x04 byte 4) */
export const HEX_ZIP_LOCAL_HEADER_4 = 0x04 as const;

// ============================================================================
// 通用十六进制数值
// ============================================================================

export const HEX_VALUE_3 = 0x3 as const;
export const HEX_VALUE_8 = 0x8 as const;
