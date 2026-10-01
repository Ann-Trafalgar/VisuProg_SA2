const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const questions = JSON.parse(fs.readFileSync(path.join(root, 'data', 'questions.json'), 'utf8'));
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(questions.length === 92, `Expected 92 questions, found ${questions.length}`);

const expectedAssessments = { 'TAB 1': 46, 'TAB 2': 6, 'MODULE 03': 20, 'MODULE 04': 20 };
for (const [assessment, expectedCount] of Object.entries(expectedAssessments)) {
  const items = questions.filter(question => question.assessment === assessment);
  assert(items.length === expectedCount, `${assessment} should have ${expectedCount} questions, found ${items.length}`);
  assert(items.every((question, index) => question.number === index + 1), `${assessment} numbering is not sequential`);
}

assert(new Set(questions.map(question => question.id)).size === questions.length, 'Question IDs are not unique');
for (const question of questions) {
  assert(question.globalNumber >= 1 && question.globalNumber <= 92, `${question.id} has an invalid global number`);
  assert(question.text?.trim(), `${question.id} has no text`);
  assert(question.options?.length >= 2, `${question.id} has fewer than two options`);
  assert(question.answer?.length >= 1, `${question.id} has no answer`);
  for (const letter of question.answer || []) {
    const answerIndex = letter.charCodeAt(0) - 65;
    assert(answerIndex >= 0 && answerIndex < question.options.length, `${question.id} answer ${letter} exceeds its options`);
  }
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'assets', 'app.js'), 'utf8');
const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const requestedIds = new Set([...app.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]));
for (const id of requestedIds) assert(htmlIds.has(id), `app.js requests missing HTML id #${id}`);

assert(app.includes("const assessmentOrder = ['TAB 1', 'TAB 2', 'MODULE 03', 'MODULE 04']"), 'Assessment picker order is incorrect');
assert(app.includes("state.assessmentId === 'all' ? question.globalNumber : question.number"), 'Combined reviewer must use global question numbers');
assert(app.includes('letter.textContent = letters[displayIndex]'), 'Shuffled choices must retain display letters');
assert(app.includes('const displayedLetter = letters[choiceOrder.indexOf(originalIndex)]'), 'Feedback must report shuffled display letters');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Validated 92 questions, four study groups, answer bounds, and all DOM references.');
