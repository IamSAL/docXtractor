import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AXIOS_INSTANCE } from "@/lib/axios";
import { toast } from "sonner";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/settings/backups")({
  component: BackupsSettingsPage,
});

interface BackupItem {
  filename: string;
  createdAt: string;
  sizeBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BackupsSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = async () => {
    try {
      const res = await AXIOS_INSTANCE.get<BackupItem[]>("/admin/backup/list");
      setBackups(res.data);
    } catch {
      toast.error("Failed to load backups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchBackups();
  }, [isAdmin]);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await AXIOS_INSTANCE.get("/admin/backup/export", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup created and downloaded");
      await fetchBackups();
    } catch {
      toast.error("Failed to create backup");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const res = await AXIOS_INSTANCE.get(
        `/admin/backup/download/${encodeURIComponent(filename)}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download backup");
    }
  };

  const handleDelete = async (filename: string) => {
    setDeletingFilename(filename);
    try {
      await AXIOS_INSTANCE.delete(
        `/admin/backup/${encodeURIComponent(filename)}`,
      );
      toast.success(`Deleted ${filename}`);
      setBackups((prev) => prev.filter((b) => b.filename !== filename));
    } catch {
      toast.error("Failed to delete backup");
    } finally {
      setDeletingFilename(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    try {
      const res = await AXIOS_INSTANCE.post<{
        extractors: { imported: number; updated: number; skipped: number };
        runs: { imported: number; updated: number; skipped: number };
        errors: string[];
      }>("/admin/backup/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { extractors, runs, errors } = res.data;
      toast.success(
        `Import complete — Extractors: ${extractors.imported} new, ${extractors.updated} updated, ${extractors.skipped} skipped. Runs: ${runs.imported} new, ${runs.updated} updated, ${runs.skipped} skipped.`,
      );
      if (errors.length > 0) {
        toast.warning(`${errors.length} record(s) had errors. Check server logs.`);
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isAdmin) {
    return (
      <p className="text-[#948a51] font-mono text-sm">
        Admin access required.
      </p>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={handleCreateBackup}
          disabled={creatingBackup}
          className="flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            backup
          </span>
          {creatingBackup ? "Creating..." : "Create Backup"}
        </Button>

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            upload_file
          </span>
          {importing ? "Importing..." : "Import Backup"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b-2 border-black bg-[#f5f2e8]">
          <h3 className="font-bold text-sm uppercase tracking-wide">
            Stored Backups
          </h3>
        </div>

        {loading ? (
          <p className="p-4 text-sm text-[#948a51] font-mono">Loading...</p>
        ) : backups.length === 0 ? (
          <p className="p-4 text-sm text-[#948a51] font-mono">
            No backups yet. Click "Create Backup" to create one.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black bg-[#f5f2e8]">
                <th className="px-4 py-2 text-left font-bold uppercase tracking-wide text-xs">
                  Filename
                </th>
                <th className="px-4 py-2 text-left font-bold uppercase tracking-wide text-xs">
                  Date
                </th>
                <th className="px-4 py-2 text-left font-bold uppercase tracking-wide text-xs">
                  Size
                </th>
                <th className="px-4 py-2 text-right font-bold uppercase tracking-wide text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b, i) => (
                <tr
                  key={b.filename}
                  className={
                    i % 2 === 0 ? "bg-white" : "bg-[#fafaf5]"
                  }
                >
                  <td className="px-4 py-2 font-mono">{b.filename}</td>
                  <td className="px-4 py-2 text-[#948a51]">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-[#948a51]">
                    {formatBytes(b.sizeBytes)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(b.filename)}
                        className="text-[#948a51] hover:text-[#1a190e] transition-colors"
                        title="Download"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          download
                        </span>
                      </button>
                      <button
                        onClick={() => handleDelete(b.filename)}
                        disabled={deletingFilename === b.filename}
                        className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
