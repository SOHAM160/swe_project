'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import Navigation from '@/components/Navigation';
import { 
  RecycleIcon, 
  ShieldIcon, 
  TruckIcon, 
  ChartIcon, 
  LeafIcon, 
  UsersIcon 
} from '@/components/ui/icons';

export default function Home() {
  const [stats, setStats] = useState({
    binsMonitored: 0,
    wasteCollected: 0,
    co2Saved: 0,
    transactions: 0
  });

  useEffect(() => {
    // Animate counters on page load
    const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        callback(value);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };

    setTimeout(() => {
      animateValue(0, 247, 2000, (value) => setStats(prev => ({ ...prev, binsMonitored: value })));
      animateValue(0, 1250, 2500, (value) => setStats(prev => ({ ...prev, wasteCollected: value })));
      animateValue(0, 340, 2200, (value) => setStats(prev => ({ ...prev, co2Saved: value })));
      animateValue(0, 8947, 3000, (value) => setStats(prev => ({ ...prev, transactions: value })));
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200">
              🌱 Powered by Blockchain Technology
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Smart Waste Management
              <span className="block text-green-600">for a Cleaner Tomorrow</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Revolutionary blockchain-based waste management system that connects citizens, 
              contractors, and administrators for efficient, transparent, and sustainable waste collection.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
              <Link href="/login/citizen">
                Start as Citizen
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login/admin">
                Admin Dashboard
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login/contractor">
                Contractor Portal
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-green-600 mb-2">
                {stats.binsMonitored}
              </div>
              <div className="text-gray-600">Smart Bins Monitored</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                {stats.wasteCollected}kg
              </div>
              <div className="text-gray-600">Waste Collected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-purple-600 mb-2">
                {stats.co2Saved}kg
              </div>
              <div className="text-gray-600">CO₂ Emissions Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-orange-600 mb-2">
                {stats.transactions}
              </div>
              <div className="text-gray-600">Blockchain Transactions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Revolutionary Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of waste management with cutting-edge technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <RecycleIcon className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Real-time Monitoring</CardTitle>
              </div>
              <CardContent className="p-0">
                <p className="text-gray-600">
                  Monitor smart bins in real-time with IoT sensors tracking fill levels, 
                  gas emissions, and waste composition.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <ShieldIcon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Blockchain Security</CardTitle>
              </div>
              <CardContent className="p-0">
                <p className="text-gray-600">
                  Immutable transaction records ensure transparency and accountability 
                  in waste collection and processing.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <TruckIcon className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Smart Routing</CardTitle>
              </div>
              <CardContent className="p-0">
                <p className="text-gray-600">
                  AI-powered route optimization for collection vehicles reduces fuel 
                  consumption and improves efficiency.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-orange-100 rounded-lg mr-4">
                  <ChartIcon className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Analytics Dashboard</CardTitle>
              </div>
              <CardContent className="p-0">
                <p className="text-gray-600">
                  Comprehensive analytics and reporting for administrators 
                  to make data-driven decisions.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <LeafIcon className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Environmental Impact</CardTitle>
              </div>
              <CardContent className="p-0">
                <p className="text-gray-600">
                  Track and reduce carbon footprint with detailed environmental 
                  impact metrics and sustainability goals.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                  <UsersIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Multi-stakeholder Platform</CardTitle>
              </div>
              <CardContent className="p-0">
                <p className="text-gray-600">
                  Seamless collaboration between citizens, contractors, and 
                  administrators on a single platform.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, efficient, and transparent waste management process
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Detection</h3>
              <p className="text-gray-600">
                IoT sensors in smart bins detect fill levels and send real-time data 
                to the blockchain network.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Automated Dispatch</h3>
              <p className="text-gray-600">
                System automatically assigns collection tasks to contractors based 
                on proximity and availability.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Transparent Tracking</h3>
              <p className="text-gray-600">
                All collection activities are recorded on the blockchain, ensuring 
                transparency and accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Waste Management?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of users already making a difference with WasteChain
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100" asChild>
              <Link href="/login/citizen">
                Get Started Now
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600" asChild>
              <Link href="/login/admin">
                View Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <RecycleIcon className="h-8 w-8 text-green-400" />
                <span className="text-xl font-bold">WasteChain</span>
              </div>
              <p className="text-gray-400">
                Revolutionizing waste management through blockchain technology 
                for a sustainable future.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/login/citizen" className="hover:text-white">Citizen Portal</Link></li>
                <li><Link href="/login/contractor" className="hover:text-white">Contractor Dashboard</Link></li>
                <li><Link href="/login/admin" className="hover:text-white">Admin Panel</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#stats" className="hover:text-white">Statistics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>23ucc569@lnmiit.ac.in</li>
                <li>+91 965 372 3589</li>
                <li>Lnmiit, Jaipur - 302031, India</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 WasteChain. All rights reserved. Built with Next.js and Blockchain Technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
