import { supabaseAdmin } from '../src/lib/supabase-admin';

function getSupabase() {
  return supabaseAdmin;
}

export function mapOrderFromDb(order: any): any {
  if (!order) return order;
  return {
    ...order,
    id: order.public_order_id || order.id // Expose public_order_id as id for frontend
  };
}

export async function getVoucherStocks(): Promise<Record<string, number>> {
  const stock: Record<string, number> = {};
  
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('vouchers')
      .select('product_id')
      .eq('status', 'available');

    if (error) throw error;
    (data || []).forEach((row: any) => {
      const pid = row.product_id;
      stock[pid] = (stock[pid] || 0) + 1;
    });
    return stock;
  } catch (err) {
    console.error('[DB] Error fetching stock from Supabase:', err);
    throw err;
  }
}

export async function getVoucherSold(): Promise<Record<string, number>> {
  const sold: Record<string, number> = {};

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('vouchers')
      .select('product_id')
      .eq('status', 'used');

    if (error) throw error;
    (data || []).forEach((row: any) => {
      const pid = row.product_id;
      sold[pid] = (sold[pid] || 0) + 1;
    });
    return sold;
  } catch (err) {
    console.error('[DB] Error fetching sold from Supabase:', err);
    throw err;
  }
}

export async function createOrder(
  publicOrderId: string,
  internalUuid: string,
  productId: string,
  qty: number,
  unitPrice: number,
  amountIdr: number,
  warranty?: { id: string; title: string; price: number; duration_days: number; }
): Promise<any> {
  const sb = getSupabase();
  const dbOrder: any = {
    id: internalUuid, 
    public_order_id: publicOrderId,
    product_id: productId,
    qty,
    unit_price: unitPrice,
    amount_idr: amountIdr,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    voucher_code: null,
  };

  if (warranty) {
    dbOrder.warranty_id = warranty.id;
    dbOrder.warranty_title = warranty.title;
    dbOrder.warranty_price = warranty.price;
    dbOrder.warranty_duration_days = warranty.duration_days;
  }

  const { data, error } = await sb
    .from('orders')
    .insert(dbOrder)
    .select();

  if (error) {
    console.error('[DB] Error inserting order in Supabase:', error);
    throw error;
  }
  return mapOrderFromDb(data?.[0]) || mapOrderFromDb(dbOrder);
}

export async function getOrder(publicOrderId: string): Promise<any | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .eq('public_order_id', publicOrderId)
    .maybeSingle();

  if (error) {
    console.error('[DB] Error fetching order in Supabase:', error);
    return null;
  }
  return mapOrderFromDb(data);
}

export async function cancelOrder(publicOrderId: string): Promise<boolean> {
  const sb = getSupabase();
  const { error } = await sb
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('public_order_id', publicOrderId)
    .eq('status', 'pending');

  if (error) {
    console.error('[DB] Error cancelling order in Supabase:', error);
    return false;
  }
  return true;
}

export async function cleanupExpiredOrders(ttlMinutes: number): Promise<number> {
  const cutoffTime = new Date(Date.now() - ttlMinutes * 60 * 1000);
  
  try {
    const sb = getSupabase();
    const { data, error: fetchError } = await sb
      .from('orders')
      .select('id')
      .eq('status', 'pending')
      .lt('created_at', cutoffTime.toISOString());
      
    if (fetchError) throw fetchError;
    if (!data || data.length === 0) return 0;
    
    const ids = data.map((d: any) => d.id);
    const { error: updateError } = await sb
      .from('orders')
      .update({ status: 'cancelled' })
      .in('id', ids);
      
    if (updateError) throw updateError;
    return ids.length;
  } catch (err) {
    console.error('[DB] Error during order TTL cleanup:', err);
    return 0;
  }
}

export async function claimVouchersForOrder(
  publicOrderId: string,
  productId: string,
  qty: number
): Promise<string[] | null> {
  const actualQty = Math.max(1, qty);

  try {
    const sb = getSupabase();
    // Fetch available vouchers
    const { data: vData, error: vError } = await sb
      .from('vouchers')
      .select('id,code')
      .eq('product_id', productId)
      .eq('status', 'available')
      .order('id', { ascending: true })
      .limit(actualQty);

    if (vError || !vData || vData.length < actualQty) {
      console.warn('[DB] Not enough vouchers or error:', vError);
      return null;
    }

    const ids = vData.map((row: any) => row.id);
    const codes = vData.map((row: any) => row.code);
    const codesString = codes.join('\n');

    // Mark as used
    const { error: patchError } = await sb
      .from('vouchers')
      .update({ status: 'used' })
      .in('id', ids);

    if (patchError) {
      console.error('[DB] Error updating vouchers status:', patchError);
      return null;
    }

    // Update order status and voucher code
    const { error: orderError } = await sb
      .from('orders')
      .update({ status: 'paid', voucher_code: codesString })
      .eq('public_order_id', publicOrderId);

    if (orderError) {
      console.error('[DB] Error marking order paid:', orderError);
      // Rollback vouchers status if order update failed
      await sb.from('vouchers').update({ status: 'available' }).in('id', ids);
      return null;
    }

    return codes;
  } catch (err) {
    console.error('[DB] Fatal error claiming vouchers on Supabase:', err);
    return null;
  }
}

export async function addVouchers(productId: string, codes: string[]): Promise<boolean> {
  const items = codes.map(code => ({
    product_id: productId,
    code,
    status: 'available' as const
  }));

  try {
    const sb = getSupabase();
    const { error } = await sb.from('vouchers').insert(items);
    if (error) {
       throw error;
    }
    return true;
  } catch (err) {
    console.error('[DB] Error adding vouchers in Supabase:', err);
    return false;
  }
}

export async function getAllOrders(): Promise<any[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('orders')
    .select('public_order_id,product_id,qty,unit,amount_idr,status,created_at,voucher_code,id')
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) {
    console.error('[DB] Error getting all orders in Supabase:', error);
    return [];
  }
  return (data || []).map(mapOrderFromDb);
}

// ----------------------
// PRODUCTS CRUD
// ----------------------

export async function getAllProducts(): Promise<any[]> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('products').select('*').order('name');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[DB] Error getting products:', err);
    return [];
  }
}

export async function upsertProduct(product: any): Promise<boolean> {
  try {
    const sb = getSupabase();
    // Only upsert columns that exist in the database schema to prevent PGRST204 errors
    const payload: any = {
      id: product.id,
      name: product.name,
      price_idr: product.price_idr || product.price || 0
    };
    
    const { error } = await sb.from('products').upsert(payload);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[DB] Exception upserting product:', err);
    return false;
  }
}

export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('products').delete().eq('id', productId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[DB] Exception deleting product:', err);
    return false;
  }
}

// ----------------------
// WARRANTIES CRUD
// ----------------------

export async function getProductWarranties(productId: string): Promise<any[]> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('product_warranties')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });
    if (error) {
       if (error.code === '42P01') return [];
       throw error;
    }
    return data || [];
  } catch (err: any) {
    const errCode = err?.code || err?.error?.code;
    const errMsg = err?.message || err?.error?.message || '';
    if (errCode !== '42P01' && !errMsg.includes('does not exist')) {
      console.error(`[DB] Error getting warranties for product ${productId}:`, err);
    }
    return [];
  }
}

export async function getWarranty(warrantyId: string): Promise<any | null> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('product_warranties')
      .select('*')
      .eq('id', warrantyId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (err: any) {
    const errCode = err?.code || err?.error?.code;
    const errMsg = err?.message || err?.error?.message || '';
    if (errCode !== '42P01' && !errMsg.includes('does not exist')) {
      console.error(`[DB] Error getting warranty ${warrantyId}:`, err);
    }
    return null;
  }
}

export async function upsertWarranty(warranty: any): Promise<boolean> {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('product_warranties').upsert(warranty);
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('[DB] Exception upserting warranty:', err?.message || err);
    return false;
  }
}

export async function deleteWarranty(warrantyId: string): Promise<boolean> {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('product_warranties').delete().eq('id', warrantyId);
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('[DB] Exception deleting warranty:', err?.message || err);
    return false;
  }
}

export function getSupabaseInstance() {
  return getSupabase();
}
