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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Activity, 
  AlertCircle, 
  Pill, 
  FileText,
  Stethoscope,
  Thermometer
} from 'lucide-react';

const VISIT_TYPES = ['Sick Visit', 'Injury', 'Medication', 'Checkup', 'Emergency', 'Follow-up'];
const SEVERITY_LEVELS = ['Minor', 'Moderate', 'Serious', 'Critical'];
const COMMON_MEDICATIONS = [
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
  'Aspirin',
  'Antihistamine',
  'Cough Syrup',
  'Antacid',
  'Antiseptic',
  'Bandages',
  'Other'
];

interface MedicalVisit {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    currentStream: string;
    admissionNumber: string;
  };
  visitType: string;
  symptoms: string;
  diagnosis: string;
  severity: string;
  temperature?: number;
  bloodPressure?: string;
  medication: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  treatment: string;
  notes: string;
  date: string;
  nurseId: string;
  followUpRequired: boolean;
  followUpDate?: string;
  status: 'active' | 'resolved' | 'referred';
}

export default function MedicalPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');

  const [form, setForm] = useState({
    studentId: '',
    visitType: 'Sick Visit',
    symptoms: '',
    diagnosis: '',
    severity: 'Minor',
    temperature: '',
    bloodPressure: '',
    medication: [{ name: '', dosage: '', frequency: '', duration: '' }],
    treatment: '',
    notes: '',
    followUpRequired: false,
    followUpDate: '',
  });

  // Search students
  const { data: students } = useQuery({
    queryKey: ['medical-students-search', studentSearch],
    queryFn: async () => {
      if (!studentSearch || studentSearch.length < 2) return [];
      const res = await api.get(`/students?search=${studentSearch}&limit=10`);
      return res.data.data;
    },
    enabled: studentSearch.length >= 2,
  });

  // Get medical visits
  const { data: visits, isLoading } = useQuery({
    queryKey: ['medical-visits', filterType, filterSeverity, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType && filterType !== 'all') params.append('visitType', filterType);
      if (filterSeverity && filterSeverity !== 'all') params.append('severity', filterSeverity);
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      const res = await api.get(`/medical/visits?${params}`);
      return res.data.data as MedicalVisit[];
    },
  });

  // Get statistics
  const { data: stats } = useQuery({
    queryKey: ['medical-stats'],
    queryFn: async () => {
      const res = await api.get('/medical/stats');
      return res.data.data;
    },
  });

  // Create medical visit
  const createVisitMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        ...data,
        temperature: data.temperature ? parseFloat(data.temperature) : undefined,
        medication: data.medication.filter(m => m.name && m.dosage),
      };
      return api.post('/medical/visits', payload);
    },
    onSuccess: () => {
      toast({ title: 'Visit Recorded', description: 'Medical visit saved successfully' });
      queryClient.invalidateQueries({ queryKey: ['medical-visits'] });
      queryClient.invalidateQueries({ queryKey: ['medical-stats'] });
      setShowAddVisit(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to record visit', 
        variant: 'destructive' 
      });
    },
  });

  // Update visit status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      api.patch(`/medical/visits/${id}`, { status }),
    onSuccess: () => {
      toast({ title: 'Status Updated', description: 'Visit status updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['medical-visits'] });
    },
  });

  const resetForm = () => {
    setForm({
      studentId: '',
      visitType: 'Sick Visit',
      symptoms: '',
      diagnosis: '',
      severity: 'Minor',
      temperature: '',
      bloodPressure: '',
      medication: [{ name: '', dosage: '', frequency: '', duration: '' }],
      treatment: '',
      notes: '',
      followUpRequired: false,
      followUpDate: '',
    });
    setSelectedStudent(null);
    setStudentSearch('');
  };

  const addMedication = () => {
    setForm({
      ...form,
      medication: [...form.medication, { name: '', dosage: '', frequency: '', duration: '' }],
    });
  };

  const removeMedication = (index: number) => {
    setForm({
      ...form,
      medication: form.medication.filter((_, i) => i !== index),
    });
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...form.medication];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, medication: updated });
  };

  const selectStudent = (student: any) => {
    setSelectedStudent(student);
    setForm({ ...form, studentId: student._id });
    setStudentSearch(`${student.firstName} ${student.lastName} - ${student.admissionNumber}`);
  };

  const totalVisits = visits?.length || 0;
  const activeVisits = visits?.filter(v => v.status === 'active').length || 0;
  const criticalCases = visits?.filter(v => v.severity === 'Critical').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medical Center</h1>
          <p className="text-muted-foreground">Track student health visits and medications</p>
        </div>
        <Button onClick={() => setShowAddVisit(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Visit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVisits}</p>
                <p className="text-sm text-muted-foreground">Total Visits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeVisits}</p>
                <p className="text-sm text-muted-foreground">Active Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalCases}</p>
                <p className="text-sm text-muted-foreground">Critical Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Pill className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.medicationsDispensed || 0}</p>
                <p className="text-sm text-muted-foreground">Medications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterType || undefined} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Visit Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {VISIT_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSeverity || undefined} onValueChange={(v) => setFilterSeverity(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {SEVERITY_LEVELS.map(level => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus || undefined} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="referred">Referred</SelectItem>
          </SelectContent>
        </Select>

        {(filterType || filterSeverity || (filterStatus && filterStatus !== 'active')) && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterType('');
              setFilterSeverity('');
              setFilterStatus('active');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Visits</CardTitle>
          <CardDescription>Recent student health visits and treatments</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading visits...</div>
          ) : visits && visits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Visit Type</TableHead>
                  <TableHead>Symptoms</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((visit) => (
                  <TableRow key={visit._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {visit.studentId?.firstName} {visit.studentId?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {visit.studentId?.admissionNumber} • {visit.studentId?.currentStream}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{visit.visitType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{visit.symptoms}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{visit.diagnosis || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          visit.severity === 'Critical'
                            ? 'destructive'
                            : visit.severity === 'Serious'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {visit.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {visit.medication && visit.medication.length > 0 ? (
                        <div className="space-y-1">
                          {visit.medication.slice(0, 2).map((med, idx) => (
                            <p key={idx} className="text-xs">
                              {med.name} - {med.dosage}
                            </p>
                          ))}
                          {visit.medication.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{visit.medication.length - 2} more
                            </p>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(visit.date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          visit.status === 'active'
                            ? 'default'
                            : visit.status === 'resolved'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {visit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {visit.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: visit._id, status: 'resolved' })
                            }
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              No medical visits recorded
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Visit Dialog */}
      <Dialog open={showAddVisit} onOpenChange={setShowAddVisit}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Medical Visit</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
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

            {/* Visit Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visit Type *</Label>
                <Select
                  value={form.visitType}
                  onValueChange={(v) => setForm({ ...form, visitType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity *</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v) => setForm({ ...form, severity: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Temperature (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                  placeholder="36.5"
                />
              </div>

              <div className="space-y-2">
                <Label>Blood Pressure</Label>
                <Input
                  value={form.bloodPressure}
                  onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })}
                  placeholder="120/80"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Symptoms *</Label>
              <Textarea
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                placeholder="Describe the symptoms..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                placeholder="Medical diagnosis..."
                rows={2}
              />
            </div>

            {/* Medication */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Medication Administered</Label>
                <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Medication
                </Button>
              </div>

              {form.medication.map((med, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Medication Name</Label>
                        <Select
                          value={med.name}
                          onValueChange={(v) => updateMedication(index, 'name', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select medication" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_MEDICATIONS.map((medication) => (
                              <SelectItem key={medication} value={medication}>
                                {medication}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Dosage</Label>
                        <Input
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Input
                          value={med.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          placeholder="e.g., 3 times daily"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          value={med.duration}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          placeholder="e.g., 5 days"
                        />
                      </div>
                    </div>

                    {form.medication.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => removeMedication(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Treatment / Care Given</Label>
              <Textarea
                value={form.treatment}
                onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                placeholder="Treatment and care provided..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>

            {/* Follow-up */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={form.followUpRequired}
                  onChange={(e) =>
                    setForm({ ...form, followUpRequired: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="followUp">Follow-up Required</Label>
              </div>

              {form.followUpRequired && (
                <div className="space-y-2">
                  <Label>Follow-up Date</Label>
                  <Input
                    type="date"
                    value={form.followUpDate}
                    onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVisit(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createVisitMutation.mutate(form)}
              disabled={!form.studentId || !form.symptoms || createVisitMutation.isPending}
            >
              {createVisitMutation.isPending ? 'Saving...' : 'Record Visit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
