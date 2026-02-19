'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Exam } from '@/types';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Plus, BookOpen, ClipboardList, BarChart2, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AcademicsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showMarkEntry, setShowMarkEntry] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [analysisExam, setAnalysisExam] = useState<string>('');

  const [examForm, setExamForm] = useState({
    name: '', type: 'End-Term', academicYear: '2025', term: 1,
    classes: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
    startDate: '', endDate: '',
  });

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => { const res = await api.get('/exams'); return res.data.data as Exam[]; },
  });

  const { data: analysisData } = useQuery({
    queryKey: ['exam-analysis', analysisExam],
    queryFn: async () => {
      const res = await api.get(`/marks/analysis/${analysisExam}`);
      return res.data.data;
    },
    enabled: !!analysisExam,
  });

  const createExamMutation = useMutation({
    mutationFn: () => api.post('/exams', examForm),
    onSuccess: () => {
      toast({ title: 'Exam Created', description: 'Exam has been created successfully' });
      qc.invalidateQueries({ queryKey: ['exams'] });
      setShowCreateExam(false);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to create exam', variant: 'destructive' }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Academics</h1>
        <p className="text-muted-foreground text-sm">Manage exams, marks, and academic performance</p>
      </div>

      <Tabs defaultValue="exams">
        <TabsList>
          <TabsTrigger value="exams"><ClipboardList size={14} className="mr-1.5" />Exams</TabsTrigger>
          <TabsTrigger value="marks"><BookOpen size={14} className="mr-1.5" />Marks Entry</TabsTrigger>
          <TabsTrigger value="analysis"><BarChart2 size={14} className="mr-1.5" />Analysis</TabsTrigger>
        </TabsList>

        {/* Exams List */}
        <TabsContent value="exams" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowCreateExam(true)}>
              <Plus size={16} className="mr-2" /> Create Exam
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {examsLoading ? (
                <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(exams || []).map(exam => (
                      <TableRow key={exam._id} className="cursor-pointer" onClick={() => setAnalysisExam(exam._id)}>
                        <TableCell className="font-medium text-sm">{exam.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">{exam.type}</span>
                        </TableCell>
                        <TableCell className="text-sm">{exam.academicYear}</TableCell>
                        <TableCell className="text-sm">Term {exam.term}</TableCell>
                        <TableCell className="text-sm">{exam.classes.length} classes</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(exam.startDate)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(exam.endDate)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${exam.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {exam.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!(exams || []).length && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No exams created yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marks Entry */}
        <TabsContent value="marks">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Marks Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Select exam..." /></SelectTrigger>
                  <SelectContent>
                    {(exams || []).map(e => <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {!selectedExam ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <ClipboardList size={32} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Select an exam to enter marks</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Select an exam and the marks entry interface will appear here. In production, this would show a full subject paper selection and mark entry grid.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis */}
        <TabsContent value="analysis">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Select value={analysisExam} onValueChange={setAnalysisExam}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Select exam for analysis..." /></SelectTrigger>
                <SelectContent>
                  {(exams || []).map(e => <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {analysisExam && analysisData?.length > 0 && (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-base">Subject Performance Analysis</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analysisData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                        <YAxis dataKey="subject" type="category" tick={{ fontSize: 12 }} width={100} />
                        <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`]} />
                        <Bar dataKey="avgPercent" name="Avg Score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="passRate" name="Pass Rate" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Avg Score</TableHead>
                          <TableHead>Highest</TableHead>
                          <TableHead>Lowest</TableHead>
                          <TableHead>Pass Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisData.map((s: {
                          subject: string; count: number; avgPercent: number;
                          highest: number; lowest: number; passRate: number;
                        }) => (
                          <TableRow key={s.subject}>
                            <TableCell className="font-medium text-sm">{s.subject}</TableCell>
                            <TableCell className="text-sm">{s.count}</TableCell>
                            <TableCell className="text-sm">{s.avgPercent}%</TableCell>
                            <TableCell className="text-sm text-green-600">{s.highest}</TableCell>
                            <TableCell className="text-sm text-red-600">{s.lowest}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${s.passRate}%` }} />
                                </div>
                                <span className="text-sm">{s.passRate.toFixed(0)}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}

            {analysisExam && !analysisData?.length && (
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <p className="text-muted-foreground">No marks data found for this exam</p>
              </div>
            )}

            {!analysisExam && (
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <BarChart2 size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Select an exam to view analysis</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Exam Dialog */}
      <Dialog open={showCreateExam} onOpenChange={setShowCreateExam}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create New Exam</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Exam Name *</Label>
              <Input value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} placeholder="e.g. Form 1 End-Term Exam" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={examForm.type} onValueChange={v => setExamForm({ ...examForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['CAT', 'Mid-Term', 'End-Term', 'Mock', 'KCSE Trial'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term *</Label>
                <Select value={String(examForm.term)} onValueChange={v => setExamForm({ ...examForm, term: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={examForm.startDate} onChange={e => setExamForm({ ...examForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={examForm.endDate} onChange={e => setExamForm({ ...examForm, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateExam(false)}>Cancel</Button>
            <Button onClick={() => createExamMutation.mutate()} disabled={createExamMutation.isPending || !examForm.name}>
              {createExamMutation.isPending ? <><Loader2 size={14} className="mr-2 animate-spin" />Creating...</> : 'Create Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
