import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "../components/retroui/Button";
import { Input } from "../components/retroui/Input";
import { Card } from "../components/retroui/Card";
import { useAuth, useRedirectIfAuthenticated } from "../hooks/useAuth";
import { AXIOS_INSTANCE } from "@/lib/axios";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

interface LoginFormData {
  email: string;
  password: string;
}

interface InstanceStatus {
  isInitialized: boolean;
  allowPublicSignup: boolean;
  instanceName: string;
  googleOAuthEnabled: boolean;
}

function LoginComponent() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [showError, setShowError] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<InstanceStatus | null>(null);

  // Redirect if already authenticated
  useRedirectIfAuthenticated("/dashboard");

  // Check instance status
  useEffect(() => {
    AXIOS_INSTANCE.get("/instance/status")
      .then((res) => {
        const status = res.data as InstanceStatus;
        setInstanceStatus(status);
        if (!status.isInitialized) {
          navigate({ to: "/setup" });
        }
      })
      .catch(() => {
        // If instance endpoint doesn't exist, assume initialized
        setInstanceStatus({
          isInitialized: true,
          allowPublicSignup: false,
          instanceName: "DocXtractor",
          googleOAuthEnabled: false,
        });
      });
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        clearError();
        setShowError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      // Error is handled by the store
      console.error("Login error:", err);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3002`}/auth/google`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[#f0f0f0] w-full"
      style={{
        backgroundImage: "radial-gradient(#000000 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <Card
        shadowsize="lg"
        className="relative w-full max-w-md p-8 md:p-10 border-4 animate-fade-in"
      >
        <div className="flex flex-col items-center justify-center mb-8 gap-3">
          <div className="bg-primary w-16 h-16 border-2 border-black rounded flex items-center justify-center shadow-hard">
            <span className="material-symbols-outlined text-4xl text-black">
              description
            </span>
          </div>
          <div className="text-center mt-2">
            <h1 className="text-3xl font-extrabold text-black tracking-tight leading-none uppercase">
              {instanceStatus?.instanceName || "DocXTractor"}
            </h1>
            <p className="text-black font-medium text-sm mt-1">
              Extract data with confidence.
            </p>
          </div>
        </div>

        {showError && error && (
          <div className="mb-6 bg-red-100 border-2 border-red-500 p-4 text-red-700 text-sm font-bold animate-shake">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              className="text-black text-base font-bold uppercase tracking-wide"
              htmlFor="email"
            >
              Email Address
            </label>
            <Input
              id="email"
              placeholder="name@company.com"
              type="email"
              icon="mail"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <span className="text-red-600 text-xs font-bold">
                {errors.email.message}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <label
                className="text-black text-base font-bold uppercase tracking-wide"
                htmlFor="password"
              >
                Password
              </label>
              <span
                className="text-sm font-bold text-gray-400 cursor-not-allowed select-none"
                title="Password reset is not yet available"
              >
                Forgot password?
              </span>
            </div>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              icon="lock"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <span className="text-red-600 text-xs font-bold">
                {errors.password.message}
              </span>
            )}
          </div>
          <Button
            className="mt-2 w-full h-14 text-lg justify-center gap-2"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
            <span className="material-symbols-outlined font-bold">
              {isLoading ? "hourglass_empty" : "login"}
            </span>
          </Button>
        </form>
        {instanceStatus?.googleOAuthEnabled && (
          <div className="mt-8 flex flex-col gap-4">
            <div className="relative flex items-center">
              <div className="grow border-t-2 border-black"></div>
              <span className="shrink mx-4 text-xs font-bold uppercase tracking-widest text-black">
                Or sign in quickly
              </span>
              <div className="grow border-t-2 border-black"></div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                className="h-12 justify-center gap-2 bg-white"
                type="button"
                onClick={handleGoogleLogin}
              >
                <img
                  alt="Google"
                  className="w-5 h-5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDG90Z0AqtXTsKm_McnzdJ534I7h656CC9oy9GK-L8ZmZ8LkmZRDXDuni-Z29mx0GbXvC9pBPIYa9JcxHyhBT7vkzXss60ytmXn70RiwQFONlZ2pbVv1sR_iA5RAfqJTDq72dxwRd6Q3UDl7hwzWCZ-d5OY-h3MiqHgRKrohV5Z8nLrHF8pSR2I-SKHwmS0Dqe2nNqQglAEBgT4ybbGq_eWDYduq4useGThVgxApzxbhshN5zeCbFU9jdehEln6RYHmgpexMGGhBbhx"
                />
                Continue with Google
              </Button>
            </div>
          </div>
        )}
        <div className="mt-8 pt-6 border-t-2 border-black flex justify-center">
          {instanceStatus?.allowPublicSignup ? (
            <p className="text-black font-medium text-sm">
              Don't have an account?
              <Link
                to="/signup"
                replace
                className="font-bold underline decoration-2 decoration-primary underline-offset-4 hover:bg-primary hover:text-black transition-colors px-1 ml-1 no-underline"
              >
                Sign Up
              </Link>
            </p>
          ) : (
            <p className="text-gray-500 font-medium text-sm text-center">
              Need an account? Contact your administrator for an invite.
            </p>
          )}
        </div>
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
        <div className="absolute -top-3 -right-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
        <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
      </Card>
      <div
        className="fixed bottom-10 right-10 hidden xl:block animate-bounce"
        style={{ animationDuration: "3s" }}
      >
        <div className="bg-white border-2 border-black p-2 shadow-hard-sm -rotate-6">
          <span className="material-symbols-outlined text-4xl">folder_zip</span>
        </div>
      </div>

      <div className="fixed top-32 left-20 hidden xl:block opacity-60">
        <div className="bg-primary/20 border-2 border-black p-4 shadow-hard-sm rotate-12 w-32 h-32 flex items-center justify-center">
          <span className="font-mono text-xs text-center font-bold">
            RAW DATA
            <br />
            PROCESSING...
          </span>
        </div>
      </div>
    </div>
  );
}
