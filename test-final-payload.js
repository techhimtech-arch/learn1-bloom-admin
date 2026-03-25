// Final Correct Payload that form now sends
console.log('=== FINAL CORRECT PAYLOAD ===');

const finalPayload = {
  title: "weeeeeee",
  content: "weeeeeeeeeeeeeeee",
  type: "general",           // ✅ lowercase
  targetAudience: ["all"],  // ✅ array
  priority: "medium",        // ✅ lowercase
  publishDate: "2026-03-25",  // ✅ YYYY-MM-DD
  expiryDate: "2026-03-30"     // ✅ YYYY-MM-DD
};

console.log(JSON.stringify(finalPayload, null, 2));

console.log('\n=== KEY CHANGES MADE ===');
console.log('✅ Field Names: message → content, targetType → targetAudience');
console.log('✅ Enum Values: UPPERCASE → lowercase');
console.log('✅ Removed: status field');
console.log('✅ Dates: Simple YYYY-MM-DD format');
console.log('✅ Target Audience: Array format');
