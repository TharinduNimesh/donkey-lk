"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { signOut } from "@/lib/supabase";
import { TaskCard } from "@/components/dashboard/task-card";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Json } from '@/types/database.types';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { BrandSyncLinkModal } from "@/components/dashboard/brandsync-link-modal";

const ITEMS_PER_PAGE = 6;

type TaskDetail = {
  task_id: number | null;
  title: string | null;
  description: string | null;
  status: Database['public']['Enums']['TaskStatus'] | null;
  created_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  cost: Json | null;
  source: string | null;
  total_influencers: number | null;
  total_promised_views: number | null;
  total_proof_views?: number | null;
  total_target_views: number | null;
  targets: Json | null;
};

const BlobSVG = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 200 200"
    className="absolute bottom-0 left-0 w-48 h-48 -mb-12 -ml-12 opacity-15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feComposite in="SourceGraphic" in2="coloredBlur" operator="over"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path
      fill={color}
      filter="url(#glow)"
      d="M52.8,-75.5C68.7,-67.4,81.9,-52.3,89.3,-34.4C96.7,-16.5,98.2,4.3,92.7,23.2C87.2,42.1,74.7,59,58.3,70.3C41.9,81.6,21,87.2,0.7,86.2C-19.5,85.2,-39,77.6,-56.1,66.1C-73.2,54.6,-87.9,39.2,-94.1,20.7C-100.4,2.2,-98.2,-19.4,-88.6,-36.3C-79,-53.2,-62,-65.4,-44.6,-72.7C-27.2,-80,-13.6,-82.4,2.9,-86.8C19.4,-91.2,38.8,-97.7,52.8,-75.5Z"
      transform="translate(100 100)"
    />
  </svg>
);

export default function BuyerDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskDetail[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskDetail[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showBrandSyncModal, setShowBrandSyncModal] = useState(false);
  const [brandSyncLinks, setBrandSyncLinks] = useState<Array<{ id: number; title: string; platform: string; brandSyncUrl: string; thumbnailUrl?: string | null; shares?: number; isPaid?: boolean; amount?: number;}>>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("created_at_desc");

  useEffect(() => {
    const fetchTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('task_details_view')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks(data || []);
      setIsLoading(false);
    };

    fetchTasks();
    // load user's BrandSync links (non-blocking)
    const loadLinks = async () => {
      setIsLoadingLinks(true);
      try {
        const res = await fetch('/api/brandsync-links', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setBrandSyncLinks(data.links ?? []);
      } catch (err) {
        console.error('Failed to load BrandSync links', err);
      } finally {
        setIsLoadingLinks(false);
      }
    };

    loadLinks();
  }, [supabase, router]);

  useEffect(() => {
    let filtered = [...tasks];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        task =>
          task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Apply platform filter
    if (platformFilter !== "ALL") {
      filtered = filtered.filter(task => {
        const targets = task.targets as Array<{ platform: Database['public']['Enums']['Platforms'] }> | null;
        return targets?.some(target => target.platform === platformFilter);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created_at_desc":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "created_at_asc":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "title_asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "");
        default:
          return 0;
      }
    });

    setFilteredTasks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [tasks, searchQuery, statusFilter, platformFilter, sortBy]);

  const handleLogout = async () => {
    setIsLoading(true);
    const { error } = await signOut();
    if (!error) {
      router.push('/auth');
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleCreateTask = () => {
    router.push('/dashboard/buyer/tasks/create');
  };

  // Calculate dashboard statistics
  const activeTasksCount = tasks.filter(t => t.status === 'ACTIVE').length;
  const totalBudget = tasks.reduce((sum, task) => {
    const cost = task.cost as { amount: number } | null;
    return sum + (cost?.amount || 0);
  }, 0);
  
  const platformCounts = tasks.reduce((counts, task) => {
    const targets = task.targets as Array<{ platform: Database['public']['Enums']['Platforms'] }> | null;
    targets?.forEach(target => {
      counts[target.platform] = (counts[target.platform] || 0) + 1;
    });
    return counts;
  }, {} as Record<string, number>);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const PaginationControls = () => (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0 rounded-md border border-gray-200 dark:border-gray-800"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => prev - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0 rounded-md border border-gray-200 dark:border-gray-800"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-sm font-medium px-4">
        Page {currentPage} of {totalPages}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => prev + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0 rounded-md border border-gray-200 dark:border-gray-800"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0 rounded-md border border-gray-200 dark:border-gray-800"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const handleUploadSlipForLink = async (e: React.ChangeEvent<HTMLInputElement>, linkId: number) => {
    try {
      const file = e.target?.files?.[0];
      if (!file) {
        toast.error('No file selected');
        return;
      }

      const fd = new FormData();
      fd.append('slip', file);


      setUploadProgress(prev => ({ ...prev, [linkId]: 0 }));

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/brandsync-links/${linkId}/bank-transfer`);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const percent = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgress(prev => ({ ...prev, [linkId]: percent }));
          }
        };

        xhr.onload = () => {
          try {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              const text = xhr.responseText || `Upload failed: ${xhr.status}`;
              let parsed: any = null;
              try { parsed = JSON.parse(text); } catch {}
              const msg = parsed?.error || parsed?.message || text;
              reject(new Error(String(msg)));
            }
          } catch (e) {
            reject(e instanceof Error ? e : new Error('Unknown upload error'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload network error'));

        xhr.send(fd);
      });

      toast.success('Slip uploaded — admin will verify');
      // refresh links
      const updated = await fetch('/api/brandsync-links', { credentials: 'include' });
      if (updated.ok) {
        const json = await updated.json();
        setBrandSyncLinks(json.links ?? []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload slip');
    } finally {
      setUploadProgress(prev => {
        const copy = { ...prev };
        delete copy[linkId];
        return copy;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-950">
        <div className="container mx-auto py-8 px-4">
          <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden border border-gray-100 dark:border-gray-800">
                <CardHeader>
                  <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-2" />
                  <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[420px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 font-['Roboto']">
      <div className="container mx-auto py-8 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center sm:text-left">
            Brand Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              onClick={handleCreateTask}
              className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white shadow-sm hover:shadow-md transition-all duration-300"
            >
              Create New Task
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowBrandSyncModal(true)}
              className="w-full sm:w-auto border-pink-200 text-pink-700 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-300 dark:hover:bg-pink-950/40"
            >
              Add BrandSync Link
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full sm:w-auto border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </motion.div>

        <BrandSyncLinkModal
          open={showBrandSyncModal}
          onOpenChange={setShowBrandSyncModal}
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12"
        >
          <Card className="border-0 bg-pink-50 dark:bg-pink-950/20 overflow-hidden relative">
            <BlobSVG color="#ec4899" />
            <CardHeader>
              <CardTitle className="text-pink-900 dark:text-pink-100">Active Tasks</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-4xl font-bold text-pink-700 dark:text-pink-300">
                {activeTasksCount}
              </p>
              <p className="text-sm text-pink-600/80 dark:text-pink-300/80 mt-1">
                {activeTasksCount === 1 ? '1 campaign running' : `${activeTasksCount} campaigns running`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-blue-50 dark:bg-blue-950/20 overflow-hidden relative">
            <BlobSVG color="#0ea5e9" />
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">Total Budget</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                Rs. {totalBudget.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600/80 dark:text-blue-300/80 mt-1">Across all campaigns</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-indigo-50 dark:bg-indigo-950/20 overflow-hidden relative">
            <BlobSVG color="#6366f1" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-indigo-900 dark:text-indigo-100">Platform Distribution</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPlatformModal(true)}
                className="text-sm text-indigo-600/80 hover:text-indigo-700 dark:text-indigo-300/80 dark:hover:text-indigo-200"
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(platformCounts)
                  .slice(0, 2)
                  .map(([platform, count]) => {
                    const percentage = (count / tasks.length) * 100;
                    return (
                      <div key={platform} className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2">
                          <CircularProgressbar
                            value={percentage}
                            text={`${count}`}
                            styles={buildStyles({
                              pathColor: platform === 'INSTAGRAM' ? '#E1306C' :
                                        platform === 'FACEBOOK' ? '#4267B2' :
                                        platform === 'TIKTOK' ? '#000000' : '#6366f1',
                              textColor: '#4338ca',
                              trailColor: '#e0e7ff',
                            })}
                          />
                        </div>
                        <p className="text-xs font-medium mt-1 text-indigo-700 dark:text-indigo-300">
                          {platform.charAt(0) + platform.slice(1).toLowerCase()}
                        </p>
                      </div>
                    );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Platform Distribution Modal */}
          <Dialog open={showPlatformModal} onOpenChange={setShowPlatformModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Platform Distribution</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-4">
                {Object.entries(platformCounts).map(([platform, count]) => {
                  const percentage = (count / tasks.length) * 100;
                  return (
                    <div key={platform} className="text-center">
                      <div className="w-20 h-20 mx-auto mb-3">
                        <CircularProgressbar
                          value={percentage}
                          text={`${count}`}
                          styles={buildStyles({
                            pathColor: platform === 'INSTAGRAM' ? '#E1306C' :
                                      platform === 'FACEBOOK' ? '#4267B2' :
                                      platform === 'TIKTOK' ? '#000000' : '#ec4899',
                            textColor: 'currentColor',
                            trailColor: '#E5E7EB',
                            pathTransitionDuration: 0.5,
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {platform.charAt(0) + platform.slice(1).toLowerCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}% of tasks
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

        </motion.div>

        {/* BrandSync Links Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">BrandSync Links</h2>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowBrandSyncModal(true)} className="bg-pink-600 hover:bg-pink-700 text-white">
                Create Link
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brandSyncLinks.length === 0 ? (
                <div className="col-span-full rounded-lg border border-dashed p-6 text-center">
                  <p className="text-lg font-medium">No BrandSync links yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Create a link to share your external video while hiding the original URL.</p>
                  <div className="mt-4">
                    <Button onClick={() => setShowBrandSyncModal(true)} className="bg-pink-600 hover:bg-pink-700 text-white">Create your first link</Button>
                  </div>
                </div>
              ) : (
                brandSyncLinks.map(link => (
                  <Card key={link.id} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate max-w-[60%]">{link.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{link.platform}</span>
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        {link.thumbnailUrl ? (
                          <img src={link.thumbnailUrl} alt={link.title} className="h-16 w-24 rounded-md object-cover" />
                        ) : (
                          <div className="h-16 w-24 rounded-md bg-muted" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{link.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">Shares: {link.shares ?? 0} • Amount: LKR {Number(link.amount ?? 0).toLocaleString()}</p>
                          {!link.isPaid && (
                            <p className="text-xs text-yellow-700 mt-1">Status: Awaiting payment</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        {link.isPaid ? (
                          <Button asChild variant="outline">
                            <a href={link.brandSyncUrl} target="_blank" rel="noreferrer">Open</a>
                          </Button>
                        ) : (
                          <>
                            <Button type="button" onClick={async () => {
                              // initialize PayHere for existing brandsync
                              try {
                                const resp = await fetch(`/api/payment/initialize/brandsync/${link.id}`, { method: 'POST' });
                                if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e?.error||'Failed to init payment'); }
                                const formData = await resp.json();
                                const paymentForm = document.createElement('form');
                                paymentForm.method = 'post';
                                paymentForm.action = formData.checkout_url;
                                paymentForm.target = '_blank';
                                Object.entries(formData).forEach(([key, value]) => {
                                  if (value !== undefined && value !== null) {
                                    const input = document.createElement('input');
                                    input.type = 'hidden';
                                    input.name = key;
                                    input.value = String(value);
                                    paymentForm.appendChild(input);
                                  }
                                });
                                document.body.appendChild(paymentForm);
                                paymentForm.submit();
                                setTimeout(()=>document.body.removeChild(paymentForm),100);
                              } catch (err) { console.error(err); toast.error('Failed to initialize payment'); }
                            }} className="bg-green-600 text-white">Pay</Button>
                            <label className="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer">
                                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e)=>handleUploadSlipForLink(e, link.id)} />
                                  Upload Slip
                                </label>
                                {uploadProgress[link.id] != null && (
                                  <div className="w-full mt-2">
                                    <div className="h-2 bg-gray-200 rounded overflow-hidden">
                                      <div className="h-2 bg-pink-600" style={{ width: `${uploadProgress[link.id]}%` }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Uploading: {uploadProgress[link.id]}%</p>
                                  </div>
                                )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Your Tasks</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchInput
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[200px]"
              />
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Platforms</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="FACEBOOK">Facebook</SelectItem>
                  <SelectItem value="TIKTOK">TikTok</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at_desc">Newest First</SelectItem>
                  <SelectItem value="created_at_asc">Oldest First</SelectItem>
                  <SelectItem value="title_asc">Title A-Z</SelectItem>
                  <SelectItem value="title_desc">Title Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentTasks.map((task, index) => (
              <motion.div
                key={task.task_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <TaskCard task={task} />
              </motion.div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  {tasks.length === 0 
                    ? "No tasks found. Create your first task to get started!"
                    : "No tasks match your search criteria."
                  }
                </p>
              </div>
            )}
          </div>

          {filteredTasks.length > ITEMS_PER_PAGE && (
            <PaginationControls />
          )}
        </motion.div>
      </div>
    </div>
  );
}