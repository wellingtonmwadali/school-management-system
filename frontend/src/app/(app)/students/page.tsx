'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/badge';
import { formatDate, getInitials, getStatusColor } from '@/lib/utils';
import { Plus, Search, Download, Filter, Eye, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth';
import { getFeaturePermissions } from '@/lib/rbac';
import Link from 'next/link';

const CLASS_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];

export default function StudentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const permissions = getFeaturePermissions(user?.role, 'students');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'male',
    currentClass: 'Form 1', currentStream: 'Form 1 East',
    residentialAddress: 'Nairobi', admissionDate: new Date().toISOString().split('T')[0],
    yearOfJoining: new Date().getFullYear(),
    father: { name: '', phone: '' },
    primaryContactType: 'father',
    emergencyContacts: [{ name: '', relationship: 'Father', phone: '' }],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students', search, filterClass, filterStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.set('search', search);
      if (filterClass) params.set('class', filterClass);
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get(`/students?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/students', data),
    onSuccess: () => {
      toast({ title: 'Student Added', description: 'Student enrolled successfully', variant: 'default' });
      qc.invalidateQueries({ queryKey: ['students'] });
      setShowAdd(false);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to add student', variant: 'destructive' }),
  });

  const students: Student[] = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground text-sm">{total} students enrolled</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" /> Export
          </Button>
          {permissions.canCreate && (
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={16} className="mr-2" /> Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name or admission number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={filterClass || undefined} onValueChange={(v) => setFilterClass(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus || undefined} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
            {(filterClass || filterStatus || search) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterClass(''); setFilterStatus(''); setSearch(''); }}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission #</TableHead>
                  <TableHead>Class / Stream</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Admission Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {getInitials(s.firstName, s.lastName)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{s.admissionNumber}</TableCell>
                    <TableCell className="text-sm">{s.currentStream}</TableCell>
                    <TableCell className="text-sm capitalize">{s.gender}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(s.admissionDate)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(s.status)}`}>
                        {s.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/students/${s._id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye size={14} /></Button>
                        </Link>
                        {permissions.canEdit && (
                          <Link href={`/students/${s._id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Edit size={14} /></Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enroll New Student</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={form.currentClass} onValueChange={v => setForm({ ...form, currentClass: v, currentStream: `${v} East` })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stream *</Label>
              <Select value={form.currentStream} onValueChange={v => setForm({ ...form, currentStream: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['East', 'West', 'North'].map(s => (
                    <SelectItem key={s} value={`${form.currentClass} ${s}`}>{form.currentClass} {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admission Date *</Label>
              <Input type="date" value={form.admissionDate} onChange={e => setForm({ ...form, admissionDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Year of Joining *</Label>
              <Input type="number" value={form.yearOfJoining} onChange={e => setForm({ ...form, yearOfJoining: parseInt(e.target.value) })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Residential Address *</Label>
              <Input value={form.residentialAddress} onChange={e => setForm({ ...form, residentialAddress: e.target.value })} placeholder="Home address" />
            </div>
            <div className="col-span-2 border-t pt-3">
              <p className="text-sm font-semibold mb-3">Parent/Guardian Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Father's Name</Label>
                  <Input value={form.father.name} onChange={e => setForm({ ...form, father: { ...form.father, name: e.target.value } })} placeholder="Father's full name" />
                </div>
                <div className="space-y-2">
                  <Label>Father's Phone</Label>
                  <Input value={form.father.phone} onChange={e => setForm({ ...form, father: { ...form.father, phone: e.target.value } })} placeholder="+254..." />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Enroll Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
