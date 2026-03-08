import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "../components/retroui/Button";
import { Input } from "../components/retroui/Input";
import { Card } from "../components/retroui/Card";
import { useAuthStore } from "@/lib/auth-store";
import { AXIOS_INSTANCE } from "@/lib/axios";

export const Route = createFileRoute("/setup")({
  component: SetupComponent,
});

interface SetupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  instanceName: string;
}

function SetupComponent() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetupFormData>({
    defaultValues: {
      instanceName: "DocXtractor",
    },
  });

  const password = watch("password");

  // Check if instance is already initialized
  useEffect(() => {
    AXIOS_INSTANCE.get("/instance/status")
      .then((res) => {
        if (res.data.isInitialized) {
          navigate({ to: "/login" });
        } else {
          setCheckingStatus(false);
        }
      })
      .catch(() => {
        setCheckingStatus(false);
      });
  }, [navigate]);

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await AXIOS_INSTANCE.post("/auth/admin-setup", {
        email: data.email,
        password: data.password,
        instanceName: data.instanceName || "DocXtractor",
      });

      const { user, accessToken, refreshToken } = response.data;

      useAuthStore.setState({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to create admin account. Please try again.",
      );
      setIsLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
        <div className="animate-pulse text-lg font-bold">Loading...</div>
      </div>
    );
  }

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
              rocket_launch
            </span>
          </div>
          <div className="text-center mt-2">
            <h1 className="text-2xl font-extrabold text-black tracking-tight leading-none uppercase">
              Welcome to DocXtractor
            </h1>
            <p className="text-black font-medium text-sm mt-2">
              Create your admin account to get started.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border-2 border-red-500 p-4 text-red-700 text-sm font-bold animate-shake">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              className="text-black text-sm font-bold uppercase tracking-wide"
              htmlFor="instanceName"
            >
              Instance Name
            </label>
            <Input
              id="instanceName"
              placeholder="DocXtractor"
              type="text"
              icon="badge"
              {...register("instanceName")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-black text-sm font-bold uppercase tracking-wide"
              htmlFor="email"
            >
              Admin Email
            </label>
            <Input
              id="email"
              placeholder="admin@example.com"
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
            <label
              className="text-black text-sm font-bold uppercase tracking-wide"
              htmlFor="password"
            >
              Password
            </label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              icon="lock"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
            />
            {errors.password && (
              <span className="text-red-600 text-xs font-bold">
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-black text-sm font-bold uppercase tracking-wide"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              placeholder="••••••••"
              type="password"
              icon="lock"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <span className="text-red-600 text-xs font-bold">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <Button
            className="mt-2 w-full h-14 text-lg justify-center gap-2"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Setting up..." : "Create Admin Account"}
            <span className="material-symbols-outlined font-bold">
              {isLoading ? "hourglass_empty" : "arrow_forward"}
            </span>
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 font-medium">
            This page is only available during initial setup.
          </p>
        </div>

        <div className="absolute -top-3 -left-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
        <div className="absolute -top-3 -right-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
        <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
      </Card>
    </div>
  );
}
