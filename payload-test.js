// Test payload that the form is sending
console.log('=== FORMDATA PAYLOAD ===');

// Simulate FormData entries
const formDataEntries = [
  ['title', 'Test Announcement'],
  ['content', 'This is a test announcement content'],
  ['type', 'general'],
  ['priority', 'medium'],
  ['targetAudience[]', 'all'],
  ['publishDate', '2026-03-25'],
  ['expiryDate', '2026-03-31']
];

formDataEntries.forEach(([key, value]) => {
  console.log(`${key}:`, value);
});

console.log('\n=== EXPECTED API FORMAT ===');
const expectedFormat = {
  title: 'Test Announcement',
  content: 'This is a test announcement content',
  type: 'general',
  priority: 'medium',
  targetAudience: ['all'],  // This is what API expects
  publishDate: '2026-03-25',
  expiryDate: '2026-03-31'
};

console.log(JSON.stringify(expectedFormat, null, 2));

console.log('\n=== SPECIFIC CLASSES EXAMPLE ===');
const specificClassesPayload = {
  title: 'Class 10 Exam Schedule',
  content: 'Class 10 final exams start next week.',
  type: 'examination',
  priority: 'high',
  targetAudience: ['specific_classes'],
  targetClasses: [
    {classId: "class_id_1", className: "Class 10A"},
    {classId: "class_id_2", className: "Class 10B"}
  ],
  publishDate: '2026-03-25',
  expiryDate: '2026-03-30'
};

console.log(JSON.stringify(specificClassesPayload, null, 2));
