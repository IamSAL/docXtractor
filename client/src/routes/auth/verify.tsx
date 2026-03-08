import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "../../components/retroui/Card";
import { Button } from "../../components/retroui/Button";
import { useAuthStore } from "@/lib/auth-store";
import { AXIOS_INSTANCE } from "@/lib/axios";

export const Route = createFileRoute("/auth/verify")({
  component: VerifyMagicLinkComponent,
});

function VerifyMagicLinkComponent() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found in the URL.");
      return;
    }

    AXIOS_INSTANCE.get(`/auth/verify-magic-link?token=${token}`)
      .then((res) => {
        const { user, accessToken, refreshToken } = res.data;

        useAuthStore.setState({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        setStatus("success");

        // Auto-redirect after brief success display
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 1500);
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(
          err?.response?.data?.message ||
            "Verification failed. The link may be expired or invalid.",
        );
      });
  }, [navigate]);

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
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-primary w-16 h-16 border-2 border-black rounded flex items-center justify-center shadow-hard animate-pulse">
              <span className="material-symbols-outlined text-4xl text-black">
                hourglass_empty
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-black uppercase">
              Verifying...
            </h1>
            <p className="text-gray-600 font-medium">
              Please wait while we verify your email.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-green-100 w-16 h-16 border-2 border-black rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-green-600">
                check_circle
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-black uppercase">
              Email Verified
            </h1>
            <p className="text-gray-600 font-medium">
              Redirecting you to the dashboard...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-red-100 w-16 h-16 border-2 border-black rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-red-600">
                error
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-black uppercase">
              Verification Failed
            </h1>
            <p className="text-gray-600 font-medium">{errorMessage}</p>
            <Button
              className="mt-4 gap-2"
              onClick={() => navigate({ to: "/login" })}
            >
              Go to Login
              <span className="material-symbols-outlined">arrow_forward</span>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
