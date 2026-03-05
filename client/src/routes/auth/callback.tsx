import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/auth/callback")({
	component: AuthCallbackComponent,
});

function AuthCallbackComponent() {
	const navigate = useNavigate();
	const processed = useRef(false);

	useEffect(() => {
		if (processed.current) return;
		processed.current = true;

		const params = new URLSearchParams(window.location.search);
		const accessToken = params.get("accessToken");
		const refreshToken = params.get("refreshToken");

		if (accessToken && refreshToken) {
			// Store tokens from OAuth redirect
			useAuthStore.setState({
				accessToken,
				refreshToken,
				isAuthenticated: true,
				error: null,
			});
			navigate({ to: "/dashboard", replace: true });
		} else {
			// Missing tokens — redirect to login
			navigate({ to: "/login", replace: true });
		}
	}, [navigate]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-[#f0f0f0] w-screen!">
			<div className="text-center">
				<div className="animate-spin rounded-full h-16 w-16 border-4 border-black border-t-primary mx-auto"></div>
				<p className="mt-4 text-black font-bold">Signing you in...</p>
			</div>
		</div>
	);
}
