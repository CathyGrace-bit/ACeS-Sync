
/* =========================================
   ACeS SYNC - SUPABASE CONNECTION
   ACLC MANDAUE
========================================= */

"use strict";

const SUPABASE_URL = "https://brpwufimscyjazehhswc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_SzXU4B4JJG_PUXJ16i8efA_73qmaey4";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("ACeS Sync: Supabase client initialized successfully!");
