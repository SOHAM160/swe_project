'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bin } from "@/lib/bins";
import { RecycleIcon } from "@/components/ui/icons";

interface BinCardProps {
  bin: Bin;
  showActions?: boolean;
  onAction?: (binId: string, action: string) => void;
}

export default function BinCard({ bin, showActions = false, onAction }: BinCardProps) {
  const getStatusInfo = () => {
    switch (bin.status) {
      case 'Full':
        return {
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeColor: 'bg-red-500 text-white',
          progressColor: 'bg-red-500'
        };
      case 'Normal':
        return {
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badgeColor: 'bg-green-500 text-white',
          progressColor: 'bg-green-500'
        };
      case 'Empty':
        return {
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeColor: 'bg-gray-500 text-white',
          progressColor: 'bg-gray-500'
        };
      case 'Hazard':
        return {
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          badgeColor: 'bg-yellow-500 text-white',
          progressColor: 'bg-yellow-500'
        };
      default:
        return {
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeColor: 'bg-gray-500 text-white',
          progressColor: 'bg-gray-500'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const fillPercentage = Math.min(bin.fillLevel, 100);
  const gasLevel = bin.gasLevel || 0;

  return (
    <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
              <RecycleIcon className={`h-5 w-5 ${statusInfo.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">{bin.id}</CardTitle>
              <p className="text-sm text-gray-600">{bin.location}</p>
            </div>
          </div>
          <Badge className={`${statusInfo.badgeColor} font-medium`}>
            {bin.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Fill Level Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Fill Level</span>
            <span className={`text-sm font-bold ${statusInfo.color}`}>{fillPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 ${statusInfo.progressColor} transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Gas Level Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <span className="text-sm text-gray-600">Gas Level</span>
          </div>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded-full ${
                  gasLevel >= level ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
          <span>Last updated</span>
          <span className="font-medium">
            {new Date(bin.lastUpdated).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Action Buttons */}
        {showActions && onAction && (
          <div className="pt-3 border-t border-gray-200">
            {bin.status === 'Full' && (
              <button
                onClick={() => onAction(bin.id, 'Collected')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Confirm Pickup
              </button>
            )}
            {bin.status === 'Hazard' && (
              <button
                onClick={() => onAction(bin.id, 'Hazard_Resolved')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Report Hazard Resolved
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
