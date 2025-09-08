"use client"

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { AccountType, getAccountTypeLabel } from '@/types/enums';

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ accounts }: DoughnutChartProps) => {
  // Group accounts by type and calculate balances
  const accountsByType = accounts.reduce((acc, account) => {
    const typeLabel = getAccountTypeLabel(account.accountType || 0);
    
    if (!acc[typeLabel]) {
      acc[typeLabel] = 0;
    }
    acc[typeLabel] += account.balance || account.currentBalance || 0;
    return acc;
  }, {} as Record<string, number>);

  const labels = Object.keys(accountsByType);
  const balances = Object.values(accountsByType);

  // Generate colors for different account types
  const colors = ['#0747b6', '#2265d8', '#2f91fa', '#5BADFF', '#87CEEB'];

  const data = {
    datasets: [
      {
        label: 'Hesap Bakiyeleri',
        data: balances.length > 0 ? balances : [1], // Fallback for empty accounts
        backgroundColor: colors.slice(0, labels.length > 0 ? labels.length : 1),
        borderColor: colors.slice(0, labels.length > 0 ? labels.length : 1),
        borderWidth: 1,
      }
    ],
    labels: labels.length > 0 ? labels : ['Hesap Yok']
  }

  return <Doughnut 
    data={data} 
    options={{
      cutout: '60%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY'
              })} (${percentage}%)`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
    }}
  />
}

export default DoughnutChart