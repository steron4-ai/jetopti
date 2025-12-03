// src/lib/CurrencyContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  // Master-Währung im Backend ist EUR
  const [currency, setCurrency] = useState('EUR'); // 'EUR' | 'USD'
  const [rateEurToUsd, setRateEurToUsd] = useState(1.16); // 1 € = 1,16 $

  const formatPrice = useCallback(
    (priceInEur, options = {}) => {
      const { showBoth = false, maximumFractionDigits = 0 } = options;

      if (priceInEur == null || isNaN(priceInEur)) return '–';

      const eur = Number(priceInEur);
      const usd = eur * rateEurToUsd;

      const primaryValue = currency === 'EUR' ? eur : usd;
      const primaryCurrency = currency === 'EUR' ? 'EUR' : 'USD';

      const primaryFormatter = new Intl.NumberFormat(
        primaryCurrency === 'EUR' ? 'de-DE' : 'en-US',
        {
          style: 'currency',
          currency: primaryCurrency,
          maximumFractionDigits,
        }
      );

      let result = primaryFormatter.format(primaryValue);

      if (showBoth) {
        const eurFormatter = new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits,
        });

        const usdFormatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits,
        });

        const eurStr = eurFormatter.format(eur);
        const usdStr = usdFormatter.format(usd);

        // Immer beide anzeigen, primäre Währung zuerst
        result =
          currency === 'EUR'
            ? `${eurStr} (≈ ${usdStr})`
            : `${usdStr} (≈ ${eurStr})`;
      }

      return result;
    },
    [currency, rateEurToUsd]
  );

  const value = {
    currency,
    setCurrency,
    rateEurToUsd,
    setRateEurToUsd,
    formatPrice,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
