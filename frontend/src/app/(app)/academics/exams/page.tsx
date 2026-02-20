'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Plus, Download, Calendar, Clock } from 'lucide-react';

const CLASS_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
const STREAM_OPTIONS = ['East', 'West', 'North'];
const EXAM_TYPES = ['CAT', 'Mid-Term', 'End-Term', 'Mock', 'National'];

export default function ExamsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('schedule');
  const [showUploadSchedule, setShowUploadSchedule] = useState(false);
  const [showManualSchedule, setShowManualSchedule] = useState(false);
  const [showUploadMarks, setShowUploadMarks] = useState(false);
  const [selectedClass, setSelectedClass] = useState('Form 1');
  const [selectedStream, setSelectedStream] = useState('East');
  const [selectedExamType, setSelectedExamType] = useState('CAT');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [scheduleEntry, setScheduleEntry] = useState({
    subject: '',
    date: '',
    time: '',
    duration: '',
    venue: '',
  });

  const { data: examSchedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ['exam-schedule', selectedClass, selectedStream, selectedExamType],
    queryFn: async () => {
      const res = await api.get(`/exams/schedule?class=${selectedClass}&stream=${selectedStream}&type=${selectedExamType}`);
      return res.data.data;
    },
  });

  const { data: marksSummary, isLoading: loadingMarks } = useQuery({
    queryKey: ['marks-summary', selectedClass, selectedStream, selectedExamType],
    queryFn: async () => {
      const res = await api.get(`/exams/marks/summary?class=${selectedClass}&stream=${selectedStream}&type=${selectedExamType}`);
      return res.data.data;
    },
  });

  const uploadScheduleMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/exams/schedule/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Upload Successful', description: 'Exam schedule uploaded and processed' });
      qc.invalidateQueries({ queryKey: ['exam-schedule'] });
      setShowUploadSchedule(false);
      setUploadFile(null);
    },
    onError: () => toast({ title: 'Upload Failed', description: 'Failed to upload schedule', variant: 'destructive' }),
  });

  const uploadMarksMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/exams/marks/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Marks Uploaded', description: 'Exam marks uploaded and processed' });
      qc.invalidateQueries({ queryKey: ['marks-summary'] });
      setShowUploadMarks(false);
      setUploadFile(null);
    },
    onError: () => toast({ title: 'Upload Failed', description: 'Failed to upload marks', variant: 'destructive' }),
  });

  const addScheduleMutation = useMutation({
    mutationFn: (data: any) => api.post('/exams/schedule', {
      ...data,
      class: selectedClass,
      stream: selectedStream,
      type: selectedExamType,
    }),
    onSuccess: () => {
      toast({ title: 'Schedule Added', description: 'Exam schedule entry added successfully' });
      qc.invalidateQueries({ queryKey: ['exam-schedule'] });
      setShowManualSchedule(false);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to add schedule entry', variant: 'destructive' }),
  });

  const handleUploadSchedule = () => {
    if (!uploadFile) {
      toast({ title: 'No File', description: 'Please select a file to upload', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('class', selectedClass);
    formData.append('stream', selectedStream);
    formData.append('type', selectedExamType);
    uploadScheduleMutation.mutate(formData);
  };

  const handleUploadMarks = () => {
    if (!uploadFile) {
      toast({ title: 'No File', description: 'Please select a file to upload', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('class', selectedClass);
    formData.append('stream', selectedStream);
    formData.append('type', selectedExamType);
    uploadMarksMutation.mutate(formData);
  };

  const downloadScheduleTemplate = () => {
    const headers = ['Subject', 'Date', 'Time', 'Duration', 'Venue'];
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-schedule-template-${selectedClass}-${selectedStream}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadMarksTemplate = () => {
    const headers = ['Admission Number', 'Student Name', 'Subject', 'Score', 'Grade'];
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks-template-${selectedClass}-${selectedStream}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exam Management</h1>
          <p className="text-muted-foreground text-sm">Manage exam schedules and marks</p>
        </div>
      </div>

      {/* Class, Stream, and Exam Type Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedStream} onValueChange={setSelectedStream}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STREAM_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedExamType} onValueChange={setSelectedExamType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="schedule">Exam Schedule</TabsTrigger>
          <TabsTrigger value="marks">Marks Upload</TabsTrigger>
        </TabsList>

        {/* Exam Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadScheduleTemplate}>
              <Download size={16} className="mr-2" /> Download Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowUploadSchedule(true)}>
              <Upload size={16} className="mr-2" /> Upload Schedule
            </Button>
            <Button size="sm" onClick={() => setShowManualSchedule(true)}>
              <Plus size={16} className="mr-2" /> Add Schedule Entry
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{selectedExamType} - {selectedClass} {selectedStream}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingSchedule ? (
                    <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                  ) : examSchedule && examSchedule.length > 0 ? (
                    examSchedule.map((exam: any, idx: number) => {
                      const isPast = new Date(exam.date) < new Date();
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{exam.subject}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-muted-foreground" />
                              {new Date(exam.date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-muted-foreground" />
                              {exam.time}
                            </div>
                          </TableCell>
                          <TableCell>{exam.duration}</TableCell>
                          <TableCell>{exam.venue}</TableCell>
                          <TableCell>
                            <Badge variant={isPast ? 'secondary' : 'default'}>
                              {isPast ? 'Completed' : 'Upcoming'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No exam schedule found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marks Upload Tab */}
        <TabsContent value="marks" className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadMarksTemplate}>
              <Download size={16} className="mr-2" /> Download Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowUploadMarks(true)}>
              <Upload size={16} className="mr-2" /> Upload Marks
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Marks Summary - {selectedExamType}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMarks ? (
                <div className="text-center py-8">Loading...</div>
              ) : marksSummary && marksSummary.length > 0 ? (
                <div className="space-y-3">
                  {marksSummary.map((subject: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{subject.subject}</h3>
                        <Badge>{subject.totalStudents} students</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Average</p>
                          <p className="font-medium">{subject.average?.toFixed(1) || '—'}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Highest</p>
                          <p className="font-medium">{subject.highest || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Lowest</p>
                          <p className="font-medium">{subject.lowest || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Mean Grade</p>
                          <p className="font-medium">{subject.meanGrade || '—'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No marks uploaded yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Schedule Dialog */}
      <Dialog open={showUploadSchedule} onOpenChange={setShowUploadSchedule}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Exam Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="max-w-xs mx-auto"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Upload CSV or Excel file. Download template for correct format.
              </p>
              {uploadFile && (
                <p className="text-sm font-medium mt-2 text-green-700">Selected: {uploadFile.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadSchedule(false)}>Cancel</Button>
            <Button onClick={handleUploadSchedule} disabled={uploadScheduleMutation.isPending || !uploadFile}>
              {uploadScheduleMutation.isPending ? 'Uploading...' : 'Upload & Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Schedule Entry Dialog */}
      <Dialog open={showManualSchedule} onOpenChange={setShowManualSchedule}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Exam Schedule Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={scheduleEntry.subject} onChange={e => setScheduleEntry({ ...scheduleEntry, subject: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={scheduleEntry.date} onChange={e => setScheduleEntry({ ...scheduleEntry, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input type="time" value={scheduleEntry.time} onChange={e => setScheduleEntry({ ...scheduleEntry, time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input placeholder="e.g., 2 hours" value={scheduleEntry.duration} onChange={e => setScheduleEntry({ ...scheduleEntry, duration: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Venue</Label>
                <Input placeholder="e.g., Hall A" value={scheduleEntry.venue} onChange={e => setScheduleEntry({ ...scheduleEntry, venue: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualSchedule(false)}>Cancel</Button>
            <Button onClick={() => addScheduleMutation.mutate(scheduleEntry)} disabled={addScheduleMutation.isPending || !scheduleEntry.subject || !scheduleEntry.date || !scheduleEntry.time}>
              {addScheduleMutation.isPending ? 'Adding...' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Marks Dialog */}
      <Dialog open={showUploadMarks} onOpenChange={setShowUploadMarks}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Exam Marks</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="max-w-xs mx-auto"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Upload CSV or Excel file with student marks. Download template for correct format.
              </p>
              {uploadFile && (
                <p className="text-sm font-medium mt-2 text-green-700">Selected: {uploadFile.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadMarks(false)}>Cancel</Button>
            <Button onClick={handleUploadMarks} disabled={uploadMarksMutation.isPending || !uploadFile}>
              {uploadMarksMutation.isPending ? 'Uploading...' : 'Upload Marks'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
