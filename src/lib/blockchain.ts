// This file is kept for backward compatibility
// The actual blockchain operations are now handled via API routes
// which use the Database class for persistence

type Transaction = {
  id: string;
  binId: string;
  action: string;
  timestamp: string;
};

// Legacy in-memory storage (for backward compatibility only)
const blockchainLog: Transaction[] = [];

export function logToBlockchain(binId: string, action: string) {
  const tx = {
    id: `TX-${Date.now()}`,
    binId,
    action,
    timestamp: new Date().toISOString(),
  };
  blockchainLog.push(tx);
  return tx;
}

export function getBlockchainLog() {
  return blockchainLog;
}
