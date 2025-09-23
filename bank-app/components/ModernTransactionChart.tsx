"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { CurrencyType, getCurrencySymbol } from '@/types/enums'
import { useExchangeRates } from '@/lib/hooks/useExchangeRates'

interface Transaction {
  id: number;
  amount: number;
  transactionType: number;
  transactionDate: string;
  accountId: number;
}

interface ModernTransactionChartProps {
  transactions: Transaction[];
  accounts: any[];
  getCurrencySymbol: (currencyType: CurrencyType | number) => string;
}

const chartConfig = {
  deposits: {
    label: "Para Yatırma",
    color: "hsl(var(--chart-1))",
  },
  withdrawals: {
    label: "Para Çekme",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function ModernTransactionChart({ 
  transactions, 
  accounts, 
  getCurrencySymbol 
}: ModernTransactionChartProps) {
  const { convertToTRY, rates } = useExchangeRates();
  const dailyData: { [key: string]: { deposits: number; withdrawals: number; date: string } } = {}
  
  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.transactionDate);
    if (isNaN(transactionDate.getTime())) {
      console.warn('Invalid transaction date:', transaction.transactionDate);
      return;
    }
    
    const date = transactionDate.toISOString().split('T')[0]
    if (!dailyData[date]) {
      dailyData[date] = { 
        deposits: 0, 
        withdrawals: 0, 
        date: transactionDate.toLocaleDateString('tr-TR', { 
          day: '2-digit', 
          month: '2-digit' 
        })
      }
    }
    
    if (transaction.transactionType === 1) { // Deposit
      dailyData[date].deposits += Math.abs(transaction.amount)
    } else if (transaction.transactionType === 2) { // Withdraw
      dailyData[date].withdrawals += Math.abs(transaction.amount)
    } else if (transaction.transactionType === 3) { // Transfer
      if (transaction.amount > 0) {
        dailyData[date].deposits += Math.abs(transaction.amount) // Gelen transfer
      } else {
        dailyData[date].withdrawals += Math.abs(transaction.amount) // Giden transfer
      }
    }
  })

  const sortedDates = Object.keys(dailyData).sort()
  const last30Days = sortedDates.slice(-30)
  
  const chartData = last30Days.map(date => dailyData[date])

  const accountData = accounts
    .filter(account => account.balance > 0)
    .map(account => {
      const balanceInTRY = convertToTRY(account.balance, account.currencyType || 0);
      
      return {
        name: `${account.iban.slice(-4)}`,
        value: Math.round(balanceInTRY * 100) / 100,
        currency: account.currencyType,
        symbol: getCurrencySymbol(account.currencyType || 0),
        originalBalance: account.balance
      };
    })
    .sort((a, b) => b.value - a.value)

  const accountChartConfig = {
    value: {
      label: "Bakiye",
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
      {/* Günlük İşlemler ve Hesap Dağılımı */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Günlük İşlem Grafiği */}
        <Card>
          <CardHeader>
            <CardTitle>Günlük İşlemler</CardTitle>
            <CardDescription>
              Son 30 günlük para yatırma ve çekme işlemleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(value) => `₺${value.toLocaleString()}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                    formatter={(value, name) => [
                      `₺${Number(value).toLocaleString('tr-TR')}`, 
                      name === 'deposits' ? 'Para Yatırma' : 'Para Çekme'
                    ]}
                  />}
                />
                <Bar dataKey="deposits" fill="var(--color-deposits)" radius={4} />
                <Bar dataKey="withdrawals" fill="var(--color-withdrawals)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Hesap Dağılımı Grafiği */}
        <Card>
          <CardHeader>
            <CardTitle>Hesap Dağılımı</CardTitle>
            <CardDescription>
              Hesaplarınızdaki bakiye dağılımı (TRY cinsinden)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={accountChartConfig} className="h-[300px]">
              <BarChart 
                data={accountData} 
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
              >
                <XAxis 
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(value) => `₺${value.toLocaleString()}`}
                />
                <YAxis 
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  width={50}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                    formatter={(value, name, props) => [
                      `₺${Number(value).toLocaleString('tr-TR')} (${props.payload.symbol}${props.payload.originalBalance.toLocaleString('tr-TR')})`, 
                      'Bakiye'
                    ]}
                  />}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Aylık Trend Grafiği */}
      <Card>
        <CardHeader>
          <CardTitle>Aylık Trend</CardTitle>
          <CardDescription>
            Aylık para yatırma ve çekme trendi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                className="text-xs"
                interval="preserveStartEnd"
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                className="text-xs"
                tickFormatter={(value) => `₺${value.toLocaleString()}`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                  formatter={(value, name) => [
                    `₺${Number(value).toLocaleString('tr-TR')}`, 
                    name === 'deposits' ? 'Para Yatırma' : 'Para Çekme'
                  ]}
                />}
              />
              <Line 
                type="monotone" 
                dataKey="deposits" 
                stroke="var(--color-deposits)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-deposits)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="withdrawals" 
                stroke="var(--color-withdrawals)" 
                strokeWidth={3}
                dot={{ fill: "var(--color-withdrawals)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
