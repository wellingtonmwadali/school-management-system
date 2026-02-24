'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, XCircle, UserCheck, Calendar, Info } from 'lucide-react';

const LEAVE_TYPES = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Compassionate', 'Study', 'Emergency'];

export default function LeavePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ leaveType: 'Annual', startDate: '', endDate: '', reason: '', totalDays: 1 });

  // Get my approver
  const { data: approverData } = useQuery({
    queryKey: ['my-approver', 'leave'],
    queryFn: async () => { 
      const res = await api.get('/settings/approvers/my?requestType=leave'); 
      return res.data.data; 
    },
  });

  // Get leave balance
  const { data: balanceData } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: async () => { 
      const res = await api.get('/requests/leave-balance'); 
      return res.data.data; 
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => { const res = await api.get('/leave'); return res.data.data; },
  });

  const applyMutation = useMutation({
    mutationFn: () => api.post('/leave', form),
    onSuccess: () => {
      toast({ title: 'Leave Applied', description: 'Your leave request has been submitted' });
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      setShowApply(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to apply for leave';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/leave/${id}/review`, { status }),
    onSuccess: () => {
      toast({ title: 'Leave Reviewed', description: 'Leave request updated' });
      qc.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => api.put(`/requests/${id}/withdraw`),
    onSuccess: () => {
      toast({ title: 'Request Withdrawn', description: 'Your request has been cancelled' });
      qc.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to withdraw request';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const leaves = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground text-sm">Staff leave requests and approvals</p>
        </div>
        <Button size="sm" onClick={() => setShowApply(true)}>
          <Plus size={16} className="mr-2" /> Apply for Leave
        </Button>
      </div>

      {/* Approver Info Card */}
      {approverData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck size={16} className="text-blue-600" />
              Your Approver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{approverData.approverName}</p>
                <p className="text-sm text-muted-foreground">{approverData.approverEmail}</p>
              </div>
              {approverData.isDefault && (
                <Badge variant="outline" className="text-xs">Default Approver</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Balance Card */}
      {balanceData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar size={16} className="text-green-600" />
              Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(balanceData).map(([key, value]: [string, any]) => {
                if (['annual', 'sick', 'maternity', 'paternity', 'compassionate', 'unpaid'].includes(key)) {
                  return (
                    <div key={key} className="space-y-1">
                      <p className="text-xs text-muted-foreground capitalize">{key}</p>
                      <p className="text-2xl font-bold">{value.remaining}</p>
                      <p className="text-xs text-muted-foreground">of {value.total} days</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground text-sm">Staff leave requests and approvals</p>
        </div>
        <Button size="sm" onClick={() => setShowApply(true)}>
          <Plus size={16} className="mr-2" /> Apply for Leave
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave: {
                  _id: string;
                  staffId: { firstName: string; lastName: string; designation: string } | null;
                  leaveType: string; startDate: string; endDate: string; totalDays: number;
                  status: string; createdAt: string;
                }) => (
                  <TableRow key={leave._id}>
                    <TableCell>
                      <p className="font-medium text-sm">{leave.staffId ? `${leave.staffId.firstName} ${leave.staffId.lastName}` : '—'}</p>
                      <p className="text-xs text-muted-foreground">{leave.staffId?.designation}</p>
                    </TableCell>
                    <TableCell className="text-sm">{leave.leaveType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(leave.startDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(leave.endDate)}</TableCell>
                    <TableCell className="text-sm">{leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(leave.createdAt)}</TableCell>
                    <TableCell>
                      {leave.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => reviewMutation.mutate({ id: leave._id, status: 'approved' })}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => reviewMutation.mutate({ id: leave._id, status: 'rejected' })}>Reject</Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs text-orange-700 border-orange-300 hover:bg-orange-50"
                            onClick={() => {
                              if (confirm('Are you sure you want to withdraw this request?')) {
                                withdrawMutation.mutate(leave._id);
                              }
                            }}
                          >
                            <XCircle size={14} className="mr-1" />
                            Withdraw
                          </Button>
                        </div>
                      )}
                      {leave.status === 'cancelled' && (
                        <span className="text-xs text-muted-foreground">Withdrawn</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!leaves.length && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leave requests found</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={form.leaveType} onValueChange={v => setForm({ ...form, leaveType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Number of Days</Label>
              <Input type="number" value={form.totalDays} onChange={e => setForm({ ...form, totalDays: parseInt(e.target.value) })} min={1} />
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="State your reason for leave..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApply(false)}>Cancel</Button>
            <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending || !form.startDate || !form.endDate || !form.reason}>
              {applyMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
