'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  BookOpen,
  Edit,
  Calendar,
  Briefcase,
  IdCard
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff-member', staffId],
    queryFn: async () => {
      const res = await api.get(`/staff/${staffId}`);
      return res.data.data;
    },
  });

  const { data: borrowedBooks } = useQuery({
    queryKey: ['staff-library', staffId],
    queryFn: async () => {
      const res = await api.get(`/library/borrowings?borrowerId=${staffId}&borrowerType=staff`);
      return res.data.data || [];
    },
    enabled: !!staffId,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading staff details...</div>;
  }

  if (!staff) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Staff member not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {staff.firstName} {staff.lastName}
            </h1>
            <p className="text-muted-foreground">
              {staff.staffNumber} • {staff.position}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
            {staff.status}
          </Badge>
          <Link href={`/staff/${staffId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Staff
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="font-semibold">{staff.position}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <IdCard className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-semibold">{staff.department || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-semibold">{staff.dateOfJoining ? formatDate(staff.dateOfJoining) : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Employment Type</p>
                <p className="font-semibold capitalize">{staff.employmentType || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Personal details and employment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Personal Details</h3>
                  <div className="space-y-3">
                    <InfoRow label="Full Name" value={`${staff.firstName} ${staff.lastName}`} />
                    <InfoRow label="Staff Number" value={staff.staffNumber} />
                    <InfoRow label="Gender" value={staff.gender} className="capitalize" />
                    <InfoRow label="Date of Birth" value={staff.dateOfBirth ? formatDate(staff.dateOfBirth) : 'N/A'} />
                    <InfoRow label="Nationality" value={staff.nationality || 'Kenyan'} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Employment Details</h3>
                  <div className="space-y-3">
                    <InfoRow label="Position" value={staff.position} />
                    <InfoRow label="Department" value={staff.department || 'N/A'} />
                    <InfoRow label="Employment Type" value={staff.employmentType || 'N/A'} className="capitalize" />
                    <InfoRow label="Date of Joining" value={staff.dateOfJoining ? formatDate(staff.dateOfJoining) : 'N/A'} />
                    <InfoRow label="Status" value={staff.status} className="capitalize" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Info Tab */}
        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Qualifications and teaching details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Qualifications</h3>
                  <div className="space-y-3">
                    <InfoRow label="TSC Number" value={staff.tscNumber || 'N/A'} />
                    <InfoRow label="Highest Qualification" value={staff.qualification || 'N/A'} />
                    <InfoRow label="Specialization" value={staff.specialization || 'N/A'} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Teaching Assignments</h3>
                  <div className="space-y-3">
                    {staff.subjectsTaught && staff.subjectsTaught.length > 0 ? (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Subjects Taught:</p>
                        <div className="flex flex-wrap gap-2">
                          {staff.subjectsTaught.map((subject: string, idx: number) => (
                            <Badge key={idx} variant="secondary">{subject}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No subjects assigned</p>
                    )}
                    {staff.classTeacher && (
                      <InfoRow label="Class Teacher" value={staff.classTeacher} />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Statutory Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <InfoRow label="KRA PIN" value={staff.kraPin || 'N/A'} />
                    <InfoRow label="NHIF Number" value={staff.nhifNumber || 'N/A'} />
                  </div>
                  <div className="space-y-3">
                    <InfoRow label="NSSF Number" value={staff.nssfNumber || 'N/A'} />
                    <InfoRow label="ID Number" value={staff.idNumber || 'N/A'} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Phone numbers, email, and addresses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Contact Details</h3>
                  <div className="space-y-3">
                    <InfoRow 
                      label="Email" 
                      value={staff.email} 
                      icon={<Mail className="h-4 w-4" />} 
                    />
                    <InfoRow 
                      label="Phone Number" 
                      value={staff.phoneNumber || 'N/A'} 
                      icon={<Phone className="h-4 w-4" />} 
                    />
                    <InfoRow 
                      label="Alternate Phone" 
                      value={staff.alternatePhone || 'N/A'} 
                      icon={<Phone className="h-4 w-4" />} 
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Address</h3>
                  <div className="space-y-3">
                    <InfoRow 
                      label="Residential Address" 
                      value={staff.residentialAddress || 'N/A'} 
                      icon={<MapPin className="h-4 w-4" />} 
                    />
                    <InfoRow 
                      label="Postal Address" 
                      value={staff.postalAddress || 'N/A'} 
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <InfoRow label="Contact Name" value={staff.emergencyContact?.name || 'N/A'} />
                    <InfoRow label="Relationship" value={staff.emergencyContact?.relationship || 'N/A'} />
                  </div>
                  <div className="space-y-3">
                    <InfoRow label="Contact Phone" value={staff.emergencyContact?.phone || 'N/A'} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Library Books
              </CardTitle>
              <CardDescription>Borrowed books and reading history</CardDescription>
            </CardHeader>
            <CardContent>
              {borrowedBooks && borrowedBooks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Borrowed Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {borrowedBooks.map((borrowing: any) => {
                      const isOverdue = !borrowing.returnDate && new Date(borrowing.dueDate) < new Date();
                      const isReturned = !!borrowing.returnDate;
                      return (
                        <TableRow key={borrowing._id}>
                          <TableCell className="font-medium">{borrowing.book?.title || 'Unknown'}</TableCell>
                          <TableCell>{borrowing.book?.author || 'N/A'}</TableCell>
                          <TableCell>{formatDate(borrowing.borrowDate)}</TableCell>
                          <TableCell>{formatDate(borrowing.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant={isReturned ? 'default' : isOverdue ? 'destructive' : 'secondary'}>
                              {isReturned ? 'Returned' : isOverdue ? 'Overdue' : 'Borrowed'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No library books borrowed</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for info rows
function InfoRow({ 
  label, 
  value, 
  icon, 
  className = '' 
}: { 
  label: string; 
  value: any; 
  icon?: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}:</span>
      </div>
      <span className={`text-sm font-medium text-right ${className}`}>{value || 'N/A'}</span>
    </div>
  );
}
