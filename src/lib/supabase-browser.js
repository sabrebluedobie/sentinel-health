"use client";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// If you haven't set up anon key yet, this will be undefined; Header guards its usage.
export const supabase = (url && anon) ? createClient(url, anon) : null;
