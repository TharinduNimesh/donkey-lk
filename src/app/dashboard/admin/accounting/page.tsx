"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const ITEMS_PER_PAGE = 10;

type SortField = 'date' | 'amount';
type SortOrder = 'asc' | 'desc';

type Transaction = {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  paymentMethod?: Database['public']['Enums']['PaymentMethod'];
  taskId?: number;
  taskTitle?: string;
  buyerName?: string;
  userName?: string; // For withdrawal requests
  paidAt: string;
  description?: string; // For withdrawal requests
  isBrandSync?: boolean;
};

export default function AdminAccountingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profile')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile?.role.includes('ADMIN')) {
        router.push('/dashboard');
        return;
      }
    };

    checkAdminAccess();
  }, [supabase, router]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);

      // Calculate monthly and total income/expenses
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      // Fetch BrandSync links
      let bsLinks: any[] = [];
      try {
        const bsResp = await fetch('/api/admin/brandsync-links');
        if (bsResp.ok) {
          const bsData = await bsResp.json();
          bsLinks = bsData.links || [];
        }
      } catch (err) {
        console.error('Error fetching BrandSync links:', err);
      }

      // Calculate income
      const { data: monthlyIncomeData, error: monthlyIncomeError } = await supabase
        .from('task_cost')
        .select('amount')
        .eq('is_paid', true)
        .gte('paid_at', firstDayOfMonth.toISOString());

      if (!monthlyIncomeError) {
        const taskMonthlyTotal = monthlyIncomeData ? monthlyIncomeData.reduce((sum, item) => sum + item.amount, 0) : 0;
        const bsMonthlyTotal = bsLinks
          .filter((link: any) => link.paidAt && new Date(link.paidAt) >= firstDayOfMonth)
          .reduce((sum: number, link: any) => sum + link.amount, 0);
        setMonthlyIncome(taskMonthlyTotal + bsMonthlyTotal);
      }

      const { data: totalIncomeData, error: totalIncomeError } = await supabase
        .from('task_cost')
        .select('amount')
        .eq('is_paid', true);

      if (!totalIncomeError) {
        const taskTotal = totalIncomeData ? totalIncomeData.reduce((sum, item) => sum + item.amount, 0) : 0;
        const bsTotal = bsLinks.reduce((sum: number, link: any) => sum + link.amount, 0);
        setTotalIncome(taskTotal + bsTotal);
      }

      // Calculate expenses (from withdrawal requests)
      const { data: monthlyExpenseData, error: monthlyExpenseError } = await supabase
        .from('withdrawal_request_status')
        .select(`
          id,
          reviewed_at,
          withdrawal_request:withdrawal_requests!inner(
            amount
          )
        `)
        .eq('status', 'ACCEPTED')
        .gte('reviewed_at', firstDayOfMonth.toISOString());

      if (!monthlyExpenseError && monthlyExpenseData) {
        const monthlyExpenseTotal = monthlyExpenseData.reduce(
          (sum, item) => sum + item.withdrawal_request.amount, 0
        );
        setMonthlyExpenses(monthlyExpenseTotal);
      }

      const { data: totalExpenseData, error: totalExpenseError } = await supabase
        .from('withdrawal_request_status')
        .select(`
          id,
          withdrawal_request:withdrawal_requests!inner(
            amount
          )
        `)
        .eq('status', 'ACCEPTED');

      if (!totalExpenseError && totalExpenseData) {
        const totalExpenseAmount = totalExpenseData.reduce(
          (sum, item) => sum + item.withdrawal_request.amount, 0
        );
        setTotalExpenses(totalExpenseAmount);
      }

      // Fetch all transactions (both income and expenses)
      // First, get income transactions
      let incomeQuery = supabase
        .from('task_cost')
        .select(`
          *,
          task:tasks!inner(
            id,
            title,
            user:profile(
              name
            )
          )
        `)
        .eq('is_paid', true);

      if (searchQuery) {
        incomeQuery = incomeQuery.or(`task.title.ilike.%${searchQuery}%,task.user.name.ilike.%${searchQuery}%`);
      }

      const { data: incomeData, error: incomeError } = await incomeQuery;

      if (incomeError) throw incomeError;

      // Then, get expense transactions (withdrawal requests)
      let expenseQuery = supabase
        .from('withdrawal_request_status')
        .select(`
          id,
          reviewed_at,
          withdrawal_request:withdrawal_requests!inner(
            id,
            amount,
            user_id,
            user:profile(
              name
            ),
            withdrawal_option:withdrawal_options(
              account_number,
              bank_name
            )
          )
        `)
        .eq('status', 'ACCEPTED');

      if (searchQuery) {
        expenseQuery = expenseQuery.or(`withdrawal_request.user.name.ilike.%${searchQuery}%`);
      }

      const { data: expenseData, error: expenseError } = await expenseQuery;

      if (expenseError) throw expenseError;

      // Combine and format both types of transactions
      const formattedIncomeTransactions: Transaction[] = incomeData ? incomeData.map(item => ({
        id: item.id,
        amount: item.amount,
        type: 'income',
        paymentMethod: item.payment_method,
        taskId: item.task.id,
        taskTitle: item.task.title,
        buyerName: item.task.user.name,
        paidAt: item.paid_at!
      })) : [];

      const formattedExpenseTransactions: Transaction[] = expenseData ? expenseData.map(item => ({
        id: item.id,
        amount: item.withdrawal_request.amount,
        type: 'expense',
        userName: item.withdrawal_request.user.name,
        paidAt: item.reviewed_at!,
        description: `Withdrawal to ${item.withdrawal_request.withdrawal_option.bank_name} - ${item.withdrawal_request.withdrawal_option.account_number}`
      })) : [];

      // Filter and format BrandSync link transactions
      let filteredBsLinks = bsLinks;
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        filteredBsLinks = bsLinks.filter((link: any) => 
          (link.title && link.title.toLowerCase().includes(queryLower)) ||
          (link.buyer?.name && link.buyer.name.toLowerCase().includes(queryLower))
        );
      }

      const formattedBsTransactions: Transaction[] = filteredBsLinks.map((link: any) => ({
        id: link.id,
        amount: link.amount,
        type: 'income',
        paymentMethod: link.paymentMethod,
        taskId: link.id,
        taskTitle: link.title || 'BrandSync Link',
        buyerName: link.buyer?.name || 'Unknown Buyer',
        paidAt: link.paidAt,
        isBrandSync: true
      }));

      // Combine both transaction types
      const allTransactions = [...formattedIncomeTransactions, ...formattedExpenseTransactions, ...formattedBsTransactions];
      
      // Sort combined transactions
      const sortedTransactions = allTransactions.sort((a, b) => {
        if (sortField === 'date') {
          return sortOrder === 'asc' 
            ? new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime()
            : new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime();
        } else { // amount
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        }
      });

      // Apply pagination
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const paginatedTransactions = sortedTransactions.slice(start, end);

      setTransactions(paginatedTransactions);
      setTotalTransactions(allTransactions.length);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, sortField, sortOrder, searchQuery]);

  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);

  const PaginationControls = () => (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-sm">
        Page {currentPage} of {totalPages}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage === totalPages}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Accounting</h1>
        <p className="text-xs text-gray-500">Monitor platform revenues, expenses, and transaction logs.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Income */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Monthly Income</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {monthlyIncome.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">
            Income for {format(new Date(), 'MMMM yyyy')}
          </p>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-[0.03] bg-emerald-500" />
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500" />
          <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-red-50">
            <TrendingUp className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Monthly Expenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {monthlyExpenses.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">
            Expenses for {format(new Date(), 'MMMM yyyy')}
          </p>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-[0.03] bg-red-500" />
        </div>

        {/* Total Income */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Income</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {totalIncome.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">All-time platform earnings</p>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-[0.03] bg-emerald-500" />
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500" />
          <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-red-50">
            <TrendingUp className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">All-time platform expenses</p>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-[0.03] bg-red-500" />
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Financial Transactions</h2>
            <p className="text-xs text-gray-400">Search and sort transaction records across the platform.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              placeholder="Search by title or buyer..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[240px] bg-white border-gray-200"
              type="text"
            />

            <Select
              value={`${sortField}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split('-') as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] bg-white border-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Latest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-gray-400 py-10 text-sm">
              No transactions found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Date</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Type</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Details</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs">Payment Info</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-gray-600 text-xs text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={`${transaction.type}-${transaction.id}`} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                      <TableCell className="py-3.5 px-4 text-xs text-gray-500">
                        {format(new Date(transaction.paidAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border-0 ${
                          transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        {transaction.type === 'income' ? (
                          transaction.isBrandSync ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                                {transaction.taskTitle}
                                <span className="px-1.5 py-0.25 text-[9px] font-semibold bg-purple-50 text-purple-700 rounded-md border border-purple-100 shrink-0">
                                  BrandSync Link
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-400 font-medium">Link ID: {transaction.taskId} • Buyer: {transaction.buyerName}</div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                                {transaction.taskTitle}
                                <span className="px-1.5 py-0.25 text-[9px] font-semibold bg-pink-50 text-pink-700 rounded-md border border-pink-100 shrink-0">
                                  BrandSync Task
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-400 font-medium">Task ID: {transaction.taskId} • Buyer: {transaction.buyerName}</div>
                            </div>
                          )
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-sm text-gray-800">Withdrawal</div>
                            <div className="text-[10px] text-gray-400 font-medium">Influencer: {transaction.userName}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-gray-600">
                        {transaction.type === 'income' ? (
                          transaction.paymentMethod === 'PAYMENT_GATEWAY' ? 'Online Payment' : 'Bank Transfer'
                        ) : (
                          <span className="font-mono text-[11px] text-gray-500">{transaction.description}</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className={`flex items-center justify-end gap-1.5 font-semibold text-sm ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          <span>Rs. {transaction.amount.toLocaleString()}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-4 border-t border-gray-100">
                <PaginationControls />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}