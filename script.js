(function(){
  var $ = function(id){ return document.getElementById(id); };

  /* ---------- Estimator ---------- */
  var defs = [
    { key:'lead',    label:'lead follow-up and CRM updates', title:'Lead qualification pipeline', body:'An intake form, AI scoring, routing to tracks, and timed email sequences, like my AI Lead Management Pipeline.' },
    { key:'report',  label:'reporting and data entry',       title:'Data into one place',          body:'Pull data from your tools into a single sheet and dashboard, with column mapping that survives layout changes.' },
    { key:'invoice', label:'invoices and payments',          title:'Payments to your books',       body:'Collect missing details from the people involved in Slack, then push clean records to QuickBooks, like my Expense Tracking System.' },
    { key:'sched',   label:'scheduling and bookings',        title:'Booking and reminders',        body:'Confirmation and reminder flows around your booking link, so no one chases a time slot by hand.' },
    { key:'approve', label:'internal approvals and messages',title:'Approvals in Slack',           body:'Requests and approvals handled in Slack, with an AI assistant for the repeat questions, like Winnax.' },
    { key:'onboard', label:'client onboarding',              title:'Onboarding workflow',          body:'Collect details once, create the records, and send the welcome sequence automatically.' }
  ];
  function money(n){ return '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function val(id){ return Number($(id).value); }
  function renderEstimate(){
    var people = val('e-people'), hours = val('e-hours'), rate = val('e-rate'), share = val('e-share');
    var month = Math.round(people * hours * (share / 100) * 52 / 12);
    var year = month * 12 * rate;
    $('o-people').textContent = people;
    $('o-hours').textContent = hours;
    $('o-rate').textContent = money(rate) + '/h';
    $('o-share').textContent = share + '%';
    $('r-hours').textContent = month;
    $('r-year').textContent = money(year);
    $('r-formula').innerHTML = people + ' people × ' + hours + ' h × ' + share + '% × 52 weeks ÷ 12 months = ' + month + ' h<br>' + month + ' h × 12 months × ' + money(rate) + '/h = ' + money(year);

    var picked = defs.filter(function(d){
      var box = document.querySelector('#areas input[data-key="' + d.key + '"]');
      return box && box.checked;
    });
    var recs = $('r-recs');
    recs.innerHTML = '';
    if (!picked.length) {
      var p = document.createElement('p');
      p.className = 'fine';
      p.textContent = 'Tick at least one area on the left and the first workflow I would build appears here.';
      recs.appendChild(p);
    }
    picked.slice(0, 3).forEach(function(d){
      var box = document.createElement('div'); box.className = 'rec';
      var b = document.createElement('b'); b.textContent = d.title;
      var s = document.createElement('span'); s.textContent = d.body;
      box.appendChild(b); box.appendChild(s); recs.appendChild(box);
    });

    var names = picked.map(function(d){ return d.label; });
    var msg = 'Hi Irwin, I tried your estimator. ' + people + ' people, ' + hours + ' h per week each, ' + money(rate) + ' per hour, ' + share + '% rule-based: about ' + month + ' hours per month (' + money(year) + ' per year). ' + (names.length ? 'Main areas: ' + names.join(', ') + '.' : '');
    $('r-wa').href = 'https://wa.me/639560588686?text=' + encodeURIComponent(msg);
  }
  ['e-people','e-hours','e-rate','e-share'].forEach(function(id){ $(id).addEventListener('input', renderEstimate); });
  document.querySelectorAll('#areas input').forEach(function(box){
    box.addEventListener('change', function(){ box.closest('.area').classList.toggle('on', box.checked); renderEstimate(); });
  });
  renderEstimate();

  /* ---------- Workflow explorer ---------- */
  var wf = {
    'WF-1':  { name:'Plaid Ingest', role:'Pulls card transactions from Plaid and rebuilds the dashboard HTML.', fixes:[
      'Plaid rejected requests with UNKNOWN_FIELDS because the proxy forwarded extra fields. The proxy no longer forwards them.',
      'A Merge node was silently dropping transactions. Its configuration is corrected.',
      'Expressions could not reach nodes in parallel branches because of an n8n scoping issue. Resolved.' ] },
    'WF-2':  { name:'Slack Cardholder Notification', role:'Messages the cardholder in Slack about a new transaction and asks them to explain the charge.', fixes:[] },
    'WF-3':  { name:'Slack Response Collector', role:'Collects cardholder replies from Slack and writes them to Google Sheets.', fixes:[
      'Worked through a chain of linked issues: Slack modal structure, the 3-second response limit, Google Sheets rate limits and Block Kit validation rules.',
      'A column shift once corrupted sheet data. Columns are now mapped by header name.' ] },
    'WF-5':  { name:'QuickBooks Push', role:'Pushes completed, filed transactions to QuickBooks.', fixes:[] },
    'WF-2b': { name:'Slack Remind Webhook', role:'Sends a reminder to a cardholder when the accountant triggers it. The webhook is protected by a header-based secret.', fixes:[] },
    'WF-4':  { name:'Weekly Summary to Accountant', role:'Sends the accountant a weekly rollup.', fixes:[] },
    'WF-6':  { name:'Project Management', role:'Adds and removes projects.', fixes:[] }
  };
  var mainIds = ['WF-1','WF-2','WF-3','WF-5'], supportIds = ['WF-2b','WF-4','WF-6'];
  var current = 'WF-1';
  function buildNodes(hostId, ids){
    var host = $(hostId);
    ids.forEach(function(id){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'node'; b.setAttribute('data-id', id);
      var i = document.createElement('i'); i.textContent = id;
      var n = document.createElement('b'); n.textContent = wf[id].name;
      b.appendChild(i); b.appendChild(n);
      b.addEventListener('click', function(){ current = id; renderExplorer(); });
      host.appendChild(b);
    });
  }
  function renderExplorer(){
    document.querySelectorAll('.node').forEach(function(b){
      b.setAttribute('aria-pressed', b.getAttribute('data-id') === current ? 'true' : 'false');
    });
    var w = wf[current], d = $('detail');
    d.innerHTML = '';
    var tag = document.createElement('span'); tag.className = 'tag'; tag.style.alignSelf = 'flex-start'; tag.textContent = current;
    var h = document.createElement('h5'); h.textContent = w.name;
    var p = document.createElement('p'); p.textContent = w.role;
    d.appendChild(tag); d.appendChild(h); d.appendChild(p);
    if (w.fixes.length) {
      var t = document.createElement('h4'); t.textContent = 'Problems solved here'; t.style.margin = '6px 0 0';
      var ul = document.createElement('ul'); ul.className = 'solved';
      w.fixes.forEach(function(f){ var li = document.createElement('li'); li.textContent = f; ul.appendChild(li); });
      d.appendChild(t); d.appendChild(ul);
    }
  }
  buildNodes('nodes-main', mainIds);
  buildNodes('nodes-support', supportIds);
  renderExplorer();

  /* ---------- Lightbox ---------- */
  var lb = $('lb'), im = $('lbimg'), x = $('lbclose'), last = null;
  function openLb(src, btn){ last = btn; im.src = src; lb.classList.add('open'); x.focus(); }
  function closeLb(){ lb.classList.remove('open'); im.removeAttribute('src'); if (last) last.focus(); }
  document.querySelectorAll('.shot').forEach(function(b){ b.addEventListener('click', function(){ openLb(b.getAttribute('data-full'), b); }); });
  x.addEventListener('click', closeLb);
  lb.addEventListener('click', function(e){ if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && lb.classList.contains('open')) closeLb(); });

  /* ---------- Copy email ---------- */
  var btn = $('copy'), mail = $('mail');
  function selectMail(){ var r = document.createRange(); r.selectNodeContents(mail); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
  btn.addEventListener('click', function(){
    function done(t){ btn.textContent = t; setTimeout(function(){ btn.textContent = 'Copy email'; }, 2000); }
    try {
      navigator.clipboard.writeText(mail.textContent).then(function(){ done('Copied'); }, function(){ selectMail(); done('Press Ctrl+C'); });
    } catch (e) { selectMail(); done('Press Ctrl+C'); }
  });
})();
