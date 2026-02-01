export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate relative to USD (1 USD = X currency)
}

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", rate: 1 },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR ", rate: 3.75 },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KWD ", rate: 0.3061 },
  { code: "AED", name: "UAE Dirham", symbol: "AED ", rate: 3.67 },
  { code: "QAR", name: "Qatari Riyal", symbol: "QAR ", rate: 3.64 },
  { code: "OMR", name: "Omani Rial", symbol: "OMR ", rate: 0.3845 },
  { code: "BHD", name: "Bahraini Dinar", symbol: "BHD ", rate: 0.376 },
  { code: "JOD", name: "Jordanian Dinar", symbol: "JOD ", rate: 0.709 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", rate: 1.35 },
];

export const getCurrencyByCode = (code: string): Currency => {
  return currencies.find((c) => c.code === code) || currencies[0];
};

export const convertFromUSD = (amountUSD: number, currencyCode: string): number => {
  const currency = getCurrencyByCode(currencyCode);
  return amountUSD * currency.rate;
};

export const formatCurrencyValue = (
  amount: number,
  currencyCode: string,
  options?: { showDecimals?: boolean }
): string => {
  const currency = getCurrencyByCode(currencyCode);
  const convertedAmount = amount * currency.rate;
  
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: options?.showDecimals ? 2 : 0,
    maximumFractionDigits: options?.showDecimals ? 2 : 0,
  });

  return `${currency.symbol}${formatter.format(convertedAmount)}`;
};

export type CurrencyCode = "USD" | "SAR" | "KWD" | "AED" | "QAR" | "OMR" | "BHD" | "JOD" | "CAD";
