import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Wrench, 
  Users, 
  BarChart3,
  AlertTriangle,
  Target
} from 'lucide-react';
import { clsx } from 'clsx';
import type { GameState } from '../types';

interface FinancialOverviewProps {
  gameState?: GameState | null;
}

interface FinancialBreakdown {
  income: {
    prizeMoney: number;
    bonuses: number;
    total: number;
  };
  expenses: {
    operationalCosts: number;
    raceWeekendCosts: number;
    total: number;
  };
  netChange: number;
  projectedEndOfSeason: number;
}

export default function FinancialOverview({ gameState }: FinancialOverviewProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'season' | 'recent'>('season');

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">No game state available</div>
      </div>
    );
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatShortCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return formatCurrency(amount);
  };

  const calculateFinancialBreakdown = (): FinancialBreakdown => {
    const team = gameState.selectedTeamData;
    const completedRaces = gameState.seasonStats.completedRaces;
    
    // Estimate season financials based on completed races
    const avgRaceWeekendCost = 600000; // Average cost per race weekend
    const totalOperationalCosts = completedRaces * avgRaceWeekendCost;
    
    // Estimated prize money (simplified calculation)
    const estimatedPrizeMoney = completedRaces * 200000; // Average prize money per race
    const bonuses = gameState.raceFinancials?.breakdown?.fastestLapBonus || 0;
    
    const totalIncome = estimatedPrizeMoney + bonuses;
    const totalExpenses = totalOperationalCosts;
    const netChange = totalIncome - totalExpenses;
    
    // Project end of season budget
    const remainingRaces = gameState.seasonStats.upcomingRaces;
    const projectedRemainingCosts = remainingRaces * avgRaceWeekendCost;
    const projectedEndOfSeason = team.budget - projectedRemainingCosts;
    
    return {
      income: {
        prizeMoney: estimatedPrizeMoney,
        bonuses,
        total: totalIncome
      },
      expenses: {
        operationalCosts: totalOperationalCosts,
        raceWeekendCosts: totalOperationalCosts,
        total: totalExpenses
      },
      netChange,
      projectedEndOfSeason
    };
  };

  const getBudgetHealthStatus = (budget: number) => {
    if (budget > 100000000) {
      return { status: 'Excellent', color: 'green', icon: TrendingUp };
    } else if (budget > 50000000) {
      return { status: 'Good', color: 'yellow', icon: BarChart3 };
    } else if (budget > 20000000) {
      return { status: 'Warning', color: 'orange', icon: AlertTriangle };
    } else {
      return { status: 'Critical', color: 'red', icon: TrendingDown };
    }
  };

  const financialBreakdown = calculateFinancialBreakdown();
  const budgetHealth = getBudgetHealthStatus(gameState.selectedTeamData.budget);
  const HealthIcon = budgetHealth.icon;

  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-3xl lg:text-4xl mb-2 bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            Financial Overview
          </h1>
          <p className="text-gray-400">
            {gameState.selectedTeamData.name} • Season {gameState.season}
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
          <button
            onClick={() => setSelectedPeriod('season')}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-racing transition-all duration-200',
              {
                'bg-green-500 text-white': selectedPeriod === 'season',
                'text-gray-400 hover:text-white': selectedPeriod !== 'season',
              }
            )}
          >
            Season Total
          </button>
          <button
            onClick={() => setSelectedPeriod('recent')}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-racing transition-all duration-200',
              {
                'bg-green-500 text-white': selectedPeriod === 'recent',
                'text-gray-400 hover:text-white': selectedPeriod !== 'recent',
              }
            )}
          >
            Last Race
          </button>
        </div>
      </motion.div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Budget */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-400" />
            <h3 className="font-racing text-lg text-white">Current Budget</h3>
          </div>
          
          <div className="text-2xl font-bold text-green-400 mb-2">
            {formatCurrency(gameState.selectedTeamData.budget)}
          </div>
          
          <div className="flex items-center space-x-2">
            <HealthIcon className={clsx('w-4 h-4', {
              'text-green-400': budgetHealth.color === 'green',
              'text-yellow-400': budgetHealth.color === 'yellow',
              'text-orange-400': budgetHealth.color === 'orange',
              'text-red-400': budgetHealth.color === 'red',
            })} />
            <span className={clsx('text-sm font-bold', {
              'text-green-400': budgetHealth.color === 'green',
              'text-yellow-400': budgetHealth.color === 'yellow',
              'text-orange-400': budgetHealth.color === 'orange',
              'text-red-400': budgetHealth.color === 'red',
            })}>
              {budgetHealth.status}
            </span>
          </div>
        </motion.div>

        {/* Total Income */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h3 className="font-racing text-lg text-white">Season Income</h3>
          </div>
          
          <div className="text-2xl font-bold text-blue-400 mb-2">
            {formatCurrency(financialBreakdown.income.total)}
          </div>
          
          <div className="text-sm text-gray-400">
            {gameState.seasonStats.completedRaces} races completed
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <TrendingDown className="w-6 h-6 text-red-400" />
            <h3 className="font-racing text-lg text-white">Season Expenses</h3>
          </div>
          
          <div className="text-2xl font-bold text-red-400 mb-2">
            {formatCurrency(financialBreakdown.expenses.total)}
          </div>
          
          <div className="text-sm text-gray-400">
            Operational costs
          </div>
        </motion.div>

        {/* Net Change */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h3 className="font-racing text-lg text-white">Net P&L</h3>
          </div>
          
          <div className={clsx('text-2xl font-bold mb-2', {
            'text-green-400': financialBreakdown.netChange >= 0,
            'text-red-400': financialBreakdown.netChange < 0,
          })}>
            {financialBreakdown.netChange >= 0 ? '+' : ''}{formatCurrency(financialBreakdown.netChange)}
          </div>
          
          <div className="text-sm text-gray-400">
            Season so far
          </div>
        </motion.div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Award className="w-6 h-6 text-green-400" />
            <h3 className="font-racing text-xl text-white">Income Sources</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">Prize Money</span>
              </div>
              <span className="text-white font-bold">
                {formatShortCurrency(financialBreakdown.income.prizeMoney)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Performance Bonuses</span>
              </div>
              <span className="text-white font-bold">
                {formatShortCurrency(financialBreakdown.income.bonuses)}
              </span>
            </div>
            
            <div className="border-t border-gray-700 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-bold">Total Income</span>
                <span className="text-green-400 font-bold text-lg">
                  {formatShortCurrency(financialBreakdown.income.total)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Wrench className="w-6 h-6 text-red-400" />
            <h3 className="font-racing text-xl text-white">Expense Categories</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-gray-300">Race Operations</span>
              </div>
              <span className="text-white font-bold">
                {formatShortCurrency(financialBreakdown.expenses.raceWeekendCosts)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span className="text-gray-300">Development</span>
              </div>
              <span className="text-white font-bold">
                $0 {/* Future R&D implementation */}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-300">Staff Salaries</span>
              </div>
              <span className="text-white font-bold">
                $0 {/* Future staff implementation */}
              </span>
            </div>
            
            <div className="border-t border-gray-700 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-bold">Total Expenses</span>
                <span className="text-red-400 font-bold text-lg">
                  {formatShortCurrency(financialBreakdown.expenses.total)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Budget Projection */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Target className="w-6 h-6 text-purple-400" />
          <h3 className="font-racing text-xl text-white">Season Projection</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Current Budget</div>
            <div className="text-2xl font-bold text-white">
              {formatShortCurrency(gameState.selectedTeamData.budget)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Projected End of Season</div>
            <div className={clsx('text-2xl font-bold', {
              'text-green-400': financialBreakdown.projectedEndOfSeason > 50000000,
              'text-yellow-400': financialBreakdown.projectedEndOfSeason > 20000000,
              'text-red-400': financialBreakdown.projectedEndOfSeason <= 20000000,
            })}>
              {formatShortCurrency(financialBreakdown.projectedEndOfSeason)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Remaining Races</div>
            <div className="text-2xl font-bold text-blue-400">
              {gameState.seasonStats.upcomingRaces}
            </div>
          </div>
        </div>
        
        {financialBreakdown.projectedEndOfSeason <= 20000000 && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-bold">Budget Warning</span>
            </div>
            <p className="text-red-300 text-sm mt-1">
              Your projected end-of-season budget is critically low. Consider reducing costs or improving race performance to increase prize money.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
} 