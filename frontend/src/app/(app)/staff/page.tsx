'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Staff } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getInitials, getStatusColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Loader2, Eye, Edit } from 'lucide-react';
import Link from 'next/link';

const DEPARTMENTS = ['Sciences', 'Languages', 'Humanities', 'Mathematics', 'Arts', 'Technical', 'Administration', 'Support'];

export default function StaffPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '1990-01-01', gender: 'male',
    designation: 'Teacher', department: 'Sciences', subjectsTaught: [] as string[],
    employmentType: 'permanent', employmentDate: new Date().toISOString().split('T')[0],
    phone: '', email: '', homeAddress: 'Nairobi',
    idNumber: '', role: 'subject_teacher',
    emergencyContact: { name: '', relationship: 'Spouse', phone: '' },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['staff', search, filterDept],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterDept) params.set('department', filterDept);
      const res = await api.get(`/staff?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/staff', form),
    onSuccess: () => {
      toast({ title: 'Staff Added', description: 'Staff member created successfully' });
      qc.invalidateQueries({ queryKey: ['staff'] });
      setShowAdd(false);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to add staff', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.put(`/staff/${selectedStaff?._id}`, data),
    onSuccess: () => {
      toast({ title: 'Staff Updated', description: 'Staff details updated successfully' });
      qc.invalidateQueries({ queryKey: ['staff'] });
      setShowEdit(false);
      setSelectedStaff(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update staff', variant: 'destructive' }),
  });

  const handleEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setForm({
      firstName: staff.firstName,
      lastName: staff.lastName,
      dateOfBirth: staff.dateOfBirth.split('T')[0],
      gender: staff.gender,
      designation: staff.designation,
      department: staff.department,
      subjectsTaught: staff.subjectsTaught,
      employmentType: staff.employmentType,
      employmentDate: staff.employmentDate.split('T')[0],
      phone: staff.phone,
      email: staff.email,
      homeAddress: staff.homeAddress,
      idNumber: staff.idNumber,
      role: staff.userId?.role || 'subject_teacher',
      emergencyContact: staff.emergencyContact,
    });
    setShowEdit(true);
  };

  const handleView = (staff: Staff) => {
    setSelectedStaff(staff);
    setShowView(true);
  };

  const staff: Staff[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-muted-foreground text-sm">{data?.total || 0} staff members</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} className="mr-2" /> Add Staff
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={filterDept || undefined} onValueChange={(v) => setFilterDept(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map(s => (
                  <TableRow key={s._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-sm font-semibold text-purple-700">
                          {getInitials(s.firstName, s.lastName)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{s.staffId}</TableCell>
                    <TableCell className="text-sm">{s.designation}</TableCell>
                    <TableCell className="text-sm">{s.department}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.subjectsTaught.slice(0, 2).join(', ')}{s.subjectsTaught.length > 2 ? '...' : ''}</TableCell>
                    <TableCell className="text-sm">{s.phone}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 capitalize">
                        {s.employmentType.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Link href={`/staff/${s._id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye size={14} /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(s)}><Edit size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!staff.length && (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No staff found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>ID Number *</Label><Input value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} /></div>
            <div className="space-y-2"><Label>Designation *</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>System Role</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                  <SelectItem value="class_teacher">Class Teacher</SelectItem>
                  <SelectItem value="hod">Head of Department</SelectItem>
                  <SelectItem value="deputy_principal">Deputy Principal</SelectItem>
                  <SelectItem value="counselor">Counselor</SelectItem>
                  <SelectItem value="librarian">Librarian</SelectItem>
                  <SelectItem value="medical_officer">Medical Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select value={form.employmentType} onValueChange={v => setForm({ ...form, employmentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254..." /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Employment Date</Label><Input type="date" value={form.employmentDate} onChange={e => setForm({ ...form, employmentDate: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Home Address</Label><Input value={form.homeAddress} onChange={e => setForm({ ...form, homeAddress: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Staff Dialog */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Staff Details</DialogTitle></DialogHeader>
          {selectedStaff && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 border-b pb-4">
                <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center text-2xl font-semibold text-purple-700">
                  {getInitials(selectedStaff.firstName, selectedStaff.lastName)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedStaff.firstName} {selectedStaff.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStaff.designation}</p>
                  <p className="text-sm text-muted-foreground">{selectedStaff.staffId}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${selectedStaff.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {selectedStaff.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gender</p>
                  <p className="font-medium capitalize">{selectedStaff.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID Number</p>
                  <p className="font-medium">{selectedStaff.idNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Department</p>
                  <p className="font-medium">{selectedStaff.department}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Employment Type</p>
                  <p className="font-medium capitalize">{selectedStaff.employmentType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{selectedStaff.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{selectedStaff.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Home Address</p>
                  <p className="font-medium">{selectedStaff.homeAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">TSC Number</p>
                  <p className="font-medium">{selectedStaff.tscNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">KRA PIN</p>
                  <p className="font-medium">{selectedStaff.kraPin || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">NHIF Number</p>
                  <p className="font-medium">{selectedStaff.nhifNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">NSSF Number</p>
                  <p className="font-medium">{selectedStaff.nssfNumber || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Subjects Taught</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedStaff.subjectsTaught.map(sub => (
                      <span key={sub} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">{sub}</span>
                    ))}
                  </div>
                </div>
                {selectedStaff.classTeacherOf && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Class Teacher Of</p>
                    <p className="font-medium">{selectedStaff.classTeacherOf}</p>
                  </div>
                )}
                {selectedStaff.emergencyContact && (
                  <div className="col-span-2 border-t pt-4">
                    <p className="text-sm font-semibold mb-2">Emergency Contact</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Name</p>
                        <p className="font-medium">{selectedStaff.emergencyContact.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Relationship</p>
                        <p className="font-medium">{selectedStaff.emergencyContact.relationship}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Phone</p>
                        <p className="font-medium">{selectedStaff.emergencyContact.phone}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowView(false)}>Close</Button>
            <Button onClick={() => { setShowView(false); selectedStaff && handleEdit(selectedStaff); }}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Staff Member</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>ID Number *</Label><Input value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} /></div>
            <div className="space-y-2"><Label>Designation *</Label><Input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select value={form.employmentType} onValueChange={v => setForm({ ...form, employmentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254..." /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Employment Date</Label><Input type="date" value={form.employmentDate} onChange={e => setForm({ ...form, employmentDate: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Home Address</Label><Input value={form.homeAddress} onChange={e => setForm({ ...form, homeAddress: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
