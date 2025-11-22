'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecycleIcon, ChartIcon, TruckIcon, UsersIcon } from '@/components/ui/icons';
import { getAuthUser, logout, requireAuth, User } from '@/lib/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userType: 'admin' | 'contractor' | 'citizen';
}

export default function DashboardLayout({ children, title, userType }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authUser = requireAuth(userType);
    if (!authUser) {
      router.push(`/login/${userType}`);
      return;
    }
    setUser(authUser);
    setLoading(false);
  }, [userType, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      name: 'Citizen Portal',
      href: '/dashboard/citizen',
      icon: UsersIcon,
      active: pathname.includes('/dashboard/citizen'),
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Admin Panel',
      href: '/dashboard/admin',
      icon: ChartIcon,
      active: pathname.includes('/dashboard/admin'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Contractor Hub',
      href: '/dashboard/contractor',
      icon: TruckIcon,
      active: pathname.includes('/dashboard/contractor'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
  ];

  const getHeaderColor = () => {
    switch (userType) {
      case 'admin': return 'from-blue-600 to-blue-700';
      case 'contractor': return 'from-purple-600 to-purple-700';
      case 'citizen': return 'from-green-600 to-green-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`bg-gradient-to-r ${getHeaderColor()} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <RecycleIcon className="h-8 w-8" />
                <span className="text-xl font-bold">WasteChain</span>
              </Link>
              <div className="hidden md:block">
                <span className="text-sm opacity-75">|</span>
                <span className="text-sm ml-2 opacity-90">{title}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm opacity-90 hidden md:block text-white">
                Welcome, {user.name || user.username}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                asChild
              >
                <Link href="/">← Back to Home</Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Dashboard Navigation</h3>
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        item.active
                          ? `${item.bgColor} ${item.color}`
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <RecycleIcon className="h-4 w-4" />
                  <span className="text-sm">Main Website</span>
                </Link>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}