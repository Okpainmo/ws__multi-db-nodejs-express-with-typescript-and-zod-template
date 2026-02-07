/**
 * Generate a unique connection ID
 */
export function generateConnectionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
