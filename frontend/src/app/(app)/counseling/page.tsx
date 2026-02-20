'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Heart, AlertTriangle, Calendar, FileText } from 'lucide-react';

interface CounselingCase {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    currentStream: string;
    admissionNumber: string;
  };
  counselorId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  presentingIssue: string;
  referralSource?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'referred_external' | 'closed';
  isUrgent: boolean;
  sessions: {
    date: string;
    duration: number;
    notes: string;
    actionPlan: string;
    nextSessionDate?: string;
  }[];
  externalReferral?: string;
  closedAt?: string;
  closedReason?: string;
  createdAt: string;
}

export default function CounselingPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CounselingCase | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgent, setFilterUrgent] = useState('all');

  const [form, setForm] = useState({
    studentId: '',
    counselorId: '',
    presentingIssue: '',
    referralSource: '',
    isUrgent: false,
  });

  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    notes: '',
    actionPlan: '',
    nextSessionDate: '',
  });

  // Search students
  const { data: students } = useQuery({
    queryKey: ['counseling-students-search', studentSearch],
    queryFn: async () => {
      if (!studentSearch || studentSearch.length < 2) return [];
      const res = await api.get(`/students?search=${studentSearch}&limit=10`);
      return res.data.data;
    },
    enabled: studentSearch.length >= 2,
  });

  // Get staff (counselors)
  const { data: staff } = useQuery({
    queryKey: ['counseling-staff'],
    queryFn: async () => {
      const res = await api.get('/staff?limit=100');
      return res.data.data;
    },
  });

  // Get counseling cases
  const { data: cases, isLoading } = useQuery({
    queryKey: ['counseling-cases', filterStatus, filterUrgent],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      if (filterUrgent === 'true') params.append('isUrgent', 'true');
      const res = await api.get(`/counseling/cases?${params}`);
      return res.data.data as CounselingCase[];
    },
  });

  // Create counseling case
  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/counseling/cases', data),
    onSuccess: () => {
      toast({ title: 'Case Created', description: 'Counseling case created successfully' });
      qc.invalidateQueries({ queryKey: ['counseling-cases'] });
      setShowAdd(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create case',
        variant: 'destructive',
      });
    },
  });

  // Update case status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, closedReason }: { id: string; status: string; closedReason?: string }) =>
      api.put(`/counseling/cases/${id}`, { status, closedReason, closedAt: status === 'closed' ? new Date() : undefined }),
    onSuccess: () => {
      toast({ title: 'Status Updated', description: 'Case status updated successfully' });
      qc.invalidateQueries({ queryKey: ['counseling-cases'] });
      setShowView(false);
      setSelectedCase(null);
    },
  });

  // Add session to case
  const addSessionMutation = useMutation({
    mutationFn: ({ caseId, session }: { caseId: string; session: typeof sessionForm }) =>
      api.post(`/counseling/cases/${caseId}/sessions`, session),
    onSuccess: () => {
      toast({ title: 'Session Added', description: 'Counseling session added successfully' });
      qc.invalidateQueries({ queryKey: ['counseling-cases'] });
      setShowAddSession(false);
      resetSessionForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add session',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setForm({
      studentId: '',
      counselorId: '',
      presentingIssue: '',
      referralSource: '',
      isUrgent: false,
    });
    setSelectedStudent(null);
    setStudentSearch('');
  };

  const resetSessionForm = () => {
    setSessionForm({
      date: new Date().toISOString().split('T')[0],
      duration: 60,
      notes: '',
      actionPlan: '',
      nextSessionDate: '',
    });
  };

  const selectStudent = (student: any) => {
    setSelectedStudent(student);
    setForm({ ...form, studentId: student._id });
    setStudentSearch(`${student.firstName} ${student.lastName} - ${student.admissionNumber}`);
  };

  const handleViewCase = (caseItem: CounselingCase) => {
    setSelectedCase(caseItem);
    setShowView(true);
  };

  const handleAddSession = (caseItem: CounselingCase) => {
    setSelectedCase(caseItem);
    setShowAddSession(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: 'default',
      in_progress: 'secondary',
      resolved: 'outline',
      referred_external: 'outline',
      closed: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const activeCases = cases?.filter(c => c.status !== 'closed').length || 0;
  const urgentCases = cases?.filter(c => c.isUrgent).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Counseling</h1>
          <p className="text-muted-foreground">Manage student counseling cases and sessions</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cases?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCases}</p>
                <p className="text-sm text-muted-foreground">Active Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{urgentCases}</p>
                <p className="text-sm text-muted-foreground">Urgent Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="referred_external">Referred External</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterUrgent} onValueChange={setFilterUrgent}>
              <SelectTrigger>
                <SelectValue placeholder="All Cases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="true">Urgent Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Counseling Cases</CardTitle>
          <CardDescription>Click on a case to view details and add sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-12 text-muted-foreground">Loading cases...</div>
          ) : cases && cases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Presenting Issue</TableHead>
                  <TableHead>Counselor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgent</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseItem) => (
                  <TableRow
                    key={caseItem._id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleViewCase(caseItem)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {caseItem.studentId?.firstName} {caseItem.studentId?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {caseItem.studentId?.admissionNumber} • {caseItem.studentId?.currentStream}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{caseItem.presentingIssue}</TableCell>
                    <TableCell>
                      {caseItem.counselorId?.firstName} {caseItem.counselorId?.lastName}
                    </TableCell>
                    <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                    <TableCell>
                      {caseItem.isUrgent ? (
                        <Badge variant="destructive">Urgent</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{caseItem.sessions?.length || 0} sessions</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(caseItem.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSession(caseItem);
                        }}
                      >
                        Add Session
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              No counseling cases found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Case Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Counseling Case</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Student Search */}
            <div className="space-y-2">
              <Label>Search Student *</Label>
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Type student name or admission number..."
              />
              {students && students.length > 0 && !selectedStudent && (
                <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                  {students.map((student: any) => (
                    <button
                      key={student._id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => selectStudent(student)}
                    >
                      <p className="font-medium">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.admissionNumber} • {student.currentStream}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Counselor */}
            <div className="space-y-2">
              <Label>Counselor *</Label>
              <Select value={form.counselorId} onValueChange={(v) => setForm({ ...form, counselorId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select counselor" />
                </SelectTrigger>
                <SelectContent>
                  {staff?.map((s: any) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} - {s.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Presenting Issue */}
            <div className="space-y-2">
              <Label>Presenting Issue *</Label>
              <Textarea
                value={form.presentingIssue}
                onChange={(e) => setForm({ ...form, presentingIssue: e.target.value })}
                placeholder="Describe the issue or concern..."
                rows={4}
              />
            </div>

            {/* Referral Source */}
            <div className="space-y-2">
              <Label>Referral Source</Label>
              <Input
                value={form.referralSource}
                onChange={(e) => setForm({ ...form, referralSource: e.target.value })}
                placeholder="e.g., Teacher, Parent, Self"
              />
            </div>

            {/* Is Urgent */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isUrgent"
                checked={form.isUrgent}
                onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isUrgent">Mark as Urgent</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.studentId || !form.counselorId || !form.presentingIssue || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Case Dialog */}
      {selectedCase && (
        <Dialog open={showView} onOpenChange={setShowView}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Counseling Case Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Case Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Student</Label>
                  <p className="font-medium">
                    {selectedCase.studentId?.firstName} {selectedCase.studentId?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCase.studentId?.admissionNumber} •{' '}
                    {selectedCase.studentId?.currentStream}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Counselor</Label>
                  <p className="font-medium">
                    {selectedCase.counselorId?.firstName} {selectedCase.counselorId?.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCase.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{formatDate(selectedCase.createdAt)}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Presenting Issue</Label>
                <p className="mt-1">{selectedCase.presentingIssue}</p>
              </div>

              {selectedCase.referralSource && (
                <div>
                  <Label className="text-muted-foreground">Referral Source</Label>
                  <p className="mt-1">{selectedCase.referralSource}</p>
                </div>
              )}

              {/* Sessions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Counseling Sessions ({selectedCase.sessions?.length || 0})</Label>
                  <Button variant="outline" size="sm" onClick={() => handleAddSession(selectedCase)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Session
                  </Button>
                </div>
                {selectedCase.sessions && selectedCase.sessions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCase.sessions.map((session, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{formatDate(session.date)}</span>
                                <Badge variant="outline">{session.duration} min</Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <Label className="text-muted-foreground">Notes:</Label>
                                  <p>{session.notes}</p>
                                </div>
                                {session.actionPlan && (
                                  <div>
                                    <Label className="text-muted-foreground">Action Plan:</Label>
                                    <p>{session.actionPlan}</p>
                                  </div>
                                )}
                                {session.nextSessionDate && (
                                  <div>
                                    <Label className="text-muted-foreground">Next Session:</Label>
                                    <p>{formatDate(session.nextSessionDate)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No sessions recorded yet</p>
                )}
              </div>

              {/* Update Status */}
              <div className="border-t pt-4">
                <Label className="mb-2 block">Update Case Status</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: selectedCase._id, status: 'in_progress' })}
                    disabled={selectedCase.status === 'in_progress'}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: selectedCase._id, status: 'resolved' })}
                    disabled={selectedCase.status === 'resolved'}
                  >
                    Resolved
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: selectedCase._id, status: 'closed', closedReason: 'Completed' })}
                    disabled={selectedCase.status === 'closed'}
                  >
                    Close Case
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowView(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Session Dialog */}
      {selectedCase && (
        <Dialog open={showAddSession} onOpenChange={setShowAddSession}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Counseling Session</DialogTitle>
              <CardDescription>
                For {selectedCase.studentId?.firstName} {selectedCase.studentId?.lastName}
              </CardDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes) *</Label>
                  <Input
                    type="number"
                    value={sessionForm.duration}
                    onChange={(e) => setSessionForm({ ...sessionForm, duration: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Session Notes *</Label>
                <Textarea
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  placeholder="What was discussed in this session..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Action Plan</Label>
                <Textarea
                  value={sessionForm.actionPlan}
                  onChange={(e) => setSessionForm({ ...sessionForm, actionPlan: e.target.value })}
                  placeholder="Follow-up actions, recommendations..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Next Session Date (Optional)</Label>
                <Input
                  type="date"
                  value={sessionForm.nextSessionDate}
                  onChange={(e) => setSessionForm({ ...sessionForm, nextSessionDate: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddSession(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  addSessionMutation.mutate({ caseId: selectedCase._id, session: sessionForm })
                }
                disabled={!sessionForm.date || !sessionForm.notes || addSessionMutation.isPending}
              >
                {addSessionMutation.isPending ? 'Adding...' : 'Add Session'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
