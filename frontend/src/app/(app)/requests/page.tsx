'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, FileText, Calendar, User, CheckCircle, XCircle } from 'lucide-react';

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'compassionate', label: 'Compassionate Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'other', label: 'Other' },
];

const REQUEST_TYPES = [
  { value: 'leave', label: 'Leave Request' },
  { value: 'medical', label: 'Medical Request' },
  { value: 'permission', label: 'Permission Request' },
  { value: 'other', label: 'Other Request' },
];

export default function RequestsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  
  const [showCreate, setShowCreate] = useState(false);
  const [viewFilter, setViewFilter] = useState('pending');
  const [activeTab, setActiveTab] = useState('all');
  
  const [form, setForm] = useState({
    requestType: 'leave',
    requestFor: 'self',
    subjectId: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    leaveType: 'annual',
    medicalReason: '',
    symptoms: '',
    priority: 'medium',
  });

  const isAdmin = ['principal', 'super_admin', 'deputy_principal'].includes(user?.role || '');
  const isMedicalOfficer = user?.role === 'medical_officer';
  const isTeacher = ['class_teacher', 'subject_teacher'].includes(user?.role || '');

  // Fetch all requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests', viewFilter, activeTab],
    queryFn: async () => {
      const res = await api.get(`/requests?view=${viewFilter}&type=${activeTab !== 'all' ? activeTab : 'all'}`);
      return res.data.data;
    },
  });

  // Fetch my requests only
  const { data: myRequests } = useQuery({
    queryKey: ['my-requests', viewFilter],
    queryFn: async () => {
      const res = await api.get(`/requests/my?status=${viewFilter === 'pending' ? 'pending' : 'all'}`);
      return res.data.data;
    },
  });

  // Fetch leave balance
  const { data: leaveBalance } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: async () => {
      const res = await api.get('/requests/leave-balance');
      return res.data.data;
    },
    enabled: !isMedicalOfficer,
  });

  // Fetch students for dropdown (if teacher/nurse/admin)
  const { data: students } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const res = await api.get('/students?limit=500');
      return res.data.data;
    },
    enabled: isTeacher || isMedicalOfficer || isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/requests', form),
    onSuccess: () => {
      toast({ title: 'Request Submitted', description: 'Your request has been submitted for approval' });
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['my-requests'] });
      setShowCreate(false);
      setForm({
        requestType: 'leave',
        requestFor: 'self',
        subjectId: '',
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        leaveType: 'annual',
        medicalReason: '',
        symptoms: '',
        priority: 'medium',
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to submit request', 
        variant: 'destructive' 
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, reviewComments }: { id: string; status: 'approved' | 'rejected'; reviewComments?: string }) =>
      api.put(`/requests/${id}/review`, { status, reviewComments }),
    onSuccess: () => {
      toast({ title: 'Request Reviewed', description: 'Request has been updated' });
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['my-requests'] });
    },
  });

  const handleReview = (id: string, status: 'approved' | 'rejected') => {
    const comments = prompt(status === 'rejected' ? 'Reason for rejection:' : 'Comments (optional):');
    if (status === 'rejected' && !comments) return;
    reviewMutation.mutate({ id, status, reviewComments: comments || undefined });
  };

  const displayRequests = isAdmin ? requests : myRequests;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requests</h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin ? 'Manage all requests' : 'View and manage your requests'}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New Request
        </Button>
      </div>

      {/* Leave Balance Cards */}
      {leaveBalance && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(leaveBalance).filter(([key]) => !['_id', 'schoolId', 'staffId', 'academicYear', 'createdAt', 'updatedAt', '__v'].includes(key)).map(([type, data]: [string, any]) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground capitalize">
                  {type} Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.remaining}</div>
                <p className="text-xs text-muted-foreground">
                  of {data.total} days left
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs and Filters */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="leave">Leave</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="permission">Permission</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant={viewFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={viewFilter === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewFilter('history')}
          >
            History
          </Button>
        </div>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="animate-spin mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>For</TableHead>
                  {isAdmin && <TableHead>Requested By</TableHead>}
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!displayRequests || displayRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayRequests.map((req: any) => (
                    <TableRow key={req._id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {req.requestType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{req.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {req.description}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">{req.subjectName}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-sm">{req.requestedByName}</TableCell>
                      )}
                      <TableCell className="text-sm text-muted-foreground">
                        {req.startDate && req.endDate ? (
                          <>
                            {formatDate(req.startDate)} - {formatDate(req.endDate)}
                            <span className="text-xs block">({req.totalDays} days)</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{req.approverName}</TableCell>
                      <TableCell>
                        {req.status === 'pending' && req.approverId === user?.id && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleReview(req._id, 'approved')}
                            >
                              <CheckCircle size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleReview(req._id, 'rejected')}
                            >
                              <XCircle size={16} />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Request Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Request Type</Label>
              <Select value={form.requestType} onValueChange={(v) => setForm({ ...form, requestType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.filter(t => {
                    if (isMedicalOfficer) return t.value === 'medical';
                    return true;
                  }).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(isTeacher || isMedicalOfficer || isAdmin) && (
              <div>
                <Label>Request For</Label>
                <Select value={form.requestFor} onValueChange={(v) => setForm({ ...form, requestFor: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {!isMedicalOfficer && <SelectItem value="self">Myself</SelectItem>}
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.requestFor === 'student' && (
              <div>
                <Label>Select Student</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student: any) => (
                      <SelectItem key={student._id} value={student._id}>
                        {student.firstName} {student.lastName} - {student.admissionNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief title for the request"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed description"
              />
            </div>

            {form.requestType === 'leave' && (
              <>
                <div>
                  <Label>Leave Type</Label>
                  <Select value={form.leaveType} onValueChange={(v) => setForm({ ...form, leaveType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {form.requestType === 'medical' && (
              <>
                <div>
                  <Label>Medical Reason</Label>
                  <Input
                    value={form.medicalReason}
                    onChange={(e) => setForm({ ...form, medicalReason: e.target.value })}
                    placeholder="e.g., Flu, Malaria, etc."
                  />
                </div>
                <div>
                  <Label>Symptoms</Label>
                  <Textarea
                    rows={2}
                    value={form.symptoms}
                    onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                    placeholder="Describe symptoms"
                  />
                </div>
              </>
            )}

            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
