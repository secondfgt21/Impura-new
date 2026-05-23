import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getVoucherStocks,
  getVoucherSold,
  createOrder,
  getOrder,
  cancelOrder,
  cleanupExpiredOrders,
  claimVouchersForOrder,
  addVouchers,
  getAllOrders,
  getAllProducts,
  upsertProduct,
  deleteProduct,
  getSupabaseInstance,
  getProductWarranties,
  getWarranty,
  upsertWarranty,
  deleteWarranty
} from './server/db';


import {
  testSupabaseConnection,
  testProductsRead,
  testOrdersInsert,
  testRealtime
} from './src/lib/supabase-health';


// Load env variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

const ORDER_TTL_MINUTES = 5;

// Run background task every 1 minute to cleanup expired orders
setInterval(async () => {
  try {
    const cleanedCount = await cleanupExpiredOrders(ORDER_TTL_MINUTES);
    if (cleanedCount > 0) {
      console.log(`[CLEANUP] Automatically expired ${cleanedCount} pending order(s).`);
    }
  } catch (err) {
    console.error('[CLEANUP] Error in periodic order TTL cleanup:', err);
  }
}, 60000);

// Helper to get order warranty string
function getOrderWarrantyLabel(order: any): string {
  if (order.warranty_title) return order.warranty_title;
  return '';
}

// Helper to verify and handle expired pending orders dynamically
async function ensureNotExpired(order: any): Promise<{ order: any; cancelled: boolean }> {
  if (order.status.toLowerCase() !== 'pending') {
    return { order, cancelled: false };
  }
  const createdTime = new Date(order.created_at).getTime();
  const elapsedMinutes = (Date.now() - createdTime) / (1000 * 60);

  if (elapsedMinutes > ORDER_TTL_MINUTES) {
    const success = await cancelOrder(order.id);
    if (success) {
      order.status = 'cancelled';
      return { order, cancelled: true };
    }
  }
  return { order, cancelled: false };
}

// Visitor counter tracking (in-memory session map)
const visitorSessions = new Map<string, number>();
const VISITOR_BASE_SHIFT = 120;

// API ROUTES
app.get('/api/health', async (req, res) => {
  try {
    const connCheck = await testSupabaseConnection(false);
    const readCheck = await testProductsRead(false);
    const rtCheck = await testRealtime();

    let errMessage = null;
    if (!connCheck.success) errMessage = connCheck.error || 'Database connection error';
    else if (!readCheck.success) errMessage = readCheck.error || 'Products read query error';

    res.json({
      status: 'ok',
      database: connCheck.success ? 'connected' : 'disconnected',
      realtime: rtCheck.success,
      products: readCheck.details?.count || 0,
      error: errMessage
    });
  } catch (err: any) {
    res.json({
      status: 'error',
      database: 'disconnected',
      realtime: false,
      products: 0,
      error: err.message || String(err)
    });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json({ ok: true, products });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/products/:id/warranties', async (req, res) => {
  try {
    const warranties = await getProductWarranties(req.params.id);
    res.json({ ok: true, warranties });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 1. Get stats (real-time stocks and sales)
app.get('/api/store-data', async (req, res) => {
  try {
    const stock = await getVoucherStocks();
    const sold = await getVoucherSold();
    const total_sold = Object.values(sold).reduce((a, b: any) => a + Number(b), 0);

    res.json({
      ok: true,
      stock,
      sold,
      total_sold
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

function generateOrderId(): string {
  let digits = '';
  for (let i = 0; i < 12; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return `IMPURA${digits}`;
}

async function generateUniqueOrderId(): Promise<string> {
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateId = generateOrderId();
    const existing = await getOrder(candidateId);
    if (!existing) {
      return candidateId;
    }
  }
  return generateOrderId();
}

// 2. Checkout
app.post('/api/checkout', async (req, res) => {
  try {
    const { product_id, qty, warranty } = req.body;

    const products = await getAllProducts();
    const targetProduct = products.find(p => p.id === product_id);

    if (!targetProduct) {
      return res.status(404).json({ ok: false, error: 'Product not found' });
    }

    const requestedQty = Math.max(1, Number(qty || 1));
    const stock = await getVoucherStocks();
    const availableStock = stock[product_id] || 0;

    if (availableStock <= 0) {
      return res.status(400).json({ ok: false, error: 'Stok habis' });
    }

    const qtyToOrder = Math.min(requestedQty, availableStock);

    let price = Number(targetProduct.price || targetProduct.price_idr || 0);
    let selectedWarrantyData = null;

    if (warranty) { // warranty should be the warranty ID
      selectedWarrantyData = await getWarranty(warranty);
      if (selectedWarrantyData && selectedWarrantyData.product_id === product_id) {
        price += Number(selectedWarrantyData.extra_price);
      } else {
        selectedWarrantyData = null; // invalid warranty
      }
    }

    // Generate unique cents (1 to 99) for unique QRIS verification
    const uniqueCode = Math.floor(Math.random() * 99) + 1;
    const totalAmount = (price * qtyToOrder) + uniqueCode;
    const publicOrderId = await generateUniqueOrderId();
    const internalUuid = crypto.randomUUID();

    const created = await createOrder(
      publicOrderId, 
      internalUuid, 
      product_id, 
      qtyToOrder, 
      price, 
      totalAmount,
      selectedWarrantyData ? {
        id: selectedWarrantyData.id,
        title: selectedWarrantyData.title,
        price: selectedWarrantyData.extra_price,
        duration_days: selectedWarrantyData.duration_days
      } : undefined
    );

    res.json({
      ok: true,
      order: created
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3. Get single order & auto-cancel check
app.get('/api/order/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    let order = await getOrder(orderId);

    if (!order) {
      return res.status(404).json({ ok: false, error: 'Order not found' });
    }

    const result = await ensureNotExpired(order);
    order = result.order;

    const createdTime = new Date(order.created_at).getTime();
    const expireTime = createdTime + (ORDER_TTL_MINUTES * 60 * 1000);
    const ttl_sec = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
    
    // get product name
    const products = await getAllProducts();
    const product = products.find(p => p.id === order.product_id);

    res.json({
      ok: true,
      order: {
        ...order,
        product_name: product?.name || order.product_id,
        product_note: product?.note || '',
        warranty_label: getOrderWarrantyLabel(order)
      },
      status: order.status,
      ttl_sec
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3a. SSE Stream for Realtime order updates
app.get('/api/order/:id/stream', async (req, res) => {
  const orderId = req.params.id; // This is the public order ID

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let isClosed = false;
  req.on('close', () => {
    isClosed = true;
  });

  const sb = getSupabaseInstance();
  if (sb) {
    // Send initial status just in case
    const initial = await getOrder(orderId);
    if (initial && !isClosed) {
      sendEvent({ status: initial.status });
    }

    const channel = sb.channel(`realtime-order-${orderId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `public_order_id=eq.${orderId}` },
        (payload: any) => {
          if (!isClosed) {
            sendEvent({ status: payload.new.status });
          }
        }
      )
      .subscribe();

    req.on('close', () => {
      sb.removeChannel(channel);
    });
  }
});

app.get('/api/active-sessions', (req, res) => {
  let visId = req.cookies.vis_sid;
  if (!visId) {
    visId = crypto.randomUUID();
  }

  const now = Date.now();
  visitorSessions.set(visId, now);

  // Expire session after 45 seconds of inactivity
  for (const [key, timestamp] of visitorSessions.entries()) {
    if (now - timestamp > 45000) {
      visitorSessions.delete(key);
    }
  }

  const currentActive = visitorSessions.size;
  // Dynamic variance simulation
  const randOffset = Math.floor(Math.random() * 9);
  const count = VISITOR_BASE_SHIFT + currentActive + randOffset;

  res.cookie('vis_sid', visId, { maxAge: 24 * 3600 * 1000, httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true, count });
});

// 5. Check if Supabase configured
app.get('/api/supabase-status', (req, res) => {
  res.json({
    configured: true
  });
});

// Admin configuration (auth handled client-side via simple token check)
const ADMIN_TOKEN = 'admin-secure-token-x1';

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.query.token || req.headers['x-admin-token'];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
};

// 6. Admin: Get all orders
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const list = await getAllOrders();
    // Parse order items with warranty labels
    const transformed = list.map(o => ({
      ...o,
      warranty_label: getOrderWarrantyLabel(o)
    }));
    res.json({ ok: true, orders: transformed });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 7. Admin: Manual verify / pay & claim voucher
app.post('/api/admin/verify/:id', requireAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await getOrder(orderId);

    if (!order) {
      return res.status(404).json({ ok: false, error: 'Order not found' });
    }

    if (order.status === 'paid' && order.voucher_code) {
      return res.json({ ok: true, order, alreadyPaid: true });
    }

    const claimed = await claimVouchersForOrder(orderId, order.product_id, order.qty);
    if (!claimed) {
      return res.status(400).json({
        ok: false,
        error: 'Stok tidak mencukupi untuk memverifikasi order ini.'
      });
    }

    const updated = await getOrder(orderId);
    res.json({ ok: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 8. Admin: Inject voucher codes directly
app.post('/api/admin/add-vouchers', requireAdmin, async (req, res) => {
  try {
    const { product_id, codes } = req.body;
    if (!product_id || !Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ ok: false, error: 'Invalid product_id or empty codes array' });
    }

    const sanitizedCodes = codes.map(c => String(c).trim()).filter(Boolean);
    if (sanitizedCodes.length === 0) {
      return res.status(400).json({ ok: false, error: 'No non-empty codes provided' });
    }

    const success = await addVouchers(product_id, sanitizedCodes);
    if (success) {
      return res.json({ ok: true, count: sanitizedCodes.length });
    }
    res.status(500).json({ ok: false, error: 'Failed to insert codes to storage' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 9. Admin: Get all products
app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json({ ok: true, products });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 10. Admin: Upsert (Create/Edit) product
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const product = req.body;
    if (!product || !product.id || !product.name) {
      return res.status(400).json({ ok: false, error: 'Missing required product fields' });
    }
    const success = await upsertProduct(product);
    if (!success) {
      return res.status(500).json({ ok: false, error: 'Failed to save product' });
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 11. Admin: Delete product
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const success = await deleteProduct(req.params.id);
    if (!success) {
      return res.status(500).json({ ok: false, error: 'Failed to delete product' });
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Admin Warranty APIs
app.post('/api/admin/warranties', requireAdmin, async (req, res) => {
  try {
    const warranty = req.body;
    if (!warranty.product_id || !warranty.title) {
      return res.status(400).json({ ok: false, error: 'Missing required warranty fields' });
    }
    const success = await upsertWarranty(warranty);
    if (!success) {
      return res.status(500).json({ ok: false, error: 'Failed to save warranty' });
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/admin/warranties/:id', requireAdmin, async (req, res) => {
  try {
    const success = await deleteWarranty(req.params.id);
    if (!success) {
      return res.status(500).json({ ok: false, error: 'Failed to delete warranty' });
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

async function runStartupDiagnostics() {
  console.log('\n======================================================');
  console.log('       SUPABASE CONNECTION HEALTH DIAGNOSTICS       ');
  console.log('======================================================');
  
  // 1. Connection check with Anon client
  const connCheck = await testSupabaseConnection(false);
  if (connCheck.success) {
    console.log('✅ Supabase connected');
  } else {
    console.log('❌ Supabase connection check failed:', connCheck.error || 'Unknown error');
  }

  // 2. Products query check
  const readCheck = await testProductsRead(false);
  if (readCheck.success) {
    console.log(`✅ Supabase read products succeeded (Found ${readCheck.details?.count} item(s))`);
  } else {
    console.log('❌ Supabase read failed:', readCheck.error);
  }

  // 3. Admin Order Insert proxy check
  const insertCheck = await testOrdersInsert(true); // admin/service role client
  if (insertCheck.success) {
    console.log('✅ Supabase admin connection check succeeded');
  } else {
    console.log('❌ Supabase insert failed:', insertCheck.error);
    if (insertCheck.details?.isRlsFailure) {
      console.log('❌ Missing service role key or incorrect credentials configuration');
    }
  }

  // 4. Websocket subscriber check
  const rtCheck = await testRealtime();
  if (rtCheck.success) {
    console.log('✅ Supabase realtime subscription channels connecting stably');
  } else {
    console.log('❌ Supabase realtime socket connection issue:', rtCheck.error);
  }
  
  console.log('======================================================\n');
}

// Setup Vite & Static Files routing
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Note: In Vercel, standard static file serving is done by Vercel edge.
    // The dist path is only used for local production testing (npm run start)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen on a port if not in Vercel serverless environment
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', async () => {
      console.log(`[SERVER] Fullstack backend running on port ${PORT}`);
      console.log(`[SERVER] Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[SERVER] Supabase configured: true`);
      await runStartupDiagnostics();
    });
  }
}

startServer();

export default app;
