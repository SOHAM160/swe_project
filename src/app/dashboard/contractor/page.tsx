'use client';
import { useEffect, useState } from 'react';
import BinCard from '@/components/BinCard';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  StatsCard, 
  QuickActionsCard, 
  ActivityFeed 
} from '@/components/DashboardComponents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bin } from '@/lib/bins';
import { TruckIcon, ChartIcon, RecycleIcon, LeafIcon } from '@/components/ui/icons';

interface Contractor {
  id: string;
  name: string;
  email: string;
  todaysEarnings: number;
  completedPickups: number;
  weeklyStats: {
    pickupsCompleted: number;
    totalEarnings: number;
    efficiencyRating: number;
    onTimeRate: number;
  };
}

export default function ContractorDashboard() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'assigned' | 'routes' | 'earnings'>('overview');
  const [loading, setLoading] = useState(false);
  const contractorId = 'contractor-1'; // In a real app, this would come from auth

  const loadData = async () => {
    try {
      const [binsRes, contractorRes] = await Promise.all([
        fetch('/api/bins'),
        fetch(`/api/contractors/${contractorId}`),
      ]);
      
      const binsData = await binsRes.json();
      const contractorData = await contractorRes.json();
      
      setBins(binsData);
      setContractor(contractorData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to default values
      if (!contractor) {
        setContractor({
          id: contractorId,
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
        });
      }
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 20 seconds to stay in sync with IoT simulation and other dashboards
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  async function handlePickup(binId: string, action: string = 'Collected') {
    setLoading(true);
    try {
      const res = await fetch(`/api/contractors/${contractorId}/pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ binId, action }),
      });

      if (res.ok) {
        const data = await res.json();
        setContractor({
          ...contractor!,
          todaysEarnings: data.totalEarnings,
          completedPickups: contractor!.completedPickups + 1,
          weeklyStats: {
            ...contractor!.weeklyStats,
            pickupsCompleted: contractor!.weeklyStats.pickupsCompleted + 1,
            totalEarnings: contractor!.weeklyStats.totalEarnings + data.earnings,
          },
        });
        
        // Update bins
        setBins(prevBins => 
          prevBins.map(bin => 
            bin.id === binId ? data.bin : bin
          )
        );
        
        alert(`✅ ${action} confirmed for ${binId}! Earned $${data.earnings.toFixed(2)}`);
        loadData();
      } else {
        alert('❌ Failed to confirm pickup. Please try again.');
      }
    } catch (error) {
      alert('❌ Failed to confirm pickup. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Filter bins for contractor (only full and hazard bins are assigned)
  const assignedBins = bins.filter(bin => bin.status === 'Full' || bin.status === 'Hazard');
  // Removed unused variable: completedToday
  const urgentBins = bins.filter(bin => bin.status === 'Hazard');

  const mockActivities = [
    {
      id: '1',
      message: 'Completed pickup for BIN002 - Earned $25.00',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      type: 'success' as const,
      user: 'You'
    },
    {
      id: '2',
      message: 'New pickup assignment: BIN001 (Priority: High)',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      type: 'info' as const,
      user: 'System'
    },
    {
      id: '3',
      message: 'Route optimized - 3 pickups in Sector 5',
      timestamp: new Date(Date.now() - 40 * 60 * 1000),
      type: 'success' as const,
      user: 'Route AI'
    }
  ];

  const quickActions = [
    {
      label: '🚛 Start Route',
      onClick: () => {
        const assignedBins = bins.filter(b => b.status === 'Full' || b.status === 'Hazard');
        if (assignedBins.length > 0) {
          alert(`🗺️ Optimal route calculated for ${assignedBins.length} bins! Opening GPS navigation...`);
          // In a real app, this would open a map with the route
        } else {
          alert('🗺️ No assigned bins for route planning.');
        }
      },
      variant: 'default' as const
    },
    {
      label: '⚠️ Report Issue',
      onClick: () => {
        const issue = prompt('Describe the issue:');
        if (issue) {
          alert(`📝 Issue reported: ${issue}\nDispatch team has been notified.`);
        }
      }
    },
    {
      label: '📞 Emergency Contact',
      onClick: () => {
        if (confirm('Call emergency dispatch?')) {
          alert('☎️ Connecting to dispatch...\nEmergency line: +1-800-WASTE-911');
        }
      },
      variant: 'outline' as const
    },
    {
      label: '💰 View Earnings',
      onClick: () => setSelectedView('earnings')
    },
    {
      label: '🔄 Refresh Data',
      onClick: loadData,
      variant: 'outline' as const
    }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Earnings"
          value={`$${(contractor?.todaysEarnings || 0).toFixed(2)}`}
          change="+$50 from yesterday"
          changeType="positive"
          icon={<LeafIcon className="h-6 w-6 text-green-600" />}
        />
        <StatsCard
          title="Assigned Pickups"
          value={assignedBins.length}
          change={assignedBins.length > 0 ? 'Ready to collect' : 'All clear'}
          changeType={assignedBins.length > 0 ? 'neutral' : 'positive'}
          icon={<RecycleIcon className="h-6 w-6 text-blue-600" />}
        />
        <StatsCard
          title="Completed Today"
          value={contractor?.completedPickups || 0}
          change="+2 from target"
          changeType="positive"
          icon={<TruckIcon className="h-6 w-6 text-purple-600" />}
        />
        <StatsCard
          title="Urgent Bins"
          value={urgentBins.length}
          change={urgentBins.length === 0 ? 'No urgents' : 'Priority required'}
          changeType={urgentBins.length === 0 ? 'positive' : 'negative'}
          icon={<ChartIcon className="h-6 w-6 text-red-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Urgent Assignments */}
          {urgentBins.length > 0 && (
            <Card className="p-6 border-red-200 bg-red-50">
              <CardTitle className="text-lg font-semibold text-red-800 mb-4">
                🚨 Urgent Assignments
              </CardTitle>
              <CardContent className="p-0 space-y-3">
                {urgentBins.map(bin => (
                  <div key={bin.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <span className="font-medium text-red-700">{bin.id} - {bin.location}</span>
                      <p className="text-sm text-red-600">Hazard detected - immediate attention required</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handlePickup(bin.id, 'Hazard_Resolved')}
                      disabled={loading}
                    >
                      Resolve
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Today's Route */}
          <Card className="p-6">
            <CardTitle className="text-lg font-semibold mb-4 flex items-center">
              <TruckIcon className="h-5 w-5 mr-2 text-blue-600" />
              Today&apos;s Optimized Route
            </CardTitle>
            <CardContent className="p-0">
              {assignedBins.length > 0 ? (
                <div className="space-y-3">
                  {assignedBins.map((bin, index) => (
                    <div key={bin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <span className="font-medium">{bin.id} - {bin.location}</span>
                          <p className="text-sm text-gray-600">Fill level: {bin.fillLevel}% • Est. reward: $25</p>
                        </div>
                      </div>
                      <Badge 
                        className={`${
                          bin.status === 'Full' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {bin.status}
                      </Badge>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total estimated time:</span>
                      <span className="font-medium">2h 15min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total estimated earnings:</span>
                      <span className="font-medium text-green-600">${assignedBins.length * 25}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TruckIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pickups assigned for today</p>
                  <p className="text-sm">Check back later for new assignments</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Activity Feed */}
          <ActivityFeed activities={mockActivities} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <QuickActionsCard title="Quick Actions" actions={quickActions} />
          
          {/* Performance Stats */}
          <Card className="p-6 bg-green-50 border-green-200">
            <CardTitle className="text-lg font-semibold text-green-800 mb-4">
              📈 Performance This Week
            </CardTitle>
            <CardContent className="p-0 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Pickups Completed</span>
                <span className="font-bold text-green-800">{contractor?.weeklyStats.pickupsCompleted || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Total Earnings</span>
                <span className="font-bold text-green-800">${(contractor?.weeklyStats.totalEarnings || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Efficiency Rating</span>
                <span className="font-bold text-green-800">{contractor?.weeklyStats.efficiencyRating || 0}/5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">On-time Rate</span>
                <span className="font-bold text-green-800">{contractor?.weeklyStats.onTimeRate || 0}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderAssigned = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assigned Pickups</h2>
          <p className="text-gray-600">Complete pickups to earn rewards</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            🔄 Refresh
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              const assignedBins = bins.filter(b => b.status === 'Full' || b.status === 'Hazard');
              if (assignedBins.length > 0) {
                alert(`🗺️ Route optimized for ${assignedBins.length} bins! Estimated time: ${Math.ceil(assignedBins.length * 15)} minutes`);
              } else {
                alert('🗺️ No bins to optimize route for.');
              }
            }}
          >
            🗺️ Optimize Route
          </Button>
        </div>
      </div>
      
      {assignedBins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedBins.map((bin) => (
            <BinCard 
              key={bin.id} 
              bin={bin} 
              showActions={true}
              onAction={handlePickup}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <TruckIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2">No Assignments</h3>
          <p className="text-gray-600">You have no pickup assignments at the moment. New assignments will appear here when available.</p>
        </Card>
      )}
    </div>
  );

  const renderContent = () => {
    switch (selectedView) {
      case 'assigned': return renderAssigned();
      case 'routes': return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Route Planning</h2>
          <p className="text-gray-600 mb-4">Coming soon - Advanced route optimization</p>
          <Button onClick={() => setSelectedView('overview')}>← Back to Overview</Button>
        </div>
      );
      case 'earnings': return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Earnings History</h2>
            <Button onClick={() => setSelectedView('overview')}>← Back to Overview</Button>
          </div>
          
          <Card className="p-6">
            <CardTitle className="text-lg font-semibold mb-4">Today's Earnings</CardTitle>
            <CardContent className="p-0 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed Pickups</span>
                <span className="font-bold text-lg">{contractor?.completedPickups || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Earnings per Pickup</span>
                <span className="font-bold">$25.00</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Today</span>
                  <span className="font-bold text-2xl text-green-600">
                    ${(contractor?.todaysEarnings || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardTitle className="text-lg font-semibold mb-4">Weekly Statistics</CardTitle>
            <CardContent className="p-0 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pickups Completed</span>
                <span className="font-bold">{contractor?.weeklyStats.pickupsCompleted || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Earnings</span>
                <span className="font-bold text-green-600">
                  ${(contractor?.weeklyStats.totalEarnings || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average per Pickup</span>
                <span className="font-bold">
                  ${contractor?.weeklyStats.pickupsCompleted 
                    ? (contractor.weeklyStats.totalEarnings / contractor.weeklyStats.pickupsCompleted).toFixed(2)
                    : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Efficiency Rating</span>
                <span className="font-bold">{contractor?.weeklyStats.efficiencyRating || 0}/5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">On-time Rate</span>
                <span className="font-bold">{contractor?.weeklyStats.onTimeRate || 0}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      );
      default: return renderOverview();
    }
  };

  return (
    <DashboardLayout title="Contractor Hub" userType="contractor">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'assigned', label: '🚛 Assigned Bins' },
            { key: 'routes', label: '🗺️ Routes' },
            { key: 'earnings', label: '💰 Earnings' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key as 'overview' | 'assigned' | 'routes' | 'earnings')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedView === tab.key
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Main Content */}
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}
