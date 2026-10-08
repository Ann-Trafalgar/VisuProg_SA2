(() => {
  'use strict';

  const finalExamQuestions = window.FINAL_EXAM_DATA || [];
  const baseQuestions = finalExamQuestions.slice();
  const byId = new Map(baseQuestions.map(question => [question.id, question]));
  const $ = id => document.getElementById(id);
  const screens = ['welcomeScreen', 'quizScreen', 'resultsScreen'];
  const storageKey = 'visualquest-sa2-progress-v1';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const assessmentOrder = ['TAB 1', 'TAB 2', 'MODULE 03', 'MODULE 04', 'MIDTERM EXAM'];
  const assessments = [
    {
      id: 'all',
      group: 'final',
      title: 'Visual Programming - Complete',
      subtitle: '155 slots across the PDF, modules, and Midterm Exam; 150 have answer keys.',
      questions: finalExamQuestions
    },
    ...assessmentOrder.map(assessment => ({
      id: assessment.toLowerCase().replace(/\s+/g, '-'),
      group: assessment === 'MIDTERM EXAM' ? 'midterms' : 'fa',
      title: assessment,
      subtitle: finalExamQuestions.find(question => question.assessment === assessment)?.category.replace(`${assessment}: `, '') || 'Visual Programming assessment',
      questions: finalExamQuestions.filter(question => question.assessment === assessment)
    }))
  ];
  const assessmentById = new Map(assessments.map(assessment => [assessment.id, assessment]));

  let state = freshState();
  let questions = baseQuestions.slice();
  let selectedChoiceIndexes = [];
  let selectedMatches = [];
  let timerId = null;
  let advanceId = null;

  function freshState(order = finalExamQuestions.map(question => question.id), mode = 'assessment', assessmentId = 'all', scopeLabel = 'Visual Programming - Complete') {
    return {
      order,
      index: 0,
      answered: {},
      flags: [],
      elapsed: 0,
      shuffleQuestions: false,
      shuffleChoices: false,
      pauseWrong: true,
      choiceOrders: {},
      matchOrders: {},
      mode,
      assessmentId,
      scopeLabel
    };
  }

  function shuffled(values) {
    const copy = values.slice();
    for (let index = copy.length - 1; index > 0; index--) {
      const random = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[random]] = [copy[random], copy[index]];
    }
    return copy;
  }

  function applyOrder() {
    questions = (state.order || []).map(id => byId.get(id)).filter(Boolean);
    if (!questions.length) {
      const fallback = assessmentById.get(state.assessmentId) || assessmentById.get('all');
      questions = fallback.questions.slice();
      state.order = questions.map(question => question.id);
    }
    state.index = Math.min(Math.max(0, state.index || 0), questions.length - 1);
  }

  function show(screenId) {
    screens.forEach(id => $(id).classList.toggle('active', id === screenId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function formatTime(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function persist() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || !Array.isArray(saved.order) || !saved.answered) return null;
      if (!saved.order.every(id => byId.has(id))) return null;
      const answered = { ...saved.answered };
      for (const [id, response] of Object.entries(answered)) {
        const question = byId.get(id);
        if ((question.type === 'choice' || question.type === 'match') && response?.correct === null) delete answered[id];
      }
      return {
        ...freshState(saved.order, saved.mode || 'assessment', saved.assessmentId || 'all', saved.scopeLabel || 'Visual Programming - Complete'),
        ...saved,
        answered
      };
    } catch {
      return null;
    }
  }

  function startTimer() {
    clearInterval(timerId);
    $('timer').textContent = formatTime(state.elapsed);
    timerId = setInterval(() => {
      state.elapsed += 1;
      $('timer').textContent = formatTime(state.elapsed);
      if (state.elapsed % 5 === 0) persist();
    }, 1000);
  }

  function tone(correct) {
    if (localStorage.getItem('netquest-muted') === '1') return;
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = correct ? 640 : 190;
      gain.gain.value = 0.035;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.09);
    } catch {}
  }

  function answerCount() {
    return Object.keys(state.answered).length;
  }

  function correctCount() {
    return Object.values(state.answered).filter(answer => answer.correct).length;
  }

  function begin(resume = false, assessmentId = 'all', reviewOrder = null) {
    clearTimeout(advanceId);
    if (!resume) {
      const assessment = assessmentById.get(assessmentId) || assessmentById.get('all');
      const order = reviewOrder || assessment.questions.map(question => question.id);
      const label = reviewOrder ? `${assessment.title} — Review Missed` : assessment.title;
      state = freshState(order, reviewOrder ? 'review' : 'assessment', assessment.id, label);
      const shuffleMode = $('shuffleMode').value;
      state.shuffleQuestions = shuffleMode === 'questions' || shuffleMode === 'both';
      state.shuffleChoices = shuffleMode === 'choices' || shuffleMode === 'both';
      if (state.shuffleQuestions) state.order = shuffled(state.order);
      persist();
    }
    applyOrder();
    $('sessionLabel').textContent = state.scopeLabel.toUpperCase();
    show('quizScreen');
    startTimer();
    renderQuestion();
  }

  function renderQuestion() {
    clearTimeout(advanceId);
    const question = questions[state.index];
    const savedAnswer = state.answered[question.id];
    selectedChoiceIndexes = savedAnswer?.selectedChoiceIndexes?.slice() || [];
    selectedMatches = savedAnswer?.selectedMatches?.slice() || question.pairs?.map(() => '') || [];

    $('questionCounter').textContent = `Question ${state.index + 1} of ${questions.length}`;
    const assessmentPrefix = `${question.assessment} · `;
    $('questionBadge').textContent = `${assessmentPrefix}QUESTION ${String(question.number).padStart(3, '0')}`;
    renderQuestionText(question.text);
    $('timer').textContent = formatTime(state.elapsed);
    $('progressBar').style.width = `${(answerCount() / questions.length) * 100}%`;
    $('answeredCount').textContent = `${answerCount()} of ${questions.length} answered`;

    const isFlagged = state.flags.includes(question.id);
    $('flagButton').classList.toggle('flagged', isFlagged);
    $('flagButton').textContent = `${isFlagged ? '★' : '☆'} Flag`;

    const exhibitButton = $('exhibitButton');
    if (question.image) {
      exhibitButton.hidden = false;
      $('questionImage').src = question.image;
      $('questionImage').alt = `${question.assessment} question ${question.number} exhibit`;
    } else {
      exhibitButton.hidden = true;
      $('questionImage').removeAttribute('src');
    }

    $('answerArea').replaceChildren();
    $('feedback').className = 'feedback';
    $('feedback').replaceChildren();
    $('nextButton').hidden = true;
    $('submitButton').hidden = true;
    $('clearButton').hidden = true;
    $('answerArea').closest('.answer-panel').classList.toggle('answered', Boolean(savedAnswer));

    if (question.type === 'placeholder') {
      $('answerTitle').textContent = 'Question unavailable';
      $('answerHint').textContent = 'This slot could not be displayed in the source HTML. Continue without affecting your score.';
      $('nextButton').hidden = false;
      $('nextButton').textContent = 'Continue →';
    } else if (question.type === 'essay') {
      renderEssay(question, savedAnswer);
      $('nextButton').hidden = false;
      $('nextButton').textContent = 'Save response and continue →';
    } else if (question.type === 'match') renderMatching(question, savedAnswer);
    else renderChoices(question, savedAnswer);

    if (savedAnswer && question.type !== 'placeholder' && question.type !== 'essay') {
      renderFeedback(question, savedAnswer.correct);
      $('nextButton').hidden = false;
      $('nextButton').textContent = answerCount() === questions.length ? 'See results →' : 'Next question →';
    }
    updateSubmit(question);
    renderPicker();
  }

  function renderQuestionText(text) {
    const container = $('questionText');
    container.replaceChildren();
    const codePattern = /```(?:[a-z0-9_-]+)?\n([\s\S]*?)```/gi;
    let cursor = 0;
    let match;

    const appendProse = value => {
      value.split(/\n{2,}/).map(part => part.trim()).filter(Boolean).forEach(part => {
        const paragraph = document.createElement('p');
        paragraph.textContent = part;
        container.append(paragraph);
      });
    };

    while ((match = codePattern.exec(text))) {
      appendProse(text.slice(cursor, match.index));
      const code = document.createElement('pre');
      code.className = 'question-code';
      code.textContent = match[1].trim();
      container.append(code);
      cursor = match.index + match[0].length;
    }
    appendProse(text.slice(cursor));
  }

  function renderEssay(question, savedAnswer) {
    $('answerTitle').textContent = 'Written response';
    $('answerHint').textContent = 'Write your response below. This item is saved but not automatically graded.';
    const textarea = document.createElement('textarea');
    textarea.id = 'essayResponse';
    textarea.className = 'essay-response';
    textarea.rows = 8;
    textarea.placeholder = 'Write your explanation here…';
    textarea.value = savedAnswer?.response || '';
    textarea.setAttribute('aria-label', 'Written response');
    textarea.addEventListener('input', () => { state.answered[question.id] = { correct: null, response: textarea.value }; persist(); });
    $('answerArea').append(textarea);
    if (question.referenceAnswer) {
      const details = document.createElement('details');
      details.className = 'essay-reference';
      const summary = document.createElement('summary');
      summary.textContent = 'Show sample answer (ungraded)';
      const example = document.createElement('p');
      example.textContent = question.referenceAnswer;
      details.append(summary, example);
      $('answerArea').append(details);
    }
  }

  function renderChoices(question, savedAnswer) {
    const needed = question.answer.length;
    $('answerTitle').textContent = needed > 1 ? `Select ${needed} answers` : 'Select one answer';
    $('answerHint').textContent = question.type === 'ungraded' ? 'The HTML does not include an answer key for this question. Your choice will be saved without scoring.' : needed > 1 ? `Choose exactly ${needed} options.` : 'Tap an answer to check it instantly.';

    if (!state.choiceOrders[question.id]) {
      const indexes = question.options.map((_, index) => index);
      state.choiceOrders[question.id] = state.shuffleChoices ? shuffled(indexes) : indexes;
      persist();
    }

    const list = document.createElement('div');
    list.className = 'choice-list';
    state.choiceOrders[question.id].forEach((originalIndex, displayIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-button';
      button.dataset.index = originalIndex;
      const selected = selectedChoiceIndexes.includes(originalIndex);
      button.classList.toggle('selected', selected);

      const letter = document.createElement('span');
      letter.className = 'choice-letter';
      letter.textContent = letters[displayIndex];
      const copy = document.createElement('span');
      copy.className = 'choice-copy';
      copy.append(document.createTextNode(question.options[originalIndex]));
      if (question.optionImages?.[originalIndex]) {
        const image = document.createElement('img');
        image.src = question.optionImages[originalIndex];
        image.alt = `${question.options[originalIndex]} connector option`;
        copy.append(image);
      }
      button.append(letter, copy);

      if (savedAnswer) {
        const originalLetter = letters[originalIndex];
        if (question.type !== 'ungraded' && (question.acceptedAnswers || question.answer).includes(originalLetter)) button.classList.add('correct-answer');
        else if (selected && question.type !== 'ungraded') button.classList.add('wrong-answer');
      } else {
        button.addEventListener('click', () => {
          if (needed <= 1) selectedChoiceIndexes = [originalIndex];
          else if (selectedChoiceIndexes.includes(originalIndex)) selectedChoiceIndexes = selectedChoiceIndexes.filter(index => index !== originalIndex);
          else if (selectedChoiceIndexes.length < needed) selectedChoiceIndexes.push(originalIndex);
          if (needed <= 1) checkAnswer();
          else {
            renderChoiceSelection(list);
            updateSubmit(question);
          }
        });
      }
      list.append(button);
    });
    $('answerArea').append(list);
  }

  function renderChoiceSelection(list) {
    list.querySelectorAll('.choice-button').forEach(button => {
      button.classList.toggle('selected', selectedChoiceIndexes.includes(Number(button.dataset.index)));
    });
  }

  function renderMatching(question, savedAnswer) {
    $('answerTitle').textContent = 'Match every item';
    $('answerHint').textContent = 'Choose the correct match for each statement.';
    if (!state.matchOrders[question.id]) {
      state.matchOrders[question.id] = state.shuffleChoices ? shuffled(question.choices) : question.choices.slice();
      persist();
    }

    const list = document.createElement('div');
    list.className = 'match-list';
    question.pairs.forEach(([prompt], index) => {
      const row = document.createElement('div');
      row.className = 'match-row';
      const label = document.createElement('label');
      label.htmlFor = `match-${question.id}-${index}`;
      label.textContent = prompt;
      const select = document.createElement('select');
      select.id = label.htmlFor;
      select.dataset.index = index;
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Choose a match…';
      select.append(placeholder);
      for (const choice of state.matchOrders[question.id]) {
        const option = document.createElement('option');
        option.value = choice;
        option.textContent = choice;
        select.append(option);
      }
      select.value = selectedMatches[index] || '';
      if (!savedAnswer) {
        select.addEventListener('change', () => {
          selectedMatches[index] = select.value;
          updateSubmit(question);
        });
      }
      row.append(label, select);
      list.append(row);
    });
    $('answerArea').append(list);
  }

  function updateSubmit(question) {
    if (state.answered[question.id]) {
      $('submitButton').disabled = true;
      return;
    }
    $('submitButton').disabled = question.type === 'match'
      ? selectedMatches.length !== question.pairs.length || selectedMatches.some(value => !value)
      : selectedChoiceIndexes.length !== question.answer.length;
  }

  function checkAnswer() {
    const question = questions[state.index];
    let correct;
    const stored = {};
    if (question.type === 'ungraded') {
      correct = null;
      stored.selectedChoiceIndexes = selectedChoiceIndexes.slice();
    } else if (question.type === 'match') {
      correct = question.pairs.every((pair, index) => pair[1] === selectedMatches[index]);
      stored.selectedMatches = selectedMatches.slice();
    } else {
      const selectedLetters = selectedChoiceIndexes.map(index => letters[index]).sort().join('');
      correct = question.acceptedAnswers ? question.acceptedAnswers.includes(selectedLetters) : selectedLetters === question.answer.slice().sort().join('');
      stored.selectedChoiceIndexes = selectedChoiceIndexes.slice();
    }
    state.answered[question.id] = { correct, ...stored };
    persist();
    if (correct !== null) tone(correct);
    renderQuestion();
    if (correct) {
      $('nextButton').hidden = true;
      advanceId = setTimeout(goNext, 2000);
    }
  }

  function renderFeedback(question, correct) {
    const feedback = $('feedback');
    if (question.type === 'ungraded') {
      feedback.className = 'feedback show neutral';
      feedback.textContent = 'Choice saved. The source HTML does not show the correct answer for this question.';
      return;
    }
    feedback.className = `feedback show ${correct ? 'good' : 'bad'}`;
    const heading = document.createElement('strong');
    heading.textContent = correct ? 'Correct — nice work.' : 'Not quite. Review the correct answer below.';
    feedback.append(heading);

    const answer = document.createElement('div');
    if (question.type === 'match') {
      answer.textContent = question.pairs.map(([prompt, value]) => `${prompt} → ${value}`).join('\n');
    } else {
      const choiceOrder = state.choiceOrders[question.id] || question.options.map((_, index) => index);
      answer.textContent = (question.acceptedAnswers || question.answer).map(originalLetter => {
        const originalIndex = letters.indexOf(originalLetter);
        const displayedLetter = letters[choiceOrder.indexOf(originalIndex)];
        return `${displayedLetter}. ${question.options[originalIndex]}`;
      }).join('\n');
    }
    feedback.append(answer);

    if (question.explanation) {
      const explanation = document.createElement('div');
      explanation.style.marginTop = '9px';
      explanation.textContent = question.explanation;
      feedback.append(explanation);
    }

    if (question.answerImage) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Show source answer-key image';
      const image = document.createElement('img');
      image.src = question.answerImage;
      image.alt = `${question.assessment} question ${question.number} source answer key`;
      details.append(summary, image);
      feedback.append(details);
    }
  }

  function goNext() {
    clearTimeout(advanceId);
    const current = questions[state.index];
    if (current.type === 'placeholder' && !state.answered[current.id]) {
      state.answered[current.id] = { correct: null };
      persist();
    }
    if (current.type === 'essay' && !state.answered[current.id]) {
      state.answered[current.id] = { correct: null, response: $('essayResponse')?.value || '' };
      persist();
    }
    if (answerCount() === questions.length) {
      finish();
      return;
    }
    for (let offset = 1; offset <= questions.length; offset++) {
      const nextIndex = (state.index + offset) % questions.length;
      if (!state.answered[questions[nextIndex].id]) {
        state.index = nextIndex;
        persist();
        renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
  }

  function renderPicker() {
    const grid = $('pickerGrid');
    grid.replaceChildren();
    questions.forEach((question, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'picker-btn';
      const displayNumber = state.assessmentId === 'all' ? question.globalNumber : question.number;
      button.textContent = displayNumber;
      button.title = `${question.assessment} question ${question.number}${question.type === 'placeholder' ? ' (unavailable)' : question.type === 'ungraded' ? ' (ungraded)' : question.type === 'essay' ? ' (essay)' : ''}`;
      button.classList.toggle('current', index === state.index);
      const answer = state.answered[question.id];
      if (answer && answer.correct !== null) button.classList.add(answer.correct ? 'correct' : 'wrong');
      if (state.flags.includes(question.id)) button.classList.add('flagged');
      button.addEventListener('click', () => {
        clearTimeout(advanceId);
        state.index = index;
        persist();
        renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      grid.append(button);
    });
  }

  function renderAssessmentPicker() {
    const targets = {
      final: $('finalAssessmentGrid'),
      fa: $('faAssessmentGrid'),
      midterms: $('midtermsAssessmentGrid')
    };
    Object.values(targets).forEach(target => target.replaceChildren());

    assessments.forEach(assessment => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `assessment-card ${assessment.group === 'final' ? 'final-card' : ''}`;
      card.setAttribute('aria-label', `Start ${assessment.title}, ${assessment.questions.length} questions`);

      const copy = document.createElement('span');
      copy.className = 'assessment-copy';
      const badge = document.createElement('span');
      badge.className = 'assessment-badge';
      badge.textContent = assessment.group === 'final' ? 'ALL QUESTIONS' : assessment.title;
      const title = document.createElement('strong');
      title.textContent = assessment.title;
      const subtitle = document.createElement('small');
      subtitle.textContent = assessment.subtitle;
      copy.append(badge, title, subtitle);

      const stats = document.createElement('span');
      stats.className = 'assessment-stats';
      const count = document.createElement('strong');
      count.textContent = assessment.questions.length;
      const label = document.createElement('small');
      const best = localStorage.getItem(`visualquest-sa2-best-${assessment.id}`);
      label.textContent = best ? `Questions · Best ${best}%` : 'Questions';
      stats.append(count, label);

      card.append(copy, stats);
      card.addEventListener('click', () => begin(false, assessment.id));
      targets[assessment.group].append(card);
    });
  }

  function finish() {
    clearInterval(timerId);
    clearTimeout(advanceId);
    const correct = correctCount();
    const total = questions.filter(question => question.type === 'choice' || question.type === 'match').length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    $('finalPercent').textContent = `${percent}%`;
    $('finalScore').textContent = `${correct} / ${total} points`;
    $('correctStat').textContent = correct;
    $('wrongStat').textContent = total - correct;
    $('timeStat').textContent = formatTime(state.elapsed);
    $('scoreRing').style.setProperty('--score', `${percent}%`);
    $('reviewButton').hidden = correct === total;
    $('resultsAssessment').textContent = `${state.scopeLabel.toUpperCase()} COMPLETE`;
    if (state.mode === 'assessment') {
      const bestKey = `visualquest-sa2-best-${state.assessmentId}`;
      const previousBest = Number(localStorage.getItem(bestKey) || 0);
      if (percent > previousBest) localStorage.setItem(bestKey, String(percent));
      renderAssessmentPicker();
    }
    persist();
    show('resultsScreen');
  }

  function saveAndExit() {
    clearInterval(timerId);
    clearTimeout(advanceId);
    persist();
    const canResume = answerCount() < questions.length;
    $('resumeButton').hidden = !canResume;
    if (canResume) $('resumeButton').textContent = `Resume ${state.scopeLabel}`;
    renderAssessmentPicker();
    show('welcomeScreen');
  }

  $('resumeButton').addEventListener('click', () => begin(true));
  $('submitButton').addEventListener('click', checkAnswer);
  $('nextButton').addEventListener('click', goNext);
  $('clearButton').addEventListener('click', () => {
    const question = questions[state.index];
    if (question.type === 'match') selectedMatches = question.pairs.map(() => '');
    else selectedChoiceIndexes = [];
    renderQuestion();
  });
  $('flagButton').addEventListener('click', () => {
    const id = questions[state.index].id;
    state.flags = state.flags.includes(id) ? state.flags.filter(value => value !== id) : [...state.flags, id];
    persist();
    renderQuestion();
  });
  $('exitButton').addEventListener('click', saveAndExit);
  $('homeLink').addEventListener('click', event => {
    event.preventDefault();
    if ($('quizScreen').classList.contains('active')) saveAndExit();
    else {
      renderAssessmentPicker();
      show('welcomeScreen');
    }
  });
  $('retryButton').addEventListener('click', () => begin(false, state.assessmentId));
  $('reviewButton').addEventListener('click', () => {
    const missed = questions.filter(question => (question.type === 'choice' || question.type === 'match') && !state.answered[question.id]?.correct).map(question => question.id);
    if (missed.length) begin(false, state.assessmentId, missed);
  });

  $('exhibitButton').addEventListener('click', () => {
    $('dialogImage').src = $('questionImage').src;
    $('dialogImage').alt = $('questionImage').alt;
    $('imageDialog').showModal();
  });
  $('closeDialog').addEventListener('click', () => $('imageDialog').close());
  $('imageDialog').addEventListener('click', event => {
    if (event.target === $('imageDialog')) $('imageDialog').close();
  });

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('netquest-theme', theme);
    $('themeButton').textContent = theme === 'dark' ? '☀' : '☾';
    $('themeButton').setAttribute('aria-label', theme === 'dark' ? 'Use light mode' : 'Use dark mode');
  }
  $('themeButton').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  setTheme(localStorage.getItem('netquest-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  function updateSoundButton() {
    const muted = localStorage.getItem('netquest-muted') === '1';
    $('soundButton').classList.toggle('muted', muted);
    $('soundButton').textContent = muted ? '×' : '♪';
    $('soundButton').setAttribute('aria-label', muted ? 'Enable sound' : 'Mute sound');
  }
  $('soundButton').addEventListener('click', () => {
    localStorage.setItem('netquest-muted', localStorage.getItem('netquest-muted') === '1' ? '0' : '1');
    updateSoundButton();
  });
  updateSoundButton();

  renderAssessmentPicker();
  const saved = restore();
  if (saved && Object.keys(saved.answered).length < saved.order.length) {
    state = saved;
    applyOrder();
    $('resumeButton').hidden = false;
    $('resumeButton').textContent = `Resume ${state.scopeLabel}`;
    $('shuffleMode').value = state.shuffleQuestions ? (state.shuffleChoices ? 'both' : 'questions') : (state.shuffleChoices ? 'choices' : 'off');
  }
})();
