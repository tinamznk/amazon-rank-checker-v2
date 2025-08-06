/**
 * Sleep trong khoảng thời gian (ms)
 * @param {number} ms - số milliseconds cần delay
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
