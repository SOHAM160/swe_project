export type Bin = {
  id: string;
  location: string;
  fillLevel: number;
  gasLevel: number;
  lastUpdated: string;
  status: 'Empty' | 'Normal' | 'Full' | 'Hazard';
};

export const bins: Bin[] = [
  {
    id: 'BIN001',
    location: 'Sector 5, Jaipur',
    fillLevel: 45,
    gasLevel: 2,
    lastUpdated: new Date().toISOString(),
    status: 'Normal',
  },
  {
    id: 'BIN002',
    location: 'Vaishali Nagar, Jaipur',
    fillLevel: 85,
    gasLevel: 4,
    lastUpdated: new Date().toISOString(),
    status: 'Full',
  },
  {
    id: 'BIN003',
    location: 'Malviya Nagar, Jaipur',
    fillLevel: 20,
    gasLevel: 1,
    lastUpdated: new Date().toISOString(),
    status: 'Empty',
  },
];
