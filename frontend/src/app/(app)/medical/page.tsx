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
    currentClass: string;
    admissionNumber: string;
  };
  date: string;
  time: string;
  complaint: string;
  assessment: string;
  treatment: string;
  medicationDispensed: {
    name: string;
    dosage: string;
    quantity: number;
  }[];
  referredToHospital: boolean;
  hospitalName?: string;
  parentNotified: boolean;
  attendedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MedicalPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');

  const [form, setForm] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    complaint: '',
    assessment: '',
    treatment: '',
    medicationDispensed: [{ name: '', dosage: '', quantity: 0 }],
    referredToHospital: false,
    hospitalName: '',
    parentNotified: false,
    followUpDate: '',
    notes: '',
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
    queryKey: ['medical-visits'],
    queryFn: async () => {
      const res = await api.get('/medical/visits');
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
        studentId: data.studentId,
        date: data.date,
        time: data.time,
        complaint: data.complaint,
        assessment: data.assessment,
        treatment: data.treatment,
        medicationDispensed: data.medicationDispensed.filter(m => m.name && m.dosage),
        referredToHospital: data.referredToHospital,
        hospitalName: data.referredToHospital ? data.hospitalName : undefined,
        parentNotified: data.parentNotified,
        followUpDate: data.followUpDate || undefined,
        notes: data.notes,
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

  const resetForm = () => {
    setForm({
      studentId: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      complaint: '',
      assessment: '',
      treatment: '',
      medicationDispensed: [{ name: '', dosage: '', quantity: 0 }],
      referredToHospital: false,
      hospitalName: '',
      parentNotified: false,
      followUpDate: '',
      notes: '',
    });
    setSelectedStudent(null);
    setStudentSearch('');
  };

  const addMedication = () => {
    setForm({
      ...form,
      medicationDispensed: [...form.medicationDispensed, { name: '', dosage: '', quantity: 0 }],
    });
  };

  const removeMedication = (index: number) => {
    setForm({
      ...form,
      medicationDispensed: form.medicationDispensed.filter((_, i) => i !== index),
    });
  };

  const updateMedication = (index: number, field: string, value: string | number) => {
    const updated = [...form.medicationDispensed];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, medicationDispensed: updated });
  };

  const selectStudent = (student: any) => {
    setSelectedStudent(student);
    setForm({ ...form, studentId: student._id });
    setStudentSearch(`${student.firstName} ${student.lastName} - ${student.admissionNumber}`);
  };

  const totalVisits = visits?.length || 0;
  const hospitalReferred = visits?.filter(v => v.referredToHospital).length || 0;
  const parentNotified = visits?.filter(v => v.parentNotified).length || 0;

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
                <p className="text-2xl font-bold">{hospitalReferred}</p>
                <p className="text-sm text-muted-foreground">Hospital Referred</p>
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
                <p className="text-2xl font-bold">{parentNotified}</p>
                <p className="text-sm text-muted-foreground">Parents Notified</p>
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
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Medications</TableHead>
                  <TableHead>Hospital Referral</TableHead>
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
                          {visit.studentId?.admissionNumber} • {visit.studentId?.currentClass} {visit.studentId?.currentStream}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{formatDate(visit.date)}</p>
                        <p className="text-xs text-muted-foreground">{visit.time}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate" title={visit.complaint}>{visit.complaint}</p>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate" title={visit.assessment || ''}>{visit.assessment || '—'}</p>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate" title={visit.treatment || ''}>{visit.treatment || '—'}</p>
                    </TableCell>
                    <TableCell>
                      {visit.medicationDispensed && visit.medicationDispensed.length > 0 ? (
                        <div className="space-y-1">
                          {visit.medicationDispensed.slice(0, 2).map((med, idx) => (
                            <p key={idx} className="text-xs">
                              {med.name} - {med.dosage} (×{med.quantity})
                            </p>
                          ))}
                          {visit.medicationDispensed.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{visit.medicationDispensed.length - 2} more
                            </p>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {visit.referredToHospital ? (
                        <div>
                          <Badge variant="destructive">Referred</Badge>
                          {visit.hospitalName && (
                            <p className="text-xs text-muted-foreground mt-1">{visit.hospitalName}</p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({ 
                              title: 'Visit Details', 
                              description: `Attended by: ${visit.attendedBy?.firstName || 'Unknown'} ${visit.attendedBy?.lastName || ''}` 
                            });
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
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
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Complaint *</Label>
              <Textarea
                value={form.complaint}
                onChange={(e) => setForm({ ...form, complaint: e.target.value })}
                placeholder="Describe the student's complaint or symptoms..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Assessment</Label>
              <Textarea
                value={form.assessment}
                onChange={(e) => setForm({ ...form, assessment: e.target.value })}
                placeholder="Medical assessment or diagnosis..."
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

              {form.medicationDispensed.map((med, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-3">
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
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={med.quantity}
                          onChange={(e) => updateMedication(index, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="e.g., 10"
                        />
                      </div>
                    </div>

                    {form.medicationDispensed.length > 1 && (
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

            {/* Hospital Referral */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="referredToHospital"
                  checked={form.referredToHospital}
                  onChange={(e) =>
                    setForm({ ...form, referredToHospital: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="referredToHospital">Referred to Hospital</Label>
              </div>

              {form.referredToHospital && (
                <div className="space-y-2">
                  <Label>Hospital Name</Label>
                  <Input
                    value={form.hospitalName}
                    onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                    placeholder="Enter hospital name"
                  />
                </div>
              )}
            </div>

            {/* Parent Notification */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="parentNotified"
                checked={form.parentNotified}
                onChange={(e) =>
                  setForm({ ...form, parentNotified: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="parentNotified">Parent/Guardian Notified</Label>
            </div>

            {/* Follow-up Date */}
            <div className="space-y-2">
              <Label>Follow-up Date (Optional)</Label>
              <Input
                type="date"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVisit(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createVisitMutation.mutate(form)}
              disabled={!form.studentId || !form.date || !form.time || !form.complaint || createVisitMutation.isPending}
            >
              {createVisitMutation.isPending ? 'Saving...' : 'Record Visit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
