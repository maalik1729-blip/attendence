/**
 * Face descriptor utilities.
 *
 * In production, use a real face-recognition service (AWS Rekognition,
 * Microsoft Face API, or face-api.js with pre-loaded models). This module
 * provides a thin abstraction so the rest of the backend doesn't depend on
 * the specific implementation.
 *
 * The client is expected to compute a 128-D face descriptor with face-api.js
 * in the Expo app and send it along with the photo. The backend then:
 *   - stores the descriptor on first (enrollment) attendance;
 *   - compares against the stored descriptor for subsequent attempts.
 *
 * If no descriptor is provided we fall back to accepting the image with a
 * warning (to keep the app usable during local development without ML setup).
 */

function euclideanDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Returns { matched: boolean, distance: number }.
 * threshold: typical face-api.js distance cutoff ~0.55.
 */
function compareDescriptors(reference, candidate, threshold) {
  if (!reference || !candidate) {
    return { matched: false, distance: null, reason: 'missing_descriptor' };
  }
  const distance = euclideanDistance(reference, candidate);
  return {
    matched: distance <= threshold,
    distance,
  };
}

function isValidDescriptor(desc) {
  return Array.isArray(desc) && desc.length >= 64 && desc.every((n) => typeof n === 'number');
}

module.exports = { compareDescriptors, isValidDescriptor, euclideanDistance };
