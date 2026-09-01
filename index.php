<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Material (AI) Generator · GSES</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #0b2a5b;
      --navy-deep: #071833;
      --gold: #c9a227;
      --gold-soft: #f0d78c;
      --bg: #07111f;
      --card: rgba(14, 28, 48, 0.92);
      --border: rgba(201, 162, 39, 0.22);
      --text: #eef3fb;
      --muted: #93a4bd;
      --accent: #1d6fd8;
      --success: #22c55e;
      --error: #f87171;
      --ai: #3b82f6;
      --radius: 18px;
      --shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
      --font: "Outfit", "Segoe UI", sans-serif;
      --display: "Source Serif 4", Georgia, serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--font);
      color: var(--text);
      padding: 1.25rem 1rem 2.5rem;
      background:
        radial-gradient(ellipse 80% 50% at 10% -10%, rgba(201,162,39,0.18), transparent 55%),
        radial-gradient(ellipse 70% 45% at 95% 5%, rgba(29,111,216,0.22), transparent 50%),
        radial-gradient(ellipse 60% 40% at 50% 100%, rgba(11,42,91,0.55), transparent 60%),
        linear-gradient(165deg, #050b14 0%, #0a1a33 45%, #0d1524 100%);
      background-attachment: fixed;
    }
    .wrap { max-width: 920px; margin: 0 auto; position: relative; z-index: 1; }

    .site-header {
      display: grid;
      grid-template-columns: 110px 1fr 110px;
      align-items: center;
      gap: 0.75rem 1rem;
      margin-bottom: 1.5rem;
      padding: 0.9rem 1.1rem;
      background:
        linear-gradient(180deg, #ffffff 0%, #f7f9fc 70%, #eef3f9 100%);
      border: 1px solid rgba(201,162,39,0.35);
      border-radius: 22px;
      box-shadow: var(--shadow), inset 0 1px 0 #fff;
      color: var(--navy);
      animation: headerIn 0.55s ease-out;
    }
    @keyframes headerIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: none; }
    }
    .header-logo,
    .header-ganpati {
      display: block;
      width: 100%;
      max-width: 100px;
      height: 100px;
      object-fit: contain;
      margin: 0 auto;
      filter: drop-shadow(0 6px 12px rgba(11,42,91,0.15));
      transition: transform 0.35s ease;
    }
    .header-logo:hover,
    .header-ganpati:hover { transform: scale(1.04); }
    .header-center {
      min-width: 0;
      text-align: center;
      padding: 0 0.25rem;
    }
    .brand-kicker {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #8a7020;
      background: linear-gradient(90deg, rgba(201,162,39,0.18), rgba(201,162,39,0.05));
      border: 1px solid rgba(201,162,39,0.35);
      border-radius: 999px;
      padding: 0.2rem 0.7rem;
      margin-bottom: 0.45rem;
    }
    .header-center h1 {
      margin: 0;
      font-family: var(--display);
      font-size: clamp(1.2rem, 2.8vw, 1.65rem);
      font-weight: 700;
      color: var(--navy);
      line-height: 1.2;
    }
    .header-center .sub {
      margin: 0.4rem 0 0;
      color: #516787;
      font-size: 0.86rem;
      line-height: 1.45;
    }
    .header-center .badge {
      background: linear-gradient(135deg, #0b2a5b, #1d6fd8);
      color: #fff;
      font-family: var(--font);
      font-weight: 700;
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      padding: 0.18rem 0.55rem;
      border-radius: 999px;
      margin-left: 0.35rem;
      vertical-align: middle;
    }
    .header-user {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem 0.7rem;
      margin-top: 0.7rem;
    }
    .header-user .user-line {
      color: #355074;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .header-user .ghost {
      border-color: #c8d4e6;
      color: var(--navy);
      background: #fff;
      border-radius: 999px;
      padding: 0.35rem 0.9rem;
      font-weight: 600;
    }
    .header-user .ghost:hover { border-color: var(--gold); color: #8a7020; }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.6rem 1.5rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
      animation: cardIn 0.5s ease-out 0.08s both;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: none; }
    }
    .card.ai {
      border-color: rgba(201,162,39,0.28);
      background: linear-gradient(145deg, rgba(14,28,48,0.95), rgba(11,42,91,0.35));
    }

    #loginForm.card {
      max-width: 440px;
      margin-left: auto;
      margin-right: auto;
      padding: 2rem 1.75rem 1.75rem;
      border: 1px solid rgba(201,162,39,0.3);
      background:
        linear-gradient(160deg, rgba(16,34,58,0.98) 0%, rgba(10,24,44,0.96) 100%);
      position: relative;
      overflow: hidden;
    }
    #loginForm.card::before {
      content: "";
      position: absolute;
      inset: 0 0 auto 0;
      height: 3px;
      background: linear-gradient(90deg, var(--gold), #1d6fd8, var(--gold));
    }
    .login-head {
      text-align: center;
      margin-bottom: 1.4rem;
    }
    .login-head strong {
      display: block;
      font-family: var(--display);
      font-size: 1.55rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.35rem;
    }
    .login-head p {
      margin: 0;
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.45;
    }

    label { display: block; font-weight: 600; margin-bottom: 0.4rem; font-size: 0.88rem; color: #c7d4e8; }
    .hint { color: var(--muted); font-size: 0.8rem; margin: 0 0 0.75rem; }
    input[type="file"], input[type="text"], input[type="password"], select {
      width: 100%;
      padding: 0.8rem 0.9rem;
      background: rgba(5, 12, 24, 0.75);
      border: 1px solid rgba(147, 164, 189, 0.28);
      border-radius: 12px;
      color: var(--text);
      font-size: 0.95rem;
      font-family: var(--font);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input[type="file"] { border-style: dashed; cursor: pointer; }
    input:focus, select:focus {
      outline: none;
      border-color: rgba(201,162,39,0.65);
      box-shadow: 0 0 0 3px rgba(201,162,39,0.15);
    }
    .field { margin-bottom: 1.05rem; }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.85rem;
    }
    @media (max-width: 560px) { .grid-2 { grid-template-columns: 1fr; } }
    .check-row {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      padding: 0.85rem;
      margin-bottom: 1rem;
      background: rgba(29,111,216,0.1);
      border-radius: 12px;
      border: 1px solid rgba(29,111,216,0.28);
    }
    .check-row input { margin-top: 0.2rem; width: auto; }
    .check-row label { margin: 0; font-weight: 500; cursor: pointer; color: var(--text); }
    .check-row small { display: block; color: var(--muted); font-weight: 400; margin-top: 0.25rem; }
    button {
      width: 100%;
      padding: 0.95rem;
      background: linear-gradient(135deg, #0b2a5b 0%, #1d6fd8 55%, #c9a227 160%);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      font-family: var(--font);
      cursor: pointer;
      letter-spacing: 0.02em;
      box-shadow: 0 10px 24px rgba(29,111,216,0.28);
      transition: transform 0.15s ease, box-shadow 0.2s, opacity 0.2s;
    }
    button:hover:not(:disabled) {
      opacity: 1;
      transform: translateY(-1px);
      box-shadow: 0 14px 28px rgba(29,111,216,0.35);
    }
    button:disabled { opacity: 0.6; cursor: wait; transform: none; }
    button.linkish, button.ghost {
      width: auto;
      padding: 0.4rem 0.75rem;
      background: transparent;
      border: 1px solid var(--border);
      color: var(--muted);
      font-size: 0.85rem;
      box-shadow: none;
    }
    #status {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 12px;
      display: none;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    #status.show { display: block; }
    #status.ok { background: rgba(34,197,94,0.15); border: 1px solid var(--success); }
    #status.err { background: rgba(239,68,68,0.15); border: 1px solid var(--error); }
    #status.loading { background: rgba(29,111,216,0.12); border: 1px solid rgba(29,111,216,0.45); }
    a.dl {
      display: inline-block;
      margin-top: 0.35rem;
      margin-right: 0.75rem;
      color: #7eb6ff;
      text-decoration: none;
      font-weight: 600;
    }
    a.dl:hover { text-decoration: underline; }
    code {
      background: rgba(5,12,24,0.8);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    ul { margin: 0.5rem 0 0; padding-left: 1.25rem; color: var(--muted); font-size: 0.85rem; }
    .topic-list { list-style: none; padding: 0; margin: 0.75rem 0 0; }
    .topic-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.7rem 0.85rem;
      border: 1px solid rgba(147,164,189,0.2);
      border-radius: 12px;
      margin-bottom: 0.5rem;
      background: rgba(5,12,24,0.45);
    }
    .topic-item.done { border-color: rgba(34,197,94,0.4); }
    .topic-item.pending { border-color: rgba(251,191,36,0.35); }
    .topic-item.skipped { border-color: rgba(248,113,113,0.45); }
    .topic-meta { flex: 1; min-width: 0; }
    .topic-meta strong { display: block; font-size: 0.9rem; }
    .topic-meta small { color: var(--muted); font-size: 0.78rem; }
    .topic-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
      justify-content: flex-end;
      flex-shrink: 0;
    }
    .topic-btn {
      width: auto;
      padding: 0.45rem 0.75rem;
      font-size: 0.82rem;
      white-space: nowrap;
      box-shadow: none;
    }
    .topic-btn.skip-btn {
      background: transparent;
      border: 1px solid rgba(248,113,113,0.45);
      color: #fca5a5;
    }
    .topic-btn.skip-btn:hover:not(:disabled) {
      border-color: var(--error);
      color: #fecaca;
      opacity: 1;
      transform: none;
    }
    .topic-btn.regen-btn {
      background: transparent;
      border: 1px solid rgba(201,162,39,0.45);
      color: var(--gold-soft);
    }
    .topic-btn.regen-btn:hover:not(:disabled) {
      border-color: var(--gold);
      color: #fff;
      opacity: 1;
      transform: none;
    }
    button.secondary {
      width: 100%;
      margin: 0.75rem 0 0.25rem;
      background: transparent;
      border: 1px solid rgba(201,162,39,0.45);
      color: var(--gold-soft);
      box-shadow: none;
    }
    .btn-row {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 0.75rem;
    }
    .btn-row-3 {
      grid-template-columns: 1fr 1.2fr 1.6fr;
    }
    @media (max-width: 560px) {
      .btn-row,
      .btn-row-3 { grid-template-columns: 1fr; }
    }
    button.clear-btn {
      width: 100%;
      background: transparent;
      border: 1px solid rgba(147,164,189,0.3);
      color: var(--muted);
      box-shadow: none;
    }
    button.clear-btn:hover:not(:disabled) {
      border-color: var(--error);
      color: #fecaca;
      opacity: 1;
      transform: none;
    }
    button.add-more-btn {
      width: 100%;
      margin-top: 0;
      background: transparent;
      border: 1px dashed rgba(201,162,39,0.65);
      color: var(--gold-soft);
      box-shadow: none;
      font-weight: 700;
    }
    button.add-more-btn:hover:not(:disabled) {
      border-style: solid;
      border-color: var(--gold);
      color: #fff;
      background: rgba(201,162,39,0.14);
      opacity: 1;
      transform: none;
    }
    button.add-more-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .queue-list { list-style: none; padding: 0; margin: 0.75rem 0 0; }
    .queue-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.7rem 0.85rem;
      border: 1px solid rgba(147,164,189,0.22);
      border-radius: 12px;
      margin-bottom: 0.5rem;
      background: rgba(5,12,24,0.45);
    }
    .queue-item.queued { border-color: rgba(147,164,189,0.28); }
    .queue-item.running { border-color: rgba(29,111,216,0.55); background: rgba(29,111,216,0.1); }
    .queue-item.done { border-color: rgba(34,197,94,0.4); }
    .queue-item.error { border-color: rgba(248,113,113,0.45); }
    .queue-meta { flex: 1; min-width: 0; }
    .queue-meta strong { display: block; font-size: 0.92rem; }
    .queue-meta small { color: var(--muted); font-size: 0.78rem; }
    .queue-badge {
      flex-shrink: 0;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.22rem 0.55rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: rgba(147,164,189,0.15);
      color: var(--muted);
    }
    .queue-item.running .queue-badge { background: rgba(29,111,216,0.2); color: #93c5fd; }
    .queue-item.done .queue-badge { background: rgba(34,197,94,0.18); color: #86efac; }
    .queue-item.error .queue-badge { background: rgba(248,113,113,0.18); color: #fca5a5; }
    .queue-remove {
      width: auto;
      padding: 0.35rem 0.65rem;
      font-size: 0.78rem;
      background: transparent;
      border: 1px solid rgba(248,113,113,0.4);
      color: #fca5a5;
      box-shadow: none;
    }
    .queue-remove:hover:not(:disabled) {
      border-color: var(--error);
      color: #fecaca;
      opacity: 1;
      transform: none;
    }
    .queue-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      align-items: center;
      justify-content: flex-end;
      flex-shrink: 0;
    }
    .queue-regen {
      width: auto;
      padding: 0.35rem 0.65rem;
      font-size: 0.78rem;
      background: transparent;
      border: 1px solid rgba(201,162,39,0.55);
      color: var(--gold-soft);
      box-shadow: none;
    }
    .queue-regen:hover:not(:disabled) {
      border-color: var(--gold);
      color: #fff;
      background: rgba(201,162,39,0.14);
      opacity: 1;
      transform: none;
    }
    .chapters-list { list-style: none; padding: 0; margin: 0; }
    .chapter-group { margin-bottom: 1.1rem; }
    .chapter-group:last-child { margin-bottom: 0; }
    .chapter-group-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin: 0 0 0.55rem;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--gold-soft);
    }
    .chapter-card {
      border: 1px solid rgba(147,164,189,0.2);
      border-radius: 14px;
      background: rgba(5,12,24,0.45);
      margin-bottom: 0.55rem;
      overflow: hidden;
    }
    .chapter-card.active {
      border-color: rgba(29,111,216,0.55);
      box-shadow: 0 0 0 1px rgba(29,111,216,0.25);
    }
    .chapter-card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.85rem 0.95rem;
      cursor: pointer;
      width: 100%;
      text-align: left;
      background: transparent;
      border: none;
      border-radius: 0;
      box-shadow: none;
      color: inherit;
      font: inherit;
    }
    .chapter-card-head:hover:not(:disabled) {
      background: rgba(29,111,216,0.08);
      transform: none;
      opacity: 1;
      box-shadow: none;
    }
    .chapter-card-meta { flex: 1; min-width: 0; }
    .chapter-card-meta strong {
      display: block;
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
    }
    .chapter-card-meta small {
      display: block;
      margin-top: 0.25rem;
      color: var(--muted);
      font-size: 0.78rem;
      line-height: 1.4;
    }
    .chapter-progress {
      flex-shrink: 0;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      background: rgba(29,111,216,0.15);
      color: #93c5fd;
      white-space: nowrap;
    }
    .chapter-progress.complete {
      background: rgba(34,197,94,0.15);
      color: #86efac;
    }
    .chapter-topics {
      list-style: none;
      padding: 0 0.85rem 0.85rem;
      margin: 0;
      border-top: 1px solid rgba(147,164,189,0.12);
      display: none;
    }
    .chapter-card.open .chapter-topics { display: block; }
    .chapter-topics li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.45rem 0;
      border-bottom: 1px solid rgba(147,164,189,0.08);
      font-size: 0.85rem;
      color: var(--text);
    }
    .chapter-topics li:last-child { border-bottom: none; }
    .chapter-topics .dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      flex-shrink: 0;
      background: rgba(251,191,36,0.8);
    }
    .chapter-topics .dot.done { background: var(--success); }
    .empty-chapters {
      color: var(--muted);
      font-size: 0.88rem;
      margin: 0;
      text-align: center;
      padding: 0.75rem 0.25rem;
    }
    .badge {
      display: inline-block;
      background: rgba(168,85,247,0.2);
      color: #d8b4fe;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      margin-left: 0.35rem;
      vertical-align: middle;
    }
    .panel-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1.1rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid rgba(147,164,189,0.15);
    }
    .panel-title strong {
      font-family: var(--display);
      font-size: 1.2rem;
      font-weight: 700;
    }
    .panel-title span {
      font-size: 0.75rem;
      color: var(--gold-soft);
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .hidden { display: none !important; }
    #loginStatus { margin-top: 0.85rem; font-size: 0.9rem; color: var(--error); text-align: center; min-height: 1.2em; }

    @media (max-width: 640px) {
      .site-header {
        grid-template-columns: 1fr 1fr;
        grid-template-areas:
          "logo ganpati"
          "center center";
        gap: 0.5rem 0.75rem;
        padding: 0.75rem;
      }
      .header-logo { grid-area: logo; justify-self: start; max-width: 78px; height: 78px; }
      .header-ganpati { grid-area: ganpati; justify-self: end; max-width: 78px; height: 78px; }
      .header-center { grid-area: center; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="site-header">
      <img class="header-logo" src="public/images/gses-logo.png" alt="Gujarat School of Excellence System" onerror="this.style.visibility='hidden'">
      <div class="header-center">
        <div class="brand-kicker">Gujarat School of Excellence System</div>
        <h1>Material Generator <span class="badge">AI</span></h1>
        <p class="sub">Add all chapters → auto generate 1-by-1 → chapter-wise list</p>
        <div id="userBar" class="header-user hidden">
          <span class="user-line" id="userLabel"></span>
          <button type="button" class="ghost" id="logoutBtn">Logout</button>
        </div>
      </div>
      <img class="header-ganpati" src="public/images/ganpati.png" alt="Shree Ganpati" onerror="this.style.visibility='hidden'">
    </header>

    <!-- LOGIN -->
    <form id="loginForm" class="card">
      <div class="login-head">
        <strong>Welcome GSES Chaturji</strong>
        <p>Sign in with your GSES account to generate chapter material</p>
      </div>
      <div class="field">
        <label for="username">Email</label>
        <input type="text" id="username" name="username" autocomplete="username" placeholder="you@example.com" required>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" autocomplete="current-password" placeholder="••••••••" required>
      </div>
      <button type="submit" id="loginBtn">Sign in</button>
      <div id="loginStatus"></div>
    </form>

    <!-- GENERATE -->
    <div id="appPanel" class="hidden">
      <form id="uploadForm" class="card" enctype="multipart/form-data">
        <div class="panel-title">
          <strong>Add chapters</strong>
          <span>Queue → generate 1-by-1</span>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="medium">Medium</label>
            <select id="medium" name="medium" required>
              <option value="">Select medium</option>
              <option value="Gujarati">Gujarati</option>
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
              <option value="Marathi">Marathi</option>
            </select>
          </div>
          <div class="field">
            <label for="standard">Standard</label>
            <select id="standard" name="standard" required>
              <option value="">Select standard</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label for="subject">Subject</label>
          <input type="text" id="subject" name="subject" list="subjectList" placeholder="Select or type subject" autocomplete="off" required>
          <datalist id="subjectList"></datalist>
          <p class="hint" style="margin-top:0.4rem;">Same for all chapters below. Not in list? Type a new subject.</p>
        </div>

        <div class="panel-title" style="margin-top:0.35rem;">
          <strong style="font-size:1rem;">Chapter entry</strong>
          <span>Add to queue</span>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="chapter_no">Chapter No</label>
            <input type="text" id="chapter_no" name="chapter_no" placeholder="e.g. 1" autocomplete="off">
          </div>
          <div class="field">
            <label for="chapter_name">Chapter Name</label>
            <input type="text" id="chapter_name" name="chapter_name" placeholder="e.g. SOME BASIC CONCEPTS OF CHEMISTRY" autocomplete="off">
          </div>
        </div>

        <div class="field">
          <label for="chapter_pdf">Chapter PDF</label>
          <p class="hint">Select PDF, then click <strong>+ Add more</strong> to queue it. Add all chapters first.</p>
          <input type="file" id="chapter_pdf" name="chapter_pdf" accept=".pdf,application/pdf">
        </div>

        <div class="check-row">
          <input type="checkbox" id="auto_all_topics" checked>
          <label for="auto_all_topics">
            Auto generate all topics per chapter
            <small>Each queued chapter: Topic 1 → 2 → 3… then next chapter automatically.</small>
          </label>
        </div>

        <div class="btn-row btn-row-3">
          <button type="button" class="clear-btn" id="clearBtn">Clear</button>
          <button type="button" class="add-more-btn" id="addMoreBtn">+ Add more</button>
          <button type="submit" id="submitBtn">Generate all chapters</button>
        </div>
        <p class="hint" style="margin-top:0.55rem;">
          1) Fill Medium / Standard / Subject · 2) Add every chapter with <strong>+ Add more</strong> · 3) Click <strong>Generate all chapters</strong> (1-by-1 auto).
        </p>

        <div id="queuePanel" style="display:none;margin-top:1rem;">
          <strong id="queueTitle">Queued chapters (0)</strong>
          <ul class="queue-list" id="queueList"></ul>
        </div>

        <div id="status"></div>
        <div id="topicPanel" style="display:none;margin-top:1rem;"></div>
      </form>

      <div class="card" id="chaptersCard">
        <div class="panel-title">
          <strong>All chapters</strong>
          <span>Chapter-wise topics</span>
        </div>
        <p class="hint" style="margin-top:-0.35rem;">Generated chapters appear here with topics under each chapter.</p>
        <div id="chaptersPanel"><p class="empty-chapters">Loading chapters…</p></div>
      </div>

      <div class="card ai">
        <div class="panel-title">
          <strong>How it works</strong>
          <span>GSES · AI</span>
        </div>
        <ul>
          <li>1. Login with your GSES account</li>
          <li>2. Set Medium, Standard, Subject once</li>
          <li>3. For each chapter: enter No + Name + PDF → click <strong>+ Add more</strong> (repeat)</li>
          <li>4. Click <strong>Generate all chapters</strong> — uploads &amp; generates chapter 1, then 2, then 3…</li>
          <li>5. List below shows every chapter with topics</li>
        </ul>
      </div>
    </div>
  </div>

  <script>
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginStatus = document.getElementById('loginStatus');
    const appPanel = document.getElementById('appPanel');
    const userBar = document.getElementById('userBar');
    const userLabel = document.getElementById('userLabel');
    const logoutBtn = document.getElementById('logoutBtn');

    const form = document.getElementById('uploadForm');
    const status = document.getElementById('status');
    const topicPanel = document.getElementById('topicPanel');
    const chaptersPanel = document.getElementById('chaptersPanel');
    const btn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const autoAll = document.getElementById('auto_all_topics');
    const queuePanel = document.getElementById('queuePanel');
    const queueList = document.getElementById('queueList');
    const queueTitle = document.getElementById('queueTitle');

    let chapterQueue = [];
    let processingQueue = false;
    let queueSeq = 1;

    let chapterJsonName = sessionStorage.getItem('chapterJsonName') || null;
    let downloadUrls = {};
    try {
      downloadUrls = JSON.parse(sessionStorage.getItem('downloadUrls') || '{}') || {};
    } catch (_) {
      downloadUrls = {};
    }
    let generatingAll = false;
    let latestRow = null;
    let activeMaterialId = null;
    let failedTopics = {};
    let standardsCache = [];
    let subjectsCache = [];
    let currentUser = null;
    let chaptersCache = [];
    let openChapterIds = new Set();

    function userStandardValue() {
      const raw = currentUser?.standard;
      if (raw == null || String(raw).trim() === '') return '';
      const m = String(raw).match(/(\d{1,2})/);
      return m ? String(parseInt(m[1], 10)) : String(raw).trim();
    }

    function setFieldValue(id, value) {
      const el = document.getElementById(id);
      if (!el || value == null) return;
      el.value = String(value);
    }

    function fillSelect(selectEl, items, placeholder, selectedValue) {
      if (!selectEl) return;
      const prev = selectedValue != null ? String(selectedValue) : selectEl.value;
      selectEl.innerHTML = '';
      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = placeholder;
      selectEl.appendChild(opt0);
      for (const item of items) {
        const opt = document.createElement('option');
        opt.value = item.value;
        opt.textContent = item.name;
        if (item.id != null) opt.dataset.id = String(item.id);
        selectEl.appendChild(opt);
      }
      if (prev) {
        const match = [...selectEl.options].find(
          (o) => o.value === prev || o.textContent === prev || o.textContent.replace(/\D+/g, '') === prev
        );
        if (match) selectEl.value = match.value;
      }
    }

    async function loadStandards(selectedValue) {
      const sel = document.getElementById('standard');
      const res = await fetch('api/meta.php');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load standards');
      standardsCache = data.standards || [];
      if (sel) sel.disabled = false;
      // Prefer teacher's assigned standard (e.g. 11), never leave blank when known
      const prefer =
        userStandardValue()
        || (selectedValue != null ? String(selectedValue).replace(/\D+/g, '') || selectedValue : '')
        || data.user_standard
        || '';
      fillSelect(sel, standardsCache, 'Select standard', prefer);
      if (prefer && sel && !sel.value) {
        const opt = document.createElement('option');
        opt.value = prefer;
        opt.textContent = 'Std ' + prefer;
        sel.appendChild(opt);
        sel.value = prefer;
      }
      await loadSubjectsForStandard(sel?.value || prefer);
    }

    function resolveStandardId(standardValue) {
      if (!standardValue) return null;
      const v = String(standardValue);
      const hit = standardsCache.find(
        (s) => String(s.value) === v || String(s.id) === v || s.name === v
          || String(s.name).replace(/\D+/g, '') === v
      );
      return hit ? hit.id : (Number.isFinite(Number(v)) ? Number(v) : null);
    }

    async function loadSubjectsForStandard(standardValue, selectedSubject) {
      const input = document.getElementById('subject');
      const list = document.getElementById('subjectList');
      const standardId = resolveStandardId(standardValue ?? document.getElementById('standard')?.value);
      if (!standardId) {
        subjectsCache = [];
        if (list) list.innerHTML = '';
        if (input && !selectedSubject) input.value = '';
        return;
      }
      const res = await fetch('api/meta.php?standard_id=' + encodeURIComponent(standardId));
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load subjects');
      subjectsCache = data.subjects || [];
      if (list) {
        list.innerHTML = '';
        for (const item of subjectsCache) {
          const opt = document.createElement('option');
          opt.value = item.value || item.name;
          list.appendChild(opt);
        }
      }
      if (selectedSubject) {
        input.value = selectedSubject;
      } else if (subjectsCache.length === 1 && !input.value) {
        input.value = subjectsCache[0].value || subjectsCache[0].name;
      }
    }

    async function applyFormMeta(meta = {}) {
      // Never wipe shared fields with empty values (breaks multi-chapter queue after topic 1)
      if (meta.medium) setFieldValue('medium', meta.medium);
      if (meta.chapter_no != null && String(meta.chapter_no) !== '') {
        setFieldValue('chapter_no', meta.chapter_no);
      }
      if (meta.chapter_name || meta.title) {
        setFieldValue('chapter_name', meta.chapter_name || meta.title);
      }
      try {
        // Teacher's assigned standard wins over resumed material (avoids Std 11 login → Std 6 form)
        const preferredStd = userStandardValue() || meta.standard || '';
        if (!standardsCache.length) {
          await loadStandards(preferredStd);
        } else if (preferredStd) {
          setFieldValue('standard', preferredStd);
          await loadSubjectsForStandard(
            document.getElementById('standard')?.value || preferredStd,
            meta.subject || document.getElementById('subject')?.value || ''
          );
        }
        if (preferredStd) setFieldValue('standard', preferredStd);
        if (meta.subject) setFieldValue('subject', meta.subject);
      } catch (_) {
        // keep whatever is already on the form
      }
    }

    function showLogin() {
      loginForm.classList.remove('hidden');
      appPanel.classList.add('hidden');
      userBar.classList.add('hidden');
    }

    async function showApp(user) {
      currentUser = user || null;
      loginForm.classList.add('hidden');
      appPanel.classList.remove('hidden');
      userBar.classList.remove('hidden');
      const stdLabel = user?.standard ? ` · Std ${user.standard}` : '';
      userLabel.textContent = user?.username
        ? `Signed in as ${user.username}${user.role ? ` (${user.role})` : ''}${stdLabel}`
        : 'Signed in';
      try {
        await loadStandards(user?.standard || '');
      } catch (err) {
        status.textContent = err.message || 'Could not load standards/subjects';
      }
      await Promise.all([resumeFromDb(), loadChaptersList()]);
      updateQueueControls();
    }

    async function checkSession() {
      try {
        const res = await fetch('api/login.php');
        const data = await res.json();
        if (data.logged_in) showApp(data.user);
        else showLogin();
      } catch (_) {
        showLogin();
      }
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginStatus.textContent = '';
      loginBtn.disabled = true;
      try {
        const body = new FormData(loginForm);
        body.append('action', 'login');
        const res = await fetch('api/login.php', { method: 'POST', body });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Login failed');
        showApp(data.user);
      } catch (err) {
        loginStatus.textContent = err.message || 'Login failed';
      } finally {
        loginBtn.disabled = false;
      }
    });

    logoutBtn.addEventListener('click', async () => {
      const body = new FormData();
      body.append('action', 'logout');
      await fetch('api/login.php', { method: 'POST', body });
      chapterJsonName = null;
      downloadUrls = {};
      sessionStorage.removeItem('chapterJsonName');
      sessionStorage.removeItem('downloadUrls');
      showLogin();
    });

    document.getElementById('standard').addEventListener('change', async (e) => {
      try {
        await loadSubjectsForStandard(e.target.value);
      } catch (err) {
        status.textContent = err.message || 'Could not load subjects';
      }
    });

    function clearChapterEntryFields() {
      setFieldValue('chapter_no', '');
      setFieldValue('chapter_name', '');
      const pdf = document.getElementById('chapter_pdf');
      if (pdf) pdf.value = '';
    }

    async function clearForm() {
      if (processingQueue) return;
      form.reset();
      autoAll.checked = true;
      subjectsCache = [];
      const subjectList = document.getElementById('subjectList');
      if (subjectList) subjectList.innerHTML = '';
      setFieldValue('medium', '');
      setFieldValue('subject', '');
      clearChapterEntryFields();
      chapterQueue = [];
      renderQueueList();
      status.className = '';
      status.textContent = '';
      topicPanel.style.display = 'none';
      topicPanel.innerHTML = '';
      chapterJsonName = null;
      downloadUrls = {};
      failedTopics = {};
      latestRow = null;
      activeMaterialId = null;
      generatingAll = false;
      processingQueue = false;
      sessionStorage.removeItem('chapterJsonName');
      sessionStorage.removeItem('downloadUrls');
      sessionStorage.removeItem('failedTopics');
      btn.disabled = false;
      updateQueueControls();
      try {
        await loadStandards(currentUser?.standard || '');
      } catch (_) {
        // ignore reload errors on clear
      }
    }

    clearBtn.addEventListener('click', () => {
      clearForm();
    });

    function updateQueueControls() {
      const busy = processingQueue || generatingAll;
      if (addMoreBtn) {
        addMoreBtn.classList.remove('hidden');
        addMoreBtn.disabled = busy;
        addMoreBtn.title = busy
          ? 'Wait until generation finishes'
          : 'Add this chapter to the queue (does not generate yet)';
      }
      if (btn) {
        btn.disabled = busy;
        const pending = chapterQueue.filter((c) => c.status === 'queued' || c.status === 'error').length;
        btn.textContent = pending > 0
          ? ('Generate all chapters (' + pending + ')')
          : 'Generate all chapters';
      }
      if (clearBtn) clearBtn.disabled = busy;
    }

    function sharedMetaOrError() {
      const medium = (document.getElementById('medium')?.value || '').trim();
      const standard = (document.getElementById('standard')?.value || '').trim();
      const subject = (document.getElementById('subject')?.value || '').trim();
      if (!medium || !standard || !subject) {
        throw new Error('Fill Medium, Standard, and Subject first.');
      }
      return { medium, standard, subject };
    }

    function metaForQueueItem(item) {
      const medium = (item?.medium || document.getElementById('medium')?.value || '').trim();
      const standard = (item?.standard || document.getElementById('standard')?.value || '').trim();
      const subject = (item?.subject || document.getElementById('subject')?.value || '').trim();
      if (!medium || !standard || !subject) {
        throw new Error('Fill Medium, Standard, and Subject first.');
      }
      // Keep form fields in sync so UI stays correct during long runs
      setFieldValue('medium', medium);
      setFieldValue('standard', standard);
      setFieldValue('subject', subject);
      item.medium = medium;
      item.standard = standard;
      item.subject = subject;
      return { medium, standard, subject };
    }

    function readChapterEntryOrError() {
      const chapter_no = (document.getElementById('chapter_no')?.value || '').trim();
      const chapter_name = (document.getElementById('chapter_name')?.value || '').trim();
      const pdfInput = document.getElementById('chapter_pdf');
      const pdfFile = pdfInput?.files?.[0] || null;
      if (!chapter_no) throw new Error('Enter Chapter No.');
      if (!chapter_name) throw new Error('Enter Chapter Name.');
      if (!pdfFile) throw new Error('Select Chapter PDF.');
      return { chapter_no, chapter_name, pdfFile, pdfName: pdfFile.name };
    }

    function renderQueueList() {
      if (!queuePanel || !queueList) return;
      if (!chapterQueue.length) {
        queuePanel.style.display = 'none';
        queueList.innerHTML = '';
        if (queueTitle) queueTitle.textContent = 'Queued chapters (0)';
        updateQueueControls();
        return;
      }
      queuePanel.style.display = 'block';
      if (queueTitle) {
        const done = chapterQueue.filter((c) => c.status === 'done').length;
        const errCount = chapterQueue.filter((c) => c.status === 'error').length;
        queueTitle.textContent = 'Queued chapters (' + chapterQueue.length + ') · ' + done + ' done'
          + (errCount ? (' · ' + errCount + ' failed') : '');
      }
      const labels = { queued: 'Queued', running: 'Running', done: 'Done', error: 'Error' };
      queueList.innerHTML = chapterQueue.map((item) => {
        const canRemove = (item.status === 'queued' || item.status === 'error') && !processingQueue;
        const canRegen = (item.status === 'error' || item.status === 'done') && !processingQueue && item.pdfFile;
        return '<li class="queue-item ' + item.status + '">'
          + '<div class="queue-meta">'
          + '<strong>Ch ' + escapeHtml(item.chapter_no) + ': ' + escapeHtml(item.chapter_name) + '</strong>'
          + '<small>' + escapeHtml(item.pdfName)
          + (item.medium ? (' · ' + escapeHtml(item.medium) + ' · Std ' + escapeHtml(String(item.standard || '')) + ' · ' + escapeHtml(item.subject || '')) : '')
          + (item.error ? ' · ' + escapeHtml(item.error) : '')
          + '</small>'
          + '</div>'
          + '<div class="queue-actions">'
          + '<span class="queue-badge">' + (labels[item.status] || item.status) + '</span>'
          + (canRegen
            ? '<button type="button" class="queue-regen" data-regen-queue="' + item.id + '">Regenerate</button>'
            : '')
          + (canRemove
            ? '<button type="button" class="queue-remove" data-remove-queue="' + item.id + '">Remove</button>'
            : '')
          + '</div>'
          + '</li>';
      }).join('');

      const failedCount = chapterQueue.filter((c) => c.status === 'error' && c.pdfFile).length;
      if (failedCount && !processingQueue) {
        queueList.insertAdjacentHTML(
          'beforeend',
          '<li style="list-style:none;margin-top:0.35rem;">'
          + '<button type="button" class="queue-regen" id="regenFailedBtn" style="width:100%;">'
          + 'Regenerate failed (' + failedCount + ')'
          + '</button></li>'
        );
        document.getElementById('regenFailedBtn')?.addEventListener('click', () => {
          regenerateFailedChapters();
        });
      }

      queueList.querySelectorAll('[data-remove-queue]').forEach((el) => {
        el.addEventListener('click', () => {
          const id = Number(el.dataset.removeQueue);
          chapterQueue = chapterQueue.filter((c) => c.id !== id);
          renderQueueList();
        });
      });
      queueList.querySelectorAll('[data-regen-queue]').forEach((el) => {
        el.addEventListener('click', () => {
          const id = Number(el.dataset.regenQueue);
          regenerateQueueItem(id);
        });
      });
      updateQueueControls();
    }

    function addCurrentChapterToQueue() {
      try {
        const meta = sharedMetaOrError();
        const entry = readChapterEntryOrError();
        const dup = chapterQueue.find(
          (c) => String(c.chapter_no) === String(entry.chapter_no) && c.status !== 'error'
        );
        if (dup) throw new Error('Chapter ' + entry.chapter_no + ' is already in the queue.');

        chapterQueue.push({
          id: queueSeq++,
          chapter_no: entry.chapter_no,
          chapter_name: entry.chapter_name,
          pdfFile: entry.pdfFile,
          pdfName: entry.pdfName,
          medium: meta.medium,
          standard: meta.standard,
          subject: meta.subject,
          status: 'queued',
          error: null,
        });
        clearChapterEntryFields();
        renderQueueList();
        status.className = 'show ok';
        status.innerHTML = '<strong>Chapter ' + escapeHtml(entry.chapter_no) + ' added to queue.</strong><br>'
          + '<span style="color:var(--muted)">Add more chapters, then click Generate all chapters.</span>';
        document.getElementById('chapter_no')?.focus();
      } catch (err) {
        status.className = 'show err';
        status.textContent = err.message || 'Could not add chapter';
      }
    }

    addMoreBtn.addEventListener('click', () => {
      addCurrentChapterToQueue();
    });

    function persistState() {
      if (chapterJsonName) sessionStorage.setItem('chapterJsonName', chapterJsonName);
      sessionStorage.setItem('downloadUrls', JSON.stringify(downloadUrls || {}));
      sessionStorage.setItem('failedTopics', JSON.stringify(failedTopics || {}));
    }

    function groupChaptersBySubject(items) {
      const groups = new Map();
      for (const item of items) {
        const subject = (item.subject || 'Other').trim() || 'Other';
        if (!groups.has(subject)) groups.set(subject, []);
        groups.get(subject).push(item);
      }
      return groups;
    }

    function renderChaptersList() {
      if (!chaptersPanel) return;
      const items = chaptersCache || [];
      if (!items.length) {
        chaptersPanel.innerHTML = '<p class="empty-chapters">No chapters yet. Upload your first chapter above.</p>';
        updateQueueControls();
        return;
      }

      const groups = groupChaptersBySubject(items);
      let html = '<div class="chapters-list">';
      for (const [subject, chapters] of groups) {
        html += `<div class="chapter-group">
          <div class="chapter-group-title"><span>${escapeHtml(subject)}</span><span>${chapters.length} chapter${chapters.length === 1 ? '' : 's'}</span></div>`;
        for (const ch of chapters) {
          const id = Number(ch.id);
          const done = Number(ch.topics_done || 0);
          const total = Number(ch.topics_total || 0);
          const complete = total > 0 && done >= total;
          const isActive = activeMaterialId != null && Number(activeMaterialId) === id;
          const isOpen = openChapterIds.has(id) || isActive;
          const title = ch.chapter_name || ch.title || `Chapter ${ch.chapter_no || id}`;
          const metaBits = [
            ch.medium || '',
            ch.standard ? `Std ${ch.standard}` : '',
            ch.chapter_no ? `Ch ${ch.chapter_no}` : '',
          ].filter(Boolean).join(' · ');
          html += `<div class="chapter-card${isOpen ? ' open' : ''}${isActive ? ' active' : ''}" data-chapter-id="${id}">
            <button type="button" class="chapter-card-head" data-open-chapter="${id}">
              <div class="chapter-card-meta">
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(metaBits)}${complete ? ' · Complete' : done || total ? ` · ${done}/${total} topics` : ''}</small>
              </div>
              <span class="chapter-progress${complete ? ' complete' : ''}">${done}/${total || '?'}</span>
            </button>
            <ul class="chapter-topics">`;
          const topics = ch.topics || [];
          if (!topics.length) {
            html += `<li><span style="color:var(--muted)">No topics saved yet</span></li>`;
          } else {
            for (const t of topics) {
              const generated = Number(t.generated) === 1 || t.generated === true;
              const tTitle = t.title_gu || t.title || `Topic ${t.topic_order}`;
              html += `<li>
                <span style="display:flex;align-items:center;gap:0.45rem;min-width:0;">
                  <span class="dot${generated ? ' done' : ''}"></span>
                  <span>Topic ${escapeHtml(String(t.topic_order))}: ${escapeHtml(tTitle)}</span>
                </span>
                <small style="color:var(--muted);flex-shrink:0;">${generated ? 'Done' : 'Pending'}</small>
              </li>`;
            }
          }
          html += `</ul></div>`;
        }
        html += '</div>';
      }
      html += '</div>';
      chaptersPanel.innerHTML = html;

      chaptersPanel.querySelectorAll('[data-open-chapter]').forEach((el) => {
        el.addEventListener('click', () => {
          const id = Number(el.dataset.openChapter);
          if (openChapterIds.has(id)) openChapterIds.delete(id);
          else openChapterIds.add(id);
          openMaterialById(id);
        });
      });
      updateQueueControls();
    }

    async function loadChaptersList() {
      if (!chaptersPanel) return;
      try {
        const res = await fetch('api/materials.php?limit=100&with_topics=1');
        const data = await res.json();
        if (handleAuthError(data)) return;
        if (!data.success) throw new Error(data.error || 'Failed to load chapters');
        chaptersCache = data.items || [];
        renderChaptersList();
      } catch (err) {
        chaptersPanel.innerHTML = `<p class="empty-chapters">${escapeHtml(err.message || 'Could not load chapters')}</p>`;
      }
    }

    function materialRowFromDb(matRow, chapterJsonHint = null) {
      const mat = matRow?.material || {};
      const generatedOrders = mat.meta?.generated_topic_orders || [];
      const topicFilesMeta = mat.meta?.topic_files || {};
      const topics = (mat.topic_plans || matRow.topics || []).map((t) => {
        const order = Number(t.order || t.topic_order);
        const files = topicFilesMeta[String(order)] || {};
        const generated = generatedOrders.includes(order) || !!t.generated || Number(t.generated) === 1;
        return {
          order,
          id: t.id || t.topic_key,
          title: t.title,
          title_gu: t.title_gu,
          generated,
          json_name: t.json_name || files.json_name || null,
          html_name: t.html_name || files.html_name || null,
        };
      });
      return {
        id: matRow.id,
        slug: mat.meta?.id || matRow.slug,
        title: mat.meta?.title || matRow.title,
        medium: matRow.medium || mat.meta?.medium || '',
        standard: matRow.standard || mat.meta?.standard || '',
        subject: matRow.subject || mat.meta?.subject || '',
        chapter_no: matRow.chapter_no || mat.meta?.chapter_no || '',
        chapter_name: matRow.chapter_name || mat.meta?.chapter_name || mat.meta?.title || '',
        output_name: matRow.material_json_name,
        html_name: matRow.html_name,
        total_sections: mat.meta?.total_sections || topics.filter((t) => t.generated).length,
        planned_sections: mat.meta?.planned_sections || topics.length || Number(matRow.topics_total || 0),
        topics,
        chapter_json_name: chapterJsonHint,
      };
    }

    async function openMaterialById(materialId) {
      if (!materialId || generatingAll || processingQueue) return;
      try {
        status.className = 'show loading';
        status.textContent = 'Opening chapter…';
        const full = await fetch('api/materials.php?id=' + encodeURIComponent(materialId));
        const fullData = await full.json();
        if (handleAuthError(fullData)) return;
        const matRow = fullData.material;
        if (!matRow) throw new Error('Chapter not found');

        let nextChapterJson = null;
        if (matRow.chapter_id) {
          const chRes = await fetch('api/materials.php?chapter=' + encodeURIComponent(matRow.chapter_id));
          const chData = await chRes.json();
          if (chData.chapter?.chapter_json_name) {
            nextChapterJson = chData.chapter.chapter_json_name;
          }
        }
        const mat = matRow.material || {};
        if (!nextChapterJson && mat.meta?.id) {
          nextChapterJson = mat.meta.id + '-chapter.json';
        }

        chapterJsonName = nextChapterJson;
        failedTopics = {};
        activeMaterialId = Number(matRow.id);
        openChapterIds.add(activeMaterialId);

        const userStd = userStandardValue();
        const row = materialRowFromDb(matRow, chapterJsonName);
        downloadUrls = {};
        if (row.output_name) {
          downloadUrls.material_ai = 'output/' + encodeURIComponent(row.output_name);
          downloadUrls.material_ai_html = row.html_name ? 'output/' + encodeURIComponent(row.html_name) : null;
          downloadUrls.material_ai_view = 'view.php?file=' + encodeURIComponent(row.output_name);
        }
        if (matRow.material_attachment) {
          downloadUrls.material_attachment = matRow.material_attachment;
        }
        persistState();
        await applyFormMeta({
          ...row,
          standard: userStd || row.standard,
        });
        const pdf = document.getElementById('chapter_pdf');
        if (pdf) pdf.value = '';

        status.className = 'show ok';
        status.innerHTML = `<strong>Opened:</strong> ${escapeHtml(row.chapter_name || row.title || row.slug)} — ${row.total_sections}/${row.planned_sections}<br>`
          + renderDownloads(row)
          + (pendingTopics(row).length
            ? `<br><span style="color:var(--muted)">Continue generating remaining topics, or use + Add another chapter when done.</span>`
            : `<br><span style="color:var(--muted)">Chapter complete. Use + Add another chapter for the next one (same subject).</span>`);
        renderTopicPanel(row);
        renderChaptersList();
        updateQueueControls();
      } catch (err) {
        status.className = 'show err';
        status.textContent = err.message || 'Could not open chapter';
      }
    }

    function renderDownloads(row) {
      let html = '';
      if (downloadUrls.material_ai) {
        html += `<a class="dl" href="${downloadUrls.material_ai}?t=${Date.now()}" download>${row.output_name || 'full.json'}</a>`;
      }
      if (downloadUrls.material_ai_view) {
        html += ` · <a class="dl" href="${downloadUrls.material_ai_view}&t=${Date.now()}" target="_blank">View full HTML</a>`;
      }
      if (downloadUrls.material_ai_html) {
        html += ` · <a class="dl" href="${downloadUrls.material_ai_html}?t=${Date.now()}" download>${row.html_name || 'material.html'}</a>`;
      }
      if (downloadUrls.material_attachment) {
        html += `${html ? ' · ' : ''}<a class="dl" href="${downloadUrls.material_attachment}?t=${Date.now()}" target="_blank">PDF</a>`;
      }
      return html;
    }

    function topicFileLinks(topic) {
      const order = Number(topic.order);
      const fromUrls = downloadUrls.topics && downloadUrls.topics[order];
      const jsonName = topic.json_name || fromUrls?.json_name;
      const htmlName = topic.html_name || fromUrls?.html_name;
      if (!jsonName && !htmlName && !fromUrls) return '';

      const jsonHref = fromUrls?.json || (jsonName ? 'output/' + encodeURIComponent(jsonName) : null);
      const htmlHref = fromUrls?.html || (htmlName ? 'output/' + encodeURIComponent(htmlName) : null);
      const viewHref = fromUrls?.view || (jsonName ? 'view.php?file=' + encodeURIComponent(jsonName) : null);

      let links = '';
      if (viewHref) links += `<a class="dl" href="${viewHref}&t=${Date.now()}" target="_blank">View</a>`;
      if (jsonHref) links += `${links ? ' · ' : ''}<a class="dl" href="${jsonHref}?t=${Date.now()}" download>JSON</a>`;
      if (htmlHref) links += `${links ? ' · ' : ''}<a class="dl" href="${htmlHref}?t=${Date.now()}" download>HTML</a>`;
      return links;
    }

    function pendingTopics(row) {
      return (row?.topics || [])
        .filter((t) => !t.generated && !failedTopics[t.order])
        .map((t) => t.order);
    }

    function skipTopic(topicOrder) {
      if (!latestRow || generatingAll) return;
      failedTopics[topicOrder] = 'Skipped by user';
      persistState();
      status.className = 'show ok';
      status.textContent = `Topic ${topicOrder} skipped. You can Regenerate it later.`;
      renderTopicPanel(latestRow);
    }

    function renderTopicPanel(row) {
      latestRow = row;
      const topics = row?.topics || [];
      if (!topics.length) {
        topicPanel.style.display = 'none';
        return;
      }

      downloadUrls.topics = downloadUrls.topics || {};
      for (const topic of topics) {
        if (!topic.generated) continue;
        const order = Number(topic.order);
        if (topic.json_name || topic.html_name) {
          downloadUrls.topics[order] = {
            order,
            json_name: topic.json_name,
            html_name: topic.html_name,
            json: topic.json_name ? 'output/' + encodeURIComponent(topic.json_name) : null,
            html: topic.html_name ? 'output/' + encodeURIComponent(topic.html_name) : null,
            view: topic.json_name ? 'view.php?file=' + encodeURIComponent(topic.json_name) : null,
          };
        }
      }
      persistState();

      const planned = row.planned_sections || topics.length;
      const generated = row.total_sections || topics.filter((t) => t.generated).length || 0;
      const pending = pendingTopics(row);
      const skippedOrders = Object.keys(failedTopics);
      const failedCount = skippedOrders.length;

      let html = `<strong>Topics (${generated}/${planned} generated)</strong>`;
      if (failedCount) {
        html += `<p class="hint" style="margin:0.5rem 0 0;color:#fca5a5;">Skipped topics: ${skippedOrders.join(', ')} — use Regenerate to retry</p>`;
      }
      if (pending.length && !generatingAll) {
        html += `<button type="button" class="secondary" id="genAllBtn">Generate all remaining (${pending.length})</button>`;
      } else if (generatingAll) {
        html += `<p class="hint" style="margin:0.5rem 0 0;">Auto-generating remaining topics… keep this tab open.</p>`;
      }
      html += `<ul class="topic-list">`;

      for (const topic of topics) {
        const title = topic.title_gu || topic.title || `Topic ${topic.order}`;
        const done = topic.generated;
        const failed = !!failedTopics[topic.order];
        const stateClass = done ? 'done' : failed ? 'skipped' : 'pending';
        const stateLabel = done
          ? 'Generated'
          : failed
            ? (String(failedTopics[topic.order]).startsWith('Skipped by user') ? 'Skipped' : 'Skipped after error')
            : 'Pending';
        html += `<li class="topic-item ${stateClass}">
          <div class="topic-meta">
            <strong>Topic ${topic.order}: ${escapeHtml(title)}</strong>
            <small>${stateLabel}${done && (topic.json_name || topic.html_name) ? ' · separate JSON + HTML' : ''}${failed ? ` · ${escapeHtml(failedTopics[topic.order])}` : ''}</small>
            ${done ? `<div style="margin-top:0.35rem;">${topicFileLinks(topic)}</div>` : ''}
          </div>
          <div class="topic-actions">`;
        if (!generatingAll) {
          if (done) {
            html += `<button type="button" class="topic-btn regen-btn" data-regen="${topic.order}">Regenerate</button>`;
            html += `<span style="color:var(--success);font-size:0.85rem;">✓ Done</span>`;
          } else if (failed) {
            html += `<button type="button" class="topic-btn regen-btn" data-regen="${topic.order}">Regenerate</button>`;
            html += `<span style="color:var(--error);font-size:0.85rem;">Skipped</span>`;
          } else {
            html += `<button type="button" class="topic-btn" data-topic="${topic.order}">Generate</button>`;
            html += `<button type="button" class="topic-btn skip-btn" data-skip="${topic.order}">Skip</button>`;
          }
        } else if (done) {
          html += `<span style="color:var(--success);font-size:0.85rem;">✓ Done</span>`;
        } else if (failed) {
          html += `<span style="color:var(--error);font-size:0.85rem;">Skipped</span>`;
        } else {
          html += `<span style="color:var(--muted);font-size:0.85rem;">Waiting…</span>`;
        }
        html += '</div></li>';
      }

      html += '</ul>';
      topicPanel.innerHTML = html;
      topicPanel.style.display = 'block';

      topicPanel.querySelectorAll('[data-topic]').forEach((el) => {
        el.addEventListener('click', () => generateTopic(Number(el.dataset.topic), el));
      });
      topicPanel.querySelectorAll('[data-skip]').forEach((el) => {
        el.addEventListener('click', () => skipTopic(Number(el.dataset.skip)));
      });
      topicPanel.querySelectorAll('[data-regen]').forEach((el) => {
        el.addEventListener('click', () => generateTopic(Number(el.dataset.regen), el));
      });
      const genAllBtn = document.getElementById('genAllBtn');
      if (genAllBtn) {
        genAllBtn.addEventListener('click', () => generateAllRemaining());
      }
      updateQueueControls();
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function formatDbLine(data) {
      if (data.db_saved) {
        const db = data.results?.database;
        let html = `<br><span style="color:var(--success)">MySQL saved</span>`;
        if (db?.id) html += ` · id=${db.id} · ${db.topics_done}/${db.topics_total}`;
        if (db?.medium) {
          html += `<br><span style="color:var(--muted)">${escapeHtml(db.medium)} · Std ${escapeHtml(String(db.standard || ''))} · ${escapeHtml(db.subject || '')} · Ch ${escapeHtml(String(db.chapter_no || ''))} · ${escapeHtml(db.chapter_name || '')}</span>`;
        }
        return html;
      }
      if (data.db_error) {
        return `<br><span style="color:var(--error)">MySQL: ${escapeHtml(data.db_error)}</span>`;
      }
      return '';
    }

    function handleAuthError(data) {
      if (data?.login_required) {
        showLogin();
        loginStatus.textContent = 'Please login again.';
        return true;
      }
      return false;
    }

    async function generateTopic(topicIndex, buttonEl) {
      if (!chapterJsonName) return null;
      if (buttonEl) buttonEl.disabled = true;
      status.className = 'show loading';
      status.textContent = `Generating Topic ${topicIndex}…`;

      try {
        const body = new FormData();
        body.append('chapter_json', chapterJsonName);
        body.append('topic_index', String(topicIndex));

        const res = await fetch('api/generate-topic.php', { method: 'POST', body });
        const data = await res.json();
        if (handleAuthError(data)) return null;
        if (!data.success) throw new Error(data.error || 'Topic generation failed');

        const row = data.results?.material_ai;
        delete failedTopics[topicIndex];
        downloadUrls = data.download_urls || downloadUrls;
        if (row?.chapter_json_name) chapterJsonName = row.chapter_json_name;
        if (data.results?.database) {
          applyFormMeta(data.results.database);
        }
        persistState();

        let html = `<strong>Topic ${topicIndex} ready!</strong><br>`;
        if (row) {
          html += `<strong>${row.title || row.slug}</strong> — ${row.total_sections}/${row.planned_sections} topics<br>`;
          html += renderDownloads(row);
        }
        html += formatDbLine(data);
        status.className = 'show ok';
        status.innerHTML = html;
        renderTopicPanel(row);
        if (!generatingAll) loadChaptersList();
        return row;
      } catch (err) {
        status.className = 'show err';
        status.textContent = err.message || 'Error';
        if (buttonEl) buttonEl.disabled = false;
        throw err;
      }
    }

    async function generateAllRemaining(startRow = null) {
      if (!chapterJsonName || generatingAll) return;
      generatingAll = true;
      btn.disabled = true;

      let row = startRow || latestRow;
      const skipped = [];

      try {
        renderTopicPanel(row);

        while (true) {
          const pending = pendingTopics(row);
          if (!pending.length) {
            status.className = 'show ok';
            status.innerHTML = `<strong>Auto generation finished!</strong><br>`
              + (row ? `<strong>${row.title || row.slug}</strong> — ${row.total_sections}/${row.planned_sections}<br>${renderDownloads(row)}` : '')
              + (skipped.length ? `<br><span style="color:#fca5a5">Skipped topics: ${escapeHtml(skipped.join(', '))}</span>` : '')
              + `<br><span style="color:var(--muted)">Use <strong>+ Add another chapter</strong> to upload the next chapter for this subject.</span>`;
            break;
          }

          const next = pending[0];
          status.className = 'show loading';
          status.textContent = `Auto-generating Topic ${next} of ${row.planned_sections || '?'}… keep tab open`;
          try {
            const nextRow = await generateTopic(next, null);
            if (!nextRow) break;
            row = nextRow;
          } catch (err) {
            const msg = (err && err.message) || 'Generation failed';
            failedTopics[next] = msg;
            skipped.push(next);
            persistState();
            status.className = 'show err';
            status.innerHTML = `<strong>Topic ${next} failed.</strong> Skipping and continuing...<br><span style="color:#fecaca">${escapeHtml(msg)}</span>`;
            if (row) {
              row = {
                ...row,
                topics: (row.topics || []).map((t) =>
                  Number(t.order) === Number(next) ? { ...t, generated: false } : t
                ),
              };
              latestRow = row;
              renderTopicPanel(row);
            }
          }
        }
      } finally {
        generatingAll = false;
        if (!processingQueue) btn.disabled = false;
        if (latestRow) renderTopicPanel(latestRow);
        updateQueueControls();
        loadChaptersList();
      }
    }

    async function uploadAndGenerateChapter(item) {
      const meta = metaForQueueItem(item);
      const body = new FormData();
      body.append('medium', meta.medium);
      body.append('standard', meta.standard);
      body.append('subject', meta.subject);
      body.append('chapter_no', item.chapter_no);
      body.append('chapter_name', item.chapter_name);
      body.append('chapter_pdf', item.pdfFile, item.pdfName);

      status.className = 'show loading';
      status.textContent = 'Chapter ' + item.chapter_no + ': uploading PDF, planning topics, generating Topic 1…';
      topicPanel.style.display = 'none';

      const res = await fetch('api/generate.php', { method: 'POST', body });
      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (_) {
        const snippet = (raw || '').replace(/\s+/g, ' ').trim().slice(0, 200);
        throw new Error(
          snippet
            ? ('Server error (HTTP ' + res.status + '): ' + snippet)
            : ('Server returned empty response (HTTP ' + res.status + '). Check PHP upload limits.')
        );
      }
      if (handleAuthError(data)) throw new Error('Login required');
      if (!data.success) throw new Error(data.error || 'Generation failed');

      failedTopics = {};
      const row = data.results?.material_ai;
      chapterJsonName = data.results?.chapter_json?.name || row?.chapter_json_name || null;
      downloadUrls = data.download_urls || {};
      if (data.results?.material_attachment_url || data.results?.material_attachment) {
        downloadUrls.material_attachment = data.results.material_attachment_url || data.results.material_attachment;
      }
      if (data.results?.database?.id) {
        activeMaterialId = Number(data.results.database.id);
        openChapterIds.add(activeMaterialId);
      }
      // Keep shared form fields from queue item (do not let empty DB meta wipe them)
      setFieldValue('medium', meta.medium);
      setFieldValue('standard', meta.standard);
      setFieldValue('subject', meta.subject);
      persistState();

      let html = '<strong>Chapter ' + escapeHtml(item.chapter_no) + ' — Topic 1 generated</strong><br>';
      if (row) {
        html += '<strong>' + escapeHtml(row.title || row.slug || '') + '</strong>';
        if (row.planned_sections) html += ' — Topic 1 of ' + row.planned_sections;
        html += '<br>' + renderDownloads(row);
      }
      html += formatDbLine(data);
      status.className = 'show ok';
      status.innerHTML = html;
      renderTopicPanel(row);
      await loadChaptersList();

      if (autoAll.checked && pendingTopics(row).length) {
        await generateAllRemaining(row);
      }
      // Restore shared meta again after topic loop (applyFormMeta may have run)
      setFieldValue('medium', meta.medium);
      setFieldValue('standard', meta.standard);
      setFieldValue('subject', meta.subject);
      return row;
    }

    async function runQueueItems(items, { skipDone = true } = {}) {
      if (processingQueue) return;
      if (!items.length) {
        status.className = 'show err';
        status.textContent = 'No chapters to generate.';
        return;
      }

      processingQueue = true;
      updateQueueControls();
      let completed = 0;
      let failed = 0;

      try {
        for (const item of items) {
          if (skipDone && item.status === 'done') continue;
          if (!item.pdfFile) {
            item.status = 'error';
            item.error = 'PDF missing — remove and add chapter again';
            failed += 1;
            renderQueueList();
            continue;
          }
          item.status = 'running';
          item.error = null;
          renderQueueList();
          try {
            await uploadAndGenerateChapter(item);
            item.status = 'done';
            completed += 1;
            // Backfill Medium/Standard/Subject onto other queued items
            for (const sibling of chapterQueue) {
              sibling.medium = sibling.medium || item.medium;
              sibling.standard = sibling.standard || item.standard;
              sibling.subject = sibling.subject || item.subject;
            }
          } catch (err) {
            item.status = 'error';
            item.error = err.message || 'Failed';
            failed += 1;
            status.className = 'show err';
            status.innerHTML = '<strong>Chapter ' + escapeHtml(item.chapter_no) + ' failed.</strong> Continuing next…<br>'
              + '<span style="color:#fecaca">' + escapeHtml(item.error) + '</span>';
          }
          renderQueueList();
          await loadChaptersList();
        }

        status.className = failed ? 'show err' : 'show ok';
        status.innerHTML = '<strong>Queue finished.</strong> '
          + completed + ' chapter(s) done'
          + (failed ? (', ' + failed + ' failed') : '')
          + '.<br><span style="color:var(--muted)">Use Regenerate on failed chapters, or see All chapters list below.</span>';
      } finally {
        processingQueue = false;
        generatingAll = false;
        updateQueueControls();
        renderQueueList();
        await loadChaptersList();
      }
    }

    async function regenerateQueueItem(id) {
      const item = chapterQueue.find((c) => Number(c.id) === Number(id));
      if (!item || processingQueue) return;
      if (!item.pdfFile) {
        status.className = 'show err';
        status.textContent = 'PDF missing for this chapter — remove and add it again with + Add more.';
        return;
      }
      // Ensure meta exists (from item or form / first successful sibling)
      if (!item.medium || !item.standard || !item.subject) {
        const donor = chapterQueue.find((c) => c.medium && c.standard && c.subject);
        if (donor) {
          item.medium = item.medium || donor.medium;
          item.standard = item.standard || donor.standard;
          item.subject = item.subject || donor.subject;
        }
      }
      item.status = 'queued';
      item.error = null;
      renderQueueList();
      await runQueueItems([item], { skipDone: false });
    }

    async function regenerateFailedChapters() {
      if (processingQueue) return;
      const failed = chapterQueue.filter((c) => c.status === 'error');
      if (!failed.length) {
        status.className = 'show err';
        status.textContent = 'No failed chapters to regenerate.';
        return;
      }
      let donor = chapterQueue.find((c) => c.medium && c.standard && c.subject) || null;
      if (!donor) {
        try {
          donor = sharedMetaOrError();
        } catch (_) {
          donor = null;
        }
      }
      if (!donor) {
        status.className = 'show err';
        status.textContent = 'Fill Medium, Standard, and Subject again, then click Regenerate failed.';
        return;
      }
      for (const item of failed) {
        item.medium = item.medium || donor.medium;
        item.standard = item.standard || donor.standard;
        item.subject = item.subject || donor.subject;
        item.status = 'queued';
        item.error = null;
      }
      setFieldValue('medium', donor.medium);
      setFieldValue('standard', donor.standard);
      setFieldValue('subject', donor.subject);
      renderQueueList();
      await runQueueItems(failed, { skipDone: false });
    }

    async function processChapterQueue() {
      if (processingQueue) return;
      let meta;
      try {
        meta = sharedMetaOrError();
      } catch (err) {
        // Fall back to meta already stored on queued items
        const donor = chapterQueue.find((c) => c.medium && c.standard && c.subject);
        if (!donor) {
          status.className = 'show err';
          status.textContent = err.message;
          return;
        }
        meta = { medium: donor.medium, standard: donor.standard, subject: donor.subject };
        setFieldValue('medium', meta.medium);
        setFieldValue('standard', meta.standard);
        setFieldValue('subject', meta.subject);
      }

      // Stamp shared meta onto every queued item
      for (const item of chapterQueue) {
        item.medium = item.medium || meta.medium;
        item.standard = item.standard || meta.standard;
        item.subject = item.subject || meta.subject;
      }

      // If entry fields are filled, auto-add before generate
      const no = (document.getElementById('chapter_no')?.value || '').trim();
      const name = (document.getElementById('chapter_name')?.value || '').trim();
      const pdf = document.getElementById('chapter_pdf')?.files?.[0];
      if (no && name && pdf) {
        addCurrentChapterToQueue();
      }

      const pending = chapterQueue.filter((c) => c.status === 'queued' || c.status === 'error');
      if (!pending.length) {
        status.className = 'show err';
        status.textContent = 'Add at least one chapter with + Add more, then Generate all chapters.';
        return;
      }

      for (const item of pending) {
        item.status = 'queued';
        item.error = null;
        item.medium = item.medium || meta.medium;
        item.standard = item.standard || meta.standard;
        item.subject = item.subject || meta.subject;
      }
      renderQueueList();
      await runQueueItems(pending, { skipDone: false });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await processChapterQueue();
    });

    async function resumeFromDb() {
      try {
        const res = await fetch('api/materials.php?limit=20');
        const data = await res.json();
        if (handleAuthError(data)) return;
        const userStd = userStandardValue();
        const userId = currentUser?.id != null ? Number(currentUser.id) : null;
        const items = data.items || [];
        // Prefer this teacher's own / matching-standard material for chapter fields only
        const matchesStd = (it) => {
          if (!userStd) return true;
          const m = String(it.standard ?? '').match(/(\d{1,2})/);
          return !!(m && String(parseInt(m[1], 10)) === userStd);
        };
        const own = items.filter((it) => userId && it.user_id != null && Number(it.user_id) === userId && matchesStd(it));
        const byStd = items.filter(matchesStd);
        // Prefer incomplete chapter so user can continue; else latest matching
        const incomplete = (own.length ? own : byStd).find(
          (it) => Number(it.topics_total || 0) > 0 && Number(it.topics_done || 0) < Number(it.topics_total || 0)
        );
        const item = incomplete || own[0] || byStd[0] || null;
        if (!item) {
          if (userStd) await applyFormMeta({ standard: userStd });
          updateQueueControls();
          return;
        }
        if (item.topics_done >= item.topics_total && item.topics_total > 0 && !chapterJsonName) {
          if (userStd) await applyFormMeta({ standard: userStd, ...item });
          updateQueueControls();
          return;
        }
        await applyFormMeta({
          ...item,
          standard: userStd || item.standard,
        });

        const full = await fetch('api/materials.php?id=' + encodeURIComponent(item.id));
        const fullData = await full.json();
        const matRow = fullData.material;
        const mat = matRow?.material;
        if (!mat) return;

        if (matRow.chapter_id) {
          const chRes = await fetch('api/materials.php?chapter=' + encodeURIComponent(matRow.chapter_id));
          const chData = await chRes.json();
          if (chData.chapter?.chapter_json_name) {
            chapterJsonName = chData.chapter.chapter_json_name;
          }
        }
        if (!chapterJsonName && mat.meta?.id) {
          chapterJsonName = mat.meta.id + '-chapter.json';
        }
        activeMaterialId = Number(matRow.id);
        openChapterIds.add(activeMaterialId);
        persistState();

        const row = materialRowFromDb(matRow, chapterJsonName);

        if (row.output_name) {
          downloadUrls.material_ai = 'output/' + encodeURIComponent(row.output_name);
          downloadUrls.material_ai_html = row.html_name ? 'output/' + encodeURIComponent(row.html_name) : null;
          downloadUrls.material_ai_view = 'view.php?file=' + encodeURIComponent(row.output_name);
        }
        if (matRow.material_attachment) {
          downloadUrls.material_attachment = matRow.material_attachment;
        }
        persistState();

        applyFormMeta({
          ...row,
          standard: userStd || row.standard,
        });

        if (pendingTopics(row).length) {
          status.className = 'show ok';
          status.innerHTML = `<strong>Resumed from MySQL:</strong> ${escapeHtml(row.title || row.slug)} — ${row.total_sections}/${row.planned_sections}<br>`
            + renderDownloads(row)
            + `<br><span style="color:var(--muted)">Click “Generate all remaining” to continue.</span>`;
          renderTopicPanel(row);
        } else {
          renderTopicPanel(row);
          updateQueueControls();
        }
        renderChaptersList();
      } catch (_) {
        // ignore resume errors
      }
    }

    try {
      failedTopics = JSON.parse(sessionStorage.getItem('failedTopics') || '{}') || {};
    } catch (_) {
      failedTopics = {};
    }

    checkSession();
  </script>
</body>
</html>
