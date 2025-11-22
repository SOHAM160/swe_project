'use client';
import { useEffect, useState } from 'react';
import BinCard from '@/components/BinCard';
import DashboardLayout from '@/components/DashboardLayout';
import { StatsCard, QuickActionsCard } from '@/components/DashboardComponents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bin } from '@/lib/bins';
import { RecycleIcon, LeafIcon, ChartIcon, UsersIcon } from '@/components/ui/icons';

interface Citizen {
  id: string;
  name: string;
  email: string;
  points: number;
  reportsSubmitted: number;
  environmentalImpact: {
    co2Saved: number;
    wasteDisposed: number;
    recyclingRate: number;
  };
}

export default function CitizenDashboard() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [reportedBins, setReportedBins] = useState<Set<string>>(new Set());
  const [selectedView, setSelectedView] = useState<'overview' | 'nearby' | 'impact' | 'rewards'>('overview');
  const [loading, setLoading] = useState(false);
  
  // Get citizen ID from auth or use default
  const getCitizenId = () => {
    if (typeof window !== 'undefined') {
      const authUser = localStorage.getItem('authUser');
      if (authUser) {
        try {
          const user = JSON.parse(authUser);
          if (user.role === 'citizen' && user.id) {
            return user.id;
          }
        } catch (e) {
          // Fallback to default
        }
      }
    }
    return 'citizen-1'; // Fallback
  };
  
  const citizenId = getCitizenId();

  const loadData = async () => {
    try {
      const [binsRes, citizenRes, reportsRes] = await Promise.all([
        fetch('/api/bins'),
        fetch(`/api/citizens/${citizenId}`),
        fetch(`/api/reports?citizenId=${citizenId}`),
      ]);
      
      const binsData = await binsRes.json();
      const citizenData = await citizenRes.json();
      const reportsData = await reportsRes.json();
      
      setBins(binsData);
      setCitizen(citizenData);
      
      // Track which bins have been reported (pending or investigating)
      const reported = new Set<string>();
      reportsData.forEach((report: any) => {
        if (report.status === 'pending' || report.status === 'investigating') {
          reported.add(report.binId);
        }
      });
      setReportedBins(reported);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to default values
      if (!citizen) {
        setCitizen({
          id: citizenId,
          name: 'Demo Citizen',
          email: 'citizen@example.com',
          points: 1250,
          reportsSubmitted: 8,
          environmentalImpact: {
            co2Saved: 12.5,
            wasteDisposed: 45,
            recyclingRate: 78,
          },
        });
      }
    }
  };

  useEffect(() => {
    loadData();
    // Refresh data every 20 seconds to stay in sync with IoT simulation and other dashboards
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  // Calculate nearby bins (all bins for demo) - removed unused variable
  const availableBins = bins.filter(bin => bin.status === 'Normal' || bin.status === 'Empty');
  const fullBins = bins.filter(bin => bin.status === 'Full');
  const hazardBins = bins.filter(bin => bin.status === 'Hazard');

  const reportIssue = async (binId: string) => {
    if (!citizen) return;
    
    // Check if bin still has the issue
    const bin = bins.find(b => b.id === binId);
    if (bin && bin.status !== 'Hazard' && bin.status !== 'Full') {
      alert(`⚠️ This bin is currently ${bin.status}. Only Hazard or Full bins can be reported.`);
      loadData(); // Refresh to get latest status
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/citizens/${citizenId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          binId,
          issueType: 'Hazard',
          description: 'Reported via citizen portal',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCitizen({
          ...citizen,
          points: data.newPointsTotal,
          reportsSubmitted: citizen.reportsSubmitted + (data.pointsAwarded > 0 ? 1 : 0),
        });
        
        // Mark bin as reported
        setReportedBins(prev => new Set(prev).add(binId));
        
        if (data.pointsAwarded > 0) {
          alert(`✅ Thank you for reporting an issue with ${binId}! You earned ${data.pointsAwarded} points.`);
        } else {
          alert(`ℹ️ ${data.message || 'Your report has been logged.'}`);
        }
        loadData();
      } else {
        // Handle error response
        alert(`❌ ${data.error || 'Failed to submit report. Please try again.'}`);
      }
    } catch (error) {
      alert('❌ Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      label: '📍 Find Nearest Bin',
      onClick: () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              alert(`📍 Location found! Finding nearest bins to your location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
              setSelectedView('nearby');
            },
            () => {
              alert('📍 Location access denied. Showing all nearby bins.');
              setSelectedView('nearby');
            }
          );
        } else {
          alert('📍 Location access not available. Showing all nearby bins.');
          setSelectedView('nearby');
        }
      },
      variant: 'default' as const
    },
    {
      label: '⚠️ Report Issue',
      onClick: () => {
        if (bins.filter(b => b.status === 'Hazard' || b.status === 'Full').length > 0) {
          setSelectedView('nearby');
        } else {
          alert('📝 No issues to report at the moment. All bins are in good condition!');
        }
      }
    },
    {
      label: '🎁 Redeem Rewards',
      onClick: () => setSelectedView('rewards')
    },
    {
      label: '🔄 Refresh Data',
      onClick: loadData,
      variant: 'outline' as const
    }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to WasteChain! 🌱
              </h2>
              <p className="text-gray-600 mb-4">
                You&apos;re making a difference! Every proper disposal helps create a cleaner, greener world.
              </p>
              <div className="flex items-center space-x-4">
                <Badge className="bg-green-100 text-green-800">
                  🏆 Eco-Citizen Level
                </Badge>
                <span className="text-sm text-gray-600">
                  {citizen?.points || 0} points earned
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-6xl">♻️</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Available Bins"
          value={availableBins.length}
          change="Near you"
          changeType="positive"
          icon={<RecycleIcon className="h-6 w-6 text-green-600" />}
        />
        <StatsCard
          title="Eco Points"
          value={citizen?.points || 0}
          change="+150 this week"
          changeType="positive"
          icon={<LeafIcon className="h-6 w-6 text-blue-600" />}
        />
        <StatsCard
          title="Reports Submitted"
          value={citizen?.reportsSubmitted || 0}
          change="+2 this month"
          changeType="positive"
          icon={<ChartIcon className="h-6 w-6 text-purple-600" />}
        />
        <StatsCard
          title="Community Impact"
          value="Top 15%"
          description="Among local citizens"
          changeType="positive"
          icon={<UsersIcon className="h-6 w-6 text-orange-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Alerts Section */}
          {(fullBins.length > 0 || hazardBins.length > 0) && (
            <Card className="p-6 border-yellow-200 bg-yellow-50">
              <CardTitle className="text-lg font-semibold text-yellow-800 mb-4">
                ⚠️ Bin Status Alerts
              </CardTitle>
              <CardContent className="p-0 space-y-3">
                {fullBins.length > 0 && (
                  <div className="p-3 bg-white rounded-lg border">
                    <span className="text-yellow-700">
                      {fullBins.length} bin{fullBins.length > 1 ? 's are' : ' is'} currently full. Please use alternative bins nearby.
                    </span>
                  </div>
                )}
                {hazardBins.length > 0 && (
                  <div className="p-3 bg-white rounded-lg border">
                    <span className="text-red-700">
                      {hazardBins.length} bin{hazardBins.length > 1 ? 's have' : ' has'} safety issues. Please avoid these locations.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Nearby Bins Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg font-semibold">
                📍 Bins Near You
              </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              loadData();
              setSelectedView('nearby');
            }}
            disabled={loading}
          >
            View All
          </Button>
            </div>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bins.slice(0, 4).map((bin) => (
                  <div key={bin.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{bin.location}</span>
                      <Badge 
                        className={`text-xs ${
                          bin.status === 'Full' ? 'bg-red-100 text-red-800' :
                          bin.status === 'Normal' ? 'bg-green-100 text-green-800' :
                          bin.status === 'Empty' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {bin.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Fill: {bin.fillLevel}%</span>
                      <span>~0.5km away</span>
                    </div>
                    {(bin.status === 'Hazard' || bin.status === 'Full') && (
                      <Button 
                        size="sm" 
                        variant={reportedBins.has(bin.id) ? "outline" : "default"}
                        className={`mt-2 w-full ${
                          reportedBins.has(bin.id) 
                            ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                            : ''
                        }`}
                        onClick={() => reportIssue(bin.id)}
                        disabled={loading || reportedBins.has(bin.id)}
                      >
                        {reportedBins.has(bin.id) 
                          ? '✓ Already Reported' 
                          : `Report Issue (+50 pts)`}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <QuickActionsCard title="Quick Actions" actions={quickActions} />
          
          {/* Environmental Impact */}
          <Card className="p-6 bg-green-50 border-green-200">
            <CardTitle className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <LeafIcon className="h-5 w-5 mr-2" />
              Your Environmental Impact
            </CardTitle>
            <CardContent className="p-0 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-green-700">CO₂ Saved This Month</span>
                <span className="font-bold text-green-800">{citizen?.environmentalImpact.co2Saved || 0}kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Waste Properly Disposed</span>
                <span className="font-bold text-green-800">{citizen?.environmentalImpact.wasteDisposed || 0}kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Recycling Rate</span>
                <span className="font-bold text-green-800">{citizen?.environmentalImpact.recyclingRate || 0}%</span>
              </div>
              <div className="pt-3 border-t border-green-200">
                <div className="text-center">
                  <div className="text-2xl mb-2">🌳</div>
                  <p className="text-xs text-green-600">
                    Equivalent to planting 2.3 trees!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards Preview */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <CardTitle className="text-lg font-semibold text-blue-800 mb-4">
              🎁 Available Rewards
            </CardTitle>
            <CardContent className="p-0 space-y-3">
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Coffee Shop Voucher</span>
                  <Badge className="bg-blue-100 text-blue-800">500 pts</Badge>
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Eco-Friendly Bag</span>
                  <Badge className="bg-blue-100 text-blue-800">800 pts</Badge>
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Plant a Tree</span>
                  <Badge className="bg-blue-100 text-blue-800">1200 pts</Badge>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full mt-3"
                onClick={() => setSelectedView('rewards')}
              >
                View All Rewards
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderNearby = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nearby Smart Bins</h2>
          <p className="text-gray-600">Find the best bin for your waste disposal needs</p>
        </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      alert(`📍 Location: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                    },
                    () => alert('📍 Location access denied')
                  );
                } else {
                  alert('📍 Location services not available');
                }
              }}
            >
              📍 Use My Location
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadData}
              disabled={loading}
            >
              🔄 Refresh
            </Button>
          </div>
      </div>
      
      {/* Filter Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-green-100 text-green-800">
          Available ({availableBins.length})
        </Badge>
        <Badge className="bg-red-100 text-red-800">
          Full ({fullBins.length})
        </Badge>
        <Badge className="bg-yellow-100 text-yellow-800">
          Issues ({hazardBins.length})
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bins.map((bin) => (
          <div key={bin.id} className="relative">
            <BinCard bin={bin} />
            {(bin.status === 'Hazard' || bin.status === 'Full') && (
              <Button 
                size="sm" 
                variant={reportedBins.has(bin.id) ? "outline" : "default"}
                className={`mt-2 w-full ${
                  reportedBins.has(bin.id) 
                    ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                    : ''
                }`}
                onClick={() => reportIssue(bin.id)}
                disabled={loading || reportedBins.has(bin.id)}
              >
                {reportedBins.has(bin.id) 
                  ? '✓ Already Reported' 
                  : '🚨 Report Issue (+50 points)'}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedView) {
      case 'nearby': return renderNearby();
      case 'impact': return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Environmental Impact</h2>
          <p className="text-gray-600 mb-4">Coming soon - Detailed environmental impact tracking</p>
          <Button onClick={() => setSelectedView('overview')}>← Back to Overview</Button>
        </div>
      );
      case 'rewards': return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Rewards System</h2>
          <p className="text-gray-600 mb-4">Coming soon - Complete rewards marketplace</p>
          <p className="text-sm text-gray-500 mb-4">Current balance: {citizen?.points || 0} points</p>
          <Button onClick={() => setSelectedView('overview')}>← Back to Overview</Button>
        </div>
      );
      default: return renderOverview();
    }
  };

  return (
    <DashboardLayout title="Citizen Portal" userType="citizen">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          {[
            { key: 'overview', label: '🏠 Overview' },
            { key: 'nearby', label: '📍 Nearby Bins' },
            { key: 'impact', label: '🌱 My Impact' },
            { key: 'rewards', label: '🎁 Rewards' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key as 'overview' | 'nearby' | 'impact' | 'rewards')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedView === tab.key
                  ? 'bg-green-100 text-green-700 border border-green-200'
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
