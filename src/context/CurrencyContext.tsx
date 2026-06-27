"use client";

import { createContext, useContext } from "react";
import { convertPrice, type Rates } from "@/lib/currency";

interface CurrencyContextValue {
  currency: string;
  rates: Rates;
  formatPrice: (usdPrice: string | null | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  rates: {},
  formatPrice: (p) => p?.replace(/<[^>]*>/g, "").trim() ?? "",
});

export function CurrencyProvider({
  currency,
  rates,
  children,
}: {
  currency: string;
  rates: Rates;
  children: React.ReactNode;
}) {
  return (
    <CurrencyContext.Provider
      value={{
        currency,
        rates,
        formatPrice: (p) => convertPrice(p, rates, currency),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
