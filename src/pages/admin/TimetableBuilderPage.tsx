import { useState } from 'react';
import { Grid3x3, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AcademicFilters, AcademicFiltersState } from '@/components/shared/AcademicFilters';
import { TimetableBuilder } from '@/components/academic/TimetableBuilder';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TimetableBuilderPage() {
  const [filters, setFilters] = useState<AcademicFiltersState>({
    search: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
    department: '',
    status: '',
  });

  const hasValidFilters = filters.classId && filters.sectionId;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Timetable Builder</h1>
        <p className="text-muted-foreground">
          Design and manage school schedules using an interactive drag-and-drop interface.
        </p>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4" />
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription>
          Select a class and section to load the grid. Drag subjects from the left sidebar and drop them into the desired time slots.
        </AlertDescription>
      </Alert>

      <AcademicFilters
        onFiltersChange={setFilters}
        showDepartment={false}
        showStatus={false}
        showSearch={false}
      />

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          {!hasValidFilters ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Grid3x3 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Selection Required</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Please select an Academic Year, Class, and Section from the filters above to start building the timetable.
                </p>
              </CardContent>
            </Card>
          ) : (
            <TimetableBuilder
              classId={filters.classId}
              sectionId={filters.sectionId}
              academicYearId={filters.academicYearId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
