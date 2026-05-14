# Social Media Share Images

This directory contains social media sharing images for SEO optimization.

## Required Images

### og-image.jpg
- **Size**: 1200x630px
- **Format**: JPEG (recommended for social platform compatibility)
- **Purpose**: Open Graph image for social media sharing
- **Content**: Should include:
  - Company logo/branding
  - Key messaging
  - Clean, professional design matching brand colors

### apple-touch-icon.png (Required for iOS)
- **Location**: `public/apple-touch-icon.png` (root of public directory)
- **Size**: 180x180px
- **Format**: PNG
- **Purpose**: iOS home screen bookmark icon
- **Content**: Square icon with your brand logo
- **Note**: Place this file in `public/` directory (not in `public/images/`)

To create an Apple Touch Icon:
1. Create a 180x180px PNG image with your logo
2. Save as `public/apple-touch-icon.png`
3. Next.js will automatically serve it at `/apple-touch-icon.png`

### twitter-image.jpg (Optional)
- **Size**: 1200x600px
- **Format**: JPEG
- **Purpose**: Twitter Cards specific image
- **Content**: Similar to og-image but optimized for Twitter's aspect ratio

## Design Guidelines

1. **Brand Consistency**: Use project's color scheme and typography
2. **Readability**: Ensure text is legible at small sizes
3. **Professional**: Maintain B2B enterprise aesthetic
4. **Technology Focus**: Highlight modern tech stack
5. **Call to Action**: Include subtle CTA or value proposition

## Current Status

- ✅ SEO configuration updated to reference `/images/og-image.jpg`
- ⏳ Apple Touch Icon: Create `public/apple-touch-icon.png` (180x180px PNG)

## Testing

After adding images, test social sharing on:
- Facebook Sharing Debugger
- Twitter Card Validator
- LinkedIn Post Inspector
- WhatsApp link preview
- iOS Safari (add to home screen to test apple-touch-icon)
