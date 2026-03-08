import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { AXIOS_INSTANCE } from "@/lib/axios";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { Card } from "@/components/retroui/Card";

export const Route = createFileRoute("/settings/instance")({
  component: InstanceSettingsComponent,
});

interface InstanceSettingsForm {
  instanceName: string;
  allowPublicSignup: boolean;
  smtpHost: string;
  smtpPort: number | string;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  googleOAuthClientId: string;
  googleOAuthClientSecret: string;
  googleOAuthCallbackUrl: string;
}

interface InviteForm {
  email: string;
  role: string;
  expiresInHours: number;
}

interface InviteData {
  id: string;
  token: string;
  email: string | null;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  createdBy: { id: string; email: string } | null;
  inviteUrl?: string;
}

function InstanceSettingsComponent() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const settingsForm = useForm<InstanceSettingsForm>();
  const inviteForm = useForm<InviteForm>({
    defaultValues: { role: "user", expiresInHours: 48 },
  });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;

    Promise.all([
      AXIOS_INSTANCE.get("/instance/settings"),
      AXIOS_INSTANCE.get("/invites"),
    ])
      .then(([settingsRes, invitesRes]) => {
        const s = settingsRes.data;
        settingsForm.reset({
          instanceName: s.instanceName || "",
          allowPublicSignup: s.allowPublicSignup || false,
          smtpHost: s.smtpHost || "",
          smtpPort: s.smtpPort || "",
          smtpUser: s.smtpUser || "",
          smtpPass: "",
          smtpSecure: s.smtpSecure || false,
          googleOAuthClientId: s.googleOAuthClientId || "",
          googleOAuthClientSecret: "",
          googleOAuthCallbackUrl: s.googleOAuthCallbackUrl || "",
        });
        setInvites(invitesRes.data.data || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load settings");
        setLoading(false);
      });
  }, [isAdmin, settingsForm]);

  const onSaveSettings = async (data: InstanceSettingsForm) => {
    setSaving(true);
    try {
      // Only send non-empty fields, skip masked password fields
      const payload: Record<string, unknown> = {};
      if (data.instanceName) payload.instanceName = data.instanceName;
      payload.allowPublicSignup = data.allowPublicSignup;
      if (data.smtpHost) payload.smtpHost = data.smtpHost;
      if (data.smtpPort) payload.smtpPort = Number(data.smtpPort);
      if (data.smtpUser) payload.smtpUser = data.smtpUser;
      if (data.smtpPass && data.smtpPass !== "••••••••")
        payload.smtpPass = data.smtpPass;
      payload.smtpSecure = data.smtpSecure;
      if (data.googleOAuthClientId)
        payload.googleOAuthClientId = data.googleOAuthClientId;
      if (
        data.googleOAuthClientSecret &&
        data.googleOAuthClientSecret !== "••••••••"
      )
        payload.googleOAuthClientSecret = data.googleOAuthClientSecret;
      if (data.googleOAuthCallbackUrl)
        payload.googleOAuthCallbackUrl = data.googleOAuthCallbackUrl;

      await AXIOS_INSTANCE.patch("/instance/settings", payload);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const onTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const res = await AXIOS_INSTANCE.post("/instance/settings/test-smtp", {});
      if (res.data.success) {
        toast.success("Test email sent successfully");
      } else {
        toast.error(res.data.error || "SMTP test failed");
      }
    } catch {
      toast.error("SMTP test failed");
    } finally {
      setTestingSmtp(false);
    }
  };

  const onCreateInvite = async (data: InviteForm) => {
    setCreatingInvite(true);
    try {
      const res = await AXIOS_INSTANCE.post("/invites", {
        email: data.email || undefined,
        role: data.role,
        expiresInHours: Number(data.expiresInHours),
      });
      setInvites((prev) => [res.data, ...prev]);
      inviteForm.reset({ role: "user", expiresInHours: 48, email: "" });
      toast.success("Invite created");

      if (res.data.inviteUrl) {
        await navigator.clipboard.writeText(res.data.inviteUrl);
        toast.success("Invite link copied to clipboard");
      }
    } catch {
      toast.error("Failed to create invite");
    } finally {
      setCreatingInvite(false);
    }
  };

  const revokeInvite = async (id: string) => {
    try {
      await AXIOS_INSTANCE.delete(`/invites/${id}`);
      setInvites((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status: "revoked" } : inv,
        ),
      );
      toast.success("Invite revoked");
    } catch {
      toast.error("Failed to revoke invite");
    }
  };

  const copyInviteLink = async (token: string, id: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">
          admin_panel_settings
        </span>
        <h2 className="text-xl font-bold text-gray-800">Admin Only</h2>
        <p className="text-gray-500 mt-2">
          Instance settings are only available to administrators.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16 animate-pulse font-bold">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* General Settings */}
      <form onSubmit={settingsForm.handleSubmit(onSaveSettings)}>
        <section>
          <h2 className="text-lg font-extrabold uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              settings
            </span>
            General
          </h2>
          <div className="grid gap-4 max-w-lg">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold uppercase tracking-wide">
                Instance Name
              </label>
              <Input
                placeholder="DocXtractor"
                {...settingsForm.register("instanceName")}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 border-2 border-black rounded accent-[#e5d161]"
                {...settingsForm.register("allowPublicSignup")}
              />
              <div>
                <span className="font-bold text-sm">
                  Allow Public Signup (Cloud Mode)
                </span>
                <p className="text-xs text-gray-500">
                  When enabled, anyone can create an account via signup page with
                  email verification.
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* SMTP */}
        <section className="mt-8">
          <h2 className="text-lg font-extrabold uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">mail</span>
            SMTP Configuration
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Required for email features (magic link signup, invites, password
            reset).
          </p>
          <div className="grid gap-4 max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase">Host</label>
                <Input
                  placeholder="smtp.example.com"
                  {...settingsForm.register("smtpHost")}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase">Port</label>
                <Input
                  placeholder="587"
                  type="number"
                  {...settingsForm.register("smtpPort")}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase">Username</label>
              <Input
                placeholder="user@example.com"
                {...settingsForm.register("smtpUser")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase">Password</label>
              <Input
                placeholder="••••••••"
                type="password"
                {...settingsForm.register("smtpPass")}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 border-2 border-black rounded accent-[#e5d161]"
                {...settingsForm.register("smtpSecure")}
              />
              <span className="font-bold text-sm">Use TLS/SSL</span>
            </label>
            <Button
              type="button"
              variant="outline"
              className="w-fit gap-2"
              onClick={onTestSmtp}
              disabled={testingSmtp}
            >
              <span className="material-symbols-outlined text-[18px]">
                send
              </span>
              {testingSmtp ? "Sending..." : "Send Test Email"}
            </Button>
          </div>
        </section>

        {/* Google OAuth */}
        <section className="mt-8">
          <h2 className="text-lg font-extrabold uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              passkey
            </span>
            Google OAuth (Optional)
          </h2>
          <div className="grid gap-4 max-w-lg">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase">Client ID</label>
              <Input
                placeholder="your-client-id.apps.googleusercontent.com"
                {...settingsForm.register("googleOAuthClientId")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase">
                Client Secret
              </label>
              <Input
                placeholder="••••••••"
                type="password"
                {...settingsForm.register("googleOAuthClientSecret")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase">
                Callback URL
              </label>
              <Input
                placeholder="http://localhost:3001/auth/google/callback"
                {...settingsForm.register("googleOAuthCallbackUrl")}
              />
            </div>
          </div>
        </section>

        <div className="mt-6">
          <Button
            type="submit"
            className="gap-2 px-8"
            disabled={saving}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>

      {/* Invite Users */}
      <section className="border-t-2 border-[#e6e3d1] pt-8">
        <h2 className="text-lg font-extrabold uppercase tracking-wide mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">
            group_add
          </span>
          Invite Users
        </h2>

        <form
          onSubmit={inviteForm.handleSubmit(onCreateInvite)}
          className="flex flex-wrap items-end gap-3 mb-6"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase">
              Email (Optional)
            </label>
            <Input
              placeholder="user@example.com"
              type="email"
              className="w-64"
              {...inviteForm.register("email")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase">Role</label>
            <select
              className="h-12 px-4 border-2 border-black font-bold text-sm bg-white"
              {...inviteForm.register("role")}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase">Expires (hrs)</label>
            <Input
              type="number"
              className="w-24"
              {...inviteForm.register("expiresInHours")}
            />
          </div>
          <Button
            type="submit"
            className="gap-2 h-12"
            disabled={creatingInvite}
          >
            <span className="material-symbols-outlined text-[18px]">
              person_add
            </span>
            {creatingInvite ? "Creating..." : "Create Invite"}
          </Button>
        </form>

        {/* Invites List */}
        {invites.length > 0 && (
          <div className="border-2 border-black overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f5f3e6] border-b-2 border-black">
                  <th className="text-left p-3 font-bold uppercase text-xs">
                    Email
                  </th>
                  <th className="text-left p-3 font-bold uppercase text-xs">
                    Role
                  </th>
                  <th className="text-left p-3 font-bold uppercase text-xs">
                    Status
                  </th>
                  <th className="text-left p-3 font-bold uppercase text-xs">
                    Expires
                  </th>
                  <th className="text-right p-3 font-bold uppercase text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr
                    key={invite.id}
                    className="border-b border-[#e6e3d1] last:border-b-0"
                  >
                    <td className="p-3 font-medium">
                      {invite.email || (
                        <span className="text-gray-400">Any email</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#f5f3e6] border border-[#e6e3d1] text-xs font-bold uppercase">
                        {invite.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase border ${
                          invite.status === "pending"
                            ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                            : invite.status === "accepted"
                              ? "bg-green-50 border-green-400 text-green-700"
                              : "bg-red-50 border-red-400 text-red-700"
                        }`}
                      >
                        {invite.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        {invite.status === "pending" && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                copyInviteLink(invite.token, invite.id)
                              }
                              title="Copy invite link"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {copiedId === invite.id
                                  ? "check"
                                  : "content_copy"}
                              </span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50"
                              onClick={() => revokeInvite(invite.id)}
                              title="Revoke invite"
                            >
                              <span className="material-symbols-outlined text-[16px] text-red-600">
                                close
                              </span>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {invites.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <span className="material-symbols-outlined text-4xl block mb-2">
              mail
            </span>
            <p className="font-medium">No invites yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
