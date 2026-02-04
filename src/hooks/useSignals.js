import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useSignals(user) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!user?.id) {
        if (mounted) {
          setSignals([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      // TODO: change "signals" + column names to match your schema
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!mounted) return;

      if (error) {
        console.error("useSignals error:", error);
        setSignals([]);
      } else {
        setSignals(Array.isArray(data) ? data : []);
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { signals, loading };
}
