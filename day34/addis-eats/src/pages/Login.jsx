import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

function Login() {
  const { user, signIn } = useAuth();
  const [phone, setPhone] = useState("09");
  const navigate = useNavigate();
  const location = useLocation();

  // RequireAuth redirected here with state={{ from: location }}. That is how
  // the person gets sent back to /checkout rather than dumped on the menu.
  const from = location.state?.from?.pathname ?? "/menu";

  function handleSubmit(event) {
    event.preventDefault();
    signIn(phone);
    // replace: true — the login screen should not be sitting in the history
    // behind the page they just reached.
    navigate(from, { replace: true });
  }

  if (user) {
    return (
      <main className="prose">
        <h2>Already signed in</h2>
        <p>You are {user.name}.</p>
      </main>
    );
  }

  return (
    <main className="prose">
      <h2>Sign in</h2>
      <p>Any 09… number will do — there is no server behind this.</p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form__label" htmlFor="phone">
          Phone number
        </label>
        <input
          id="phone"
          value={phone}
          inputMode="tel"
          pattern="09[0-9]{8}"
          title="Ten digits starting 09"
          required
          onChange={(event) => setPhone(event.target.value)}
        />

        <button type="submit" className="cta">
          Continue to {from}
        </button>
      </form>
    </main>
  );
}

export default Login;
