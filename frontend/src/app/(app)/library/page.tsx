'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, BookOpen, Loader2, BookMarked, ArrowLeftRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const CATEGORIES = ['Textbook', 'Reference', 'Fiction', 'Non-Fiction', 'Science', 'History', 'Math', 'Literature', 'Other'];

export default function LibraryPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [form, setForm] = useState({ 
    title: '', author: '', category: 'Textbook', subject: '', 
    locationCode: '', totalCopies: 1, publisher: '', year: new Date().getFullYear()
  });
  const [issueForm, setIssueForm] = useState({
    borrowerType: 'student' as 'student' | 'staff',
    borrowerSearch: '',
    selectedBorrowerId: '',
    selectedBorrowerName: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['books', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await api.get(`/library/books?${params}`);
      return res.data.data;
    },
  });

  const { data: borrowings } = useQuery({
    queryKey: ['borrowings'],
    queryFn: async () => {
      const res = await api.get('/library/borrowings?status=borrowed&status=overdue');
      return res.data.data;
    },
  });

  const { data: borrowers } = useQuery({
    queryKey: ['borrowers', issueForm.borrowerType, issueForm.borrowerSearch],
    queryFn: async () => {
      if (!issueForm.borrowerSearch || issueForm.borrowerSearch.length < 2) return [];
      const endpoint = issueForm.borrowerType === 'student' ? '/students' : '/staff';
      const res = await api.get(`${endpoint}?search=${issueForm.borrowerSearch}&limit=10`);
      return res.data.data;
    },
    enabled: issueForm.borrowerSearch.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/library/books', form),
    onSuccess: () => {
      toast({ title: 'Book Added', description: 'Book added to catalog successfully' });
      qc.invalidateQueries({ queryKey: ['books'] });
      setForm({ title: '', author: '', category: 'Textbook', subject: '', locationCode: '', totalCopies: 1, publisher: '', year: new Date().getFullYear() });
      setShowAdd(false);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to add book', variant: 'destructive' }),
  });

  const issueMutation = useMutation({
    mutationFn: (data: any) => api.post('/library/borrowings', data),
    onSuccess: () => {
      toast({ title: 'Book Issued', description: 'Book issued successfully' });
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['borrowings'] });
      setShowIssue(false);
      setSelectedBook(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to issue book', variant: 'destructive' }),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => api.put(`/library/borrowings/${id}/return`, {}),
    onSuccess: () => {
      toast({ title: 'Book Returned', description: 'Book marked as returned' });
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['borrowings'] });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to return book', variant: 'destructive' }),
  });

  const handleIssueBook = (book: any) => {
    setSelectedBook(book);
    setIssueForm({
      borrowerType: 'student',
      borrowerSearch: '',
      selectedBorrowerId: '',
      selectedBorrowerName: '',
    });
    setShowIssue(true);
  };

  const handleSelectBorrower = (borrower: any) => {
    setIssueForm({
      ...issueForm,
      selectedBorrowerId: borrower._id,
      selectedBorrowerName: issueForm.borrowerType === 'student' 
        ? `${borrower.firstName} ${borrower.lastName} (${borrower.admissionNumber})`
        : `${borrower.firstName} ${borrower.lastName} (${borrower.staffId})`,
    });
  };

  const handleSubmitIssue = () => {
    if (!issueForm.selectedBorrowerId) {
      toast({ title: 'Error', description: 'Please select a borrower', variant: 'destructive' });
      return;
    }
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    
    issueMutation.mutate({
      bookId: selectedBook._id,
      borrowerId: issueForm.selectedBorrowerId,
      borrowerType: issueForm.borrowerType,
      checkoutDate: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
    });
  };

  const books = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Library Management</h1>
          <p className="text-muted-foreground text-sm">{books.length} books in catalog</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} className="mr-2" /> Add Book
        </Button>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList>
          <TabsTrigger value="catalog">Book Catalog</TabsTrigger>
          <TabsTrigger value="issued">Issued Books</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by title or author..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {isLoading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Copies</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((book: any) => (
                      <TableRow key={book._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center"><BookOpen size={14} className="text-blue-600" /></div>
                            <div>
                              <p className="font-medium text-sm">{book.title}</p>
                              {book.subject && <p className="text-xs text-muted-foreground">{book.subject}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{book.author}</TableCell>
                        <TableCell><span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">{book.category}</span></TableCell>
                        <TableCell className="text-sm font-mono">{book.locationCode}</TableCell>
                        <TableCell className="text-sm">{book.totalCopies}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${book.availableCopies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {book.availableCopies} available
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleIssueBook(book)}
                            disabled={book.availableCopies === 0}
                          >
                            <BookMarked size={14} className="mr-1" /> Issue
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!books.length && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No books in catalog</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issued" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Checkout Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowings?.map((b: any) => (
                    <TableRow key={b._id}>
                      <TableCell className="font-medium">{b.bookId?.title || 'N/A'}</TableCell>
                      <TableCell>{b.borrowerId?.firstName} {b.borrowerId?.lastName}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{b.borrowerType}</Badge></TableCell>
                      <TableCell className="text-sm">{formatDate(b.checkoutDate)}</TableCell>
                      <TableCell className="text-sm">{formatDate(b.dueDate)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {b.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => returnMutation.mutate(b._id)}>
                          <ArrowLeftRight size={14} className="mr-1" /> Return
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!borrowings?.length && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No issued books</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Book Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Book to Catalog</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Author *</Label><Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
              <div className="space-y-2"><Label>Publisher</Label><Input value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} /></div>
              <div className="space-y-2"><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Location Code *</Label><Input value={form.locationCode} onChange={e => setForm({ ...form, locationCode: e.target.value })} placeholder="e.g. SCI-001" required /></div>
              <div className="space-y-2"><Label>Total Copies</Label><Input type="number" value={form.totalCopies} min={1} onChange={e => setForm({ ...form, totalCopies: parseInt(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.title || !form.author || !form.locationCode}>
              {createMutation.isPending ? 'Adding...' : 'Add Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog open={showIssue} onOpenChange={setShowIssue}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Issue Book</DialogTitle></DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm font-semibold">{selectedBook.title}</p>
                <p className="text-xs text-muted-foreground">{selectedBook.author}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedBook.availableCopies} copies available</p>
              </div>
              
              <div className="space-y-2">
                <Label>Borrower Type</Label>
                <Select value={issueForm.borrowerType} onValueChange={(v: 'student' | 'staff') => setIssueForm({ ...issueForm, borrowerType: v, borrowerSearch: '', selectedBorrowerId: '', selectedBorrowerName: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search {issueForm.borrowerType === 'student' ? 'Student' : 'Staff'}</Label>
                <Input 
                  value={issueForm.borrowerSearch} 
                  onChange={e => setIssueForm({ ...issueForm, borrowerSearch: e.target.value })} 
                  placeholder="Type name or ID..."
                />
                {borrowers && borrowers.length > 0 && (
                  <div className="border rounded max-h-40 overflow-y-auto">
                    {borrowers.map((b: any) => (
                      <div 
                        key={b._id}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleSelectBorrower(b)}
                      >
                        {b.firstName} {b.lastName} - {issueForm.borrowerType === 'student' ? b.admissionNumber : b.staffId}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {issueForm.selectedBorrowerName && (
                <div className="bg-green-50 p-2 rounded text-sm">
                  Selected: <span className="font-semibold">{issueForm.selectedBorrowerName}</span>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">Books are issued for 14 days</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssue(false)}>Cancel</Button>
            <Button onClick={handleSubmitIssue} disabled={issueMutation.isPending || !issueForm.selectedBorrowerId}>
              {issueMutation.isPending ? 'Issuing...' : 'Issue Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
