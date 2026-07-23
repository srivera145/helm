<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Helm — The XAMPP Alternative for Windows | Apache, MySQL, PHP &amp; phpMyAdmin</title>
<meta name="description" content="Helm is a free Windows installer for Apache, PHP, MySQL, and phpMyAdmin that fixes XAMPP's 'MySQL shutdown unexpectedly' corruption bug by running real Windows services instead of killed processes. One installer, no admin account needed to run it, install to C:\Helm.">
<link rel="canonical" href="https://helm.get-keel.dev/">

<!-- Open Graph / social sharing -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://helm.get-keel.dev/">
<meta property="og:title" content="Helm — The XAMPP Alternative for Windows">
<meta property="og:description" content="Apache, MySQL, PHP, and phpMyAdmin in one Windows installer. Real Windows services instead of XAMPP's corruption-prone process management.">
<meta property="og:image" content="https://helm.get-keel.dev/assets/og-image.jpg">
<meta property="og:site_name" content="Helm">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Helm — The XAMPP Alternative for Windows">
<meta name="twitter:description" content="Apache, MySQL, PHP, and phpMyAdmin in one Windows installer. No more 'MySQL shutdown unexpectedly.'">
<meta name="twitter:image" content="https://helm.get-keel.dev/assets/og-image.jpg">

<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          hull: '#0b1215',
          deck: '#12232b',
          deckraised: '#172a33',
          brass: '#c89b4a',
          brassbright: '#e8c171',
          amber: '#d68a3c',
          signal: '#c1443c',
          fog: '#e9ede9',
          steel: '#6b7b80',
          hairline: '#24373f'
        },
        fontFamily: {
          display: ['"Fraunces"', 'serif'],
          body: ['"Inter"', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace']
        }
      }
    }
  }
</script>

<!-- SoftwareApplication structured data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Helm",
  "alternateName": "Helm for Windows",
  "description": "Helm bundles Apache, PHP, MySQL (MariaDB), and phpMyAdmin into a single Windows installer and runs Apache and MySQL as native Windows services, fixing the InnoDB corruption caused by XAMPP's process-killing shutdown.",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Windows 10, Windows 11",
  "softwareVersion": "0.1.0",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "downloadUrl": "https://helm.get-keel.dev/downloads/Helm-Setup-0.1.0.exe",
  "url": "https://helm.get-keel.dev/",
  "author": {
    "@type": "Organization",
    "name": "EchoDial LLC"
  },
  "featureList": [
    "Bundled Apache, PHP, MySQL (MariaDB), and phpMyAdmin",
    "Apache and MySQL run as native Windows services",
    "Clean MySQL shutdown via SERVICE_CONTROL_STOP, preventing InnoDB corruption",
    "Single install folder at C:\\Helm, no Program Files permission issues",
    "phpMyAdmin auto-login, no password prompt",
    "Log-aware InnoDB corruption recovery",
    "Port conflict detection"
  ]
}
</script>

<!-- FAQPage structured data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Helm?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Helm is a free Windows application that installs Apache, PHP, MySQL (MariaDB), and phpMyAdmin from a single installer and runs Apache and MySQL as native Windows services. It is built as a direct replacement for XAMPP on Windows."
      }
    },
    {
      "@type": "Question",
      "name": "Does Helm fix the XAMPP 'MySQL shutdown unexpectedly' error?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. That error is usually caused by XAMPP's control panel hard-killing the mysqld.exe process instead of shutting it down cleanly, which corrupts InnoDB's data files. Helm registers MySQL as a real Windows service, so Windows sends it a proper SERVICE_CONTROL_STOP signal on shutdown, which MySQL handles as a graceful stop instead of a crash."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to install XAMPP before using Helm?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Helm does not require XAMPP or any other software to be installed first. Apache, PHP, MySQL, phpMyAdmin, and the Visual C++ Redistributable that MySQL needs are all bundled inside the Helm installer."
      }
    },
    {
      "@type": "Question",
      "name": "Does Helm need administrator rights to run?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Helm installs to C:\\Helm by default, a location with normal Windows file permissions, so opening the app and editing your project files never requires administrator rights. The only action that asks for administrator approval is registering Apache and MySQL as Windows services, which is a one-time step, and after that, starting and stopping them does not require it either."
      }
    },
    {
      "@type": "Question",
      "name": "Is Helm free and open source?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Helm is free to use and released under the MIT license."
      }
    },
    {
      "@type": "Question",
      "name": "Can I import my existing MySQL or MariaDB databases into Helm?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Export your existing databases with mysqldump or phpMyAdmin's export feature, then import them through Helm's built-in phpMyAdmin at http://localhost/phpmyadmin."
      }
    },
    {
      "@type": "Question",
      "name": "Where does Helm store my website files?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In the htdocs folder inside your Helm install directory, for example C:\\Helm\\resources\\server\\htdocs. Files placed there are served at http://localhost/, the same convention XAMPP uses."
      }
    },
    {
      "@type": "Question",
      "name": "What Windows versions does Helm support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Windows 10 and Windows 11, 64-bit."
      }
    }
  ]
}
</script>

<!-- HowTo structured data for installation -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to install Helm on Windows",
  "totalTime": "PT2M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "0"
  },
  "step": [
    {
      "@type": "HowToStep",
      "name": "Download the installer",
      "text": "Download Helm-Setup.exe from helm.get-keel.dev."
    },
    {
      "@type": "HowToStep",
      "name": "Run the installer",
      "text": "Run the downloaded .exe. No administrator rights are required. Confirm or change the install location, which defaults to C:\\Helm."
    },
    {
      "@type": "HowToStep",
      "name": "Open Helm and run setup",
      "text": "Open Helm from the Start Menu and click Set up Helm. This generates the Apache and MySQL configuration and initializes a fresh MySQL data directory, taking under a minute."
    },
    {
      "@type": "HowToStep",
      "name": "Register the Windows services",
      "text": "Click Register services on the main panel. Windows will show one administrator approval prompt to register Apache and MySQL as services."
    },
    {
      "@type": "HowToStep",
      "name": "Start Apache and MySQL",
      "text": "Click Start under each service. Your site is now live at http://localhost/ and phpMyAdmin at http://localhost/phpmyadmin."
    }
  ]
}
</script>

<style>
  body { background-color: #0b1215; }
  .plaque {
    background-color: #12232b;
    border: 1px solid #24373f;
    border-radius: 10px;
  }
  .rivet {
    width: 5px;
    height: 5px;
    border-radius: 9999px;
    background-color: #24373f;
  }
  .font-mono-label {
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.14em;
  }
  ::selection { background-color: #c89b4a; color: #0b1215; }
</style>
</head>
<body class="bg-hull text-fog font-body antialiased">

<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-brass focus:text-hull focus:px-4 focus:py-2 focus:rounded">Skip to content</a>

<!-- Nav -->
<header class="sticky top-0 z-40 border-b border-hairline bg-hull/95 backdrop-blur">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="#main" class="flex items-center gap-3">
      <img src="/assets/logo.png" alt="Helm logo" width="36" height="36" class="rounded-full">
      <span class="font-display font-semibold text-xl tracking-wide text-brassbright">Helm</span>
    </a>
    <nav class="hidden md:flex items-center gap-8 text-sm text-steel" aria-label="Page sections">
      <a href="#problem" class="hover:text-fog transition-colors">The problem</a>
      <a href="#how-it-works" class="hover:text-fog transition-colors">How it works</a>
      <a href="#install" class="hover:text-fog transition-colors">Install</a>
      <a href="#faq" class="hover:text-fog transition-colors">FAQ</a>
      <a href="https://get-keel.dev" class="hover:text-fog transition-colors">Keel &#8599;</a>
    </nav>
    <a href="/downloads/Helm-Setup-0.1.0.exe" class="font-mono-label text-xs uppercase bg-brass hover:bg-brassbright text-hull font-medium px-4 py-2.5 rounded transition-colors">Download</a>
  </div>
</header>

<main id="main">

  <!-- Hero -->
  <section class="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <p class="font-mono-label text-xs uppercase text-brass mb-4">For Windows &middot; Free &middot; MIT licensed</p>
        <h1 class="font-display font-semibold text-5xl md:text-6xl leading-[1.05] text-fog mb-6">
          Apache, MySQL, and PHP.<br>
          <span class="text-brassbright">Without the corruption.</span>
        </h1>
        <p class="text-lg text-steel leading-relaxed mb-8 max-w-md">
          Helm is a single Windows installer for Apache, PHP, MySQL, and phpMyAdmin &mdash; built to replace XAMPP and the
          <code class="font-mono text-sm bg-deck px-1.5 py-0.5 rounded text-signal">MySQL shutdown unexpectedly</code>
          crash loop that comes with it.
        </p>
        <div class="flex flex-wrap items-center gap-4">
          <a href="/downloads/Helm-Setup-0.1.0.exe" class="font-mono-label text-sm uppercase bg-brass hover:bg-brassbright text-hull font-medium px-6 py-3.5 rounded transition-colors">
            Download for Windows
          </a>
          <a href="#problem" class="text-sm text-steel hover:text-fog transition-colors underline decoration-hairline underline-offset-4">
            Why does this exist?
          </a>
        </div>
        <p class="font-mono text-xs text-steel mt-4">Windows 10/11 &middot; 64-bit &middot; No admin account required to install</p>
      </div>
      <div>
        <img src="/assets/banner.jpg" alt="Helm logo, a ship's wheel with an engine telegraph gauge, brass on navy" class="w-full rounded-2xl border border-hairline" width="1600" height="686">
      </div>
    </div>
  </section>

  <!-- ACT I — STOP: the problem -->
  <section id="problem" class="border-t border-hairline bg-deck/40">
    <div class="max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div class="grid md:grid-cols-[280px_1fr] gap-12 items-start">
        <div class="flex flex-col items-center md:items-start">
          <img src="/assets/gauge-stop.png" alt="Helm status gauge pointed to STOP" class="w-48 h-48 rounded-full mb-4" width="420" height="420" loading="lazy">
          <p class="font-mono-label text-xs uppercase text-signal">Act I</p>
        </div>
        <div>
          <h2 class="font-display font-semibold text-3xl md:text-4xl text-fog mb-6">XAMPP's MySQL keeps corrupting itself. Here's why.</h2>
          <p class="text-steel leading-relaxed mb-6 max-w-2xl">
            XAMPP's control panel starts <code class="font-mono text-sm text-fog">mysqld.exe</code> and
            <code class="font-mono text-sm text-fog">httpd.exe</code> as bare child processes, and stops them with a
            hard kill. MySQL's InnoDB storage engine needs a clean shutdown to flush its data files to disk &mdash;
            a hard kill mid-write is exactly what corrupts them.
          </p>
          <div class="plaque p-5 mb-6 max-w-2xl">
            <pre class="font-mono text-sm text-signal leading-relaxed whitespace-pre-wrap">Error: MySQL shutdown unexpectedly.
This may be due to a blocked port, missing dependencies,
improper privileges, a crash, or a shutdown by another method.</pre>
          </div>
          <p class="text-steel leading-relaxed max-w-2xl">
            That's followed by the familiar fix: quit XAMPP, rename <code class="font-mono text-sm text-fog">mysql/data</code>
            to <code class="font-mono text-sm text-fog">data_old</code>, restore from a backup, and hope you didn't lose anything.
            It happens because there's a fixable process management problem underneath it, not because MySQL itself is unreliable.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ACT II — STANDBY: how it works -->
  <section id="how-it-works" class="border-t border-hairline">
    <div class="max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div class="grid md:grid-cols-[280px_1fr] gap-12 items-start">
        <div class="flex flex-col items-center md:items-start">
          <img src="/assets/gauge-standby.png" alt="Helm status gauge pointed to STANDBY" class="w-48 h-48 rounded-full mb-4" width="420" height="420" loading="lazy">
          <p class="font-mono-label text-xs uppercase text-amber">Act II</p>
        </div>
        <div>
          <h2 class="font-display font-semibold text-3xl md:text-4xl text-fog mb-6">Helm registers Apache and MySQL as real Windows services.</h2>
          <p class="text-steel leading-relaxed mb-10 max-w-2xl">
            Windows' Service Control Manager stops a service with a proper <code class="font-mono text-sm text-fog">SERVICE_CONTROL_STOP</code> signal.
            Both <code class="font-mono text-sm text-fog">httpd.exe</code> and <code class="font-mono text-sm text-fog">mysqld.exe</code>
            already handle that natively as a graceful shutdown &mdash; XAMPP's control panel just never uses it. That one
            architectural difference is the entire fix.
          </p>

          <div class="grid sm:grid-cols-2 gap-4">
            <div class="plaque p-5">
              <div class="flex gap-1 mb-3"><span class="rivet"></span><span class="rivet"></span></div>
              <h3 class="font-display font-semibold text-fog mb-1.5">Bundled, not borrowed</h3>
              <p class="text-sm text-steel leading-relaxed">Apache 2.4, PHP 8.2, MariaDB, and phpMyAdmin all ship inside one installer. Nothing else to download first.</p>
            </div>
            <div class="plaque p-5">
              <div class="flex gap-1 mb-3"><span class="rivet"></span><span class="rivet"></span></div>
              <h3 class="font-display font-semibold text-fog mb-1.5">One folder, like XAMPP</h3>
              <p class="text-sm text-steel leading-relaxed">Installs to <code class="font-mono text-xs">C:\Helm</code> by default &mdash; not Program Files &mdash; so routine file access never needs admin rights.</p>
            </div>
            <div class="plaque p-5">
              <div class="flex gap-1 mb-3"><span class="rivet"></span><span class="rivet"></span></div>
              <h3 class="font-display font-semibold text-fog mb-1.5">No prompt on every click</h3>
              <p class="text-sm text-steel leading-relaxed">Starting and stopping services is granted explicitly during setup, so day-to-day use doesn't ask Windows for permission each time.</p>
            </div>
            <div class="plaque p-5">
              <div class="flex gap-1 mb-3"><span class="rivet"></span><span class="rivet"></span></div>
              <h3 class="font-display font-semibold text-fog mb-1.5">phpMyAdmin, zero login</h3>
              <p class="text-sm text-steel leading-relaxed">Auto-authenticates as root on first open, restricted to your own machine.</p>
            </div>
            <div class="plaque p-5">
              <div class="flex gap-1 mb-3"><span class="rivet"></span><span class="rivet"></span></div>
              <h3 class="font-display font-semibold text-fog mb-1.5">Log-aware recovery</h3>
              <p class="text-sm text-steel leading-relaxed">If InnoDB corruption ever does happen, Helm recognizes the signature in the error log and offers a one-click recovery that only touches the system files, not your databases.</p>
            </div>
            <div class="plaque p-5">
              <div class="flex gap-1 mb-3"><span class="rivet"></span><span class="rivet"></span></div>
              <h3 class="font-display font-semibold text-fog mb-1.5">Port conflict detection</h3>
              <p class="text-sm text-steel leading-relaxed">Checks what's actually bound to :80 or :3306 before you fight a vague startup failure.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ACT III — AHEAD: install -->
  <section id="install" class="border-t border-hairline bg-deck/40">
    <div class="max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div class="grid md:grid-cols-[280px_1fr] gap-12 items-start">
        <div class="flex flex-col items-center md:items-start">
          <img src="/assets/gauge-ahead.png" alt="Helm status gauge pointed to AHEAD" class="w-48 h-48 rounded-full mb-4" width="420" height="420" loading="lazy">
          <p class="font-mono-label text-xs uppercase text-brass">Act III</p>
        </div>
        <div>
          <h2 class="font-display font-semibold text-3xl md:text-4xl text-fog mb-6">Install Helm in under two minutes.</h2>

          <ol class="space-y-6 mb-14 max-w-2xl">
            <li class="flex gap-4">
              <span class="font-mono text-brass text-sm shrink-0 pt-0.5">01</span>
              <div>
                <p class="text-fog font-medium mb-1">Download the installer</p>
                <p class="text-sm text-steel leading-relaxed">Get <code class="font-mono text-xs bg-deckraised px-1.5 py-0.5 rounded">Helm-Setup.exe</code> from the button below.</p>
              </div>
            </li>
            <li class="flex gap-4">
              <span class="font-mono text-brass text-sm shrink-0 pt-0.5">02</span>
              <div>
                <p class="text-fog font-medium mb-1">Run it</p>
                <p class="text-sm text-steel leading-relaxed">No administrator account needed. Confirm or change the install location &mdash; it defaults to <code class="font-mono text-xs">C:\Helm</code>.</p>
              </div>
            </li>
            <li class="flex gap-4">
              <span class="font-mono text-brass text-sm shrink-0 pt-0.5">03</span>
              <div>
                <p class="text-fog font-medium mb-1">Open Helm, click "Set up Helm"</p>
                <p class="text-sm text-steel leading-relaxed">Generates your Apache and MySQL configuration and initializes a fresh database. Takes under a minute.</p>
              </div>
            </li>
            <li class="flex gap-4">
              <span class="font-mono text-brass text-sm shrink-0 pt-0.5">04</span>
              <div>
                <p class="text-fog font-medium mb-1">Click "Register services"</p>
                <p class="text-sm text-steel leading-relaxed">One Windows approval prompt &mdash; registering the services is the only step that genuinely needs it.</p>
              </div>
            </li>
            <li class="flex gap-4">
              <span class="font-mono text-brass text-sm shrink-0 pt-0.5">05</span>
              <div>
                <p class="text-fog font-medium mb-1">Start Apache and MySQL</p>
                <p class="text-sm text-steel leading-relaxed">Your site is live at <code class="font-mono text-xs">http://localhost/</code>, phpMyAdmin at <code class="font-mono text-xs">http://localhost/phpmyadmin</code>.</p>
              </div>
            </li>
          </ol>

          <div class="plaque p-6 md:p-8 mb-14 max-w-2xl">
            <h3 class="font-display font-semibold text-lg text-fog mb-4">Using Helm day to day</h3>
            <dl class="space-y-4 text-sm">
              <div>
                <dt class="text-brass font-mono-label text-xs uppercase mb-1">Where your files go</dt>
                <dd class="text-steel leading-relaxed"><code class="font-mono text-xs text-fog">htdocs\</code> inside your install folder &mdash; same convention as XAMPP.</dd>
              </div>
              <div>
                <dt class="text-brass font-mono-label text-xs uppercase mb-1">Database admin</dt>
                <dd class="text-steel leading-relaxed"><code class="font-mono text-xs text-fog">http://localhost/phpmyadmin</code>, logged in automatically as root.</dd>
              </div>
              <div>
                <dt class="text-brass font-mono-label text-xs uppercase mb-1">Start with Windows</dt>
                <dd class="text-steel leading-relaxed">Toggle it per-service in the panel if you want Apache/MySQL running on boot.</dd>
              </div>
              <div>
                <dt class="text-brass font-mono-label text-xs uppercase mb-1">Something goes wrong</dt>
                <dd class="text-steel leading-relaxed">Click <span class="text-fog">View log</span> on either service &mdash; known issues are flagged automatically with a plain-language explanation.</dd>
              </div>
            </dl>
          </div>

          <a href="/downloads/Helm-Setup-0.1.0.exe" class="inline-block font-mono-label text-sm uppercase bg-brass hover:bg-brassbright text-hull font-medium px-8 py-4 rounded transition-colors">
            Download Helm for Windows
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq" class="border-t border-hairline">
    <div class="max-w-3xl mx-auto px-6 py-20 md:py-28">
      <h2 class="font-display font-semibold text-3xl text-fog mb-10">Frequently asked questions</h2>
      <div class="space-y-3">

        <details class="plaque p-5 group">
          <summary class="cursor-pointer list-none flex justify-between items-center text-fog font-medium">
            What is Helm?
            <span class="text-brass group-open:rotate-45 transition-transform text-xl leading-none">+</span>
          </summary>
          <p class="text-sm text-steel leading-relaxed mt-3">Helm is a free Windows application that installs Apache, PHP, MySQL (MariaDB), and phpMyAdmin from a single installer and runs Apache and MySQL as native Windows services. It's built as a direct replacement for XAMPP on Windows.</p>
        </details>

        <details class="plaque p-5 group">
          <summary class="cursor-pointer list-none flex justify-between items-center text-fog font-medium">
            Does Helm fix the XAMPP "MySQL shutdown unexpectedly" error?
            <span class="text-brass group-open:rotate-45 transition-transform text-xl leading-none">+</span>
          </summary>
          <p class="text-sm text-steel leading-relaxed mt-3">Yes. That error is usually caused by XAMPP's control panel hard-killing the <code class="font-mono text-xs">mysqld.exe</code> process instead of shutting it down cleanly, which corrupts InnoDB's data files. Helm registers MySQL as a real Windows service, so Windows sends it a proper <code class="font-mono text-xs">SERVICE_CONTROL_STOP</code> signal on shutdown, which MySQL handles as a graceful stop instead of a crash.</p>
        </details>

        <details class="plaque p-5 group">
          <summary class="cursor-pointer list-none flex justify-between items-center text-fog font-medium">
            Do I need to install XAMPP before using Helm?
            <span class="text-brass group-open:rotate-45 transition-transform text-xl leading-none">+</span>
          </summary>
          <p class="text-sm text-steel leading-relaxed mt-3">No. Apache, PHP, MySQL, phpMyAdmin, and the Visual C++ Redistributable that MySQL needs are all bundled inside the Helm installer. Nothing else to download first.</p>
        </details>

        <details class="plaque p-5 group">
          <summary class="cursor-pointer list-none flex justify-between items-center text-fog font-medium">
            Does Helm need administrator rights to run?
            <span class="text-brass group-open:rotate-45 transition-transform text-xl leading-none">+</span>
          </summary>
          <p class="text-sm text-steel leading-relaxed mt-3">No. Helm installs to <code class="font-mono text-xs">C:\Helm</code> by default, a location with normal Windows file permissions, so opening the app and editing your project files never requires administrator rights. The only action that asks for approval is registering Apache and MySQL as Windows services, a one-time step &mdash; after that, starting and stopping them doesn't require it either.</p>
        </details>

        <details class="plaque p-5 group">
          <summary class="cursor-pointer list-none flex justify-between items-center text-fog font-medium">
            Is Helm free and open source?
            <span class="text-brass group-open:rotate-45 transition-transform text-xl leading-none">+</span>
          </summary>
          <p class="text-sm text-steel leading-relaxed mt-3">Yes, Helm is free to use and released under the MIT license.</p>
        </details>

        <details class="plaque p-5 group">
          <summary class="cursor-pointer list-none flex justify-between items-center text-fog font-medium">
            Can I import my existing MySQL or MariaDB databases?
            <span class="text-brass group-open:rotate-45 transition-transform text-xl leading-none">+</span>
          </summary>
          <p class="text-sm text-steel leading-relaxed mt-3">Yes. Export them with <code class="font-mono text-xs">mysqldump</code> or phpMyAdmin's export feature elsewhere, then import through Helm's built-in phpMyAdmin at <code class="font-mono text-xs">http://localhost/phpmyadmin</code>.</p>
        </details>

        <details class="plaque p-5 group">
          <summary class="cursor-pointer list-none flex justify-between items-center text-fog font-medium">
            How is Helm different from Laragon or WampServer?
            <span class="text-brass group-open:rotate-45 transition-transform text-xl leading-none">+</span>
          </summary>
          <p class="text-sm text-steel leading-relaxed mt-3">They solve similar problems. Helm's specific focus is registering Apache and MySQL as genuine Windows services with a security descriptor that avoids repeated admin prompts, installing outside Program Files by default, and shipping phpMyAdmin pre-configured for zero-login local access.</p>
        </details>

        <details class="plaque p-5 group">
          <summary class="cursor-pointer list-none flex justify-between items-center text-fog font-medium">
            What Windows versions does Helm support?
            <span class="text-brass group-open:rotate-45 transition-transform text-xl leading-none">+</span>
          </summary>
          <p class="text-sm text-steel leading-relaxed mt-3">Windows 10 and Windows 11, 64-bit.</p>
        </details>

      </div>
    </div>
  </section>

</main>

<footer class="border-t border-hairline">
  <div class="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row justify-between items-center gap-4">
    <div class="flex items-center gap-3">
      <img src="/assets/logo.png" alt="" width="24" height="24" class="rounded-full" aria-hidden="true">
      <span class="text-sm text-steel">&copy; <?php echo date('Y'); ?> EchoDial LLC &middot; MIT licensed</span>
    </div>
    <nav class="flex items-center gap-6 text-sm text-steel" aria-label="Footer">
      <a href="https://get-keel.dev" class="hover:text-fog transition-colors">Keel</a>
      <a href="https://github.com" class="hover:text-fog transition-colors">GitHub</a>
      <a href="#faq" class="hover:text-fog transition-colors">FAQ</a>
    </nav>
  </div>
</footer>

</body>
</html>
