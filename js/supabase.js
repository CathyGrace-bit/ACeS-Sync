const SUPABASE_URL =
    "https://hzpocgvhepqqffjcegjf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "YOUR_PUBLISHABLE_KEY_HERE";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
