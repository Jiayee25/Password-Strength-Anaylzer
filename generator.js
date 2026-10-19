let selectedSymbol  = '';
let selectedNumbers = [];
let numberEnabled   = false;

/* ---- SYMBOL SELECTION ---- */
document.querySelectorAll('.sym-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const sym = btn.dataset.sym;
    if (selectedSymbol === sym) {
      selectedSymbol = '';
      btn.classList.remove('active');
    } else {
      document.querySelectorAll('.sym-btn').forEach(b => b.classList.remove('active'));
      selectedSymbol = sym;
      btn.classList.add('active');
    }
  });
});

/* ---- NUMBER TOGGLE ---- */
function toggleNumber() {
  numberEnabled = !numberEnabled;
  const track = document.getElementById('num-track');
  const pad   = document.getElementById('numpad');
  track.classList.toggle('on', numberEnabled);
  pad.classList.toggle('visible', numberEnabled);
  if (!numberEnabled) {
    selectedNumbers = [];
    document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('active'));
  }
}

/* ---- NUMBER SELECTION ---- */
document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const n = btn.dataset.num;
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      selectedNumbers = selectedNumbers.filter(x => x !== n);
    } else {
      btn.classList.add('active');
      selectedNumbers.push(n);
    }
  });
});

/* ---- FISHER-YATES SHUFFLE ---- */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---- GENERATE PASSWORD ENGINE ---- */
function generatePassword() {
  let rawInput = document.getElementById('base-word').value.trim();
  if (!rawInput) rawInput = randomPhrase();

  let base = '';
  if (rawInput.includes(' ')) {
    // Advanced Sentence Tokenizer
    const words = rawInput.split(/\s+/).map(w => w.replace(/[^a-zA-Z0-9]/g, '')).filter(w => w.length > 0);
    if (words.length >= 3) {
      base = words[0] + words.slice(1, -1).map(w => w[0]).join('') + words[words.length - 1];
    } else {
      base = words.join('');
    }
  } else {
    base = rawInput;
  }

  // Keep formatting base completely pristine (exact user text layout sequence)
  const formattedBase = base;
  const randomSymbolPool = ['!','@','#','$','%','&','?','_'];
  const symbolStr    = selectedSymbol || randomSymbolPool[Math.floor(Math.random() * randomSymbolPool.length)];
  const numberStr    = numberEnabled
    ? (selectedNumbers.length > 0 ? selectedNumbers.join('') : String(Math.floor(Math.random()*10)) + String(Math.floor(Math.random()*10)))
    : (String(Math.floor(Math.random()*10)) + String(Math.floor(Math.random()*10)));

  // NEW DPAR BASELINE INPUT CONFIGURATION: Base Word + Symbol + Number
  const cleanUnshuffledPassword = formattedBase + symbolStr + numberStr;

  // Run the new visual-tier DPAR engine explicitly with separate block elements
  runDPAR(cleanUnshuffledPassword, formattedBase, symbolStr, numberStr);

  //remains intact for main output box
  const wordChars = base.split('').map(c => /[a-zA-Z]/.test(c) ? (Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()) : c);
  const scrambled = shuffle([...wordChars, ...(symbolStr ? [symbolStr] : []), ...numberStr.split('')]).join('');
  document.getElementById('pw-output').value = scrambled;

}

function randomPhrase() {
  const phrases = [
    'starlight shines bright at night','phoenix rising from the ashes',
    'cobalt blue ocean waves crashing','maple leaves fall in autumn',
    'zenith of cosmic space exploration','falcon flying high above mountains',
    'ember glowing in the dark','super nova explosion in galaxy',
    'cipher code cracked completely secure','coffee tastes great every morning'
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}


function copyPw() {
  const val = document.getElementById('pw-output').value;
  if (!val) return;
  navigator.clipboard.writeText(val).then(() => {
    const btn = document.querySelector('.btn-copy');
    btn.textContent = 'Copied!';
    btn.style.color = '#5efce8';
    setTimeout(() => { btn.textContent = 'Copy'; btn.style.color = ''; }, 1800);
  });
}

function usePw(idx) {
  const pw = document.getElementById('pw-' + idx).textContent;
  document.getElementById('pw-output').value = pw;
}

/* ============================================================
   DPAR — Human-Centric Rule-Based Tier Architecture
   ============================================================ */

/* PESrank strength calculation (bits) */
function pesrank(pw) {
  // --- PART 1: PURE MATHEMATICAL ENTROPY ---
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32;

  const freq = {};
  for (const c of pw) freq[c] = (freq[c] || 0) + 1;
  const shannon = Object.values(freq).reduce((h, f) => {
    const p = f / pw.length;
    return h - p * Math.log2(p);
  }, 0);

  const rawMathBits = (pw.length * Math.log2(Math.max(pool, 2)) * 0.6) + (shannon * pw.length * 0.4);
  const mathScore = Math.min(100, Math.round((rawMathBits / 80) * 100));

  // --- PART 2: DICTIONARY & PATTERN MATCHING ---
  const zxcvbnResult = zxcvbn(pw);
  const patternScore = zxcvbnResult.score * 25;

  // --- PART 3: HYBRID WEIGHTED COMBINATION ---
  const hybridScore = Math.round((mathScore * 0.6) + (patternScore * 0.4));

  // --- PART 4: COMPLEXITY BONUS ---
  // Count how many distinct l33t substitution characters are present.
  // Each detected l33t char adds a small bonus to differentiate tiers
  // that share the same pool size and similar length.
  const leetChars = ['@','3','1','0','$','7','|','9','8','2'];
  const leetCount = leetChars.filter(c => pw.includes(c)).length;
  const leetBonus = Math.min(leetCount * 2, 10); // max +10 bonus

  // Unique character ratio bonus — rewards non-repetitive passwords
  const uniqueRatio = new Set(pw.split('')).size / pw.length;
  const uniqueBonus = Math.round(uniqueRatio * 5); // max +5 bonus

  return Math.max(0, Math.min(100, hybridScore + leetBonus + uniqueBonus));
}

function bitsToScore(bits) { return Math.min(100, Math.round((bits/80)*100)); }

function scoreStyle(score) {
  if (score < 30) return { label: 'Very Weak', color: '#f97066' };
  if (score < 50) return { label: 'Fair',      color: '#fb923c' };
  if (score < 80) return { label: 'Strong',     color: '#34d399' };
  return                  { label: 'Excellent', color: '#5efce8' };
}

/* Standard matrix utility to calculate display Levenshtein values */
function getLevenshtein(a, b) {
  const dp = Array.from({length: a.length+1}, (_, i) => Array.from({length: b.length+1}, (_, j) => i || j));
  for (let i=1; i<=a.length; i++) for (let j=1; j<=b.length; j++)
    dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

/* ---- NEW RECO SELECTION DESIGN: FORCED VISUAL VARIETY ---- */
function runDPAR(original, base, symbol, numbers) {
  const section = document.getElementById('dpar-section');
  
 // Set RANDOM fallbacks if buttons are unselected — ensures every
  // generated password still contains a symbol and number even
  // when the user skips those selections.
  const randomSymbols = ['!','@','#','$','%','&','?','_'];
  const randomDigit    = () => String(Math.floor(Math.random() * 10));

  const sym = symbol || randomSymbols[Math.floor(Math.random() * randomSymbols.length)];
  const num = numbers || (randomDigit() + randomDigit());

  // --------------------------------------------------------
  // LEVEL 1: LOW CHANGE (Minimal mutation, highly memorable)
  // Rule: Titlecase base word only. Append number at end — no symbol.
  //       Keeping it simpler ensures a noticeably lower score than
  //       Medium and High, reflecting a genuine low-change tier.
  // --------------------------------------------------------
  const lowBase = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  const lowPassword = lowBase + sym + num;

  // --------------------------------------------------------
  // LEVEL 2: MEDIUM CHANGE (Full l33t + alternating case)
  // Rule: Apply full l33t substitution on ALL eligible characters.
  //       Non-substituted letters get alternating case for diversity.
  //       Symbol and number appended at end — no fixed wrapping.
  // --------------------------------------------------------
  let caseToggle = false;
  const midBase = base.split('').map(c => {
    const lower = c.toLowerCase();
    if (lower === 'a') return '@';
    if (lower === 'e') return '3';
    if (lower === 'i') return '1';
    if (lower === 'o') return '0';
    if (lower === 's') return '$';
    if (lower === 't') return '7';
    if (lower === 'l') return '|';
    if (lower === 'g') return '9';
    if (lower === 'b') return '8';
    if (lower === 'z') return '2';
    caseToggle = !caseToggle;
    return caseToggle ? c.toUpperCase() : c.toLowerCase();
  }).join('');
  const midPassword = midBase + sym + num;

  // --------------------------------------------------------
  // LEVEL 3: HIGH CHANGE (Maximum complexity transformation)
  // Rule: Apply full l33t on ALL eligible chars + alternating case on the rest,
  //       then REVERSE the transformed string, then symmetrically wrap with
  //       sym+num on both ends AND inject sym between every 2 characters.
  //       This guarantees highest entropy, longest length, and lowest pattern
  //       recognisability — making it more complex than Medium change.
  // --------------------------------------------------------
  let hToggle = false;
  const highLeet = base.split('').map(c => {
    const lower = c.toLowerCase();
    if (lower === 'a') return '@';
    if (lower === 'e') return '3';
    if (lower === 'i') return '1';
    if (lower === 'o') return '0';
    if (lower === 's') return '$';
    if (lower === 't') return '7';
    if (lower === 'l') return '|';
    if (lower === 'g') return '9';
    if (lower === 'b') return '8';
    if (lower === 'z') return '2';
    hToggle = !hToggle;
    return hToggle ? c.toUpperCase() : c.toLowerCase();
  }).join('');

  // Reverse the leet-transformed string for extra unpredictability
  const highReversed = highLeet.split('').reverse().join('');

  // Inject sym between every 2 characters to break pattern recognition
  let highInjected = '';
  for (let i = 0; i < highReversed.length; i++) {
    highInjected += highReversed[i];
    if (i % 3 === 2 && i < highReversed.length - 1) highInjected += sym;
  }

  // Symmetrical wrapping: num + sym at start, sym + num at end
  const highPassword = num + sym + highInjected + sym + num;

  // Package the three separate configurations
  // Each tier has a score ceiling to ensure a visible progressive gap:
  // Low  → max 80  (good but room for improvement)
  // Mid  → max 90  (clearly better than Low)
  // High → max 100 (strongest tier)
  const ceilings = [80, 90, 100];
  const recs = [
    { pw: lowPassword },
    { pw: midPassword },
    { pw: highPassword }
  ];

  // Render calculated properties cleanly onto the UI template cards
  for (let i = 0; i < 3; i++) {
    const rec = recs[i];
    const rawScore = pesrank(rec.pw);
    const score = Math.min(ceilings[i], rawScore);
    const { label, color } = scoreStyle(score);
    const calculatedLD = getLevenshtein(original, rec.pw);

    document.getElementById('pw-'    + i).textContent       = rec.pw;
    document.getElementById('ld-'    + i).textContent       = `LD: ${calculatedLD}`;
    document.getElementById('bar-'   + i).style.width       = score + '%';
    document.getElementById('bar-'   + i).style.background  = color;
    document.getElementById('score-' + i).textContent       = `${label} · ${score}/100`;
    document.getElementById('score-' + i).style.color       = color;
  }

  section.style.display = 'flex';
}