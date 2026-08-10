import Image, { type ImageProps } from "next/image";

/**
 * Product / site imagery is pre-compressed (WebP or JPEG). Skip Vercel Image
 * Optimization so Hobby plan transform quotas stay free.
 */
export function ProductImage(props: ImageProps) {
  return <Image {...props} unoptimized />;
}
