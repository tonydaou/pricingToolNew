import { Currency } from "./currencies";

const API_KEY = "5a483c12b00239b515edb36e";
const BASE_URL = "https://v6.exchangerate-api.com/v6";

export interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

export const fetchRealTimeRates = async (): Promise<Record<string, number>> => {
  try {
    const response = await fetch(`${BASE_URL}/${API_KEY}/latest/USD`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ExchangeRateResponse = await response.json();
    
    if (data.result !== "success") {
      throw new Error(`API error: ${data.result}`);
    }
    
    return data.conversion_rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    throw error;
  }
};

export const updateCurrenciesWithRealTimeRates = async (
  baseCurrencies: Currency[]
): Promise<Currency[]> => {
  try {
    const rates = await fetchRealTimeRates();
    
    return baseCurrencies.map(currency => {
      if (currency.code === "USD") {
        // Keep USD as base (rate = 1)
        return { ...currency, rate: 1 };
      } else {
        // Update rate from API response
        const apiRate = rates[currency.code];
        if (apiRate !== undefined) {
          return { ...currency, rate: apiRate };
        } else {
          console.warn(`Rate not found for ${currency.code}, keeping existing rate`);
          return currency;
        }
      }
    });
  } catch (error) {
    console.error("Failed to update currencies with real-time rates:", error);
    // Return original currencies if API fails
    return baseCurrencies;
  }
};
