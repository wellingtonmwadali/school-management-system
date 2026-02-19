'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, AlertCircle, Plus, Search, Loader2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinancePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'mpesa', reference: '' });
  const [searchStudent, setSearchStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['fee-stats'],
    queryFn: async () => { const res = await api.get('/fees/stats'); return res.data.data; },
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get(`/fees/invoices?${params}`);
      return res.data;
    },
  });

  const paymentMutation = useMutation({
    mutationFn: () => api.post('/fees/payments', {
      invoiceId: selectedInvoice,
      amount: parseFloat(paymentForm.amount),
      method: paymentForm.method,
      reference: paymentForm.reference,
      paidDate: new Date().toISOString(),
    }),
    onSuccess: () => {
      toast({ title: 'Payment Recorded', description: 'Payment saved successfully' });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['fee-stats'] });
      setShowPayment(false);
      setSelectedInvoice(null);
      setPaymentForm({ amount: '', method: 'mpesa', reference: '' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to record payment', variant: 'destructive' }),
  });

  const stats = statsData?.stats || {};
  const byClass = statsData?.byClass || [];
  const monthlyTrend = statsData?.monthlyTrend || [];
  const invoices = invoicesData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
        <p className="text-muted-foreground text-sm">Fee collection and financial management</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full p-3 bg-green-100"><DollarSign size={20} className="text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalCollected || 0)}</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${stats.totalExpected ? Math.min(100, (stats.totalCollected / stats.totalExpected) * 100) : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalExpected ? Math.round((stats.totalCollected / stats.totalExpected) * 100) : 0}% of {formatCurrency(stats.totalExpected || 0)} expected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full p-3 bg-red-100"><AlertCircle size={20} className="text-red-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(stats.totalOutstanding || 0)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{stats.unpaid || 0} unpaid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full p-3 bg-blue-100"><TrendingUp size={20} className="text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.total || 0}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">{stats.paid || 0} paid</span>
              <span className="text-yellow-600 font-medium">{stats.partial || 0} partial</span>
              <span className="text-red-600 font-medium">{stats.unpaid || 0} unpaid</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Fee Invoices</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search student..." value={searchStudent} onChange={e => setSearchStudent(e.target.value)} className="pl-9 h-9" />
                </div>
                <Select value={filterStatus || undefined} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-9 w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {invoicesLoading ? (
                <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv: {
                      _id: string;
                      invoiceNumber: string;
                      studentId: { firstName: string; lastName: string; currentClass: string } | string;
                      term: number;
                      academicYear: string;
                      totalAmount: number;
                      amountPaid: number;
                      balance: number;
                      status: string;
                      dueDate: string;
                    }) => (
                      <TableRow key={inv._id}>
                        <TableCell className="text-xs font-mono text-muted-foreground">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {typeof inv.studentId === 'object' ? `${inv.studentId.firstName} ${inv.studentId.lastName}` : inv.studentId}
                        </TableCell>
                        <TableCell className="text-sm">
                          {typeof inv.studentId === 'object' ? inv.studentId.currentClass : '—'}
                        </TableCell>
                        <TableCell className="text-sm">Term {inv.term}</TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(inv.totalAmount)}</TableCell>
                        <TableCell className="text-sm text-green-600">{formatCurrency(inv.amountPaid)}</TableCell>
                        <TableCell className="text-sm text-red-600">{formatCurrency(inv.balance)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                        <TableCell>
                          {inv.status !== 'paid' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => { setSelectedInvoice(inv._id); setShowPayment(true); }}>
                              <Plus size={12} className="mr-1" /> Pay
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Collection Rate by Class</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byClass}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="class" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Rate']} />
                    <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Collection Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={monthlyTrend.map((m: { _id: string; amount: number }) => ({ month: m._id, amount: m.amount }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Collected']} />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (Ksh) *</Label>
              <Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentForm.method} onValueChange={v => setPaymentForm({ ...paymentForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference / Receipt Number</Label>
              <Input value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="e.g. M-Pesa transaction code" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>Cancel</Button>
            <Button onClick={() => paymentMutation.mutate()} disabled={paymentMutation.isPending || !paymentForm.amount}>
              {paymentMutation.isPending ? <><Loader2 size={14} className="mr-2 animate-spin" />Saving...</> : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
