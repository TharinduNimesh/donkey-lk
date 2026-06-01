"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import {
  Link2,
  Plus,
  Search,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpDown,
  X,
} from "lucide-react";
import { BuyerSidebar, BuyerTopbar } from "@/components/dashboard/buyer-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PINK = "#C8185A";

type BrandSyncLink = {
  id: number;
  title: string;
  platform: string;
  brandSyncUrl: string;
  platformUrl?: string | null;
  thumbnailUrl?: string | null;
  shares?: number;
  isPaid?: boolean;
  amount?: number;
  clicks?: number;
};

type FilterStatus = "ALL" | "PAID" | "PENDING";

export default function AllLinksPage() {
  const router = useRouter();
  const [links, setLinks] = useState<BrandSyncLink[]>([]);
  const [filtered, setFiltered] = useState<BrandSyncLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const supabase = createClientComponentClient<Database>();

  const loadLinks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/brandsync-links", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setLinks(data.links ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      loadLinks();
    };
    check();
  }, []);

  useEffect(() => {
    let f = [...links];
    if (search) f = f.filter(l => l.title?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter === "PAID") f = f.filter(l => l.isPaid);
    if (statusFilter === "PENDING") f = f.filter(l => !l.isPaid);
    setFiltered(f);
  }, [links, search, statusFilter]);

  const handleUploadSlip = async (e: React.ChangeEvent<HTMLInputElement>, linkId: number) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("slip", file);
    setUploadProgress(p => ({ ...p, [linkId]: 0 }));
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/brandsync-links/${linkId}/bank-transfer`);
        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) setUploadProgress(p => ({ ...p, [linkId]: Math.round((ev.loaded / ev.total) * 100) }));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject();
        xhr.onerror = reject;
        xhr.send(fd);
      });
      toast.success("Slip uploaded — admin will verify");
      loadLinks();
    } catch {
      toast.error("Failed to upload slip");
    } finally {
      setUploadProgress(p => { const c = { ...p }; delete c[linkId]; return c; });
    }
  };

  const handlePay = async (link: BrandSyncLink) => {
    try {
      const resp = await fetch(`/api/payment/initialize/brandsync/${link.id}`, { method: "POST" });
      if (!resp.ok) { toast.error("Failed to initialize payment"); return; }
      const formData = await resp.json();
      const paymentForm = document.createElement("form");
      paymentForm.method = "post";
      paymentForm.action = formData.checkout_url;
      paymentForm.target = "_blank";
      Object.entries(formData).forEach(([key, value]) => {
        if (value != null) {
          const input = document.createElement("input");
          input.type = "hidden"; input.name = key; input.value = String(value);
          paymentForm.appendChild(input);
        }
      });
      document.body.appendChild(paymentForm);
      paymentForm.submit();
      setTimeout(() => document.body.removeChild(paymentForm), 100);
    } catch {
      toast.error("Failed to start payment");
    }
  };

  const paidCount = links.filter(l => l.isPaid).length;
  const pendingCount = links.filter(l => !l.isPaid).length;

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans overflow-hidden">
      <BuyerSidebar activePage="links" linksCount={links.length} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <BuyerTopbar
          title="All Links"
          actions={
            <Button
              onClick={() => router.push("/dashboard/buyer/brandsync")}
              className="h-9 px-4 text-sm font-semibold text-white rounded-lg shadow-sm"
              style={{ background: PINK }}
            >
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Link</span>
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">

          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">All BrandSync Links</h1>
              <p className="text-sm text-gray-400 mt-0.5">Manage and monitor all your influencer tracking links.</p>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Total", count: links.length, color: "#6b7280", bg: "#f3f4f6" },
              { label: "Active", count: paidCount, color: "#16a34a", bg: "#f0fdf4" },
              { label: "Pending", count: pendingCount, color: "#c8185a", bg: "#fff0f6" },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 bg-white">
                <span className="text-xl font-bold" style={{ color }}>{count}</span>
                <span className="text-sm text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search links..."
                className="pl-9 h-9 bg-white border-gray-200 rounded-lg text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {(["ALL", "PAID", "PENDING"] as FilterStatus[]).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusFilter === f
                      ? "text-white border-transparent shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  style={statusFilter === f ? { background: PINK } : {}}
                >
                  {f === "ALL" ? "All" : f === "PAID" ? "Active" : "Pending"}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-dashed border-gray-200">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#fff0f6" }}>
                <Link2 className="h-6 w-6" style={{ color: PINK }} />
              </div>
              <p className="text-base font-semibold text-gray-700">
                {search || statusFilter !== "ALL" ? "No links match your filters" : "No BrandSync links yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                {search || statusFilter !== "ALL"
                  ? "Try clearing your search or changing the filter."
                  : "Create a link to share your video while hiding the original URL from influencers."}
              </p>
              {!search && statusFilter === "ALL" && (
                <button
                  onClick={() => router.push("/dashboard/buyer/brandsync")}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm"
                  style={{ background: PINK }}
                >
                  <Plus className="h-4 w-4" /> Create first link
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(link => (
                <div
                  key={link.id}
                  className="bg-white rounded-xl border border-gray-100 hover:border-pink-100 hover:shadow-sm transition-all overflow-hidden"
                >
                  {/* Card top: status stripe */}
                  <div
                    className="h-1 w-full"
                    style={{ background: link.isPaid ? "#16a34a" : PINK }}
                  />

                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        {link.thumbnailUrl ? (
                          <img src={link.thumbnailUrl} alt={link.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#fff0f6" }}>
                            <Link2 className="h-4 w-4" style={{ color: PINK }} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">{link.title}</p>
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5"
                            style={link.isPaid
                              ? { background: "#f0fdf4", color: "#16a34a" }
                              : { background: "#fff0f6", color: PINK }
                            }
                          >
                            {link.isPaid ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                            {link.isPaid ? "Active" : "Awaiting payment"}
                          </span>
                        </div>
                      </div>
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                        {openMenuId === link.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-lg shadow-lg z-10 py-1 w-28">
                            <button
                              onClick={() => { setOpenMenuId(null); router.push("/dashboard/buyer/brandsync"); }}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400">Progress (Clicks)</span>
                        <span className="font-semibold text-gray-700">{link.clicks ?? 0} / {link.shares ?? 100}</span>
                      </div>
                      <div className="w-px h-6 bg-gray-200" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400">Amount</span>
                        <span className="font-semibold text-gray-700">LKR {Number(link.amount ?? 0).toLocaleString()}</span>
                      </div>
                      {link.platformUrl && (
                        <>
                          <div className="w-px h-6 bg-gray-200" />
                          <a
                            href={link.platformUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-600 min-w-0 truncate"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[80px]">Watch</span>
                          </a>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    {!link.isPaid ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePay(link)}
                          className="flex-1 py-1.5 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
                          style={{ background: "#16a34a" }}
                        >
                          Pay Now
                        </button>
                        <label className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold text-center cursor-pointer hover:bg-gray-50 transition-colors">
                          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handleUploadSlip(e, link.id)} />
                          Upload Slip
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active — influencers receiving unique links
                      </div>
                    )}

                    {/* Upload progress */}
                    {uploadProgress[link.id] != null && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress[link.id]}%`, background: PINK }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Uploading {uploadProgress[link.id]}%</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <footer className="flex items-center justify-between text-xs text-gray-400 pt-2 pb-4">
            <span>© {new Date().getFullYear()} BrandSync Platform. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <button className="hover:text-gray-600">Terms</button>
              <button className="hover:text-gray-600">Privacy</button>
              <button className="hover:text-gray-600">Support</button>
            </div>
          </footer>
        </main>
      </div>

      {/* Close dropdown on outside click */}
      {openMenuId !== null && (
        <div className="fixed inset-0 z-[5]" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  );
}
