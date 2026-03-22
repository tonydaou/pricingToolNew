import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and anon key
console.log("🕒 Cache breaker:", Date.now());

// Test the URL you provided
const testUrls = [
  'https://ixjnlaimajqhywopawjc.supabase.co',  // URL you provided
  'https://ixjnslaimajqhywopawjc.supabase.co'   // URL with "s"
];

const supabaseUrl = testUrls[0]; // Try your URL first
const supabaseAnonKey = 'sb_publishable_HkdypyY0rqmJdmKxCJtDdg_8DHWXIyE';

console.log("🔍 Testing URLs:", testUrls);
console.log("🔍 Using URL:", supabaseUrl);
console.log("🔍 Using key:", supabaseAnonKey.substring(0, 20) + "...");

// Test each URL
testUrls.forEach((url, index) => {
  console.log(`🌐 Testing URL ${index + 1}: ${url}`);
  fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  }).then(response => {
    console.log(`✅ URL ${index + 1} works:`, response.status);
  }).catch(error => {
    console.error(`❌ URL ${index + 1} failed:`, error.message);
  });
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
supabase.from('quotes').select('count').then(({ data, error }) => {
  if (error) {
    console.error("❌ Supabase connection test failed:", error);
  } else {
    console.log("✅ Supabase connection test passed:", data);
  }
});

// Quote type definitions
export interface Quote {
  id?: string;
  quote_name: string;
  client_name: string;
  main_asset: string;
  commitment_years: number;
  discount_percent: number;
  currency: string;
  quote_date?: string;
  created_at?: string;
  updated_at?: string;
  
  // Quote totals
  yearly_platform_fee: number;
  year_one_subscription: number;
  total_before_discount: number;
  discount_amount: number;
  final_total: number;
  
  // JSON data
  line_items: any[];
  rates: any;
  user_id?: string;
}

// Database operations
export const quoteService = {
  // Save a new quote
  async saveQuote(quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>) {
    console.log("🔍 Supabase: Attempting to save quote:", quote);
    try {
      // Remove user_id requirement for now
      const { data, error } = await supabase
        .from('quotes')
        .insert([quote])
        .select()
        .single();
      
      if (error) {
        console.error("❌ Supabase error:", error);
        throw error;
      }
      
      console.log("✅ Supabase: Quote saved successfully:", data);
      return data;
    } catch (err) {
      console.error("💥 Supabase: Failed to save quote:", err);
      throw err;
    }
  },

  // Update an existing quote
  async updateQuote(id: string, quote: Partial<Quote>) {
    console.log("🔍 Supabase: Attempting to update quote:", id, quote);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .update(quote)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("❌ Supabase error:", error);
        throw error;
      }
      
      console.log("✅ Supabase: Quote updated successfully:", data);
      return data;
    } catch (err) {
      console.error("💥 Supabase: Failed to update quote:", err);
      throw err;
    }
  },

  // Get all quotes for a user
  async getAllQuotes(userId?: string) {
    let query = supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get recent quotes (last 5)
  async getRecentQuotes(userId?: string, limit = 5) {
    let query = supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get a single quote by ID
  async getQuoteById(id: string) {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a quote
  async deleteQuote(id: string) {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Search quotes by name or client
  async searchQuotes(searchTerm: string, userId?: string) {
    let query = supabase
      .from('quotes')
      .select('*')
      .or(`quote_name.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};
