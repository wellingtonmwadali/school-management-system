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
import { useToast } from '@/hooks/use-toast';
import { Calendar, Upload, Plus, Download, FileSpreadsheet } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = ['Period 1', 'Period 2', 'Break', 'Period 3', 'Period 4', 'Lunch', 'Period 5', 'Period 6'];
const CLASS_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
const STREAM_OPTIONS = ['East', 'West', 'North'];

export default function TimetablePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [selectedClass, setSelectedClass] = useState('Form 1');
  const [selectedStream, setSelectedStream] = useState('East');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [manualEntry, setManualEntry] = useState({
    day: 'Monday',
    period: 'Period 1',
    subject: '',
    teacher: '',
    room: '',
  });

  const { data: timetable, isLoading } = useQuery({
    queryKey: ['timetable', selectedClass, selectedStream],
    queryFn: async () => {
      const res = await api.get(`/timetable?class=${selectedClass}&stream=${selectedStream}`);
      return res.data.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/timetable/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Upload Successful', description: 'Timetable uploaded and processed' });
      qc.invalidateQueries({ queryKey: ['timetable'] });
      setShowUpload(false);
      setUploadFile(null);
    },
    onError: () => toast({ title: 'Upload Failed', description: 'Failed to upload timetable', variant: 'destructive' }),
  });

  const addEntryMutation = useMutation({
    mutationFn: (data: any) => api.post('/timetable/entries', {
      ...data,
      class: selectedClass,
      stream: selectedStream,
    }),
    onSuccess: () => {
      toast({ title: 'Entry Added', description: 'Timetable entry added successfully' });
      qc.invalidateQueries({ queryKey: ['timetable'] });
      setShowManual(false);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to add entry', variant: 'destructive' }),
  });

  const handleUpload = () => {
    if (!uploadFile) {
      toast({ title: 'No File', description: 'Please select a file to upload', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('class', selectedClass);
    formData.append('stream', selectedStream);
    uploadMutation.mutate(formData);
  };

  const downloadTemplate = () => {
    // Generate CSV template
    const headers = ['Day', 'Period', 'Subject', 'Teacher', 'Room'];
    const rows = DAYS.flatMap(day => 
      PERIODS.filter(p => !p.includes('Break') && !p.includes('Lunch')).map(period => 
        [day, period, '', '', '']
      )
    );
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-template-${selectedClass}-${selectedStream}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Organize timetable data by day and period
  const timetableGrid: Record<string, Record<string, any>> = {};
  DAYS.forEach(day => {
    timetableGrid[day] = {};
    PERIODS.forEach(period => {
      timetableGrid[day][period] = timetable?.find((t: any) => t.day === day && t.period === period);
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timetable Management</h1>
          <p className="text-muted-foreground text-sm">Manage class schedules and timetables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download size={16} className="mr-2" /> Download Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
            <Upload size={16} className="mr-2" /> Upload Timetable
          </Button>
          <Button size="sm" onClick={() => setShowManual(true)}>
            <Plus size={16} className="mr-2" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Class and Stream Selection */}
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
          </div>
        </CardContent>
      </Card>

      {/* Timetable Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{selectedClass} {selectedStream} - Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Period</TableHead>
                  {DAYS.map(day => (
                    <TableHead key={day} className="text-center">{day}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERIODS.map(period => (
                  <TableRow key={period}>
                    <TableCell className="font-medium text-sm bg-muted/50">{period}</TableCell>
                    {DAYS.map(day => {
                      const entry = timetableGrid[day]?.[period];
                      const isBreak = period.includes('Break') || period.includes('Lunch');
                      
                      return (
                        <TableCell key={day} className={`text-center ${isBreak ? 'bg-gray-100' : ''}`}>
                          {isBreak ? (
                            <span className="text-sm text-muted-foreground">{period}</span>
                          ) : entry ? (
                            <div className="text-sm">
                              <p className="font-semibold text-blue-700">{entry.subject}</p>
                              <p className="text-xs text-muted-foreground">{entry.teacher}</p>
                              {entry.room && <p className="text-xs text-muted-foreground">Room: {entry.room}</p>}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Timetable</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stream</Label>
                <Select value={selectedStream} onValueChange={setSelectedStream}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STREAM_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending || !uploadFile}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload & Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Timetable Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Day</Label>
                <Select value={manualEntry.day} onValueChange={v => setManualEntry({ ...manualEntry, day: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={manualEntry.period} onValueChange={v => setManualEntry({ ...manualEntry, period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIODS.filter(p => !p.includes('Break') && !p.includes('Lunch')).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Subject *</Label>
                <Input value={manualEntry.subject} onChange={e => setManualEntry({ ...manualEntry, subject: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Input value={manualEntry.teacher} onChange={e => setManualEntry({ ...manualEntry, teacher: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Input value={manualEntry.room} onChange={e => setManualEntry({ ...manualEntry, room: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManual(false)}>Cancel</Button>
            <Button onClick={() => addEntryMutation.mutate(manualEntry)} disabled={addEntryMutation.isPending || !manualEntry.subject}>
              {addEntryMutation.isPending ? 'Adding...' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
