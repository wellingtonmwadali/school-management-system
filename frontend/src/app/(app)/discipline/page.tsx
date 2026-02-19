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
import { formatDate, getStatusColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Plus, Shield, AlertTriangle, Loader2 } from 'lucide-react';

const INCIDENT_CATEGORIES = ['Academic Dishonesty', 'Bullying', 'Violence', 'Substance Abuse', 'Truancy', 'Property Damage', 'Insubordination', 'Other'];

export default function DisciplinePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showSuspended, setShowSuspended] = useState(false);
  const [form, setForm] = useState({
    studentId: '', date: new Date().toISOString().split('T')[0],
    category: 'Insubordination', description: '', severity: 'minor',
    witnesses: [] as string[], parentNotified: false,
  });
  const [studentSearch, setStudentSearch] = useState('');

  const { data: students } = useQuery({
    queryKey: ['students-search', studentSearch],
    queryFn: async () => {
      if (!studentSearch) return [];
      const res = await api.get(`/students?search=${studentSearch}&limit=5`);
      return res.data.data;
    },
    enabled: studentSearch.length > 2,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', filterStatus, filterSeverity, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterSeverity) params.set('severity', filterSeverity);
      if (filterCategory) params.set('category', filterCategory);
      const res = await api.get(`/discipline?${params}`);
      return res.data.data;
    },
  });

  const { data: suspendedStudents, isLoading: loadingSuspended } = useQuery({
    queryKey: ['suspended-students'],
    queryFn: async () => {
      const res = await api.get('/students?status=suspended');
      return res.data.data;
    },
    enabled: showSuspended,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/discipline', form),
    onSuccess: () => {
      toast({ title: 'Incident Logged', description: 'Disciplinary incident recorded' });
      qc.invalidateQueries({ queryKey: ['incidents'] });
      setShowAdd(false);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to log incident', variant: 'destructive' }),
  });

  const incidents = data || [];
  const openCount = incidents.filter((i: { status: string }) => i.status === 'open').length;
  const seriousCount = incidents.filter((i: { severity: string }) => ['serious', 'critical'].includes(i.severity)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discipline</h1>
          <p className="text-muted-foreground text-sm">Track and manage student disciplinary incidents</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} className="mr-2" /> Log Incident
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full p-2 bg-orange-100"><Shield size={20} className="text-orange-600" /></div>
            <div><p className="text-2xl font-bold">{incidents.length}</p><p className="text-sm text-muted-foreground">Total Incidents</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full p-2 bg-red-100"><AlertTriangle size={20} className="text-red-600" /></div>
            <div><p className="text-2xl font-bold text-red-700">{openCount}</p><p className="text-sm text-muted-foreground">Open Cases</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-full p-2 bg-yellow-100"><AlertTriangle size={20} className="text-yellow-600" /></div>
            <div><p className="text-2xl font-bold text-yellow-700">{seriousCount}</p><p className="text-sm text-muted-foreground">Serious/Critical</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Select value={filterStatus || undefined} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSeverity || undefined} onValueChange={(v) => setFilterSeverity(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="serious">Serious</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory || undefined} onValueChange={(v) => setFilterCategory(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48 h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {INCIDENT_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant={showSuspended ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setShowSuspended(!showSuspended)}
        >
          {showSuspended ? 'Show All' : 'Show Suspended'}
        </Button>
        {(filterStatus || filterSeverity || filterCategory) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setFilterStatus('');
              setFilterSeverity('');
              setFilterCategory('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Suspended Students Section */}
      {showSuspended && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Suspended Students
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSuspended ? (
              <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
            ) : suspendedStudents && suspendedStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class/Stream</TableHead>
                    <TableHead>Admission Number</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspendedStudents.map((student: {
                    _id: string;
                    firstName: string;
                    lastName: string;
                    currentStream: string;
                    admissionNumber: string;
                    gender: string;
                    status: string;
                  }) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>{student.currentStream}</TableCell>
                      <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                      <TableCell className="capitalize">{student.gender}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                          {student.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">No suspended students</div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Parent Notified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident: {
                  _id: string;
                  studentId: { firstName: string; lastName: string; currentStream: string } | null;
                  category: string; severity: string; date: string; status: string; parentNotified: boolean;
                }) => (
                  <TableRow key={incident._id}>
                    <TableCell>
                      <p className="font-medium text-sm">{incident.studentId ? `${incident.studentId.firstName} ${incident.studentId.lastName}` : '—'}</p>
                      <p className="text-xs text-muted-foreground">{incident.studentId?.currentStream}</p>
                    </TableCell>
                    <TableCell className="text-sm">{incident.category}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        incident.severity === 'critical' ? 'bg-red-100 text-red-800'
                        : incident.severity === 'serious' ? 'bg-orange-100 text-orange-800'
                        : incident.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                        {incident.severity}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(incident.date)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${incident.parentNotified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {incident.parentNotified ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!incidents.length && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No incidents recorded</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Incident Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Disciplinary Incident</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Student</Label>
              <Input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Type student name..." />
              {students?.length > 0 && (
                <div className="border rounded-md divide-y">
                  {students.map((s: { _id: string; firstName: string; lastName: string; currentStream: string }) => (
                    <button key={s._id} className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => { setForm({ ...form, studentId: s._id }); setStudentSearch(`${s.firstName} ${s.lastName}`); }}>
                      {s.firstName} {s.lastName} — {s.currentStream}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INCIDENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="serious">Serious</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the incident..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.studentId || !form.description}>
              {createMutation.isPending ? 'Saving...' : 'Log Incident'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
