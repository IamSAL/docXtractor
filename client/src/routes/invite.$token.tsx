import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "../components/retroui/Button";
import { Input } from "../components/retroui/Input";
import { Card } from "../components/retroui/Card";
import { useAuthStore } from "@/lib/auth-store";
import { AXIOS_INSTANCE } from "@/lib/axios";

export const Route = createFileRoute("/invite/$token")({
  component: InviteAcceptComponent,
});

interface AcceptFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface InviteInfo {
  valid: boolean;
  email: string | null;
  role: string;
  expiresAt: string;
}

function InviteAcceptComponent() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [validating, setValidating] = useState(true);
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AcceptFormData>();

  const password = watch("password");

  useEffect(() => {
    AXIOS_INSTANCE.get(`/invites/${token}/validate`)
      .then((res) => {
        setInviteInfo(res.data);
        if (res.data.email) {
          setValue("email", res.data.email);
        }
        setValidating(false);
      })
      .catch((err) => {
        setInvalidMessage(
          err?.response?.data?.message || "This invite link is invalid or has expired.",
        );
        setValidating(false);
      });
  }, [token, setValue]);

  const onSubmit = async (data: AcceptFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await AXIOS_INSTANCE.post(`/invites/${token}/accept`, {
        email: data.email,
        password: data.password,
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
        err?.response?.data?.message || "Failed to accept invite. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
        <div className="animate-pulse text-lg font-bold">Validating invite...</div>
      </div>
    );
  }

  if (invalidMessage) {
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
          className="relative w-full max-w-md p-8 md:p-10 border-4 text-center"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="bg-red-100 w-16 h-16 border-2 border-black rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-red-600">
                link_off
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-black uppercase">
              Invalid Invite
            </h1>
            <p className="text-gray-600 font-medium">{invalidMessage}</p>
            <Button
              className="mt-4 gap-2"
              onClick={() => navigate({ to: "/login" })}
            >
              Go to Login
              <span className="material-symbols-outlined">arrow_forward</span>
            </Button>
          </div>
        </Card>
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
              person_add
            </span>
          </div>
          <div className="text-center mt-2">
            <h1 className="text-2xl font-extrabold text-black tracking-tight leading-none uppercase">
              Accept Invite
            </h1>
            <p className="text-black font-medium text-sm mt-2">
              Create your account to join the team.
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
              htmlFor="email"
            >
              Email Address
            </label>
            <Input
              id="email"
              placeholder="you@example.com"
              type="email"
              icon="mail"
              disabled={!!inviteInfo?.email}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {inviteInfo?.email && (
              <span className="text-xs text-gray-500 font-medium">
                This invite is restricted to this email address.
              </span>
            )}
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
            {isLoading ? "Creating Account..." : "Create Account"}
            <span className="material-symbols-outlined font-bold">
              {isLoading ? "hourglass_empty" : "how_to_reg"}
            </span>
          </Button>
        </form>

        <div className="absolute -top-3 -left-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
        <div className="absolute -top-3 -right-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
        <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-black rounded-full border-2 border-white z-10"></div>
      </Card>
    </div>
  );
}
