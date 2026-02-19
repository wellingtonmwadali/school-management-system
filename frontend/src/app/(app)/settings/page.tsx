'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [config, setConfig] = useState<Partial<SchoolConfig>>({});

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

      <Tabs defaultValue="school">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="school">School Info</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="fees">Fee Items</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
