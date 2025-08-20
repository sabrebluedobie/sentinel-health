import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.jsx";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Welcome{user?.email ? `, ${user.email}` : ""}
        </h1>
        <button className="btn-ghost" onClick={onSignOut}>Sign out</button>
      </div>
      {/* ... */}
    </div>
  );
}
