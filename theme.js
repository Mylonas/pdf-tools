/* Shared theme handling for meldpdf.
   Follows OS preference by default. Manual toggle overrides and is persisted.
   Loaded in <head> (not deferred) so data-theme is set before first paint. */
(function () {
  var root = document.documentElement;
  var saved;
  try { saved = localStorage.getItem('theme'); } catch (e) { saved = null; }
  var osDark = window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches;
  root.setAttribute('data-theme', (saved === 'dark' || saved === 'light') ? saved : (osDark ? 'dark' : 'light'));

  function icon(t) { return t === 'light' ? '🌙' : '☀️'; }
  function label(t) { return t === 'light' ? 'Switch to dark theme' : 'Switch to light theme'; }

  document.addEventListener('DOMContentLoaded', function () {
    var host = document.querySelector('.nav') || document.querySelector('.topbar');
    if (!host) return;
    var cur = root.getAttribute('data-theme');
    var b = document.createElement('button');
    b.id = 'themeToggle';
    b.type = 'button';
    b.textContent = icon(cur);
    b.title = label(cur);
    b.setAttribute('aria-label', label(cur));
    b.style.cssText = 'background:none;border:1.5px solid var(--line);border-radius:20px;' +
      'cursor:pointer;font-size:15px;line-height:1;padding:5px 9px;color:var(--soft)';
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      b.textContent = icon(next);
      b.title = label(next);
      b.setAttribute('aria-label', label(next));
    });
    host.appendChild(b);
  });
})();

/* Cookie consent banner — GDPR compliance */
(function(){
  try{if(localStorage.getItem('cookieConsent'))return;}catch(e){return;}
  document.addEventListener('DOMContentLoaded',function(){
    var bar=document.createElement('div');
    bar.id='cookieConsent';
    bar.setAttribute('role','dialog');
    bar.setAttribute('aria-label','Cookie consent');
    bar.innerHTML=
      '<p style="margin:0 0 10px">This site uses cookies for essential functionality (theme preference and hosting security). '+
      '<a href="/cookie-policy">Learn more</a>.</p>'+
      '<button id="ccAccept" style="background:var(--brand);color:#fff;border:none;padding:9px 20px;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px">OK</button>';
    bar.style.cssText='position:fixed;bottom:0;left:0;right:0;background:var(--card);border-top:1px solid var(--line);'+
      'padding:18px clamp(16px,4vw,40px);font-size:14px;color:var(--ink);z-index:9999;box-shadow:0 -4px 20px rgba(0,0,0,.08)';
    document.body.appendChild(bar);
    document.getElementById('ccAccept').onclick=function(){
      try{localStorage.setItem('cookieConsent','accepted');}catch(e){}bar.remove();
    };
  });

  // Register the service worker for offline support (see sw.js).
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('/sw.js').catch(function(){});
    });
  }
})();

/* "Install app" button — shown only when the browser reports the PWA is
   installable (fires beforeinstallprompt), hidden once installed. */
(function(){
  var deferred = null, btn = null;
  function installed(){
    try{ return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
    catch(e){ return false; }
  }
  function sync(){ if(btn) btn.style.display = (deferred && !installed()) ? '' : 'none'; }

  // Register early so the event isn't missed before DOMContentLoaded.
  window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; sync(); });
  window.addEventListener('appinstalled', function(){ deferred = null; sync(); });

  document.addEventListener('DOMContentLoaded', function(){
    var host = document.querySelector('.nav') || document.querySelector('.topbar');
    if(!host) return;
    btn = document.createElement('button');
    btn.id = 'installApp';
    btn.type = 'button';
    btn.textContent = '⬇ Install app';
    btn.title = 'Install meldpdf as an app';
    btn.setAttribute('aria-label', 'Install meldpdf as an app');
    btn.style.cssText = 'background:var(--brand);color:#fff;border:1.5px solid var(--brand);border-radius:20px;' +
      'cursor:pointer;font-size:13px;font-weight:700;line-height:1;padding:6px 12px;margin-left:4px';
    btn.addEventListener('click', function(){
      if(!deferred) return;
      btn.disabled = true;
      deferred.prompt();
      var choice = deferred.userChoice;
      deferred = null;
      if(choice && choice.then){ choice.then(function(){ btn.disabled = false; sync(); }, function(){ btn.disabled = false; sync(); }); }
      else { btn.disabled = false; sync(); }
    });
    host.appendChild(btn);
    sync();
  });
})();
