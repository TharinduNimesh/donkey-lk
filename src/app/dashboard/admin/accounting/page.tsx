"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  paymentMethod: Database['public']['Enums']['PaymentMethod'];
  taskId: number;
  taskTitle: string;
  buyerName: string;
  paidAt: string;
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

      // Calculate monthly and total income
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      const { data: monthlyData, error: monthlyError } = await supabase
        .from('task_cost')
        .select('amount')
        .eq('is_paid', true)
        .gte('paid_at', firstDayOfMonth.toISOString());

      if (!monthlyError) {
        const monthlyTotal = monthlyData.reduce((sum, item) => sum + item.amount, 0);
        setMonthlyIncome(monthlyTotal);
      }

      const { data: totalData, error: totalError } = await supabase
        .from('task_cost')
        .select('amount')
        .eq('is_paid', true);

      if (!totalError) {
        const total = totalData.reduce((sum, item) => sum + item.amount, 0);
        setTotalIncome(total);
      }

      // Fetch paginated transactions
      let query = supabase
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
        `, { count: 'exact' })
        .eq('is_paid', true)
        .order(sortField === 'date' ? 'paid_at' : 'amount', { ascending: sortOrder === 'asc' });

      if (searchQuery) {
        query = query.or(`task.title.ilike.%${searchQuery}%,task.user.name.ilike.%${searchQuery}%`);
      }

      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query.range(start, end);

      if (error) throw error;

      if (data) {
        const formattedTransactions: Transaction[] = data.map(item => ({
          id: item.id,
          amount: item.amount,
          paymentMethod: item.payment_method,
          taskId: item.task.id,
          taskTitle: item.task.title,
          buyerName: item.task.user.name,
          paidAt: item.paid_at!
        }));

        setTransactions(formattedTransactions);
        setTotalTransactions(count || 0);
      }
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search by task title or buyer name"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm"
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
                    <th className="text-left py-3 px-4">Task</th>
                    <th className="text-left py-3 px-4">Buyer</th>
                    <th className="text-left py-3 px-4">Payment Method</th>
                    <th className="text-left py-3 px-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="py-3 px-4">
                        {format(new Date(transaction.paidAt), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{transaction.taskTitle}</div>
                        <div className="text-sm text-muted-foreground">ID: {transaction.taskId}</div>
                      </td>
                      <td className="py-3 px-4">{transaction.buyerName}</td>
                      <td className="py-3 px-4">
                        {transaction.paymentMethod === 'PAYMENT_GATEWAY' ? 'Online Payment' : 'Bank Transfer'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-green-600">
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