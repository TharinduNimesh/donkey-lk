"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      // Calculate income
      const { data: monthlyIncomeData, error: monthlyIncomeError } = await supabase
        .from('task_cost')
        .select('amount')
        .eq('is_paid', true)
        .gte('paid_at', firstDayOfMonth.toISOString());

      if (!monthlyIncomeError) {
        const monthlyTotal = monthlyIncomeData.reduce((sum, item) => sum + item.amount, 0);
        setMonthlyIncome(monthlyTotal);
      }

      const { data: totalIncomeData, error: totalIncomeError } = await supabase
        .from('task_cost')
        .select('amount')
        .eq('is_paid', true);

      if (!totalIncomeError) {
        const total = totalIncomeData.reduce((sum, item) => sum + item.amount, 0);
        setTotalIncome(total);
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

      // Combine both transaction types
      const allTransactions = [...formattedIncomeTransactions, ...formattedExpenseTransactions];
      
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Accounting</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-3xl font-bold">Rs. {monthlyIncome.toLocaleString()}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Income for {format(new Date(), 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <p className="text-3xl font-bold">Rs. {monthlyExpenses.toLocaleString()}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Expenses for {format(new Date(), 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-3xl font-bold">Rs. {totalIncome.toLocaleString()}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All-time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <p className="text-3xl font-bold">Rs. {totalExpenses.toLocaleString()}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All-time expenses
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <SearchInput
              placeholder="Search by task title or buyer name"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm"
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
              <SelectTrigger className="w-[180px]">
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

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Details</th>
                    <th className="text-left py-3 px-4">Payment Info</th>
                    <th className="text-left py-3 px-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={`${transaction.type}-${transaction.id}`} className="border-b">
                      <td className="py-3 px-4">
                        {format(new Date(transaction.paidAt), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {transaction.type === 'income' ? (
                          <>
                            <div className="font-medium">{transaction.taskTitle}</div>
                            <div className="text-sm text-muted-foreground">ID: {transaction.taskId}</div>
                            <div className="text-sm text-muted-foreground">Buyer: {transaction.buyerName}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">Withdrawal</div>
                            <div className="text-sm text-muted-foreground">User: {transaction.userName}</div>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {transaction.type === 'income' ? (
                          transaction.paymentMethod === 'PAYMENT_GATEWAY' ? 'Online Payment' : 'Bank Transfer'
                        ) : (
                          <div className="text-sm">{transaction.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-2 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          <TrendingUp className="h-4 w-4" />
                          <span>Rs. {transaction.amount.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginationControls />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}