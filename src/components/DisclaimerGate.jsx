import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const DISCLAIMER_VERSION = "v1";
const DISCLAIMER_TYPE = "medical_disclaimer";

const copy = {
  title: "Medical Disclaimer",
  body: `Sentinel Health is a self-tracking and education tool. It does not provide medical advice, diagnosis, or treatment and is not a substitute for professional medical care. Use this app only under the guidance of your physician or licensed health-care provider. Do not make changes to medications, therapies, or your care plan without first consulting your physician. If you experience a medical emergency, call your local emergency number (in the U.S., call 911).`
};

export default function DisclaimerGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [uid, setUid] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: userResp, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userResp?.user?.id) {
        // If not logged in, don't block here—your auth flow will handle it.
        if (mounted) { setLoading(false); setShow(false); }
        return;
      }
      const userId = userResp.user.id;
      if (mounted) setUid(userId);

      // Has this user already accepted the current version?
      const { data, error } = await supabase
        .from("user_consents")
        .select("accepted_at")
        .eq("user_id", userId)
        .eq("type", DISCLAIMER_TYPE)
        .eq("version", DISCLAIMER_VERSION)
        .limit(1)
        .maybeSingle();

      if (mounted) {
        setShow(!data && !error); // show if no existing consent
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const accept = async () => {
    if (!uid || !checked) return;
    const { error } = await supabase.from("user_consents").insert({
      user_id: uid,
      type: DISCLAIMER_TYPE,
      version: DISCLAIMER_VERSION
    });
    if (!error) setShow(false);
    else alert(`Could not record acceptance: ${error.message}`);
  };

  if (loading) return null;

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-3">{copy.title}</h2>
            <p className="text-sm leading-6 text-gray-700 whitespace-pre-line">
              {copy.body}
            </p>

            <label className="flex items-start gap-2 mt-5 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
              />
              <span>I have read and understand the medical disclaimer.</span>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border px-3 py-2"
                onClick={() => (window.location.href = "/auth/signout")}
              >
                Sign out
              </button>
              <button
                className={`rounded-xl px-4 py-2 text-white ${checked ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
                disabled={!checked}
                onClick={accept}
              >
                I Agree
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Version: {DISCLAIMER_VERSION}
            </p>
          </div>
        </div>
      )}

      {/* Only render the app once consent is accepted (or was already accepted) */}
      {!show && children}
    </>
  );
}
