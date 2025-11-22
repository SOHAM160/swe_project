import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Generic database operations
export class Database {
  private filePath: string;

  constructor(fileName: string) {
    this.filePath = path.join(DATA_DIR, `${fileName}.json`);
  }

  async read<T>(): Promise<T[]> {
    await ensureDataDir();
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async write<T>(data: T[]): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async findById<T extends { id: string }>(id: string): Promise<T | null> {
    const items = await this.read<T>();
    return items.find(item => item.id === id) || null;
  }

  async create<T extends { id: string }>(item: T): Promise<T> {
    const items = await this.read<T>();
    items.push(item);
    await this.write(items);
    return item;
  }

  async update<T extends { id: string }>(id: string, updates: Partial<T>): Promise<T | null> {
    const items = await this.read<T>();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates };
    await this.write(items);
    return items[index];
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.read<any>();
    const filtered = items.filter((item: any) => item.id !== id);
    if (filtered.length === items.length) return false;
    await this.write(filtered);
    return true;
  }

  async findAll<T>(predicate?: (item: T) => boolean): Promise<T[]> {
    const items = await this.read<T>();
    if (predicate) {
      return items.filter(predicate);
    }
    return items;
  }
}

// Initialize default data if files don't exist
export async function initializeDefaultData() {
  const binsDb = new Database('bins');
  const bins = await binsDb.read();
  
  if (bins.length === 0) {
    // Initialize with default bins with varied initial states
    await binsDb.create({
      id: 'BIN001',
      location: 'Sector 5, Jaipur',
      fillLevel: Math.floor(Math.random() * 40) + 30, // 30-70%
      gasLevel: Math.floor(Math.random() * 2) + 1, // 1-2
      lastUpdated: new Date().toISOString(),
      status: 'Normal',
    });
    await binsDb.create({
      id: 'BIN002',
      location: 'Vaishali Nagar, Jaipur',
      fillLevel: Math.floor(Math.random() * 15) + 80, // 80-95%
      gasLevel: Math.floor(Math.random() * 2) + 3, // 3-4
      lastUpdated: new Date().toISOString(),
      status: 'Full',
    });
    await binsDb.create({
      id: 'BIN003',
      location: 'Malviya Nagar, Jaipur',
      fillLevel: Math.floor(Math.random() * 20), // 0-20%
      gasLevel: 1,
      lastUpdated: new Date().toISOString(),
      status: 'Empty',
    });
    
    // Add more bins for better simulation
    await binsDb.create({
      id: 'BIN004',
      location: 'C-Scheme, Jaipur',
      fillLevel: Math.floor(Math.random() * 30) + 50, // 50-80%
      gasLevel: Math.floor(Math.random() * 2) + 2, // 2-3
      lastUpdated: new Date().toISOString(),
      status: 'Normal',
    });
    await binsDb.create({
      id: 'BIN005',
      location: 'Raja Park, Jaipur',
      fillLevel: Math.floor(Math.random() * 25) + 10, // 10-35%
      gasLevel: 1,
      lastUpdated: new Date().toISOString(),
      status: 'Empty',
    });
  }
  
  // Start IoT simulation if not already running (server-side only)
  if (typeof window === 'undefined') {
    try {
      const { startIoTSimulation } = await import('./iot-simulator');
      startIoTSimulation(30000); // Update every 30 seconds
    } catch (error) {
      // Ignore errors if module not loaded yet
    }
  }

  const usersDb = new Database('users');
  const users = await usersDb.read();
  
  if (users.length === 0) {
    // Initialize with default users
    await usersDb.create({
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@wastechain.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
  }

  const citizensDb = new Database('citizens');
  const citizens = await citizensDb.read();
  
  if (citizens.length === 0) {
    await citizensDb.create({
      id: 'citizen-1',
      name: 'Demo Citizen',
      email: 'citizen@example.com',
      points: 1250,
      reportsSubmitted: 8,
      environmentalImpact: {
        co2Saved: 12.5,
        wasteDisposed: 45,
        recyclingRate: 78,
      },
      createdAt: new Date().toISOString(),
    });
  }

  const contractorsDb = new Database('contractors');
  const contractors = await contractorsDb.read();
  
  if (contractors.length === 0) {
    await contractorsDb.create({
      id: 'contractor-1',
      name: 'Demo Contractor',
      email: 'contractor@example.com',
      todaysEarnings: 245.50,
      completedPickups: 8,
      weeklyStats: {
        pickupsCompleted: 47,
        totalEarnings: 1175.00,
        efficiencyRating: 4.8,
        onTimeRate: 96,
      },
      createdAt: new Date().toISOString(),
    });
  }
}

