'use client';

import { useState } from 'react';

interface TransactionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionType: 'deposit' | 'withdraw' | 'transfer';
  transactionData: {
    amount: number;
    description: string;
    accountIban?: string;
    targetIban?: string;
    currentBalance?: number;
    fee?: number;
    currencyType?: number;
  };
  getCurrencySymbol: (currencyType: number) => string;
}

const TransactionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  transactionType,
  transactionData,
  getCurrencySymbol
}: TransactionConfirmModalProps) => {
  if (!isOpen) return null;

  const { amount, description, accountIban, targetIban, currentBalance = 0, fee = 0, currencyType = 0 } = transactionData;
  const currencySymbol = getCurrencySymbol(currencyType);
  
  const getTransactionTitle = () => {
    switch (transactionType) {
      case 'deposit': return 'Para Yatırma Onayı';
      case 'withdraw': return 'Para Çekme Onayı';
      case 'transfer': return 'Para Transferi Onayı';
      default: return 'İşlem Onayı';
    }
  };

  const getAfterBalance = () => {
    switch (transactionType) {
      case 'deposit': return currentBalance + amount;
      case 'withdraw': return currentBalance - amount - fee;
      case 'transfer': return currentBalance - amount - fee;
      default: return currentBalance;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-center">{getTransactionTitle()}</h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Hesap IBAN:</span>
            <span className="font-medium">{accountIban}</span>
          </div>
          
          {transactionType === 'transfer' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Alıcı IBAN:</span>
              <span className="font-medium">{targetIban}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Açıklama:</span>
            <span className="font-medium text-right max-w-48 break-words">{description}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Mevcut Bakiye:</span>
            <span className="font-medium">
              {currencySymbol}{currentBalance.toLocaleString('tr-TR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">
              {transactionType === 'deposit' ? 'Yatırılacak Tutar:' : 
               transactionType === 'withdraw' ? 'Çekilecek Tutar:' : 'Transfer Tutarı:'}
            </span>
            <span className="font-medium">
              {currencySymbol}{amount.toLocaleString('tr-TR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
          
          {(transactionType === 'withdraw' || transactionType === 'transfer') && fee > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">İşlem Ücreti (%2):</span>
              <span className="font-medium text-red-600">
                {currencySymbol}{fee.toLocaleString('tr-TR', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          )}
          
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-gray-600 font-semibold">
                {transactionType === 'deposit' ? 'Yeni Bakiye:' : 
                 transactionType === 'withdraw' ? 'Kalan Bakiye:' : 'Kalan Bakiye:'}
              </span>
              <span className="font-bold text-lg">
                {currencySymbol}{getAfterBalance().toLocaleString('tr-TR', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              transactionType === 'deposit' 
                ? 'bg-green-600 hover:bg-green-700' 
                : transactionType === 'withdraw'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {transactionType === 'deposit' ? 'Para Yatır' : 
             transactionType === 'withdraw' ? 'Para Çek' : 'Transfer Et'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionConfirmModal;


