'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { SchoolConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<Partial<SchoolConfig>>({});
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'school');

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: async () => { const res = await api.get('/config'); return res.data.data as SchoolConfig; },
  });

  useEffect(() => { if (data) setConfig(data); }, [data]);

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<SchoolConfig>) => api.put('/config', updates),
    onSuccess: () => {
      toast({ title: 'Settings Saved', description: 'School configuration updated successfully' });
      qc.invalidateQueries({ queryKey: ['config'] });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' }),
  });

  const handleSave = () => updateMutation.mutate(config);

  const updateField = (field: string, value: unknown) => setConfig(prev => ({ ...prev, [field]: value }));

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/settings?tab=${value}`);
  };

  if (isLoading) return <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm">Configure your school ERP system</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
          Save All Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="school">School Info</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="fees">Fee Items</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="classes">Class Assignments</TabsTrigger>
          <TabsTrigger value="approvers">Approvers</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="tabs">Tab Visibility</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* School Info */}
        <TabsContent value="school">
          <Card>
            <CardHeader><CardTitle>School Information</CardTitle><CardDescription>Basic school details</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School Name *</Label>
                  <Input value={config.name || ''} onChange={e => updateField('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>School Code</Label>
                  <Input value={config.code || ''} onChange={e => updateField('code', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Motto</Label>
                  <Input value={config.motto || ''} onChange={e => updateField('motto', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>School Type</Label>
                  <Select value={config.type || 'day'} onValueChange={v => updateField('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day School</SelectItem>
                      <SelectItem value="boarding">Boarding School</SelectItem>
                      <SelectItem value="mixed">Mixed (Day + Boarding)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={config.phone || ''} onChange={e => updateField('phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={config.email || ''} onChange={e => updateField('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={config.website || ''} onChange={e => updateField('website', e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Currency Symbol</Label>
                  <Input value={config.currencySymbol || 'Ksh'} onChange={e => updateField('currencySymbol', e.target.value)} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input value={config.address || ''} onChange={e => updateField('address', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Config */}
        <TabsContent value="academic">
          <Card>
            <CardHeader><CardTitle>Academic Structure</CardTitle><CardDescription>Configure classes, streams, and promotion rules</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 block">Class Levels</Label>
                <p className="text-xs text-muted-foreground mb-3">Define the class/form levels in your school</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(config.classLevels || []).map((level, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                      <span className="text-sm">{level}</span>
                      <button onClick={() => updateField('classLevels', (config.classLevels || []).filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    const name = prompt('Enter class level name (e.g., Form 5):');
                    if (name) updateField('classLevels', [...(config.classLevels || []), name]);
                  }}>
                    <Plus size={14} className="mr-1" /> Add Level
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-2 block">Promotion Criteria</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Min Pass Mark (%)</Label>
                    <Input type="number" value={config.promotionCriteria?.minPassMark || 50}
                      onChange={e => updateField('promotionCriteria', { ...config.promotionCriteria, minPassMark: parseInt(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Max Failed Subjects</Label>
                    <Input type="number" value={config.promotionCriteria?.maxFailedSubjects || 2}
                      onChange={e => updateField('promotionCriteria', { ...config.promotionCriteria, maxFailedSubjects: parseInt(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Min Attendance (%)</Label>
                    <Input type="number" value={config.promotionCriteria?.minAttendancePercent || 75}
                      onChange={e => updateField('promotionCriteria', { ...config.promotionCriteria, minAttendancePercent: parseInt(e.target.value) })} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-2 block">Assessment Weights</Label>
                <p className="text-xs text-muted-foreground mb-3">Define how different assessment types contribute to final grade</p>
                <div className="space-y-2">
                  {(config.assessmentWeights || []).map((aw, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Input value={aw.type} onChange={e => {
                        const updated = [...(config.assessmentWeights || [])];
                        updated[idx] = { ...aw, type: e.target.value };
                        updateField('assessmentWeights', updated);
                      }} className="flex-1" placeholder="Assessment type" />
                      <div className="flex items-center gap-2 w-36">
                        <Input type="number" value={aw.weight} onChange={e => {
                          const updated = [...(config.assessmentWeights || [])];
                          updated[idx] = { ...aw, weight: parseInt(e.target.value) };
                          updateField('assessmentWeights', updated);
                        }} className="w-20" />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive"
                        onClick={() => updateField('assessmentWeights', (config.assessmentWeights || []).filter((_, i) => i !== idx))}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateField('assessmentWeights', [...(config.assessmentWeights || []), { type: 'New Assessment', weight: 0 }])}>
                    <Plus size={14} className="mr-1" /> Add Assessment Type
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grading Schema */}
        <TabsContent value="grading">
          <Card>
            <CardHeader><CardTitle>Grading Schema</CardTitle><CardDescription>Configure grade boundaries and points</CardDescription></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Grade</th>
                      <th className="px-4 py-2 text-left font-medium">Min Score</th>
                      <th className="px-4 py-2 text-left font-medium">Max Score</th>
                      <th className="px-4 py-2 text-left font-medium">Points</th>
                      <th className="px-4 py-2 text-left font-medium">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(config.gradingSchema || []).map((g, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">
                          <Input value={g.letter} className="h-8 w-16" onChange={e => {
                            const updated = [...(config.gradingSchema || [])];
                            updated[idx] = { ...g, letter: e.target.value };
                            updateField('gradingSchema', updated);
                          }} />
                        </td>
                        <td className="px-4 py-2">
                          <Input type="number" value={g.minScore} className="h-8 w-20" onChange={e => {
                            const updated = [...(config.gradingSchema || [])];
                            updated[idx] = { ...g, minScore: parseInt(e.target.value) };
                            updateField('gradingSchema', updated);
                          }} />
                        </td>
                        <td className="px-4 py-2">
                          <Input type="number" value={g.maxScore} className="h-8 w-20" onChange={e => {
                            const updated = [...(config.gradingSchema || [])];
                            updated[idx] = { ...g, maxScore: parseInt(e.target.value) };
                            updateField('gradingSchema', updated);
                          }} />
                        </td>
                        <td className="px-4 py-2">
                          <Input type="number" value={g.points} className="h-8 w-20" onChange={e => {
                            const updated = [...(config.gradingSchema || [])];
                            updated[idx] = { ...g, points: parseInt(e.target.value) };
                            updateField('gradingSchema', updated);
                          }} />
                        </td>
                        <td className="px-4 py-2">
                          <Input value={g.remark} className="h-8" onChange={e => {
                            const updated = [...(config.gradingSchema || [])];
                            updated[idx] = { ...g, remark: e.target.value };
                            updateField('gradingSchema', updated);
                          }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Items */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fee Items</CardTitle>
                  <CardDescription>Configure fee structure for each class and term</CardDescription>
                </div>
                <Button size="sm" onClick={() => updateField('feeItems', [...(config.feeItems || []), { name: '', code: '', amount: 0, classes: [], terms: [1, 2, 3], isOptional: false }])}>
                  <Plus size={14} className="mr-1" /> Add Fee Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(config.feeItems || []).map((fi, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Fee Item {idx + 1}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => updateField('feeItems', (config.feeItems || []).filter((_, i) => i !== idx))}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input value={fi.name} className="h-8" onChange={e => {
                          const updated = [...(config.feeItems || [])];
                          updated[idx] = { ...fi, name: e.target.value };
                          updateField('feeItems', updated);
                        }} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Code</Label>
                        <Input value={fi.code} className="h-8" onChange={e => {
                          const updated = [...(config.feeItems || [])];
                          updated[idx] = { ...fi, code: e.target.value };
                          updateField('feeItems', updated);
                        }} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Amount (Ksh)</Label>
                        <Input type="number" value={fi.amount} className="h-8" onChange={e => {
                          const updated = [...(config.feeItems || [])];
                          updated[idx] = { ...fi, amount: parseFloat(e.target.value) };
                          updateField('feeItems', updated);
                        }} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Optional?</Label>
                        <Select value={fi.isOptional ? 'yes' : 'no'} onValueChange={v => {
                          const updated = [...(config.feeItems || [])];
                          updated[idx] = { ...fi, isOptional: v === 'yes' };
                          updateField('feeItems', updated);
                        }}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No (Mandatory)</SelectItem>
                            <SelectItem value="yes">Yes (Optional)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                {!(config.feeItems || []).length && (
                  <p className="text-center py-8 text-muted-foreground text-sm">No fee items configured. Add your first fee item above.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timetable Config */}
        <TabsContent value="timetable">
          <Card>
            <CardHeader><CardTitle>Timetable Configuration</CardTitle><CardDescription>Define school periods and schedule structure</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Periods Per Day</Label>
                  <Input type="number" value={config.periodsPerDay || 9} onChange={e => updateField('periodsPerDay', parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Period Duration (minutes)</Label>
                  <Input type="number" value={config.periodDuration || 40} onChange={e => updateField('periodDuration', parseInt(e.target.value))} />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Working Days</Label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    const isSelected = (config.workingDays || []).includes(day);
                    return (
                      <button key={day}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
                        onClick={() => {
                          const days = config.workingDays || [];
                          updateField('workingDays', isSelected ? days.filter(d => d !== day) : [...days, day]);
                        }}>
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Class Assignments */}
        <TabsContent value="classes">
          <ClassAssignmentsTab />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Notification Settings</CardTitle><CardDescription>Configure communication channels and automated alerts</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { key: 'smsEnabled', label: 'SMS Notifications', description: 'Send text messages to parents and staff' },
                  { key: 'emailEnabled', label: 'Email Notifications', description: 'Send email notifications' },
                  { key: 'whatsappEnabled', label: 'WhatsApp Notifications', description: 'Send WhatsApp messages via API' },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config[key as keyof SchoolConfig] ? 'bg-primary' : 'bg-muted'}`}
                      onClick={() => updateField(key, !config[key as keyof SchoolConfig])}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${config[key as keyof SchoolConfig] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvers */}
        <TabsContent value="approvers">
          <ApproversTab />
        </TabsContent>

        {/* Roles & Permissions */}
        <TabsContent value="roles">
          <RolesTab config={config} updateField={updateField} />
        </TabsContent>

        {/* Tab Visibility */}
        <TabsContent value="tabs">
          <TabVisibilityTab config={config} updateField={updateField} />
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements">
          <AnnouncementsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Class Assignments Component
function ClassAssignmentsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const { data: classes } = useQuery({
    queryKey: ['class-assignments'],
    queryFn: async () => {
      const res = await api.get('/settings/class-assignments');
      return res.data.data || [];
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const res = await api.get('/staff?role=teacher');
      return res.data.data || [];
    },
  });

  const assignMutation = useMutation({
    mutationFn: (data: { class: string; stream: string; teacherId: string }) => 
      api.post('/settings/assign-class-teacher', data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Class teacher assigned successfully' });
      qc.invalidateQueries({ queryKey: ['class-assignments'] });
      setSelectedClass('');
      setSelectedStream('');
      setSelectedTeacher('');
    },
    onError: () => toast({ title: 'Error', description: 'Failed to assign class teacher', variant: 'destructive' }),
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) => api.delete(`/settings/class-assignments/${assignmentId}`),
    onSuccess: () => {
      toast({ title: 'Removed', description: 'Class teacher assignment removed' });
      qc.invalidateQueries({ queryKey: ['class-assignments'] });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to remove assignment', variant: 'destructive' }),
  });

  const handleAssign = () => {
    if (!selectedClass || !selectedStream || !selectedTeacher) {
      toast({ title: 'Missing Info', description: 'Please select class, stream, and teacher', variant: 'destructive' });
      return;
    }
    assignMutation.mutate({ class: selectedClass, stream: selectedStream, teacherId: selectedTeacher });
  };

  const classOptions = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
  const streamOptions = ['East', 'West', 'North'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Teacher Assignments</CardTitle>
        <CardDescription>Assign teachers to classes for attendance marking and class management</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Assignment Form */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-3">Assign New Class Teacher</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger><SelectValue placeholder="Select Stream" /></SelectTrigger>
                <SelectContent>
                  {streamOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers?.map((t: any) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.firstName} {t.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAssign} disabled={assignMutation.isPending}>
                {assignMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Plus size={16} className="mr-2" />}
                Assign
              </Button>
            </div>
          </div>

          {/* Current Assignments */}
          <div>
            <h3 className="font-medium mb-3">Current Assignments</h3>
            {classes && classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {classes.map((assignment: any) => (
                  <div key={assignment._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{assignment.class} {assignment.stream}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.teacher?.firstName} {assignment.teacher?.lastName}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeMutation.mutate(assignment._id)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No class teachers assigned yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Approvers Tab Component
function ApproversTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]); // For single mode multi-select
  const [requestType, setRequestType] = useState('all');
  const [singleApproverId, setSingleApproverId] = useState(''); // For single assignment mode
  const [bulkApproverId, setBulkApproverId] = useState(''); // For bulk assignment mode
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectAllStaff, setSelectAllStaff] = useState(false);
  const [selectAllStudents, setSelectAllStudents] = useState(false);
  const [selectedClass, setSelectedClass] = useState(''); // For student class selection
  const [selectedStream, setSelectedStream] = useState(''); // For student stream selection

  const { data: approvers } = useQuery({
    queryKey: ['approvers'],
    queryFn: async () => { const res = await api.get('/settings/approvers'); return res.data.data; },
  });

  const { data: staff } = useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => { 
      const res = await api.get('/staff'); 
      return res.data.data; 
    },
  });

  const { data: students } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => { const res = await api.get('/students?limit=500'); return res.data.data; },
  });

  const setBulkApproverMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create approver settings for each selected subject
      const promises = data.subjects.map((subject: any) => 
        api.post('/settings/approvers', {
          subjectId: subject.id,
          subjectModel: subject.model,
          requestType: data.requestType,
          approverId: data.approverId,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Approvers set for all selected' });
      qc.invalidateQueries({ queryKey: ['approvers'] });
      setSelectedSubjects([]);
      setBulkApproverId('');
      setSelectAllStaff(false);
      setSelectAllStudents(false);
      setSelectedClass('');
      setSelectedStream('');
    },
    onError: () => toast({ title: 'Error', description: 'Failed to set bulk approvers', variant: 'destructive' }),
  });

  const handleSetApprover = () => {
    // Validate at least one staff member selected
    if (selectedStaffIds.length < 1) {
      toast({ title: 'Error', description: 'Please select at least one staff member', variant: 'destructive' });
      return;
    }

    if (!singleApproverId || singleApproverId.trim() === '') {
      toast({ title: 'Error', description: 'Please select an approver', variant: 'destructive' });
      return;
    }

    // Set approver for each selected staff member
    const promises = selectedStaffIds.map((staffId) => 
      api.post('/settings/approvers', {
        subjectId: staffId.trim(),
        subjectModel: 'Staff',
        requestType,
        approverId: singleApproverId.trim(),
      })
    );

    Promise.all(promises)
      .then(() => {
        toast({ title: 'Success', description: `Approver set for ${selectedStaffIds.length} staff member(s)` });
        qc.invalidateQueries({ queryKey: ['approvers'] });
        setSelectedStaffIds([]);
        setSingleApproverId('');
      })
      .catch(() => {
        toast({ title: 'Error', description: 'Failed to set approver', variant: 'destructive' });
      });
  };

  const handleBulkSetApprover = () => {
    // Strict validation for approver
    if (!bulkApproverId || bulkApproverId.trim() === '') {
      toast({ title: 'Error', description: 'Please select an approver', variant: 'destructive' });
      return;
    }

    const subjects: any[] = [];

    if (selectAllStaff) {
      staff?.forEach((s: any) => {
        if (s._id && s._id.trim() !== '') {
          subjects.push({ id: s._id.trim(), model: 'Staff' });
        }
      });
    } else if (selectedClass && selectedStream) {
      // Class-based student selection
      const studentsInClass = getStudentsInClass();
      studentsInClass.forEach((s: any) => {
        if (s._id && s._id.trim() !== '') {
          subjects.push({ id: s._id.trim(), model: 'Student' });
        }
      });
    } else if (selectAllStudents) {
      students?.forEach((s: any) => {
        if (s._id && s._id.trim() !== '') {
          subjects.push({ id: s._id.trim(), model: 'Student' });
        }
      });
    } else if (selectedSubjects.length > 0) {
      selectedSubjects.forEach(id => {
        // Filter out empty strings and null values
        if (id && id.trim() !== '') {
          const isStaff = staff?.find((s: any) => s._id === id);
          subjects.push({ id: id.trim(), model: isStaff ? 'Staff' : 'Student' });
        }
      });
    }

    if (subjects.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one staff/student', variant: 'destructive' });
      return;
    }

    setBulkApproverMutation.mutate({ subjects, requestType, approverId: bulkApproverId.trim() });
  };

  const toggleSubjectSelection = (id: string, e?: React.ChangeEvent<HTMLInputElement>) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedSubjects(prev => {
      return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    });
  };

  const toggleStaffSelection = (id: string, e?: React.ChangeEvent<HTMLInputElement>) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedStaffIds(prev => {
      return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    });
  };

  const handleSelectAllStaff = () => {
    setSelectAllStaff(!selectAllStaff);
    setSelectAllStudents(false);
    setSelectedSubjects([]);
  };

  const handleSelectAllStudents = () => {
    setSelectAllStudents(!selectAllStudents);
    setSelectAllStaff(false);
    setSelectedSubjects([]);
  };

  // Get students for selected class
  const getStudentsInClass = () => {
    if (!selectedClass || !selectedStream) return [];
    return students?.filter((s: any) => 
      s.currentClass === selectedClass && s.currentStream === selectedStream
    ) || [];
  };

  // Get class teacher for selected class
  const getClassTeacher = () => {
    if (!selectedClass || !selectedStream) return null;
    const classStr = `${selectedClass} ${selectedStream}`;
    return staff?.find((s: any) => s.classTeacherOf === classStr);
  };

  // Get unique classes from students
  const getUniqueClasses = () => {
    const classes = new Set<string>();
    students?.forEach((s: any) => {
      if (s.currentClass) classes.add(s.currentClass);
    });
    return Array.from(classes).sort();
  };

  // Get streams for selected class
  const getStreamsForClass = () => {
    if (!selectedClass) return [];
    const streams = new Set<string>();
    students?.filter((s: any) => s.currentClass === selectedClass)
      .forEach((s: any) => {
        if (s.currentStream) streams.add(s.currentStream);
      });
    return Array.from(streams).sort();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approver Settings</CardTitle>
        <CardDescription>Set who approves requests for each staff member or student</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="flex gap-2 border-b pb-3">
            <Button 
              variant={bulkMode ? "outline" : "default"} 
              size="sm" 
              onClick={() => { 
                setBulkMode(false); 
                setSelectedSubjects([]); 
                setSelectAllStaff(false); 
                setSelectAllStudents(false);
              }}
            >
              Single Assignment (Staff Only)
            </Button>
            <Button 
              variant={bulkMode ? "default" : "outline"} 
              size="sm" 
              onClick={() => { 
                setBulkMode(true); 
                setSelectedStaffIds([]);
              }}
            >
              Bulk Assignment
            </Button>
          </div>

          {!bulkMode && (
            /* Single Assignment Form - Staff Only, Multi-Select */
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Assign Approver (Select Staff Members)</h3>
              
              {/* Staff Selection */}
              <div className="mb-4 max-h-[250px] overflow-y-auto border rounded p-3">
                <p className="text-sm font-medium mb-2">Select Staff Members:</p>
                <div className="space-y-1">
                  {staff?.map((s: any) => (
                    <label key={`staff-checkbox-${s._id}`} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedStaffIds.includes(s._id)}
                        onChange={(e) => toggleStaffSelection(s._id, e)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{s.firstName} {s.lastName} - {s.staffId}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedStaffIds.length > 0 && (
                <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                  <strong>{selectedStaffIds.length}</strong> staff member(s) selected
                </div>
              )}

              {/* Controls */}
              <div className="grid grid-cols-3 gap-3">
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="leave">Leave Only</SelectItem>
                    <SelectItem value="medical">Medical Only</SelectItem>
                    <SelectItem value="permission">Permission Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  key="single-mode-approver-select"
                  value={String(singleApproverId || '')} 
                  onValueChange={(value) => setSingleApproverId(String(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff?.filter((s: any) => s.userId).map((s: any) => {
                      const itemValue = String(s.userId._id || s.userId);
                      return (
                        <SelectItem key={`single-approver-${itemValue}`} value={itemValue}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleSetApprover} 
                  disabled={selectedStaffIds.length === 0 || !singleApproverId || singleApproverId.trim() === ''}
                >
                  <Plus size={16} className="mr-2" />
                  Set for {selectedStaffIds.length} Staff
                </Button>
              </div>
            </div>
          )}

          {bulkMode && (
            /* Bulk Assignment Form */
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Assign Approver (Bulk)</h3>
              
              {/* Quick Select Options */}
              <div className="flex gap-4 mb-4 p-3 bg-muted rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectAllStaff} 
                    onChange={handleSelectAllStaff}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Select All Staff ({staff?.length || 0})</span>
                </label>
              </div>

              {/* Class-based Student Selection */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Assign Class Teacher for Students</h4>
                  {(selectedClass || selectedStream) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedClass('');
                        setSelectedStream('');
                        setBulkApproverId('');
                      }}
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
                {!students ? (
                  <p className="text-sm text-muted-foreground">Loading students...</p>
                ) : getUniqueClasses().length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students found in the system</p>
                ) : (
                  <>
                    <div className="mb-3 p-2 bg-white rounded border text-xs text-muted-foreground">
                      Available classes: {getUniqueClasses().join(', ')} ({students?.length || 0} students total)
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <Label className="text-xs">Select Class</Label>
                        <Select 
                          value={selectedClass || undefined} 
                          onValueChange={(val) => {
                            console.log('Class selected:', val);
                            setSelectedClass(val);
                            setSelectedStream('');
                            setSelectAllStudents(false);
                            setBulkApproverId('');
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {getUniqueClasses().map((cls) => (
                              <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Select Stream</Label>
                        <Select 
                          value={selectedStream || undefined} 
                          onValueChange={(val) => {
                            console.log('Stream selected:', val);
                            setSelectedStream(val);
                            setSelectAllStudents(false);
                            // Auto-set class teacher
                            const classTeacher = staff?.find((s: any) => s.classTeacherOf === `${selectedClass} ${val}`);
                            console.log('Class teacher found:', classTeacher);
                            if (classTeacher && classTeacher.userId) {
                              setBulkApproverId(String(classTeacher.userId._id || classTeacher.userId));
                            } else {
                              setBulkApproverId('');
                            }
                          }} 
                          disabled={!selectedClass}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={selectedClass ? "Choose Stream" : "Select class first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {getStreamsForClass().length > 0 ? (
                              getStreamsForClass().map((stream) => (
                                <SelectItem key={stream} value={stream}>{stream}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-streams" disabled>No streams found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Class Teacher</Label>
                        <Input 
                          value={getClassTeacher() ? `${getClassTeacher()?.firstName} ${getClassTeacher()?.lastName}` : (selectedClass && selectedStream ? 'Not assigned' : '')} 
                          disabled 
                          className="bg-gray-100"
                          placeholder="Auto-filled"
                        />
                        {selectedClass && selectedStream && !getClassTeacher() && (
                          <p className="text-xs text-amber-600 mt-1">
                            No class teacher assigned. Please select an approver manually below.
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedClass && selectedStream && (
                      <div className="text-sm text-blue-700">
                        <strong>{getStudentsInClass().length}</strong> student(s) in {selectedClass} {selectedStream}
                        {getStudentsInClass().length === 0 && (
                          <span className="text-amber-600"> - Warning: No students found in this class</span>
                        )}
                      </div>
                    )}
                    {selectedClass && !selectedStream && (
                      <div className="text-sm text-muted-foreground">
                        Please select a stream to continue
                      </div>
                    )}
                  </>
                )}
              </div>

              {!selectAllStaff && !selectAllStudents && !selectedClass && (
                /* Individual Selection */
                <div className="mb-4 max-h-[300px] overflow-y-auto border rounded p-3">
                  <p className="text-sm font-medium mb-2">Select Individuals:</p>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Staff</div>
                    {staff?.map((s: any) => (
                      <label key={`bulk-staff-${s._id}`} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedSubjects.includes(s._id)}
                          onChange={(e) => toggleSubjectSelection(s._id, e)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{s.firstName} {s.lastName} - {s.staffId}</span>
                      </label>
                    ))}
                    <div className="text-xs text-muted-foreground font-medium mb-1 mt-3 pt-2 border-t">Students</div>
                    {students?.slice(0, 50).map((s: any) => (
                      <label key={`bulk-student-${s._id}`} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedSubjects.includes(s._id)}
                          onChange={(e) => toggleSubjectSelection(s._id, e)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{s.firstName} {s.lastName} - {s.admissionNumber}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk Assignment Controls */}
              <div className="grid grid-cols-3 gap-3">
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="leave">Leave Only</SelectItem>
                    <SelectItem value="medical">Medical Only</SelectItem>
                    <SelectItem value="permission">Permission Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  key="bulk-mode-approver-select"
                  value={String(bulkApproverId || '')} 
                  onValueChange={(value) => setBulkApproverId(String(value))}
                >
                  <SelectTrigger><SelectValue placeholder="Select Approver" /></SelectTrigger>
                  <SelectContent>
                    {staff?.filter((s: any) => s.userId).map((s: any) => {
                      const itemValue = String(s.userId._id || s.userId);
                      return (
                        <SelectItem key={`bulk-approver-${itemValue}`} value={itemValue}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleBulkSetApprover} 
                  disabled={
                    setBulkApproverMutation.isPending || 
                    !bulkApproverId || 
                    Boolean(selectedClass && selectedStream && getStudentsInClass().length === 0)
                  }
                >
                  {setBulkApproverMutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Plus size={16} className="mr-2" />}
                  Set for {selectAllStaff ? `All Staff (${staff?.length})` : (selectedClass && selectedStream) ? `${selectedClass} ${selectedStream} (${getStudentsInClass().length})` : selectAllStudents ? `All Students (${students?.length})` : `Selected (${selectedSubjects.length})`}
                </Button>
              </div>
            </div>
          )}

          {/* Current Approvers */}
          <div>
            <h3 className="font-medium mb-3">Current Approvers</h3>
            {approvers && approvers.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {approvers.map((appr: any) => (
                  <div key={appr._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{appr.subjectName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {appr.requestType} → Approver: {appr.approverName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No approvers set yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Roles & Permissions Tab
function RolesTab({ config, updateField }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles & Permissions</CardTitle>
        <CardDescription>Manage user roles and their permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {config.roleSettings?.map((role: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">{role.displayName}</p>
                  <p className="text-xs text-muted-foreground">{role.roleName}</p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${role.isActive ? 'bg-primary' : 'bg-muted'}`}
                  onClick={() => {
                    const updated = [...(config.roleSettings || [])];
                    updated[idx] = { ...updated[idx], isActive: !updated[idx].isActive };
                    updateField('roleSettings', updated);
                  }}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${role.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((perm: string, pidx: number) => (
                  <span key={pidx} className="text-xs bg-muted px-2 py-0.5 rounded">{perm}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Tab Visibility Tab
function TabVisibilityTab({ config, updateField }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tab Visibility</CardTitle>
        <CardDescription>Control which tabs are visible to which roles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {config.tabSettings?.map((tab: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium capitalize">{tab.tabName}</p>
                <p className="text-xs text-muted-foreground">
                  Visible to: {tab.roles.join(', ')}
                </p>
              </div>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tab.isVisible ? 'bg-primary' : 'bg-muted'}`}
                onClick={() => {
                  const updated = [...(config.tabSettings || [])];
                  updated[idx] = { ...updated[idx], isVisible: !updated[idx].isVisible };
                  updateField('tabSettings', updated);
                }}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${tab.isVisible ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Announcements Tab
function AnnouncementsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', audience: ['all'], isPinned: false });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => { const res = await api.get('/announcements'); return res.data.data; },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/announcements', form),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Announcement created' });
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setShowCreate(false);
      setForm({ title: '', content: '', audience: ['all'], isPinned: false });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to create announcement', variant: 'destructive' }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Create and manage school announcements</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-2" /> New Announcement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {announcements && announcements.length > 0 ? (
              announcements.map((ann: any) => (
                <div key={ann._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{ann.title}</p>
                        {ann.isPinned && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Pinned</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{ann.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(ann.createdAt).toLocaleDateString()} • Audience: {ann.audience.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No announcements yet</p>
            )}
          </div>
        )}

        {/* Create Dialog */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-background p-6 rounded-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-4">New Announcement</h3>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isPinned}
                    onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                    className="rounded"
                  />
                  <Label>Pin this announcement</Label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
