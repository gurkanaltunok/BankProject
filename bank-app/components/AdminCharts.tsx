'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useExchangeRates } from '@/lib/hooks/useExchangeRates';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AdminChartsProps {
  bankBalance: number;
  totalBalance: number;
  totalUsers: number;
  totalAccounts: number;
  accounts?: any[];
  dailyTransactionVolume?: any[];
  dailyCommissionRevenue?: any[];
}

export default function AdminCharts({ bankBalance, totalBalance, totalUsers, totalAccounts, accounts = [], dailyTransactionVolume = [], dailyCommissionRevenue = [] }: AdminChartsProps) {
  const { rates, convertToTRY } = useExchangeRates();

  const currencySymbol: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  // Para birimi dağılımı (hesap bakiyelerine göre) — sıfır toplamlı para birimleri gösterilmez
  const totalsByCurrency = [
    { label: 'TRY', currencyType: 0, colorBg: 'rgba(37, 99, 235, 0.8)', colorBd: 'rgba(37, 99, 235, 1)' },
    { label: 'USD', currencyType: 1, colorBg: 'rgba(59, 130, 246, 0.8)', colorBd: 'rgba(59, 130, 246, 1)' },
    { label: 'EUR', currencyType: 2, colorBg: 'rgba(96, 165, 250, 0.8)', colorBd: 'rgba(96, 165, 250, 1)' },
    { label: 'GBP', currencyType: 3, colorBg: 'rgba(147, 197, 253, 0.8)', colorBd: 'rgba(147, 197, 253, 1)' },
  ].map(item => {
    const totalOriginal = accounts
      .filter(acc => acc.currencyType === item.currencyType)
      .reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalInTRY = convertToTRY(totalOriginal, item.currencyType);
    return { ...item, totalOriginal, totalInTRY };
  }).filter(item => item.totalInTRY > 0);

  const currencyDistribution = {
    labels: totalsByCurrency.map(i => i.label),
    datasets: [
      {
        // Dilim alanını TRY karşılığına göre hesapla
        data: totalsByCurrency.map(i => i.totalInTRY),
        backgroundColor: totalsByCurrency.map(i => i.colorBg),
        borderColor: totalsByCurrency.map(i => i.colorBd),
        borderWidth: 2,
      },
    ],
  };

  // 2. Günlük İşlem Hacmi (Line Chart)
  const dailyTransactionVolumeChart = {
    labels: dailyTransactionVolume.length > 0 
      ? dailyTransactionVolume.map((item: any) => item.dayName)
      : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    datasets: [
      {
        label: 'İşlem Hacmi (₺)',
        data: dailyTransactionVolume.length > 0 
          ? dailyTransactionVolume.map((item: any) => item.volume)
          : [0, 0, 0, 0, 0, 0, 0], // Gerçek veri yoksa sıfır
        borderColor: 'rgba(37, 99, 235, 1)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // 3. Para Birimi Dağılımı (Bar Chart) - Currency Type'a göre
  const currencyTypeCounts = {
    try: accounts.filter(acc => acc.currencyType === 0).length,
    usd: accounts.filter(acc => acc.currencyType === 1).length,
    eur: accounts.filter(acc => acc.currencyType === 2).length,
    gbp: accounts.filter(acc => acc.currencyType === 3).length,
  };

  const currencyTypeDistribution = {
    labels: ['TRY', 'USD', 'EUR', 'GBP'],
    datasets: [
      {
        data: [currencyTypeCounts.try, currencyTypeCounts.usd, currencyTypeCounts.eur, currencyTypeCounts.gbp],
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',   // TRY - Koyu Mavi
          'rgba(59, 130, 246, 0.8)',  // USD - Mavi
          'rgba(96, 165, 250, 0.8)',  // EUR - Açık Mavi
          'rgba(147, 197, 253, 0.8)', // GBP - Çok Açık Mavi
        ],
        borderColor: [
          'rgba(37, 99, 235, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(96, 165, 250, 1)',
          'rgba(147, 197, 253, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // 4. Haftalık Komisyon Gelirleri (Line Chart)
  const weeklyCommissionRevenueChart = {
    labels: dailyCommissionRevenue.length > 0 
      ? dailyCommissionRevenue.map((item: any) => item.dayName)
      : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    datasets: [
      {
        label: 'Komisyon Geliri (₺)',
        data: dailyCommissionRevenue.length > 0 
          ? dailyCommissionRevenue.map((item: any) => item.commission)
          : [0, 0, 0, 0, 0, 0, 0], // Gerçek veri yoksa sıfır
        borderColor: 'rgba(37, 99, 235, 1)', // Mavi renk
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointBorderColor: 'rgba(37, 99, 235, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            if (typeof value === 'number' && value > 1000) {
              return `${label}: ₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            return `${label}: ${value.toLocaleString('tr-TR')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M ₺';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K ₺';
            }
            return value + ' ₺';
          }
        }
      }
    }
  };

  const currencyTypeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            return `${label}: ${value} hesap`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value;
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const valueTRY = context.parsed as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((valueTRY / total) * 100).toFixed(1) : '0.0';
            const entry = totalsByCurrency.find(i => i.label === label);
            const symbol = currencySymbol[label] || '';
            const original = entry ? entry.totalOriginal : 0;
            // Örn: USD: $1,234.56 (₺45,678.90) %12.3
            return `${label}: ${symbol}${original.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (₺${valueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) (${percentage}%)`;
          }
        }
      }
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `İşlem Hacmi: ₺${context.parsed.y.toLocaleString('tr-TR')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M ₺';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K ₺';
            }
            return value + ' ₺';
          }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Para Birimi Dağılımı */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Para Birimi Dağılımı</h3>
        <div className="h-64">
          <Doughnut data={currencyDistribution} options={doughnutOptions} />
        </div>
      </div>

      {/* Günlük İşlem Hacmi */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Haftalık İşlem Hacmi</h3>
        <div className="h-64">
          <Line data={dailyTransactionVolumeChart} options={lineOptions} />
        </div>
      </div>

      {/* Para Birimi Dağılımı (Bar Chart) */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Para Birimi Dağılımı</h3>
        <div className="h-64">
          <Bar data={currencyTypeDistribution} options={currencyTypeChartOptions} />
        </div>
      </div>

      {/* Haftalık Komisyon Gelirleri */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Haftalık Komisyon Gelirleri</h3>
        <div className="h-64">
          <Line data={weeklyCommissionRevenueChart} options={lineOptions} />
        </div>
      </div>
    </div>
  );
}
