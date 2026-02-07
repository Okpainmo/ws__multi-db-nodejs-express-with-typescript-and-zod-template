/**
 * Generate a unique connection ID
 */
export function generateConnectionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
