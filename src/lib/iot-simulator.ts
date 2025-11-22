// IoT Data Simulator - Simulates real-time sensor data for smart bins

import { Database } from './db';
import { Bin } from './bins';

const binsDb = new Database('bins');
const activitiesDb = new Database('activities');

interface IoTState {
  binId: string;
  fillLevel: number;
  gasLevel: number;
  status: 'Empty' | 'Normal' | 'Full' | 'Hazard';
  trend: 'increasing' | 'decreasing' | 'stable';
  lastUpdate: string;
}

// Simulate realistic bin behavior
const binStates: Map<string, IoTState> = new Map();

// Initialize or get bin state
function getBinState(binId: string): IoTState {
  if (!binStates.has(binId)) {
    binStates.set(binId, {
      binId,
      fillLevel: Math.floor(Math.random() * 50) + 10, // 10-60%
      gasLevel: Math.floor(Math.random() * 3) + 1, // 1-3
      status: 'Normal',
      trend: 'increasing',
      lastUpdate: new Date().toISOString(),
    });
  }
  return binStates.get(binId)!;
}

// Simulate realistic fill level changes
function simulateFillLevel(current: number, trend: 'increasing' | 'decreasing' | 'stable'): number {
  let change = 0;
  
  switch (trend) {
    case 'increasing':
      // Bins fill up at different rates (1-5% per update)
      change = Math.random() * 4 + 1;
      break;
    case 'decreasing':
      // Empty bins slowly (0.5-2% per update)
      change = -(Math.random() * 1.5 + 0.5);
      break;
    case 'stable':
      // Small fluctuations
      change = (Math.random() - 0.5) * 2;
      break;
  }
  
  // Add some randomness
  change += (Math.random() - 0.5) * 1;
  
  let newLevel = current + change;
  
  // Clamp between 0 and 100
  newLevel = Math.max(0, Math.min(100, newLevel));
  
  return Math.round(newLevel * 10) / 10; // Round to 1 decimal
}

// Determine bin status based on fill level and gas
function determineStatus(fillLevel: number, gasLevel: number): 'Empty' | 'Normal' | 'Full' | 'Hazard' {
  // Hazard detection: high gas level or very high fill
  if (gasLevel >= 4 || fillLevel >= 95) {
    return 'Hazard';
  }
  
  // Full: 80-95%
  if (fillLevel >= 80) {
    return 'Full';
  }
  
  // Empty: 0-20%
  if (fillLevel <= 20) {
    return 'Empty';
  }
  
  // Normal: 21-79%
  return 'Normal';
}

// Simulate gas level based on fill level and time
function simulateGasLevel(fillLevel: number, currentGas: number): number {
  // Gas increases with fill level and time
  let newGas = currentGas;
  
  if (fillLevel > 70) {
    // High fill = more gas production
    newGas += Math.random() * 0.5;
  } else if (fillLevel < 30) {
    // Low fill = gas dissipates
    newGas -= Math.random() * 0.3;
  } else {
    // Normal = slight increase
    newGas += (Math.random() - 0.3) * 0.2;
  }
  
  // Clamp between 1 and 5
  newGas = Math.max(1, Math.min(5, newGas));
  
  return Math.round(newGas);
}

// Determine trend based on current state
function determineTrend(fillLevel: number, status: string): 'increasing' | 'decreasing' | 'stable' {
  if (status === 'Empty') {
    // Empty bins start filling
    return 'increasing';
  }
  
  if (status === 'Full' || status === 'Hazard') {
    // Full bins stay full (until collected)
    return 'stable';
  }
  
  // Normal bins usually fill up
  if (fillLevel < 50) {
    return 'increasing';
  }
  
  // Sometimes bins decrease (if being used less)
  if (Math.random() < 0.1) {
    return 'decreasing';
  }
  
  return 'increasing';
}

// Main simulation function
export async function simulateIoTData(): Promise<void> {
  try {
    const bins = await binsDb.read<Bin>();
    
    for (const bin of bins) {
      const state = getBinState(bin.id);
      
      // Update trend based on current status
      state.trend = determineTrend(bin.fillLevel, bin.status);
      
      // Simulate fill level change
      state.fillLevel = simulateFillLevel(bin.fillLevel, state.trend);
      
      // Simulate gas level
      state.gasLevel = simulateGasLevel(state.fillLevel, bin.gasLevel);
      
      // Determine new status
      const newStatus = determineStatus(state.fillLevel, state.gasLevel);
      const statusChanged = newStatus !== bin.status;
      state.status = newStatus;
      state.lastUpdate = new Date().toISOString();
      
      // Update bin in database
      await binsDb.update<Bin>(bin.id, {
        fillLevel: Math.round(state.fillLevel),
        gasLevel: Math.round(state.gasLevel),
        status: newStatus,
        lastUpdated: state.lastUpdate,
      });
      
      // Log status changes
      if (statusChanged) {
        let activityType: 'success' | 'warning' | 'error' | 'info' = 'info';
        let message = '';
        
        switch (newStatus) {
          case 'Full':
            activityType = 'warning';
            message = `Bin ${bin.id} is now FULL (${Math.round(state.fillLevel)}%) - requires pickup`;
            break;
          case 'Hazard':
            activityType = 'error';
            message = `🚨 HAZARD detected at ${bin.id} (${Math.round(state.fillLevel)}% full, gas level: ${Math.round(state.gasLevel)}) - IMMEDIATE ATTENTION REQUIRED`;
            break;
          case 'Empty':
            activityType = 'success';
            message = `Bin ${bin.id} is now EMPTY and ready for use`;
            break;
          case 'Normal':
            activityType = 'info';
            message = `Bin ${bin.id} status normalized (${Math.round(state.fillLevel)}%)`;
            break;
        }
        
        if (message) {
          await activitiesDb.create({
            id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: activityType,
            message,
            user: 'IoT Sensor System',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    console.error('Error simulating IoT data:', error);
  }
}

// Start continuous simulation
let simulationInterval: NodeJS.Timeout | null = null;

export function startIoTSimulation(intervalMs: number = 30000): void {
  // Run immediately
  simulateIoTData();
  
  // Then run at intervals
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }
  
  simulationInterval = setInterval(() => {
    simulateIoTData();
  }, intervalMs);
  
  console.log(`IoT Simulation started (updates every ${intervalMs / 1000} seconds)`);
}

export function stopIoTSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('IoT Simulation stopped');
  }
}

// Note: Simulation is started via initializeDefaultData in db.ts
// This prevents multiple instances from starting

