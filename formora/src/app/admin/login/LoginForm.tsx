"use client";

import { useActionState } from "react";
import { login, type ActionState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, {});
  return (
    <form action={action} className="card mx-auto mt-10 max-w-sm space-y-5 p-8">
      <h1 className="text-2xl">Admin sign in</h1>
      {state.error && (
        <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="a-email" className="field-label">
          Email
        </label>
        <input id="a-email" name="email" type="email" autoComplete="username" required defaultValue={state.email} className="field" />
      </div>
      <div>
        <label htmlFor="a-password" className="field-label">
          Password
        </label>
        <input id="a-password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
