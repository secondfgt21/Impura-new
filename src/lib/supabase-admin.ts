import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqhmnpakvdulkqovzbje.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaG1ucGFrdmR1bGtxb3Z6YmplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA3NTgzMiwiZXhwIjoyMDg2NjUxODMyfQ.0bpBw6Z9UwoxtLtqlPcQVNo7H9aDJZJx_7cxT_bMMkI';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
