export const adminTourSteps = [
  {
    id: 'welcome',
    target: 'body',
    content: '<h3>Welcome to Admin Dashboard! </h3><p>Let us guide you through the key features of your school management system. This will only take a few minutes.</p>',
    placement: 'center',
    disableBeacon: true,
  },
  {
    id: 'dashboard',
    target: '[data-tour="dashboard"]',
    content: '<h3>Dashboard</h3><p>Here you can monitor overall school activity, view statistics, and track important metrics at a glance.</p>',
    placement: 'right',
  },
  {
    id: 'users',
    target: '[data-tour="users"]',
    content: '<h3>Users Management</h3><p>Create and manage teachers, parents, and admins here. Control user access and permissions.</p>',
    placement: 'right',
  },
  {
    id: 'academic-year',
    target: '[data-tour="academic-year"]',
    content: '<h3>Academic Year</h3><p>Set up and manage academic years, terms, and important school calendar dates.</p>',
    placement: 'right',
  },
  {
    id: 'classes',
    target: '[data-tour="classes"]',
    content: '<h3>Classes</h3><p>Manage class schedules, room assignments, and class-specific settings.</p>',
    placement: 'right',
  },
  {
    id: 'sections',
    target: '[data-tour="sections"]',
    content: '<h3>Sections</h3><p>Create and manage different sections within classes for better organization.</p>',
    placement: 'right',
  },
  {
    id: 'subjects',
    target: '[data-tour="subjects"]',
    content: '<h3>Subjects</h3><p>Configure subjects, assign teachers, and manage curriculum details.</p>',
    placement: 'right',
  },
  {
    id: 'admissions',
    target: '[data-tour="admissions"]',
    content: '<h3>Admissions</h3><p>Handle student applications, enrollment processes, and admission requirements.</p>',
    placement: 'right',
  },
  {
    id: 'teachers',
    target: '[data-tour="teachers"]',
    content: '<h3>Teachers</h3><p>Manage teacher profiles, assignments, schedules, and performance tracking.</p>',
    placement: 'right',
  },
  {
    id: 'fees',
    target: '[data-tour="fees"]',
    content: '<h3>Fees Management</h3><p>Set up fee structures, track payments, and manage financial records.</p>',
    placement: 'right',
  },
  {
    id: 'exams',
    target: '[data-tour="exams"]',
    content: '<h3>Exams</h3><p>Create exam schedules, manage results, and track academic performance.</p>',
    placement: 'right',
  },
  {
    id: 'announcements',
    target: '[data-tour="announcements"]',
    content: '<h3>Announcements</h3><p>Send important notifications to students, parents, and staff members.</p>',
    placement: 'right',
  },
  {
    id: 'profile',
    target: '[data-tour="profile"]',
    content: '<h3>Profile & Settings</h3><p>Access your profile, change settings, and restart this tour anytime from here.</p>',
    placement: 'left',
  },
  {
    id: 'complete',
    target: 'body',
    content: '<h3>Tour Complete! </h3><p>You\'re all set to explore the admin dashboard. Remember, you can always restart this tour from your profile menu.</p>',
    placement: 'center',
    disableBeacon: true,
  },
];

export const getStepRoute = (stepId) => {
  const routeMap = {
    dashboard: '/',
    users: '/users',
    'academic-year': '/academic-years',
    classes: '/classes',
    sections: '/sections',
    subjects: '/subjects',
    admissions: '/admission',
    teachers: '/teacher-assignments',
    fees: '/fees/structure',
    exams: '/exams',
    announcements: '/announcements',
  };
  return routeMap[stepId] || null;
};
