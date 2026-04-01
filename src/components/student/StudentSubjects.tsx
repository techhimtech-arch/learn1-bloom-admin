import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Mail, Phone, Clock, Users, FileText, AlertCircle } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  officeHours: string;
  avatar?: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  semester: number;
  teacher: Teacher;
  schedule: string; // e.g., "Mon, Wed, Fri - 9:00 AM"
  room: string;
  totalClasses: number;
  attendedClasses: number;
  syllabus?: string;
  textbooks: string[];
  prerequisites?: string;
  currentGrade: string;
}

export const StudentSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');

  useEffect(() => {
    // Simulating API call
    const timer = setTimeout(() => {
      const mockSubjects: Subject[] = [
        {
          id: '1',
          code: 'CS101',
          name: 'Data Structures',
          description: 'Fundamental concepts of data organization and algorithms.',
          credits: 4,
          semester: 4,
          teacher: {
            id: 't1',
            name: 'Dr. Rajesh Kumar',
            email: 'rajesh.kumar@school.edu',
            phone: '+91 9876543210',
            qualification: 'M.Tech, PhD',
            experience: 12,
            officeHours: 'Mon-Wed 2:00 PM - 4:00 PM',
            avatar: '👨‍🏫'
          },
          schedule: 'Mon, Wed, Fri - 9:00 AM',
          room: 'Lab 201',
          totalClasses: 48,
          attendedClasses: 42,
          syllabus: 'Arrays, Linked Lists, Stacks, Queues, Trees, Graphs',
          textbooks: ['Introduction to Algorithms - CLRS', 'Data Structures - DS Guide'],
          prerequisites: 'Basic Programming',
          currentGrade: 'A'
        },
        {
          id: '2',
          code: 'EN102',
          name: 'English Literature',
          description: 'Study of classic and contemporary English literature.',
          credits: 3,
          semester: 4,
          teacher: {
            id: 't2',
            name: 'Ms. Priya Sharma',
            email: 'priya.sharma@school.edu',
            phone: '+91 9876543211',
            qualification: 'M.A English',
            experience: 8,
            officeHours: 'Tue-Thu 3:00 PM - 5:00 PM',
            avatar: '👩‍🏫'
          },
          schedule: 'Tue, Thu, Sat - 10:30 AM',
          room: 'Class 305',
          totalClasses: 36,
          attendedClasses: 35,
          syllabus: 'Shakespeare, Modern Poetry, Short Stories, Essay Writing',
          textbooks: ['A Midsummer Night\'s Dream', 'Contemporary Literature Anthology'],
          prerequisites: 'English Basics',
          currentGrade: 'A+'
        },
        {
          id: '3',
          code: 'MATH103',
          name: 'Calculus',
          description: 'Advanced calculus including integration and differentiation.',
          credits: 4,
          semester: 4,
          teacher: {
            id: 't3',
            name: 'Prof. Amit Patel',
            email: 'amit.patel@school.edu',
            phone: '+91 9876543212',
            qualification: 'M.Sc Mathematics',
            experience: 15,
            officeHours: 'Mon-Thu 4:00 PM - 6:00 PM',
            avatar: '👨‍🏫'
          },
          schedule: 'Mon, Wed, Fri - 11:00 AM',
          room: 'Classroom 402',
          totalClasses: 48,
          attendedClasses: 40,
          syllabus: 'Limits, Derivatives, Integrals, Multi-variable Calculus',
          textbooks: ['Calculus - Thomas Finney', 'Advanced Math Concepts'],
          prerequisites: 'Pre-Calculus',
          currentGrade: 'B+'
        },
        {
          id: '4',
          code: 'PHY104',
          name: 'Physics Lab',
          description: 'Practical experiments in mechanics and electricity.',
          credits: 2,
          semester: 4,
          teacher: {
            id: 't4',
            name: 'Dr. Vikram Singh',
            email: 'vikram.singh@school.edu',
            phone: '+91 9876543213',
            qualification: 'PhD Physics',
            experience: 10,
            officeHours: 'Wed-Fri 5:00 PM - 7:00 PM',
            avatar: '👨‍🔬'
          },
          schedule: 'Tue, Thu - 1:00 PM',
          room: 'Physics Lab 101',
          totalClasses: 24,
          attendedClasses: 24,
          syllabus: 'Mechanics, Electricity, Magnetism, Optics Experiments',
          textbooks: ['Physics Laboratory Manual'],
          prerequisites: 'Physics Theory',
          currentGrade: 'A'
        },
        {
          id: '5',
          code: 'CHM105',
          name: 'Chemistry',
          description: 'Organic and inorganic chemistry fundamentals.',
          credits: 3,
          semester: 4,
          teacher: {
            id: 't5',
            name: 'Ms. Neha Gupta',
            email: 'neha.gupta@school.edu',
            phone: '+91 9876543214',
            qualification: 'M.Sc Chemistry',
            experience: 7,
            officeHours: 'Mon-Wed 3:00 PM - 5:00 PM',
            avatar: '👩‍🔬'
          },
          schedule: 'Mon, Wed, Fri - 2:00 PM',
          room: 'Chemistry Lab',
          totalClasses: 36,
          attendedClasses: 36,
          syllabus: 'Organic Compounds, Reactions, Chemical Bonding, Periodic Table',
          textbooks: ['Organic Chemistry - Morrison Boyd', 'Chemistry Study Guide'],
          prerequisites: 'Basic Chemistry',
          currentGrade: 'A'
        }
      ];

      setSubjects(mockSubjects);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = selectedSemester === 'all' || subject.semester.toString() === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  const totalCredits = subjects.reduce((sum, sub) => sum + sub.credits, 0);
  const averageGrade = 3.8; // Mock value
  const uniqueSemesters = [...new Set(subjects.map(s => s.semester))].sort();

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (attended: number, total: number) => {
    const percentage = (attended / total) * 100;
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">Credits this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{averageGrade}</div>
            <p className="text-xs text-muted-foreground mt-1">On a scale of 4.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subjects Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Current semester courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search by subject name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:max-w-md"
          />
          <Tabs value={selectedSemester} onValueChange={setSelectedSemester} className="w-fit">
            <TabsList>
              <TabsTrigger value="all">All Semesters</TabsTrigger>
              {uniqueSemesters.map(sem => (
                <TabsTrigger key={sem} value={sem.toString()}>
                  Sem {sem}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSubjects.map(subject => (
              <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 flex-shrink-0 text-blue-600" />
                        <CardTitle className="text-lg truncate">{subject.name}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{subject.code}</p>
                    </div>
                    <Badge className={getGradeColor(subject.currentGrade)}>
                      {subject.currentGrade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subject.description}
                  </p>

                  {/* Details Grid */}
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credits</span>
                      <span className="font-semibold">{subject.credits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Schedule</span>
                      <span className="font-semibold">{subject.schedule}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room</span>
                      <span className="font-semibold">{subject.room}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Attendance</span>
                      <span className={`font-semibold ${getAttendanceColor(subject.attendedClasses, subject.totalClasses)}`}>
                        {subject.attendedClasses}/{subject.totalClasses}
                        ({Math.round((subject.attendedClasses / subject.totalClasses) * 100)}%)
                      </span>
                    </div>
                  </div>

                  {/* Teacher Info & Actions */}
                  <div className="border-t pt-3 flex items-center justify-between">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <div className="text-lg">{subject.teacher.avatar}</div>
                          <span className="text-xs truncate">{subject.teacher.name.split(' ')[0]}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">{subject.teacher.avatar}</span>
                            {subject.teacher.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-sm mb-2">Contact Information</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${subject.teacher.email}`} className="text-blue-600 hover:underline">
                                  {subject.teacher.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{subject.teacher.phone}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold text-sm mb-2">Professional Details</h3>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Qualification:</span> {subject.teacher.qualification}</p>
                              <p><span className="text-muted-foreground">Experience:</span> {subject.teacher.experience} years</p>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-start gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                              <div>
                                <p className="font-semibold">Office Hours</p>
                                <p className="text-muted-foreground">{subject.teacher.officeHours}</p>
                              </div>
                            </div>
                          </div>

                          <Button className="w-full">Send Message</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{subject.name} - Syllabus</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">Course Overview</h3>
                            <p className="text-sm text-muted-foreground">{subject.description}</p>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Prerequisites
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {subject.prerequisites || 'None'}
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2">Topics Covered</h3>
                            <p className="text-sm text-muted-foreground">
                              {subject.syllabus}
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2">Reference Books</h3>
                            <ul className="space-y-1">
                              {subject.textbooks.map((book, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-blue-600 flex-shrink-0">•</span>
                                  {book}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Button className="w-full">Download Full Syllabus (PDF)</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredSubjects.length === 0 && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No subjects found matching your criteria.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentSubjects;
