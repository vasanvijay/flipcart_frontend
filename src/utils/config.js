// Basic configuration
export const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export const isFeatureEnabled = (value) =>
    /^(true|1|yes|on)$/i.test(String(value || '').trim());

// PayU remains disabled unless it is explicitly enabled in the frontend environment.
export const PAYU_ENABLED = isFeatureEnabled(process.env.REACT_APP_PAYU_ENABLED);

// Helper to resolve image paths (handles relative uploads vs absolute URLs)
export const getImgSrc = (src) => {
    if (!src) return "https://via.placeholder.com/150?text=No+Image";
    if (src.startsWith('http') || src.startsWith('data:')) return src;

    // For local uploads, prepend backend URL
    if (src.startsWith('/')) return BASE_URL + src;
    if (src.includes('uploads/')) return BASE_URL + '/' + src;

    return src;
};
