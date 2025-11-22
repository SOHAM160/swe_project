'use client';
import { useEffect, useState } from 'react';
import BinCard from '@/components/BinCard';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  StatsCard, 
  QuickActionsCard, 
  ActivityFeed, 
  SystemHealth, 
  ProgressChart 
} from '@/components/DashboardComponents';
import { Bin } from '@/lib/bins';
import { ChartIcon, TruckIcon, UsersIcon, ShieldIcon, RecycleIcon, LeafIcon } from '@/components/ui/icons';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Activity {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  user: string;
  timestamp: string;
}

interface Analytics {
  totalBins: number;
  fullBins: number;
  normalBins: number;
  emptyBins: number;
  hazardBins: number;
  avgFillLevel: number;
  todayCollections: number;
  weeklyCollections: number;
  monthlyCollections: number;
}

export default function AdminDashboard() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'bins' | 'users' | 'analytics'>('overview');
  const [showAddBin, setShowAddBin] = useState(false);
  const [newBinLocation, setNewBinLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [iotRunning, setIotRunning] = useState(true);

  const loadData = async () => {
    try {
      const [binsRes, activitiesRes, analyticsRes] = await Promise.all([
        fetch('/api/bins'),
        fetch('/api/activities?limit=20'),
        fetch('/api/analytics'),
      ]);
      
      const binsData = await binsRes.json();
      const activitiesData = await activitiesRes.json();
      const analyticsData = await analyticsRes.json();
      
      setBins(binsData);
      setActivities(activitiesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 20 seconds to stay in sync with IoT simulation and other dashboards
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats from bins or analytics
  const stats = analytics ? {
    totalBins: analytics.totalBins,
    fullBins: analytics.fullBins,
    normalBins: analytics.normalBins,
    emptyBins: analytics.emptyBins,
    hazardBins: analytics.hazardBins,
    avgFillLevel: analytics.avgFillLevel
  } : {
    totalBins: bins.length,
    fullBins: bins.filter(bin => bin.status === 'Full').length,
    normalBins: bins.filter(bin => bin.status === 'Normal').length,
    emptyBins: bins.filter(bin => bin.status === 'Empty').length,
    hazardBins: bins.filter(bin => bin.status === 'Hazard').length,
    avgFillLevel: bins.length > 0 ? Math.round(bins.reduce((sum, bin) => sum + bin.fillLevel, 0) / bins.length) : 0
  };

  const handleEmergencyCollection = async () => {
    if (!confirm('Activate emergency collection protocol for all full bins?')) return;
    
    setLoading(true);
    try {
      const fullBins = bins.filter(b => b.status === 'Full');
      const promises = fullBins.map(bin => 
        fetch(`/api/bins/${bin.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Normal', fillLevel: 0 }),
        })
      );
      
      await Promise.all(promises);
      
      // Log activity
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'warning',
          message: `Emergency collection protocol activated for ${fullBins.length} bins`,
          user: 'Admin',
        }),
      });
      
      alert(`✅ Emergency collection activated for ${fullBins.length} bins!`);
      loadData();
    } catch (error) {
      alert('❌ Failed to activate emergency collection');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const reportData = {
        generatedAt: new Date().toISOString(),
        stats: analytics || stats,
        bins: bins.length,
        activities: activities.length,
      };
      
      // Create a downloadable report
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wastechain-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('✅ Report generated and downloaded!');
    } catch (error) {
      alert('❌ Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBin = async () => {
    if (!newBinLocation.trim()) {
      alert('Please enter a location');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/bins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: newBinLocation }),
      });
      
      if (res.ok) {
        const newBin = await res.json();
        setBins([...bins, newBin]);
        setNewBinLocation('');
        setShowAddBin(false);
        alert(`✅ Bin ${newBin.id} added successfully!`);
        loadData();
      } else {
        alert('❌ Failed to add bin');
      }
    } catch (error) {
      alert('❌ Failed to add bin');
    } finally {
      setLoading(false);
    }
  };

  const handleBinAction = async (binId: string, action: string) => {
    setLoading(true);
    try {
      if (action === 'delete') {
        if (!confirm(`Delete bin ${binId}?`)) {
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/bins/${binId}`, { method: 'DELETE' });
        if (res.ok) {
          setBins(bins.filter(b => b.id !== binId));
          alert(`✅ Bin ${binId} deleted`);
          loadData();
        }
      } else if (action === 'update') {
        const bin = bins.find(b => b.id === binId);
        if (bin) {
          const newStatus = bin.status === 'Full' ? 'Empty' : 
                          bin.status === 'Hazard' ? 'Normal' : bin.status;
          const res = await fetch(`/api/bins/${binId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: newStatus,
              fillLevel: newStatus === 'Empty' ? 0 : bin.fillLevel,
            }),
          });
          if (res.ok) {
            alert(`✅ Bin ${binId} updated`);
            loadData();
          }
        }
      }
    } catch (error) {
      alert('❌ Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleIoTSimulation = async (action: 'start' | 'stop' | 'run-once') => {
    try {
      const res = await fetch('/api/iot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, interval: 30000 }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setIotRunning(action === 'start');
        alert(`✅ ${data.message}`);
        if (action === 'run-once') {
          loadData();
        }
      }
    } catch (error) {
      alert('❌ Failed to control IoT simulation');
    }
  };

  const systemHealth = [
    { name: 'Blockchain Network', status: 'online' as const, lastCheck: new Date(), uptime: '99.9%' },
    { name: 'IoT Sensors', status: 'online' as const, lastCheck: new Date(), uptime: '98.5%' },
    { name: 'Mobile App API', status: 'online' as const, lastCheck: new Date(), uptime: '99.7%' },
    { name: 'Payment Gateway', status: 'warning' as const, lastCheck: new Date(), uptime: '97.2%' },
  ];

  const quickActions = [
    {
      label: '🚨 Emergency Collection',
      onClick: handleEmergencyCollection,
      variant: 'destructive' as const
    },
    {
      label: '📊 Generate Report',
      onClick: handleGenerateReport,
      variant: 'default' as const
    },
    {
      label: '👥 Manage Users',
      onClick: () => setSelectedView('users')
    },
    {
      label: '🔄 Refresh Data',
      onClick: loadData,
      variant: 'outline' as const
    }
  ];

  const collectionProgress = analytics ? [
    { label: 'Today\'s Collections', value: analytics.todayCollections, total: analytics.todayCollections + 5, color: 'bg-green-500' },
    { label: 'Weekly Target', value: analytics.weeklyCollections, total: 100, color: 'bg-blue-500' },
    { label: 'Monthly Goal', value: analytics.monthlyCollections, total: 400, color: 'bg-purple-500' }
  ] : [
    { label: 'Today\'s Collections', value: 0, total: 15, color: 'bg-green-500' },
    { label: 'Weekly Target', value: 0, total: 100, color: 'bg-blue-500' },
    { label: 'Monthly Goal', value: 0, total: 400, color: 'bg-purple-500' }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Smart Bins"
          value={stats.totalBins}
          change="+2 this week"
          changeType="positive"
          icon={<RecycleIcon className="h-6 w-6 text-blue-600" />}
        />
        <StatsCard
          title="Bins Requiring Pickup"
          value={stats.fullBins}
          change={stats.fullBins > 0 ? 'Urgent' : 'All clear'}
          changeType={stats.fullBins > 0 ? 'negative' : 'positive'}
          icon={<TruckIcon className="h-6 w-6 text-red-600" />}
        />
        <StatsCard
          title="Average Fill Level"
          value={`${stats.avgFillLevel}%`}
          change="+5% from yesterday"
          changeType="neutral"
          icon={<ChartIcon className="h-6 w-6 text-green-600" />}
        />
        <StatsCard
          title="Hazard Alerts"
          value={stats.hazardBins}
          change={stats.hazardBins === 0 ? 'All safe' : 'Action needed'}
          changeType={stats.hazardBins === 0 ? 'positive' : 'negative'}
          icon={<ShieldIcon className="h-6 w-6 text-yellow-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Critical Alerts */}
          {(stats.fullBins > 0 || stats.hazardBins > 0) && (
            <Card className="p-6 border-red-200 bg-red-50">
              <CardTitle className="text-lg font-semibold text-red-800 mb-4">
                🚨 Critical Alerts
              </CardTitle>
              <CardContent className="p-0 space-y-3">
                {stats.fullBins > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-red-700">
                      {stats.fullBins} bin{stats.fullBins > 1 ? 's' : ''} requiring immediate pickup
                    </span>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={handleEmergencyCollection}
                      disabled={loading}
                    >
                      Dispatch Now
                    </Button>
                  </div>
                )}
                {stats.hazardBins > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-yellow-700">
                      {stats.hazardBins} hazard alert{stats.hazardBins > 1 ? 's' : ''} detected
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const hazardBins = bins.filter(b => b.status === 'Hazard');
                        alert(`Investigating ${hazardBins.length} hazard bin(s). Dispatch team notified.`);
                      }}
                    >
                      Investigate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Collection Progress */}
          <ProgressChart title="Collection Progress" data={collectionProgress} />
          
          {/* Activity Feed */}
          <ActivityFeed activities={activities.map(a => ({
            ...a,
            timestamp: new Date(a.timestamp),
          }))} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <QuickActionsCard title="Quick Actions" actions={quickActions} />
          
          {/* IoT Simulation Control */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <CardTitle className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <RecycleIcon className="h-5 w-5 mr-2" />
              IoT Simulation Control
            </CardTitle>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-blue-700">Status:</span>
                <Badge className={iotRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {iotRunning ? '🟢 Running' : '⚪ Stopped'}
                </Badge>
              </div>
              <p className="text-xs text-blue-600 mb-3">
                Simulates real-time sensor data. Updates every 30 seconds.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={iotRunning ? 'outline' : 'default'}
                  onClick={() => handleIoTSimulation('start')}
                  className="flex-1"
                >
                  ▶️ Start
                </Button>
                <Button
                  size="sm"
                  variant={!iotRunning ? 'outline' : 'default'}
                  onClick={() => handleIoTSimulation('stop')}
                  className="flex-1"
                >
                  ⏹️ Stop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleIoTSimulation('run-once')}
                  className="flex-1"
                >
                  🔄 Run Once
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <SystemHealth systems={systemHealth} />
          
          {/* Environmental Impact */}
          <Card className="p-6 bg-green-50 border-green-200">
            <CardTitle className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <LeafIcon className="h-5 w-5 mr-2" />
              Environmental Impact Today
            </CardTitle>
            <CardContent className="p-0 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-green-700">CO₂ Saved</span>
                <span className="font-bold text-green-800">42kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Waste Diverted</span>
                <span className="font-bold text-green-800">156kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Energy Saved</span>
                <span className="font-bold text-green-800">89kWh</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderBins = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Smart Bins Management</h2>
          <p className="text-gray-600">Monitor and manage all smart bins in the network</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            🔄 Refresh Data
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowAddBin(!showAddBin)}
            disabled={loading}
          >
            + Add New Bin
          </Button>
        </div>
      </div>
      
      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-red-100 text-red-800">
          Full ({stats.fullBins})
        </Badge>
        <Badge className="bg-green-100 text-green-800">
          Normal ({stats.normalBins})
        </Badge>
        <Badge className="bg-gray-100 text-gray-800">
          Empty ({stats.emptyBins})
        </Badge>
        <Badge className="bg-yellow-100 text-yellow-800">
          Hazard ({stats.hazardBins})
        </Badge>
      </div>
      
      {showAddBin && (
        <Card className="p-6 mb-6 border-blue-200 bg-blue-50">
          <CardTitle className="text-lg font-semibold mb-4">Add New Bin</CardTitle>
          <CardContent className="p-0">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter bin location (e.g., Sector 5, Jaipur)"
                value={newBinLocation}
                onChange={(e) => setNewBinLocation(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddBin()}
              />
              <Button onClick={handleAddBin} disabled={loading || !newBinLocation.trim()}>
                Add
              </Button>
              <Button variant="outline" onClick={() => {
                setShowAddBin(false);
                setNewBinLocation('');
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bins.map((bin) => (
          <div key={bin.id} className="relative">
            <BinCard 
              bin={bin} 
              showActions={true}
              onAction={(binId, action) => handleBinAction(binId, action === 'Collected' ? 'update' : action)}
            />
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBinAction(bin.id, 'update')}
                disabled={loading}
              >
                Update Status
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBinAction(bin.id, 'delete')}
                disabled={loading}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedView) {
      case 'bins': return renderBins();
      case 'users': return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">User Management</h2>
          <p className="text-gray-600 mb-4">Coming soon - Advanced user management features</p>
          <Button onClick={() => setSelectedView('overview')}>← Back to Overview</Button>
        </div>
      );
      case 'analytics': return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Advanced Analytics</h2>
          <p className="text-gray-600 mb-4">Coming soon - Detailed analytics and reporting</p>
          <Button onClick={() => setSelectedView('overview')}>← Back to Overview</Button>
        </div>
      );
      default: return renderOverview();
    }
  };

  return (
    <DashboardLayout title="Administrator Dashboard" userType="admin">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          {[
            { key: 'overview', label: '📊 Overview', icon: ChartIcon },
            { key: 'bins', label: '🗑️ Smart Bins', icon: RecycleIcon },
            { key: 'users', label: '👥 Users', icon: UsersIcon },
            { key: 'analytics', label: '📈 Analytics', icon: ChartIcon }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key as 'overview' | 'bins' | 'users' | 'analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedView === tab.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
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
