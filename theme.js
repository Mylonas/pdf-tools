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

/* Cookie consent banner — required for AdSense GDPR compliance */
(function(){
  try{if(localStorage.getItem('cookieConsent'))return;}catch(e){return;}
  document.addEventListener('DOMContentLoaded',function(){
    var bar=document.createElement('div');
    bar.id='cookieConsent';
    bar.setAttribute('role','dialog');
    bar.setAttribute('aria-label','Cookie consent');
    bar.innerHTML=
      '<p style="margin:0 0 10px">This site uses cookies from Google to deliver and enhance the quality of its services and to analyse traffic. '+
      '<a href="/cookie-policy">Learn more</a>.</p>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap">'+
      '<button id="ccAccept" style="background:var(--brand);color:#fff;border:none;padding:9px 20px;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px">Accept</button>'+
      '<button id="ccReject" style="background:transparent;color:var(--soft);border:1.5px solid var(--line);padding:9px 20px;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px">Reject non-essential</button>'+
      '</div>';
    bar.style.cssText='position:fixed;bottom:0;left:0;right:0;background:var(--card);border-top:1px solid var(--line);'+
      'padding:18px clamp(16px,4vw,40px);font-size:14px;color:var(--ink);z-index:9999;box-shadow:0 -4px 20px rgba(0,0,0,.08)';
    document.body.appendChild(bar);
    document.getElementById('ccAccept').onclick=function(){
      try{localStorage.setItem('cookieConsent','accepted');}catch(e){}bar.remove();
    };
    document.getElementById('ccReject').onclick=function(){
      try{localStorage.setItem('cookieConsent','rejected');}catch(e){}bar.remove();
      document.querySelectorAll('script[src*="adsbygoogle"]').forEach(function(s){s.remove();});
    };
  });
})();
