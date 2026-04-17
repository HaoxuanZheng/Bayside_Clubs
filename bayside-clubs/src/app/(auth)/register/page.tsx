"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
}

export default function RegisterPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validateFields(): boolean {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!email.endsWith("@nycstudents.net")) {
      errors.email = "Email must end with @nycstudents.net";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!displayName.trim()) {
      errors.displayName = "Display name is required";
    } else if (displayName.trim().length < 2) {
      errors.displayName = "Display name must be at least 2 characters";
    } else if (displayName.trim().length > 50) {
      errors.displayName = "Display name must be at most 50 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);

    if (!validateFields()) {
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    if (signUpError) {
      setGeneralError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      setSuccessMessage("Check your school email to verify your account");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");
      setFieldErrors({});
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600">Join Bayside Clubs</p>
        </div>

        {successMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
            <p className="mt-2 text-sm text-green-700">
              If you don&apos;t see the email, check your spam folder.
            </p>
          </div>
        )}

        {generalError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{generalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                fieldErrors.displayName
                  ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500"
                  : "border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
              }`}
              placeholder="e.g., Sarah Johnson"
              disabled={loading}
            />
            {fieldErrors.displayName && (
              <p className="mt-1 text-sm font-medium text-red-600">{fieldErrors.displayName}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              School Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                fieldErrors.email
                  ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500"
                  : "border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
              }`}
              placeholder="you@nycstudents.net"
              disabled={loading}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm font-medium text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                fieldErrors.password
                  ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500"
                  : "border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
              }`}
              placeholder="At least 8 characters"
              disabled={loading}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm font-medium text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                fieldErrors.confirmPassword
                  ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500"
                  : "border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
              }`}
              placeholder="Re-enter your password"
              disabled={loading}
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm font-medium text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Creating account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
