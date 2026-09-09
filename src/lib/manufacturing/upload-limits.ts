/** Vercel serverless incoming payload cap that produced FUNCTION_PAYLOAD_TOO_LARGE. */
export const VERCEL_FUNCTION_PAYLOAD_BYTES = 4.5 * 1024 * 1024;

/** Leave headroom for multipart boundaries so the function is never hit with a 413. */
export const SERVERLESS_SAFE_UPLOAD_BYTES = 3.5 * 1024 * 1024;
