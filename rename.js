import fs from 'fs';
import path from 'path';

const files = [
  'src/components/landing/ProductShowcase.tsx',
  'src/components/landing/Hero.tsx',
  'src/components/landing/Navbar.tsx',
  'src/components/landing/Footer.tsx',
  'src/components/landing/Testimonials.tsx',
  'src/components/landing/Stats.tsx',
  'src/pages/auth/Login.tsx',
  'src/pages/auth/Register.tsx',
  'src/components/ui/VidyoraLogo.tsx'
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/Vidyora OS/g, 'TechHim EduOS');
    content = content.replace(/Vidyora Teacher/g, 'TechHim Teacher');
    content = content.replace(/Vidyora Parent/g, 'TechHim Parent');
    content = content.replace(/Vidyora LMS/g, 'TechHim LMS');
    content = content.replace(/Vidyora Mobile/g, 'TechHim Mobile');
    content = content.replace(/Vidyora AI/g, 'TechHim AI');
    content = content.replace(/app\.vidyora\.io/g, 'app.techhim.com');
    content = content.replace(/hello@vidyora\.io/g, 'hello@techhim.com');
    content = content.replace(/Vidyora Ecosystem/g, 'TechHim Ecosystem');
    content = content.replace(/Vidyora/g, 'TechHim EduOS');
    // Note: VidyoraLogo component name might be changed, but we won't rename the file or component export here to avoid breaking imports
    content = content.replace(/TechHim EduOSLogo/g, 'VidyoraLogo'); // Revert component name change
    content = content.replace(/vidyoraGrad1/g, 'techhimGrad1');
    content = content.replace(/vidyoraGrad2/g, 'techhimGrad2');
    fs.writeFileSync(fullPath, content);
  }
});

console.log('Renaming done');
