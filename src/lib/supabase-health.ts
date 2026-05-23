import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-admin';

export interface HealthTestResult {
  success: boolean;
  error?: string;
  details?: any;
}

// Exponential Backoff Retry Utility for Supabase Requests
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 1) {
      throw error;
    }
    const errMsg = error?.message || String(error);
    console.warn(`[SUPABASE RETRY] Request failed: ${errMsg}. Retrying in ${delay}ms... (Remaining attempts: ${retries - 1})`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithExponentialBackoff(fn, retries - 1, delay * 2);
  }
}

// Helper to determine which client to use based on env context
export function getClient(isAdmin = false) {
  const isServer = typeof window === 'undefined';
  
  // Requirement 9: Detect incorrect client usage
  if (!isServer && isAdmin) {
    console.warn(
      '[SUPABASE ACCESSIBILITY WARNING] Frontend code attempting to use an admin service role client directly! ' +
      'Admin operations MUST remain server-side behind secure API proxy routes to prevent key leakage and RLS bypass.'
    );
  }
  if (isServer && !isAdmin) {
    console.warn(
      '[SUPABASE ACCESSIBILITY WARNING] Server-side/Admin actions attempting to use anonymous client ' +
      'instead of service role client!'
    );
  }

  return isAdmin ? supabaseAdmin : supabase;
}

// 1. Connection Health Checker
export async function testSupabaseConnection(isAdmin = false): Promise<HealthTestResult> {
  try {
    const client = getClient(isAdmin);
    // Simple light query to check if URL is reachable and responding
    const { data, error, status } = await retryWithExponentialBackoff(async () => {
      return await client.from('products').select('id').limit(1);
    });

    if (error) {
      console.error('❌ Supabase connection check failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown Supabase connection error',
        details: { code: error.code, details: error.details, hint: error.hint, status }
      };
    }

    console.log('✅ Supabase connected');
    return { success: true, details: { status } };
  } catch (err: any) {
    console.error('❌ Supabase connection error:', err);
    return {
      success: false,
      error: err.message || String(err),
      details: err
    };
  }
}

// 2. Products Read Tester
export async function testProductsRead(isAdmin = false): Promise<HealthTestResult> {
  try {
    const client = getClient(isAdmin);
    const { data, error, status } = await retryWithExponentialBackoff(async () => {
      return await client.from('products').select('*');
    });

    if (error) {
      console.error('❌ Supabase read failed:', error);
      return {
        success: false,
        error: error.message || 'Product read query failed',
        details: { code: error.code, details: error.details, hint: error.hint, status }
      };
    }

    return {
      success: true,
      details: { count: data?.length || 0, status }
    };
  } catch (err: any) {
    console.error('❌ Supabase read exception:', err);
    return {
      success: false,
      error: err.message || String(err),
      details: err
    };
  }
}

// 3. Orders Insert/Delete Tester
export async function testOrdersInsert(isAdmin = true): Promise<HealthTestResult> {
  const client = getClient(isAdmin);
  const testId = `health_test_${Date.now()}`;
  
  try {
    // Attempt dummy order insertion
    const dummyOrder = {
      id: '00000000-0000-0000-0000-000000000000', // temporary uuid format
      public_order_id: testId,
      product_id: 'gemini',
      qty: 1,
      unit_price: 1,
      amount_idr: 1,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await client
      .from('orders')
      .insert(dummyOrder)
      .select();

    if (insertError) {
      console.error('❌ Supabase insert failed:', insertError);
      return {
        success: false,
        error: insertError.message || 'Order insertion query failed',
        details: {
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          isRlsFailure: insertError.code === '42501' || insertError.message?.toLowerCase().includes('rls') || insertError.message?.toLowerCase().includes('permission')
        }
      };
    }

    // Immediately clean up the test order
    const { error: deleteError } = await client
      .from('orders')
      .delete()
      .eq('public_order_id', testId);

    if (deleteError) {
      console.warn('⚠️ Health test cleanup delete failed:', deleteError);
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Supabase insert exception:', err);
    return {
      success: false,
      error: err.message || String(err),
      details: err
    };
  }
}

// 4. Realtime Subscription Tester
export async function testRealtime(): Promise<HealthTestResult> {
  return new Promise((resolve) => {
    try {
      // Connect to a channel to test websocket heartbeat
      const channel = supabase.channel(`health-check-${Date.now()}`);
      
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          supabase.removeChannel(channel);
          resolve({
            success: false,
            error: 'Realtime subscription handshake timed out after 3000ms'
          });
        }
      }, 3000);

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, () => {})
        .subscribe((status, err) => {
          if (resolved) return;

          if (status === 'SUBSCRIBED') {
            resolved = true;
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            resolve({ success: true });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
            resolved = true;
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            resolve({
              success: false,
              error: `Realtime state: ${status}`,
              details: err
            });
          }
        });
    } catch (err: any) {
      resolve({
        success: false,
        error: err.message || String(err),
        details: err
      });
    }
  });
}
