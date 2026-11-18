/* ============================================
   ARSA — Coach safety
   Runs BEFORE any other answer. Warning signs always get a safety reply,
   even in the middle of another conversation.

   Rules the Coach follows here:
   - Sharp or sudden pain: stop that exercise.
   - Dizziness: stop, move somewhere safe, get help if it persists or is severe.
   - Chest pain, fainting, severe breathing trouble: stop and get emergency help now.
   - Suspected injury: see a healthcare professional.
   - Never diagnose, never prescribe treatment, never tell anyone to push through pain.
   - Ordinary muscle soreness is not an injury (see the soreness answers).
   ============================================ */

const COACH_SAFETY = {

  emergency: {
    p: [
      '**Stop exercising now.** Chest pain, pressure or tightness, fainting, or severe trouble breathing can be signs of something serious.',
      '**Get emergency medical help right away.** Call your local emergency number or ask someone nearby to. Do not drive yourself, and do not wait to see whether it passes.',
      'I cannot diagnose what is going on, and no workout is worth the risk. Please get checked first.'
    ],
    f: []
  },

  dizzy: {
    p: [
      '**Stop your workout** and put the weight down safely. Sit or lie down somewhere safe, away from the bar and other equipment.',
      'Sip some water once you feel steady, and do not start again today.',
      '**Get medical help** if the dizziness is severe, does not go away, comes with chest pain, trouble breathing, confusion, numbness, a bad headache or fainting. If it happens often when you train, have a doctor check it.'
    ],
    f: ['Why do I feel tired during workouts?', 'How much water should I drink during workouts?']
  },

  sharp: {
    p: [
      '**Stop that exercise.** Sharp, stabbing or sudden pain is not something to push through, and "no pain, no gain" is wrong for this kind of pain.',
      'Put the weight down safely. Do not keep testing it with more reps. If it eases, skip that movement for now and train something that does not set it off.',
      'If it is strong, stays after you stop, or comes with swelling, bruising, numbness, tingling or weakness, **see a doctor or physiotherapist**. I cannot tell what is causing it.'
    ],
    f: ['What is the difference between soreness and an injury?']
  },

  injury: {
    p: [
      'That sounds like it needs a proper check. **Stop the exercise that caused it** and do not train through it.',
      '**Have a doctor or physiotherapist assess it**, especially if you heard a pop, cannot move or put weight on it, or see swelling or bruising. I cannot diagnose injuries or recommend a treatment, and guessing could make it worse.',
      'Once it has been checked, you can ask the professional which training is safe, and I can help you plan around it.'
    ],
    f: ['What is the difference between soreness and an injury?']
  },

  sick: {
    p: [
      'Skip training when you feel properly unwell. **Fever, body aches, chest symptoms, vomiting or diarrhea** are all signs to rest, and training can make them worse and spread illness to others.',
      'With only mild symptoms (a little stuffy nose, for example) some people do a lighter session, but if you are unsure, rest. Listen to your body and let it be your guide.',
      'Come back gradually after you feel normal, with lighter weights for the first session. See a doctor if symptoms are severe or last more than a few days.'
    ],
    f: ['What if I miss a workout?']
  },

  fatigue: {
    p: [
      'Feeling very tired for days or weeks is a sign to **slow down**, not push harder.',
      'Check the basics: sleep (7 to 9 hours), enough food and water, stress, and how much you are training. A deload week (about half the sets, lighter weights) can help.',
      'If you are exhausted most of the time, or the tiredness comes with other symptoms like dizziness, breathlessness, or unexplained weight change, **see a doctor** to check it out.'
    ],
    f: ['What is a deload?', 'What are signs of poor recovery?']
  },

  // Body part pain while lifting: each gets the same stop-and-get-checked advice.
  parts: {
    shoulder: { name: 'shoulder', lifts: 'pressing and overhead work' },
    back: { name: 'back', lifts: 'deadlifts, squats and rows' },
    knee: { name: 'knee', lifts: 'squats and lunges' },
    elbow: { name: 'elbow', lifts: 'pressing, curls and triceps work' },
    wrist: { name: 'wrist', lifts: 'pressing and curls' },
    neck: { name: 'neck', lifts: 'overhead lifts and pulls' },
    hip: { name: 'hip', lifts: 'squats and hinges' }
  }
};

Object.assign(Coach, {

  // Reply for a body-part pain report.
  _partReply(part, lift) {
    const info = COACH_SAFETY.parts[part];
    const where = lift ? ` during ${lift}` : '';
    return {
      p: [
        `**Stop the exercise that is causing your ${info.name} pain${where}.** Do not push through it or test it with more reps.`,
        `Pain in a joint, or pain that is sharp or keeps coming back, is a reason to **have it assessed by a doctor or physiotherapist**. I cannot tell what is causing it, and the right advice depends on what they find.`,
        `Until then, avoid the movements that set it off (often ${info.lifts}), and keep training what feels fine. Come back to me for help planning your workouts around it once you know more.`
      ],
      f: ['What is the difference between soreness and an injury?', 'How do I know if my form is correct?'],
      safety: 'part'
    };
  },

  _safeReply(kind) {
    const r = COACH_SAFETY[kind];
    return { p: r.p.slice(), f: (r.f || []).slice(), safety: kind };
  },

  // Returns a safety reply when the message contains a warning sign, else null.
  _safety(ctx) {
    const q = ctx.pad;
    const has = (re) => re.test(q);
    const conv = this._conv;

    // Soreness on its own is not an injury.
    const sorenessOnly = has(/\b(sore|soreness|doms|stiff)\b/) && !has(/\b(sharp|stabbing|shooting|sudden|severe|pop|popped|snap|tore|torn|numb|swollen|swelling|injur|joint|hurts|hurt|pain|painful)\b/);

    // Emergency warning signs.
    if (has(/\b(chest|heart)\b.{0,30}\b(pain|hurt|hurts|hurting|tight|tightness|pressure|squeez\w*|crushing|discomfort)\b/) ||
        has(/\b(pain|pressure|tightness|discomfort)\b.{0,20}\b(in|around|across) (my )?(chest|heart)\b/) ||
        has(/\b(fainted|fainting|passed out|pass out|blacked out|black out|blacking out|collapsed|lost consciousness|about to faint|going to faint|going to pass out)\b/) ||
        has(/\b(cant|cannot|couldnt|unable to|hard to|trouble|difficulty|struggling to|struggle to|hardly|barely) (catch my )?breath\w*\b/) ||
        has(/\b(difficulty|trouble) breathing\b/) || has(/\bshort of breath\b/) || has(/\bgasping\b/) ||
        has(/\b(pain|numbness|tingling|numb)\b.{0,25}\b(left arm|jaw|down my arm)\b/) ||
        has(/\b(slurred|face drooping|sudden weakness|coughing (up )?blood|vision (going|went) (dark|black))\b/) ||
        has(/\b(heart (is )?(racing|pounding|skipping)|irregular heartbeat|palpitations)\b.{0,30}\b(wont|not|doesnt|dont)\b/)) {
      return this._safeReply('emergency');
    }

    // Dizziness.
    if (has(/\b(dizzy|dizziness|lightheaded|light headed|light head|vertigo|room (is )?spinning|seeing stars|seeing spots|nauseous|nauseated|feel sick to my stomach|woozy|going to throw up|about to vomit)\b/)) {
      return this._safeReply('dizzy');
    }

    // Suspected injury.
    if (has(/\b(popped|pop in my|heard a pop|felt a pop|snapped|tore|torn|ruptured|dislocated|sprain|sprained|fractured|broke my|broken bone|swollen|swelling|bruised|bruising|cant (move|put weight|lift my arm|straighten|bend)|pulled a muscle|pulled my|strained my|injured|injury|i hurt my|i think i hurt)\b/) && !sorenessOnly) {
      return this._safeReply('injury');
    }

    // Body part + pain.
    const painWord = /\b(hurt|hurts|hurting|pain|painful|ache|aches|aching|pinch|pinching|twinge|twinges|clicking and pain|burning|stabbing|sharp|tweak|tweaked|strain)\b/;
    if (has(painWord) && !sorenessOnly) {
      const lifts = [
        ['bench', 'bench press'], ['squat', 'squats'], ['deadlift', 'deadlifts'], ['overhead press', 'overhead press'], ['shoulder press', 'shoulder press'],
        ['curl', 'curls'], ['row', 'rows'], ['pull up', 'pull-ups'], ['pullup', 'pull-ups'], ['lunge', 'lunges'], ['push up', 'push-ups'], ['pushup', 'push-ups'],
        ['pulldown', 'pulldowns'], ['dip', 'dips'], ['leg press', 'leg press'], ['lateral raise', 'lateral raises']
      ];
      const lift = (lifts.find(([k]) => q.includes(' ' + k + ' ') || q.includes(' ' + k + 's ') || q.includes(' ' + k + 'es ')) || [])[1] || '';
      const parts = [
        ['shoulder', /\b(shoulder|shoulders|rotator|delt|delts)\b/], ['back', /\b(back|spine|lumbar|lower back|upper back)\b/],
        ['knee', /\b(knee|knees)\b/], ['elbow', /\b(elbow|elbows|tendon)\b/], ['wrist', /\b(wrist|wrists)\b/],
        ['neck', /\b(neck)\b/], ['hip', /\b(hip|hips|groin)\b/]
      ];
      for (const [name, re] of parts) {
        if (has(re)) { conv.safety = 'part'; return this._partReply(name, lift); }
      }
      // "Sharp pain" or "it hurts" with no named body part.
      return this._safeReply('sharp');
    }

    // "No pain no gain" and similar.
    if (has(/\bno pain no gain\b/) || has(/\b(push|power|work|train|lift) through (the )?pain\b/) || has(/\b(ignore|ignoring) (the )?pain\b/)) {
      return this._safeReply('sharp');
    }

    // Sick.
    if (has(/\b(sick|ill|fever|flu|covid|stomach bug|food poisoning|vomiting|diarrhea|diarrhoea|sore throat|a cold|have a cold|got a cold|coughing|runny nose|infection)\b/) &&
        has(/\b(train|workout|work out|lift|lifting|gym|exercise|exercising|squat|bench|run|session)\b/)) {
      return this._safeReply('sick');
    }

    // Excessive fatigue (lasting, not just "tired mid-workout").
    if (has(/\b(always|constantly|all the time|every day|for weeks|for days|extremely|completely|totally|chronically)\b.{0,15}\b(tired|exhausted|fatigued|drained|wiped out)\b/) ||
        has(/\b(exhausted|fatigued|drained|burnt out|burned out|burnout)\b.{0,25}\b(weeks|days|lately|all the time|constantly|always|cant recover)\b/) ||
        has(/\bcant (seem to )?recover\b/) || has(/\bno energy (for|in) (days|weeks)\b/) || has(/\bexcessive (fatigue|tiredness)\b/)) {
      return this._safeReply('fatigue');
    }


    // "Should I continue?" right after a safety reply: the answer stays the same.
    if (conv.safety && has(/\b(continue|keep (going|lifting|training|working)|push through|finish (my|the) (set|workout|session)|carry on|is it ok to|can i still|should i stop|do i need to stop|keep going)\b/)) {
      const kind = conv.safety === 'emergency' ? 'emergency' : (conv.safety === 'part' ? 'sharp' : conv.safety);
      return this._safeReply(kind);
    }

    return null;
  }
});
