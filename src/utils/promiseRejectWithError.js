/**
 * Promise rejections in interceptors must use an Error (Sonar S6671).
 * @param {unknown} reason
 * @returns {Promise<never>}
 */
export function rejectWithError(reason) {
  if (reason instanceof Error) {
    return Promise.reject(reason);
  }
  if (typeof reason === 'string') {
    return Promise.reject(new Error(reason));
  }
  return Promise.reject(new Error('An unexpected error occurred'));
}
