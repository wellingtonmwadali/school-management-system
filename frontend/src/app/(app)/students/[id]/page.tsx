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
  Heart, 
  Users, 
  Home, 
  DollarSign, 
  Award, 
  BookOpen,
  Edit,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}`);
      return res.data.data;
    },
  });

  const { data: fees } = useQuery({
    queryKey: ['student-fees', studentId],
    queryFn: async () => {
      const res = await api.get(`/fees?studentId=${studentId}`);
      return res.data.data || [];
    },
    enabled: !!studentId,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading student details...</div>;
  }

  if (!student) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Student not found</p>
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
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-muted-foreground">
              {student.admissionNumber} • {student.currentStream}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
            {student.status}
          </Badge>
          <Link href={`/students/${studentId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-semibold">{student.currentStream}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-semibold">
                  {new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear()} years
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-semibold capitalize">{student.gender}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Fee Balance</p>
                <p className="font-semibold">
                  KES {fees?.reduce((sum: number, f: any) => sum + (f.balance || 0), 0).toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="parents">Parents</TabsTrigger>
          <TabsTrigger value="dorm">Dormitory</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="awards">Awards</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Personal details and enrollment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Personal Details</h3>
                  <div className="space-y-3">
                    <InfoRow label="Full Name" value={`${student.firstName} ${student.lastName}`} />
                    <InfoRow label="Date of Birth" value={formatDate(student.dateOfBirth)} />
                    <InfoRow label="Gender" value={student.gender} className="capitalize" />
                    <InfoRow label="Nationality" value={student.nationality || 'Kenyan'} />
                    <InfoRow label="Religion" value={student.religion || 'N/A'} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Academic Details</h3>
                  <div className="space-y-3">
                    <InfoRow label="Admission Number" value={student.admissionNumber} />
                    <InfoRow label="Current Class" value={student.currentClass} />
                    <InfoRow label="Current Stream" value={student.currentStream} />
                    <InfoRow label="Admission Date" value={formatDate(student.admissionDate)} />
                    <InfoRow label="Year of Joining" value={student.yearOfJoining} />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <InfoRow 
                      label="Residential Address" 
                      value={student.residentialAddress} 
                      icon={<MapPin className="h-4 w-4" />} 
                    />
                    {student.email && (
                      <InfoRow 
                        label="Email" 
                        value={student.email} 
                        icon={<Mail className="h-4 w-4" />} 
                      />
                    )}
                    {student.phoneNumber && (
                      <InfoRow 
                        label="Phone" 
                        value={student.phoneNumber} 
                        icon={<Phone className="h-4 w-4" />} 
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Records Tab */}
        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Medical Records
              </CardTitle>
              <CardDescription>Health information and medical history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Health Information</h3>
                  <div className="space-y-3">
                    <InfoRow label="Blood Group" value={student.medicalInfo?.bloodGroup || 'Not recorded'} />
                    <InfoRow label="Known Allergies" value={student.medicalInfo?.allergies?.join(', ') || 'None'} />
                    <InfoRow label="Chronic Conditions" value={student.medicalInfo?.chronicConditions?.join(', ') || 'None'} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Emergency Medical Contact</h3>
                  <div className="space-y-3">
                    <InfoRow label="Doctor Name" value={student.medicalInfo?.doctorName || 'N/A'} />
                    <InfoRow label="Doctor Phone" value={student.medicalInfo?.doctorPhone || 'N/A'} />
                    <InfoRow label="Hospital" value={student.medicalInfo?.hospital || 'N/A'} />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Immunization Records</h3>
                {student.medicalInfo?.immunizations?.length > 0 ? (
                  <div className="border rounded-lg p-4 space-y-2">
                    {student.medicalInfo.immunizations.map((imm: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="font-medium">{imm.vaccine}</span>
                        <span className="text-sm text-muted-foreground">{formatDate(imm.date)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No immunization records available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parents/Guardians Tab */}
        <TabsContent value="parents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parent & Guardian Information
              </CardTitle>
              <CardDescription>Family and emergency contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Father */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Father</h3>
                  <div className="space-y-3">
                    <InfoRow label="Name" value={student.father?.name || 'N/A'} />
                    <InfoRow label="Phone" value={student.father?.phone || 'N/A'} />
                    <InfoRow label="Email" value={student.father?.email || 'N/A'} />
                    <InfoRow label="Occupation" value={student.father?.occupation || 'N/A'} />
                    <InfoRow label="Address" value={student.father?.address || 'N/A'} />
                  </div>
                </div>

                {/* Mother */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Mother</h3>
                  <div className="space-y-3">
                    <InfoRow label="Name" value={student.mother?.name || 'N/A'} />
                    <InfoRow label="Phone" value={student.mother?.phone || 'N/A'} />
                    <InfoRow label="Email" value={student.mother?.email || 'N/A'} />
                    <InfoRow label="Occupation" value={student.mother?.occupation || 'N/A'} />
                    <InfoRow label="Address" value={student.mother?.address || 'N/A'} />
                  </div>
                </div>
              </div>

              {/* Guardian */}
              {student.guardian?.name && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Guardian</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <InfoRow label="Name" value={student.guardian.name} />
                      <InfoRow label="Relationship" value={student.guardian.relationship || 'N/A'} />
                      <InfoRow label="Phone" value={student.guardian.phone || 'N/A'} />
                    </div>
                    <div className="space-y-3">
                      <InfoRow label="Email" value={student.guardian.email || 'N/A'} />
                      <InfoRow label="Occupation" value={student.guardian.occupation || 'N/A'} />
                      <InfoRow label="Address" value={student.guardian.address || 'N/A'} />
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contacts */}
              <div>
                <h3 className="font-semibold mb-4">Emergency Contacts</h3>
                {student.emergencyContacts?.length > 0 ? (
                  <div className="space-y-3">
                    {student.emergencyContacts.map((contact: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <InfoRow label="Name" value={contact.name} />
                          <InfoRow label="Relationship" value={contact.relationship} />
                          <InfoRow label="Phone" value={contact.phone} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No emergency contacts recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dormitory Tab */}
        <TabsContent value="dorm">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Dormitory Assignment
              </CardTitle>
              <CardDescription>Boarding and accommodation details</CardDescription>
            </CardHeader>
            <CardContent>
              {student.dormitoryInfo ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow label="Dormitory Name" value={student.dormitoryInfo.dormName || 'N/A'} />
                    <InfoRow label="Room Number" value={student.dormitoryInfo.roomNumber || 'N/A'} />
                    <InfoRow label="Bed Number" value={student.dormitoryInfo.bedNumber || 'N/A'} />
                    <InfoRow label="House" value={student.dormitoryInfo.house || 'N/A'} />
                  </div>
                  {student.dormitoryInfo.specialNeeds && (
                    <div>
                      <h3 className="font-semibold mb-2">Special Needs</h3>
                      <p className="text-sm text-muted-foreground">{student.dormitoryInfo.specialNeeds}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No dormitory assignment</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Statements
              </CardTitle>
              <CardDescription>Payment history and outstanding balances</CardDescription>
            </CardHeader>
            <CardContent>
              {fees && fees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Amount Due</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map((fee: any) => (
                      <TableRow key={fee._id}>
                        <TableCell>Term {fee.term}</TableCell>
                        <TableCell>{fee.academicYear}</TableCell>
                        <TableCell>KES {fee.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>KES {fee.paidAmount?.toLocaleString()}</TableCell>
                        <TableCell>KES {fee.balance?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={fee.status === 'cleared' ? 'default' : fee.status === 'partial' ? 'secondary' : 'destructive'}>
                            {fee.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No fee records available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Awards Tab */}
        <TabsContent value="awards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Awards & Achievements
              </CardTitle>
              <CardDescription>Recognition and accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              {student.awards && student.awards.length > 0 ? (
                <div className="space-y-4">
                  {student.awards.map((award: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{award.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{award.description}</p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-xs text-muted-foreground">{formatDate(award.date)}</span>
                            <Badge variant="outline">{award.category}</Badge>
                          </div>
                        </div>
                        <Award className="h-8 w-8 text-yellow-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No awards recorded</p>
              )}
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
              {student.libraryBooks && student.libraryBooks.length > 0 ? (
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
                    {student.libraryBooks.map((book: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{formatDate(book.borrowedDate)}</TableCell>
                        <TableCell>{formatDate(book.dueDate)}</TableCell>
                        <TableCell>
                          <Badge variant={book.returned ? 'default' : new Date(book.dueDate) < new Date() ? 'destructive' : 'secondary'}>
                            {book.returned ? 'Returned' : new Date(book.dueDate) < new Date() ? 'Overdue' : 'Borrowed'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
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
