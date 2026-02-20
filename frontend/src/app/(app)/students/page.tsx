'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/badge';
import { formatDate, getInitials, getStatusColor } from '@/lib/utils';
import { Plus, Search, Download, Filter, Eye, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const [showEdit, setShowEdit] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    firstName: '', lastName: '', middleName: '', dateOfBirth: '', gender: 'male',
    nationality: 'Kenyan', religion: '', bloodGroup: '', 
    hasDisability: false, disabilityDetails: '',
    idNumber: '', nemisNumber: '', kcpeIndexNumber: '', kcpeScore: '',
    currentClass: 'Form 1', currentStream: 'Form 1 East',
    residentialAddress: '', postalAddress: '',
    admissionDate: new Date().toISOString().split('T')[0],
    yearOfJoining: new Date().getFullYear(),
    previousSchool: '', house: '', status: 'active' as 'active' | 'suspended' | 'expelled' | 'transferred' | 'graduated' | 'dropout',
    medicalConditions: [] as string[], allergies: [] as string[], medications: [] as string[],
    medicalInsurance: '',
    father: { name: '', idNumber: '', phone: '', email: '', occupation: '', employer: '' },
    mother: { name: '', idNumber: '', phone: '', email: '', occupation: '', employer: '' },
    guardian: { name: '', relationship: '', phone: '', email: '', idNumber: '' },
    primaryContactType: 'father' as 'father' | 'mother' | 'guardian',
    emergencyContacts: [{ name: '', relationship: '', phone: '' }],
    isBoarding: false, dormitory: '', roomNumber: '', bedNumber: '',
    usesTransport: false, transportRoute: '',
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

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.put(`/students/${selectedStudent?._id}`, data),
    onSuccess: async () => {
      toast({ title: 'Student Updated', description: 'Student information updated successfully' });
      qc.invalidateQueries({ queryKey: ['students'] });
      // Refresh current user data if they updated themselves  
      const { refreshUser } = useAuthStore.getState();
      await refreshUser();
      setShowEdit(false);
      setSelectedStudent(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update student', variant: 'destructive' }),
  });

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setForm({
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName || '',
      dateOfBirth: student.dateOfBirth.split('T')[0],
      gender: student.gender,
      nationality: student.nationality || 'Kenyan',
      religion: student.religion || '',
      bloodGroup: student.bloodGroup || '',
      hasDisability: student.hasDisability || false,
      disabilityDetails: student.disabilityDetails || '',
      idNumber: student.idNumber || '',
      nemisNumber: student.nemisNumber || '',
      kcpeIndexNumber: student.kcpeIndexNumber || '',
      kcpeScore: student.kcpeScore?.toString() || '',
      currentClass: student.currentClass,
      currentStream: student.currentStream,
      residentialAddress: student.residentialAddress || '',
      postalAddress: student.postalAddress || '',
      admissionDate: student.admissionDate.split('T')[0],
      yearOfJoining: student.yearOfJoining,
      previousSchool: student.previousSchool || '',
      house: student.house || '',
      status: student.status,
      medicalConditions: student.medicalConditions || [],
      allergies: student.allergies || [],
      medications: student.medications || [],
      medicalInsurance: student.medicalInsurance || '',
      father: student.father || { name: '', idNumber: '', phone: '', email: '', occupation: '', employer: '' },
      mother: student.mother || { name: '', idNumber: '', phone: '', email: '', occupation: '', employer: '' },
      guardian: student.guardian || { name: '', relationship: '', phone: '', email: '', idNumber: '' },
      primaryContactType: student.primaryContactType || 'father',
      emergencyContacts: student.emergencyContacts || [{ name: '', relationship: '', phone: '' }],
      isBoarding: student.isBoarding || false,
      dormitory: student.dormitory || '',
      roomNumber: student.roomNumber || '',
      bedNumber: student.bedNumber || '',
      usesTransport: student.usesTransport || false,
      transportRoute: student.transportRoute || '',
    });
    setShowEdit(true);
  };

  const students: Student[] = data?.data || [];
  const total = data?.total || 0;

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterClass) params.set('class', filterClass);
      if (filterStatus) params.set('status', filterStatus);
      
      const res = await api.get(`/students?${params}&limit=10000`, { responseType: 'blob' });
       onClick={handleExport}
      // Convert students data to CSV
      const csvData = students.map(s => ({
        'Admission No': s.admissionNumber,
        'First Name': s.firstName,
        'Last Name': s.lastName,
        'Class': s.currentClass,
        'Stream': s.currentStream,
        'Gender': s.gender,
        'Status': s.status,
        'Phone': s.father?.phone || s.mother?.phone || '',
        'Admission Date': formatDate(s.admissionDate),
      }));
      
      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({ title: 'Export Successful', description: `Exported ${students.length} students` });
    } catch (error) {
      toast({ title: 'Export Failed', description: 'Unable to export students', variant: 'destructive' });
    }
  };

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
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(s)}><Edit size={14} /></Button>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enroll New Student</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="family">Family</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-4">
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
                  <Label>Middle Name</Label>
                  <Input value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} placeholder="Middle name" />
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
                  <Label>Nationality</Label>
                  <Input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <Input value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select value={form.bloodGroup} onValueChange={v => setForm({ ...form, bloodGroup: v })}>
                    <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <Input value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>NEMIS Number</Label>
                  <Input value={form.nemisNumber} onChange={e => setForm({ ...form, nemisNumber: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Residential Address *</Label>
                  <Input value={form.residentialAddress} onChange={e => setForm({ ...form, residentialAddress: e.target.value })} placeholder="Home address" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Postal Address</Label>
                  <Input value={form.postalAddress} onChange={e => setForm({ ...form, postalAddress: e.target.value })} placeholder="P.O. Box..." />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="academic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>House</Label>
                  <Input value={form.house} onChange={e => setForm({ ...form, house: e.target.value })} placeholder="e.g. Red House" />
                </div>
                <div className="space-y-2">
                  <Label>Previous School</Label>
                  <Input value={form.previousSchool} onChange={e => setForm({ ...form, previousSchool: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>KCPE Index Number</Label>
                  <Input value={form.kcpeIndexNumber} onChange={e => setForm({ ...form, kcpeIndexNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="expelled">Expelled</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                      <SelectItem value="dropout">Dropout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>KCPE Score</Label>
                  <Input type="number" value={form.kcpeScore} onChange={e => setForm({ ...form, kcpeScore: e.target.value })} placeholder="Out of 500" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="family" className="space-y-4">
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-sm font-semibold mb-3">Father's Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={form.father.name} onChange={e => setForm({ ...form, father: { ...form.father, name: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Number</Label>
                      <Input value={form.father.idNumber} onChange={e => setForm({ ...form, father: { ...form.father, idNumber: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={form.father.phone} onChange={e => setForm({ ...form, father: { ...form.father, phone: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={form.father.email} onChange={e => setForm({ ...form, father: { ...form.father, email: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input value={form.father.occupation} onChange={e => setForm({ ...form, father: { ...form.father, occupation: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Employer</Label>
                      <Input value={form.father.employer} onChange={e => setForm({ ...form, father: { ...form.father, employer: e.target.value } })} />
                    </div>
                  </div>
                </div>
                
                <div className="border-b pb-3">
                  <p className="text-sm font-semibold mb-3">Mother's Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={form.mother.name} onChange={e => setForm({ ...form, mother: { ...form.mother, name: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Number</Label>
                      <Input value={form.mother.idNumber} onChange={e => setForm({ ...form, mother: { ...form.mother, idNumber: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={form.mother.phone} onChange={e => setForm({ ...form, mother: { ...form.mother, phone: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={form.mother.email} onChange={e => setForm({ ...form, mother: { ...form.mother, email: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input value={form.mother.occupation} onChange={e => setForm({ ...form, mother: { ...form.mother, occupation: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Employer</Label>
                      <Input value={form.mother.employer} onChange={e => setForm({ ...form, mother: { ...form.mother, employer: e.target.value } })} />
                    </div>
                  </div>
                </div>

                <div className="border-b pb-3">
                  <p className="text-sm font-semibold mb-3">Guardian Details (if applicable)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={form.guardian.name} onChange={e => setForm({ ...form, guardian: { ...form.guardian, name: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input value={form.guardian.relationship} onChange={e => setForm({ ...form, guardian: { ...form.guardian, relationship: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={form.guardian.phone} onChange={e => setForm({ ...form, guardian: { ...form.guardian, phone: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={form.guardian.email} onChange={e => setForm({ ...form, guardian: { ...form.guardian, email: e.target.value } })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Primary Contact *</Label>
                  <Select value={form.primaryContactType} onValueChange={v => setForm({ ...form, primaryContactType: v as 'father' | 'mother' | 'guardian' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="medical" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medical Insurance</Label>
                  <Input value={form.medicalInsurance} onChange={e => setForm({ ...form, medicalInsurance: e.target.value })} placeholder="Insurance provider" />
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.hasDisability} onChange={e => setForm({ ...form, hasDisability: e.target.checked })} className="h-4 w-4" />
                    <span className="text-sm">Has Disability</span>
                  </label>
                </div>
                {form.hasDisability && (
                  <div className="col-span-2 space-y-2">
                    <Label>Disability Details</Label>
                    <Input value={form.disabilityDetails} onChange={e => setForm({ ...form, disabilityDetails: e.target.value })} placeholder="Describe the disability..." />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.isBoarding} onChange={e => setForm({ ...form, isBoarding: e.target.checked })} className="h-4 w-4" />
                    <span className="text-sm">Boarding Student</span>
                  </label>
                </div>
                <div className="space-y-2 flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.usesTransport} onChange={e => setForm({ ...form, usesTransport: e.target.checked })} className="h-4 w-4" />
                    <span className="text-sm">Uses School Transport</span>
                  </label>
                </div>
                
                {form.isBoarding && (
                  <>
                    <div className="space-y-2">
                      <Label>Dormitory</Label>
                      <Input value={form.dormitory} onChange={e => setForm({ ...form, dormitory: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Room Number</Label>
                      <Input value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bed Number</Label>
                      <Input value={form.bedNumber} onChange={e => setForm({ ...form, bedNumber: e.target.value })} />
                    </div>
                  </>
                )}
                
                {form.usesTransport && (
                  <div className="space-y-2">
                    <Label>Transport Route</Label>
                    <Input value={form.transportRoute} onChange={e => setForm({ ...form, transportRoute: e.target.value })} />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Enroll Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="family">Family</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-4">
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
                  <Label>Middle Name</Label>
                  <Input value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} placeholder="Middle name" />
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
                  <Label>Nationality</Label>
                  <Input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="academic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="expelled">Expelled</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                      <SelectItem value="dropout">Dropout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="family" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><h3 className="text-sm font-semibold">Father Information</h3></div>
                <div className="space-y-2"><Label>Name</Label><Input value={form.father.name} onChange={e => setForm({ ...form, father: { ...form.father, name: e.target.value } })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.father.phone} onChange={e => setForm({ ...form, father: { ...form.father, phone: e.target.value } })} /></div>
              </div>
            </TabsContent>

            <TabsContent value="medical" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medical Insurance</Label>
                  <Input value={form.medicalInsurance} onChange={e => setForm({ ...form, medicalInsurance: e.target.value })} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.isBoarding} onChange={e => setForm({ ...form, isBoarding: e.target.checked })} className="h-4 w-4" />
                    <span className="text-sm">Boarding Student</span>
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
