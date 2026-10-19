/* ---- VISIBILITY TOGGLE ---- */
let visible = false;

function toggleVis() {
  visible = !visible;
  const inp = document.getElementById('pw-input');
  inp.type = visible ? 'text' : 'password';
  document.getElementById('eye-icon').innerHTML = visible
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
}

/* ---- ANALYZE ---- */
function analyze() {
  const pw = document.getElementById('pw-input').value;

  // --- Keep Existing Criteria Checks ---
  const checks = {
    len:   pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    num:   /[0-9]/.test(pw),
    sym:   /[^A-Za-z0-9]/.test(pw),
  };

  // Update criteria UI
  Object.keys(checks).forEach(k => {
    document.getElementById('c-' + k).classList.toggle('met', checks[k]);
  });

  const metCount = Object.values(checks).filter(Boolean).length;
  const score    = Math.round((metCount / 5) * 100);

  // Bar Fill UI
  document.getElementById('bar-fill').style.width = pw ? score + '%' : '0%';
  document.getElementById('bar-pct').textContent   = pw ? score + '%' : '0%';

  // Result Elements
  const crackEl   = document.getElementById('crack-time');
  const verdictEl = document.getElementById('strength-verdict');

  if (!pw) {
    crackEl.innerHTML = 'Enter a password above';
    crackEl.className = 'crack-time';
    verdictEl.textContent = '';
    verdictEl.style.color = '';
    return;
  }

  // ==========================================
  // --- ADDED: ZXCVBN ALGORITHM EXECUTION ---
  // ==========================================
  // Pre-processing & Pattern Matching occur inside the zxcvbn evaluation
  const zxResult = zxcvbn(pw); 
  const zxScore  = zxResult.score; // Returns an entropy-based score from 0 to 4
  
  // Extracting real-time crack time estimations compiled by zxcvbn
  //  for a realistic, secure baseline estimation
  let crackTimeDisplay = zxResult.crack_times_display.online_no_throttling_10_per_second;

  let verdict, verdictColor;

  // Evaluation mapping based on zxcvbn's 0 - 4 score range
  switch(zxScore) {
    case 0:
      verdict = 'Very Weak : Highly Vulnerable!'; 
      verdictColor = '#f97066';
      break;
    case 1:
      verdict = 'Weak : Easy to Crack!';           
      verdictColor = '#fb923c';
      break;
    case 2:
      verdict = 'Fair : Moderate Security';        
      verdictColor = '#facc15';
      break;
    case 3:
      verdict = 'Strong : Good Security';          
      verdictColor = '#34d399';
      break;
    case 4:
      verdict = 'Strong : Highly Secure!';         
      verdictColor = '#5efce8';
      break;
    default:
      verdict = 'Weak : Easy to Crack!';           
      verdictColor = '#fb923c';
  }

  // Update DOM with zxcvbn metrics
  const isSecure = zxScore >= 3;
  crackEl.className = 'crack-time' + (isSecure ? ' secure' : '');
  crackEl.innerHTML = `crack time : <span>${crackTimeDisplay}</span>`;
  verdictEl.textContent  = verdict;
  verdictEl.style.color  = verdictColor;
}
 