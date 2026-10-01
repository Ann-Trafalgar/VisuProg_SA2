const { execFileSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { module03, module04 } = require('../data/module_questions.js');

const pdf = 'C:\\Users\\User\\Downloads\\Visual Prog .pdf';
const text = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
const firstTab = text.split('Score: 0/42')[0].replace(/^Score: 0\/46\s*/, '');
const answerKey = [
  'D','B','C','C','A','B','B','C','D','C','A','A','B','B','D','C','A','C','D','D','D','D','C','B','B','C',
  'D','B','B','D','B','C','D','C','A','B','A','C','C','B','D','C','A','A','A','C'
];

function clean(value) {
  return value.replace(/\f/g, ' ').replace(/\s+/g, ' ').trim();
}

const extracted = [];
const matcher = /^\s*(\d+)\.\s+([\s\S]*?)(?=^\s*\d+\.\s+|(?![\s\S]))/gm;
let match;
while ((match = matcher.exec(firstTab))) {
  const lines = match[2].split(/\r?\n/).filter(line => line.trim());
  const prompt = clean(lines.filter(line => !/^\s{2,}/.test(line)).join(' '));
  const options = lines.filter(line => /^\s{2,}/.test(line)).map(clean);
  if (options.length > 4 && match[1] === '26') options.splice(3, 1); // PDF wraps "server keyboard" across two lines.
  extracted.push({ prompt, options });
}

const extras = [
  ['Which header extension is required in the sample code for freeglut extension functions?', ['bitmap.h', 'vertex_ext.h', 'freeglut_ext.h', 'iostream.h'], 'C'],
  ['Which function is presented as an alternative for indexed drawing?', ['glutPostRedisplay()', 'glDrawElements()', 'glRasterPos2f()', 'glDrawArrays()'], 'B'],
  ['Bitmap fonts are particularly suitable for small readable text in 2D overlays or ____.', ['index arrays', 'vertex buffers', 'HUDs', 'depth tests'], 'C'],
  ['Which function sets the initial GLUT window size?', ['glutFullScreen()', 'glutInitWindowSize()', 'glutInitWindowPosition()', 'glutCreateWindow()'], 'B'],
  ['Which function sets the global idle callback?', ['glutDisplayFunc()', 'glutEntryFunc()', 'glutTimerFunc()', 'glutIdleFunc()'], 'D'],
  ["In the sample keyboard callback, pressing 'a' changes px by ____.", ['-2.0f', '-0.02f', '+2.0f', '+0.02f'], 'B']
];

const questions = extracted.map((item, index) => ({
  id: `tab1-${index + 1}`,
  number: index + 1,
  globalNumber: index + 1,
  assessment: 'TAB 1',
  category: 'TAB 1: OpenGL and GLUT Fundamentals',
  type: 'choice', text: item.prompt, options: item.options, answer: [answerKey[index]]
}));
for (const [prompt, options, answer] of extras) {
  const number = questions.length - 45;
  questions.push({ id: `tab2-${number}`, number, globalNumber: questions.length + 1, assessment: 'TAB 2', category: 'TAB 2: Additional Unique Questions', type: 'choice', text: prompt, options, answer: [answer] });
}
for (const [assessment, items, category] of [
  ['MODULE 03', module03, 'Module 03: GLUT Text and Callbacks'],
  ['MODULE 04', module04, 'Module 04: Vertex Arrays and Indexed Drawing']
]) {
  if (items.length !== 20) throw new Error(`${assessment} must contain 20 questions`);
  items.forEach(([prompt, options, answer, explanation], index) => {
    questions.push({
      id: `${assessment.toLowerCase().replace(' ', '-')}-${index + 1}`,
      number: index + 1,
      globalNumber: questions.length + 1,
      assessment,
      category,
      type: 'choice',
      text: prompt,
      options,
      answer: [answer],
      explanation
    });
  });
}
const malformed = questions.filter(q => q.options.length !== 4 || !q.answer[0]);
const normalized = questions.map(q => q.text.toLowerCase().replace(/[^a-z0-9]/g, ''));
if (questions.length !== 92 || malformed.length || new Set(normalized).size !== 92) throw new Error(`Invalid question set: ${questions.length}; ${malformed.map(q => `${q.id}:${q.options.length}:${q.answer}`).join(', ')}`);
mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
writeFileSync(join(__dirname, '..', 'data', 'questions.json'), JSON.stringify(questions, null, 2) + '\n');
writeFileSync(join(__dirname, '..', 'data', 'questions.js'), `window.FINAL_EXAM_DATA = ${JSON.stringify(questions, null, 2)};\n`);
console.log(`Built ${questions.length} unique questions.`);
