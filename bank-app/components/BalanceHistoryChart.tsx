'use client';

import { useEffect, useRef, useState } from 'react';
import { BalanceHistory } from '@/lib/api';

interface BalanceHistoryChartProps {
  balanceHistory: BalanceHistory[];
  loading?: boolean;
  currencyType?: number; // 0: TRY, 1: USD, 2: EUR, 3: GBP
}

export default function BalanceHistoryChart({ balanceHistory, loading, currencyType = 0 }: BalanceHistoryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: BalanceHistory } | null>(null);

  const getCurrencySymbol = (currencyType: number) => {
    switch (currencyType) {
      case 0: return '₺'; // TRY
      case 1: return '$'; // USD
      case 2: return '€'; // EUR
      case 3: return '£'; // GBP
      default: return '₺';
    }
  };

  const getSmoothCurve = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return points;
    
    const smoothPoints: { x: number; y: number }[] = [];
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];
      
      for (let t = 0; t <= 1; t += 0.1) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );
        
        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );
        
        smoothPoints.push({ x, y });
      }
    }
    
    return smoothPoints;
  };

  const drawChart = () => {
    if (!canvasRef.current || balanceHistory.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const padding = 60;
    const chartWidth = rect.width - (padding * 2);
    const chartHeight = rect.height - (padding * 2);

    const sortedData = [...balanceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (sortedData.length === 0) return;

    const balances = sortedData.map(d => d.balance);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    const balanceRange = maxBalance - minBalance;

    const yPadding = balanceRange * 0.15;
    const yMin = minBalance - yPadding;
    const yMax = maxBalance + yPadding;

    ctx.clearRect(0, 0, rect.width, rect.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    const points = sortedData.map((point, index) => {
      const x = padding + (chartWidth / (sortedData.length - 1)) * index;
      const y = padding + chartHeight - ((point.balance - yMin) / (yMax - yMin)) * chartHeight;
      return { x, y, data: point };
    });

    const smoothPoints = getSmoothCurve(points);

    const areaGradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
    areaGradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
    areaGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

    ctx.fillStyle = areaGradient;
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    smoothPoints.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    smoothPoints.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });

    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    points.forEach((point, index) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

    if (hoveredPoint) {
      ctx.fillStyle = '#1d4ed8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      
      ctx.beginPath();
      ctx.arc(hoveredPoint.x, hoveredPoint.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 4; i++) {
      const value = yMin + (yMax - yMin) * (1 - i / 4);
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(`${getCurrencySymbol(currencyType)}${value.toFixed(0)}`, padding - 15, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';

    if (sortedData.length > 0) {
      const startDate = new Date(sortedData[0].date);
      const startDateStr = startDate.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
      ctx.fillText(startDateStr, padding, padding + chartHeight + 15);

      const endDate = new Date(sortedData[sortedData.length - 1].date);
      const endDateStr = endDate.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
      ctx.fillText(endDateStr, padding + chartWidth, padding + chartHeight + 15);
    }
  };

  useEffect(() => {
    drawChart();
  }, [balanceHistory, hoveredPoint]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || balanceHistory.length === 0) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const padding = 60;
    const chartWidth = rect.width - (padding * 2);
    const chartHeight = rect.height - (padding * 2);

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const sortedData = [...balanceHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const balances = sortedData.map(d => d.balance);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    const balanceRange = maxBalance - minBalance;
    const yPadding = balanceRange * 0.15;
    const yMin = minBalance - yPadding;
    const yMax = maxBalance + yPadding;

    const points = sortedData.map((point, index) => {
      const x = padding + (chartWidth / (sortedData.length - 1)) * index;
      const y = padding + chartHeight - ((point.balance - yMin) / (yMax - yMin)) * chartHeight;
      return { x, y, data: point };
    });

    let closestPoint = null;
    let minDistance = Infinity;

    points.forEach(point => {
      const distance = Math.sqrt(Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2));
      if (distance < minDistance && distance < 30) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    setHoveredPoint(closestPoint);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!balanceHistory || balanceHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bakiye Geçmişi</h3>
        <div className="text-center py-8 text-gray-500">
          Henüz bakiye geçmişi bulunmuyor.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bakiye Geçmişi</h3>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64 cursor-crosshair"
          style={{ width: '100%', height: '256px' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10"
            style={{
              left: `${hoveredPoint.x + 10}px`,
              top: `${hoveredPoint.y - 40}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-medium">
              {getCurrencySymbol(currencyType)}{hoveredPoint.data.balance.toLocaleString('tr-TR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className="text-xs text-gray-300">
              {new Date(hoveredPoint.data.date).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="text-xs text-blue-300">
              {hoveredPoint.data.changeType}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
