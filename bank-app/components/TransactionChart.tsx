'use client';

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { CurrencyType, getCurrencySymbol } from '@/types/enums';

Chart.register(...registerables);

interface Transaction {
  id: number;
  amount: number;
  transactionType: number;
  transactionDate: string;
  accountId: number;
}

interface TransactionChartProps {
  transactions: Transaction[];
  accounts: any[];
  getCurrencySymbol: (currencyType: string) => string;
}

const TransactionChart: React.FC<TransactionChartProps> = ({ 
  transactions, 
  accounts, 
  getCurrencySymbol 
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || transactions.length === 0) return;

    // Mevcut chart'ı temizle
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Son 30 günlük verileri hazırla
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const filteredTransactions = transactions.filter(t => 
      new Date(t.transactionDate) >= last30Days
    );

    // Günlere göre grupla
    const dailyData: { [key: string]: { deposits: number; withdrawals: number } } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { deposits: 0, withdrawals: 0 };
      }
      
      if (transaction.transactionType === 0) {
        dailyData[date].deposits += Math.abs(transaction.amount);
      } else if (transaction.transactionType === 1) {
        dailyData[date].withdrawals += Math.abs(transaction.amount);
      }
    });

    // Tarihleri sırala
    const sortedDates = Object.keys(dailyData).sort();
    
    const labels = sortedDates.map(date => 
      new Date(date).toLocaleDateString('tr-TR', { 
        month: 'short', 
        day: 'numeric' 
      })
    );
    
    const depositData = sortedDates.map(date => dailyData[date].deposits);
    const withdrawalData = sortedDates.map(date => dailyData[date].withdrawals);

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Para Yatırma',
            data: depositData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
          },
          {
            label: 'Para Çekme',
            data: withdrawalData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Son 30 Günlük İşlem Analizi',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const account = accounts.find(acc => acc.id === (context.raw as any).accountId);
                const symbol = account ? getCurrencySymbol(account.currencyType || 0) : '₺';
                return `${context.dataset.label}: ${symbol}${context.parsed.y.toLocaleString('tr-TR')}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₺' + value.toLocaleString('tr-TR');
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [transactions, accounts, getCurrencySymbol]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">İşlem Analizi</h3>
        <div className="text-center text-gray-500 py-8">
          Analiz için yeterli veri bulunmuyor.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">İşlem Analizi</h3>
      <div className="h-80">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default TransactionChart;
