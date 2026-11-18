/* ============================================
   ARSA — Coach knowledge: nutrition and supplements
   General information only, not personal medical advice.
   ============================================ */

coachKb('nutrition', 'nut-protein', 'How much protein should I eat daily?',
  ['how much protein do i need', 'protein intake', 'protein per day', 'grams of protein', 'how many grams of protein should i eat', 'daily protein for muscle', 'protein needs', 'how much protein for muscle gain', 'protein for muscle growth', 'protein for gains'],
  (ctx) => {
    const out = [
      'For people who lift, the best-supported range is about **1.6 to 2.2 g of protein per kg of body weight per day** (0.7 to 1.0 g per lb). Spread it across 3 to 5 meals if you can, and do not worry about a precise "window" after training.'
    ];
    if (ctx.bodyKg) {
      out.push(`At your logged body weight (${ctx.bodyText}), that is about **${Math.round(ctx.bodyKg * 1.6)} to ${Math.round(ctx.bodyKg * 2.2)} g a day**.`);
    } else {
      out.push('Log your body weight on the Dashboard and I can give you a number for you.');
    }
    out.push('Good sources: eggs, chicken, fish, meat, dairy, tofu, beans and lentils.');
    return out;
  },
  { simple: ['Aim for about 1.6 to 2.2 grams of protein for every kg you weigh, each day.'], rel: ['nut-powder', 'nut-calories'] });

coachKb('nutrition', 'nut-pre', 'What should I eat before working out?',
  ['pre workout meal', 'what to eat before the gym', 'food before training', 'eat before lifting', 'should i eat before working out', 'pre workout nutrition', 'best pre workout food'],
  [
    'Eat a meal **1 to 3 hours before** if you can. Include **carbohydrates** for energy and some **protein**, and keep fat and fiber moderate so it sits well.',
    'Examples: rice with chicken, oatmeal with milk and a banana, a sandwich with eggs, yogurt with fruit.',
    'If you only have 30 to 60 minutes, pick something light like a banana or toast. Some people train fine fasted, so go with what feels good to you.'
  ],
  { simple: ['Have carbs and some protein 1 to 3 hours before training. Something small works if you are short on time.'], rel: ['nut-post', 'nut-water'] });

coachKb('nutrition', 'nut-post', 'What should I eat after working out?',
  ['post workout meal', 'food after training', 'eat after lifting', 'what to eat after the gym', 'post workout nutrition', 'anabolic window', 'protein after workout'],
  [
    'Eat a meal with **protein (about 20 to 40 g) and carbohydrates** within a few hours. There is no need to rush: your total protein and calories for the day matter far more than the exact timing.',
    'Examples: chicken and rice, eggs on toast, a protein shake with a banana, fish with potatoes.'
  ],
  { simple: ['After training, eat a normal meal with protein and carbs. The timing is flexible.'], rel: ['nut-pre', 'nut-protein'] });

coachKb('nutrition', 'nut-powder', 'Do I need protein powder to build muscle?',
  ['is protein powder necessary', 'should i buy whey protein', 'protein shake', 'whey protein', 'protein powder basics', 'do i need protein shakes', 'is whey good', 'do i need protein powder', 'protein powder to build muscle', 'is whey necessary', 'is whey protein necessary', 'is protein powder necessary'],
  [
    '**No.** Protein powder is just a convenient way to get protein. If you reach your daily protein from regular food, you do not need it.',
    'It helps if you struggle to eat enough or are busy. Whey is a common, well-studied choice, and plant proteins (like soy or pea blends) work too. Check the label, and choose a brand that is third-party tested if you can.'
  ],
  { rel: ['nut-protein', 'nut-supplements'] });

coachKb('nutrition', 'nut-calories', 'What are calories?',
  ['what is a calorie', 'calories meaning', 'how many calories do i need', 'calorie basics', 'what are kcal', 'daily calories'],
  [
    'A **calorie** (kcal) is a unit of energy in food. Your body uses calories to move, think and repair itself.',
    'Eat more than you use and your weight tends to go up. Eat less than you use and it tends to go down. **Maintenance** is the amount that keeps your weight steady.',
    'A rough maintenance guess is your body weight in kg times 30 to 35 kcal. Track your weight for 2 to 3 weeks and adjust from there.'
  ],
  { rel: ['nut-surplus', 'nut-deficit', 'nut-bulk-cut'] });

coachKb('nutrition', 'nut-bulk-cut', 'What is the difference between bulking and cutting?',
  ['bulking vs cutting', 'what is bulking', 'what is cutting', 'should i bulk or cut', 'bulk or cut', 'how do i bulk', 'how do i cut', 'bulking and cutting'],
  [
    '**Bulking** means eating a small calorie surplus to support muscle gain. **Cutting** means eating a small deficit to lose fat while keeping muscle.',
    'Both work best with the same training: lift heavy, keep progressing, and eat enough protein. Keep changes slow so you gain mostly muscle or lose mostly fat.'
  ],
  {
    ask: {
      key: 'stage', text: 'Are you currently bulking, cutting, or maintaining your weight?',
      opts: [
        { l: 'Bulking', v: 'bulking', re: /\b(bulk|bulking|gaining)\b/, a: ['For a lean bulk, eat about 250 to 500 kcal above maintenance and aim to gain around 0.25 to 0.5% of your body weight per week.'] },
        { l: 'Cutting', v: 'cutting', re: /\b(cut|cutting|losing|lose)\b/, a: ['For a cut, eat about 300 to 500 kcal below maintenance and aim to lose about 0.5 to 1% of your body weight per week. Keep protein high.'] },
        { l: 'Maintaining', v: 'maintaining', re: /\b(maintain|maintaining|maintenance|neither)\b/, a: ['At maintenance, you can still build muscle slowly if you are newer to lifting, or hold your weight steady while strength improves.'] }
      ]
    },
    rel: ['nut-surplus', 'nut-deficit', 'nut-recomp']
  });

coachKb('nutrition', 'nut-no-gain', 'Can I build muscle without gaining weight?',
  ['build muscle without gaining weight', 'gain muscle but stay the same weight', 'muscle without weight gain', 'get stronger without gaining weight'],
  [
    '**Yes**, especially if you are new to lifting, returning after a break, or have some fat to lose. Your body can add muscle while losing a similar amount of fat, so the scale does not change.',
    'This is slower than a bulk. Lift with progression, keep protein high (1.6 to 2.2 g per kg), and eat around maintenance calories. Use photos, measurements and your lifts to track progress, not just the scale.'
  ],
  { rel: ['nut-recomp'] });

coachKb('nutrition', 'nut-water', 'How much water should I drink during workouts?',
  ['water during workout', 'hydration', 'how much water should i drink', 'drink while training', 'dehydrated', 'staying hydrated in the gym'],
  [
    'Drink to thirst through the day and keep water with you in the gym. Pale yellow urine is a simple check.',
    'During long or sweaty sessions, a common guide is **about 0.4 to 0.8 litres per hour**, sipped in small amounts. There is no special amount that boosts muscle growth, and drinking far more than you need does not help.'
  ],
  { rel: ['nut-pre'] });

coachKb('nutrition', 'nut-carbs', 'Should I eat carbohydrates when building muscle?',
  ['are carbs good for muscle', 'do carbs help build muscle', 'low carb and muscle gain', 'carbohydrates and lifting', 'do i need carbs', 'carbs for energy'],
  [
    '**Yes, carbs are helpful.** They fuel your workouts and recovery, and they help you eat enough calories. Low-carb diets can work for some people, but most lifters train better with a decent amount of carbs.',
    'Good choices: rice, oats, potatoes, bread, pasta, fruit and beans. Fill up on whole foods most of the time.'
  ],
  { rel: ['nut-fats', 'nut-pre'] });

coachKb('nutrition', 'nut-fats', 'What are dietary fats and how much do I need?',
  ['how much fat should i eat', 'healthy fats', 'fats for muscle', 'dietary fat', 'is fat bad'],
  [
    'Dietary **fats** support hormones, brain health and the absorption of some vitamins. Aim for roughly **20 to 35% of your calories** from fat, and favor sources like olive oil, nuts, eggs, fish and avocado.',
    'Fat has 9 kcal per gram, compared with 4 for protein and carbs, so it adds up quickly.'
  ],
  { rel: ['nut-carbs', 'nut-calories'] });

coachKb('nutrition', 'nut-surplus', 'What is a calorie surplus?',
  ['calorie surplus', 'eat in a surplus', 'how big should my surplus be', 'what does surplus mean', 'surplus calories'],
  [
    'A **calorie surplus** means eating more calories than you burn. Your body can use the extra energy to build muscle (with training) or store it as fat.',
    'A small surplus of about **250 to 500 kcal a day** is plenty for most people. A bigger surplus mostly adds fat, not extra muscle.'
  ],
  { rel: ['nut-deficit', 'nut-bulk-cut'] });

coachKb('nutrition', 'nut-deficit', 'What is a calorie deficit?',
  ['calorie deficit', 'eat in a deficit', 'how big should my deficit be', 'how to lose fat', 'how to lose weight', 'fat loss', 'weight loss', 'lose belly fat', 'burn fat', 'spot reduction'],
  [
    'A **calorie deficit** means eating fewer calories than you burn. It is how your body loses fat over time.',
    'A moderate deficit of about **300 to 500 kcal a day** is a good start. Keep protein high and keep lifting heavy so you hold on to muscle. You cannot choose where fat comes off, so crunches will not remove belly fat.',
    'This is general information, not medical advice. Check with a doctor or dietitian if you have a health condition.'
  ],
  { rel: ['nut-recomp', 'nut-surplus'] });

coachKb('nutrition', 'nut-recomp', 'Can I build muscle while losing fat?',
  ['lose fat and gain muscle', 'body recomposition', 'recomp', 'gain muscle and lose fat at the same time', 'build muscle and lose fat'],
  [
    'It is possible, especially if you are **new to lifting, coming back after a break, or carry extra body fat**. This is called **body recomposition**.',
    'The recipe: lift with progression, eat high protein (1.6 to 2.2 g per kg), eat around maintenance or a slight deficit, and sleep well. It is slower than doing a dedicated bulk or cut, so be patient and track your lifts and measurements.'
  ],
  { rel: ['nut-no-gain', 'nut-bulk-cut'] });

coachKb('nutrition', 'nut-maintenance', 'What are maintenance calories?',
  ['maintenance calories', 'how do i find my maintenance', 'tdee', 'calorie maintenance level'],
  [
    '**Maintenance calories** are the calories that keep your weight steady. A rough start is your body weight in kg times 30 to 35.',
    'To find your real number: eat the same amount for 2 to 3 weeks and watch your average body weight. If it stays flat, that is maintenance. If it goes up or down, adjust by 100 to 200 kcal.'
  ],
  { rel: ['nut-calories'] });

coachKb('nutrition', 'nut-mps', 'What is muscle protein synthesis?',
  ['muscle protein synthesis', 'mps', 'how do muscles grow', 'how does muscle growth work', 'what makes muscles grow'],
  [
    '**Muscle protein synthesis (MPS)** is how your body builds new muscle protein. Hard lifting and eating protein both turn it up.',
    'Muscle grows when, over time, you build more than you break down. So: lift hard, eat enough protein across the day, and sleep.'
  ],
  { rel: ['nut-protein', 'rec-sleep'] });

coachKb('nutrition', 'nut-creatine', 'Is creatine safe and should I take it?',
  ['creatine', 'what is creatine', 'creatine basics', 'how much creatine', 'does creatine work', 'should i take creatine'],
  [
    'Creatine monohydrate is one of the best-researched supplements. The usual dose is **3 to 5 g a day**, at any time, no loading needed. It can add about 1 kg of water weight early on, and it modestly helps strength and reps.',
    'It is optional, not a requirement. Check with a doctor first if you have kidney problems or take regular medication.'
  ],
  { rel: ['nut-supplements'] });

coachKb('nutrition', 'nut-supplements', 'Which supplements are worth taking?',
  ['do i need supplements', 'best supplements for muscle', 'pre workout supplement', 'bcaa', 'fat burners', 'caffeine', 'supplement advice', 'are supplements necessary'],
  [
    'Food, sleep and training do the heavy lifting. Supplements worth considering: **protein powder** (just convenient protein), **creatine** (well researched), and **caffeine** if you tolerate it.',
    'BCAAs, fat burners and most "testosterone boosters" add little or nothing. Check labels, avoid stacking several stimulants, and ask a doctor if you have a health condition.'
  ],
  { rel: ['nut-creatine', 'nut-powder'] });
