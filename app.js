/* meldpdf shared tool app.
   Mounts a working PDF tool into <div id="pdfApp">.
   - Homepage: no data-tool => full mode (search + tabs + all 17 tools).
   - Landing page: <div id="pdfApp" data-tool="compress"> => single-tool mode.
   Self-injects its component CSS (uses the theme's CSS vars), so any page that
   loads /vendor/pdf-lib + /vendor/pdf.min + this file gets a working tool.
   All processing is client-side; files are never uploaded. */
(function(){
"use strict";

/* ---------- component CSS (theme vars come from the page's :root) ---------- */
var CSS = `
.toolsearch{position:relative;margin:0 0 16px}
.searchrow{display:flex;flex-wrap:wrap;gap:8px;align-items:stretch}
.searchrow #toolSearch{flex:1 1 200px;width:auto;min-width:0}
.choosebtn{flex:0 0 auto;border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:11px 14px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit}
.choosebtn:hover{border-color:var(--brand);color:var(--brand)}
@media(max-width:430px){.searchrow #toolSearch{flex-basis:100%}.choosebtn{flex:1 1 100%}}
.dropsuggest{margin:0 0 16px;background:var(--card);border:1.5px solid var(--brand);border-radius:12px;padding:14px 16px;box-shadow:0 4px 14px rgba(51,85,255,.1)}
.dropsuggest .sghead{font-size:14px;color:var(--ink);margin:0 0 10px;display:flex;align-items:center;gap:8px}
.dropsuggest .sghead b{color:var(--brand);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%}
.dropsuggest .sgx{margin-left:auto;border:0;background:transparent;color:var(--soft);cursor:pointer;font-size:15px;padding:2px 6px;flex:none}
.dropsuggest .sgchips{display:flex;flex-wrap:wrap;gap:8px}
.sgchip{display:inline-flex;align-items:center;gap:7px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);border-radius:22px;padding:7px 13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.sgchip:hover{border-color:var(--brand);color:var(--brand)}
.sgchip .sgi{width:22px;height:22px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:13px}
.toolgrid.dropactive{outline:2.5px dashed var(--brand);outline-offset:8px;border-radius:14px;background:var(--brand-soft)}
.recent{margin:0 0 16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.recent .reclbl{font-size:12px;font-weight:700;color:var(--soft);margin-right:2px}
.recchip{display:inline-flex;align-items:center;gap:7px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:22px;padding:6px 12px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none}
.recchip:hover{border-color:var(--brand);color:var(--brand)}
.recchip .sgi{width:20px;height:20px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:12px}
.againbtn{margin-top:12px;width:100%;padding:12px;border:1.5px solid var(--line);border-radius:11px;background:var(--card);color:var(--ink);font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}
.againbtn:hover{border-color:var(--brand);color:var(--brand)}
#toolSearch{width:100%;padding:13px 15px;border:1.5px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);font-size:15px;font-family:inherit}
#toolSearch:focus{outline:none;border-color:var(--brand)}
.searchhits{position:absolute;left:0;right:0;top:calc(100% + 6px);background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;z-index:9;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.searchhits:empty{display:none}
.searchhits button,.searchhits a{display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--ink);padding:11px 15px;font-size:14px;cursor:pointer;font-family:inherit;text-decoration:none;box-sizing:border-box}
.searchhits button:hover,.searchhits a:hover{background:var(--brand-soft);color:var(--brand)}
.pdftabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
.pdftabs button{border:1.5px solid var(--line);background:var(--card);color:var(--soft);padding:9px 15px;border-radius:22px;font-weight:700;cursor:pointer;font-size:14px}
.pdftabs button.on{border-color:var(--brand);background:var(--brand);color:#fff}
.toolgrid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin:0 0 18px}
.toolbtn{display:flex;flex-direction:column;align-items:flex-start;gap:6px;background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:16px;cursor:pointer;text-align:left;transition:border-color .15s,box-shadow .15s;position:relative;text-decoration:none;color:inherit}
.toolbtn:hover{border-color:var(--brand);box-shadow:0 2px 8px rgba(0,0,0,.06)}
.toolbtn.on{border-color:var(--brand);box-shadow:0 0 0 2px var(--brand-soft)}
.toolbtn .tbicon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex:none}
.toolbtn .tbname{font-size:14px;font-weight:700;color:var(--ink)}
.toolbtn .tbdesc{font-size:12px;color:var(--soft);line-height:1.35}
.toolbtn .tbbadge{position:absolute;top:8px;right:8px;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px}
.tbic-orange{background:#fff0eb;color:#d85a30}.tbic-blue{background:#e8f1fb;color:#3578d8}.tbic-teal{background:#e4f5ef;color:#1d9e75}
.tbic-purple{background:#efedfe;color:#7f77dd}.tbic-amber{background:#faf0dc;color:#ba7517}.tbic-pink{background:#fceaf0;color:#d4537e}
.tbic-red{background:#fcebeb;color:#e24b4a}.tbic-green{background:#ecf4e0;color:#639922}
.tbbg-green{background:#e4f5ef;color:#0f6e56}
:root[data-theme="dark"] .tbic-orange{background:#3a1a0e;color:#f0997b}
:root[data-theme="dark"] .tbic-blue{background:#0a2c4a;color:#85b7eb}
:root[data-theme="dark"] .tbic-teal{background:#0a3028;color:#5dcaa5}
:root[data-theme="dark"] .tbic-purple{background:#22204a;color:#afa9ec}
:root[data-theme="dark"] .tbic-amber{background:#3a2206;color:#fac775}
:root[data-theme="dark"] .tbic-pink{background:#3a1524;color:#ed93b1}
:root[data-theme="dark"] .tbic-red{background:#3a1515;color:#f09595}
:root[data-theme="dark"] .tbic-green{background:#1a2e08;color:#97c459}
:root[data-theme="dark"] .tbbg-green{background:#0a3028;color:#3fc38a}
.toolback{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:var(--brand);font-size:14px;font-weight:700;cursor:pointer;padding:0;margin:0 0 14px;font-family:inherit}
.toolback:hover{text-decoration:underline}
.pdfcard{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px}
.toolhead{font-weight:800;font-size:18px;margin:0 0 4px;color:var(--ink)}
.tooldesc{color:var(--soft);font-size:14px;margin:0 0 18px}
.drop{border:2px dashed var(--line);border-radius:12px;padding:34px 20px;text-align:center;cursor:pointer;transition:.15s;color:var(--soft)}
.drop:hover,.drop.over{border-color:var(--brand);background:var(--brand-soft);color:var(--brand)}
.drop b{color:var(--ink);font-size:16px}
.drop.over b{color:var(--brand)}
.files{list-style:none;padding:0;margin:16px 0 0;display:flex;flex-direction:column;gap:8px}
.files li{display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:9px 12px;font-size:14px}
.files li .nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.files li .sz{color:var(--soft);font-size:12px;white-space:nowrap}
.files li button{border:0;background:transparent;color:var(--soft);cursor:pointer;font-size:16px;padding:2px 6px}
.files li .mv{font-size:13px}
.opts{display:flex;flex-wrap:wrap;gap:14px;align-items:end;margin-top:16px}
.opts label{font-size:12px;font-weight:700;color:var(--soft);display:block;margin-bottom:5px}
.opts input,.opts select{padding:9px 11px;border:1.5px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font-size:14px;font-family:inherit}
.optnote{font-size:12px;color:var(--soft);align-self:center;max-width:300px}
.go{margin-top:20px;width:100%;padding:14px;border:0;border-radius:11px;background:var(--brand);color:#fff;font-size:16px;font-weight:800;cursor:pointer}
.go:disabled{opacity:.45;cursor:not-allowed}
.status{margin-top:14px;font-size:14px;color:var(--soft);min-height:20px}
.status.ok{color:var(--ok);font-weight:700}
.status.err{color:var(--danger);font-weight:700}
.pdfresult{margin-top:14px;background:var(--brand-soft);border:1px solid var(--line);border-radius:10px;padding:14px;font-size:14px;color:var(--ink)}
.pdfresult b{color:var(--ok)}
.pdfhidden{display:none}
.thumbgrid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));margin-top:16px}
.thumb{border:1px solid var(--line);border-radius:9px;background:var(--card);padding:6px;position:relative;cursor:grab}
.thumb.dragging{opacity:.4}
.thumb.over{border-color:var(--brand);box-shadow:0 0 0 2px var(--brand-soft)}
.thumb canvas{width:100%;height:auto;border-radius:4px;display:block;background:#fff}
.thumb .pg{font-size:11px;color:var(--soft);text-align:center;margin-top:4px}
.thumb .acts{position:absolute;top:8px;right:8px;display:flex;gap:4px}
.thumb .acts button{border:0;border-radius:6px;width:24px;height:24px;font-size:12px;cursor:pointer;background:rgba(0,0,0,.55);color:#fff;line-height:1}
.thumb.del{opacity:.35;filter:grayscale(1)}
.thumb.del .pg::after{content:" (removed)";color:var(--danger)}
.sigpad{border:2px dashed var(--line);border-radius:10px;background:#fff;touch-action:none;width:100%;max-width:420px;height:180px;display:block;cursor:crosshair}
.sigrow{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-top:14px}
`;
var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);

/* ---------- tool registry ---------- */
var OPT = {
  compress:`<div class="opts"><div><label>Compression level</label><select id="clevel"><option value="strong">Strong — smallest file</option><option value="balanced" selected>Balanced — recommended</option><option value="light">Light — best quality</option><option value="lossless">Lossless — keep text selectable</option></select></div><div class="optnote">Strong / Balanced / Light rebuild pages as compressed images (text becomes non-selectable). Lossless keeps text and links intact but only trims file structure, so it saves less.</div></div>`,
  split:`<div class="opts"><div><label>Pages to extract (e.g. 1-3, 5, 8-10)</label><input type="text" id="ranges" placeholder="1-3, 5" style="min-width:180px"></div></div>`,
  delete:`<div class="opts"><div><label>Pages to delete (e.g. 2, 5-7)</label><input type="text" id="delRanges" placeholder="2, 5-7" style="min-width:180px"></div></div>`,
  rotate:`<div class="opts"><div><label>Rotate by</label><select id="angle"><option value="90">90° right</option><option value="180">180°</option><option value="270">90° left</option></select></div></div>`,
  imgq:`<div class="opts"><div><label>Quality</label><select id="scale"><option value="1.5">Standard</option><option value="2" selected>High</option><option value="3">Very high</option></select></div></div>`,
  pagenum:`<div class="opts"><div><label>Position</label><select id="pnPos"><option value="bc" selected>Bottom center</option><option value="br">Bottom right</option><option value="bl">Bottom left</option></select></div><div><label>Start at</label><input type="number" id="pnStart" value="1" min="0" style="width:80px"></div><div><label>Format</label><select id="pnFmt"><option value="n">1</option><option value="n_of">1 / N</option><option value="page_n">Page 1</option></select></div></div>`,
  watermark:`<div class="opts"><div><label>Watermark text</label><input type="text" id="wmText" placeholder="CONFIDENTIAL" value="CONFIDENTIAL" style="min-width:180px"></div><div><label>Opacity</label><select id="wmOpacity"><option value="0.12">Light</option><option value="0.2" selected>Medium</option><option value="0.35">Strong</option></select></div></div>`,
  ocr:`<div class="opts"><div><label>Document language</label><select id="ocrLang"><option value="eng" selected>English</option><option value="ell">Greek</option><option value="rus">Russian</option><option value="fra">French</option><option value="deu">German</option><option value="spa">Spanish</option><option value="ita">Italian</option></select></div><div class="optnote">Your file stays on your device. The OCR engine (~2–12&nbsp;MB) downloads once, then runs locally.</div></div>`,
  protect:`<div class="opts"><div><label>Action</label><select id="prMode"><option value="lock" selected>Add a password</option><option value="unlock">Remove a password</option></select></div><div><label id="prPassLabel">New password</label><input type="password" id="prPass" placeholder="Choose a password" style="min-width:180px"></div><div class="optnote">Anyone with the password can open it. Removing a password requires knowing the current one — we can't crack locked files.</div></div>`
};

var TOOLS={
  compress:{page:'compress-pdf',title:'Compress PDF',tab:'Compress PDF',desc:'Shrink a PDF for email or upload limits — see the before/after size.',accept:'application/pdf',hint:'One PDF file',multi:false,batch:true,btn:'Compress PDF',opts:OPT.compress,kw:'compress reduce shrink smaller size make small mb optimize',icon:'⚡',ic:'orange',badge:'SAVE 90%',sdesc:'Reduce file size'},
  merge:{page:'merge-pdf',title:'Merge PDF',tab:'Merge PDF',desc:'Combine several PDFs into one. Drag to reorder.',accept:'application/pdf',hint:'PDF files',multi:true,btn:'Merge PDFs',kw:'merge combine join together',icon:'📎',ic:'blue',sdesc:'Combine multiple PDFs'},
  split:{page:'split-pdf',title:'Split / Extract pages',tab:'Split / Extract',desc:'Extract specific pages or ranges from a PDF.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Extract pages',opts:OPT.split,kw:'split extract separate pull pages range',icon:'✂️',ic:'teal',sdesc:'Extract specific pages'},
  delete:{page:'delete-pages-from-pdf',title:'Delete pages',tab:'Delete pages',desc:'Remove specific pages from a PDF.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Delete pages',opts:OPT.delete,kw:'delete remove pages get rid',icon:'🗑️',ic:'purple',sdesc:'Remove unwanted pages'},
  img2pdf:{page:'jpg-to-pdf',title:'Images → PDF',tab:'Images → PDF',desc:'Combine JPG/PNG images into a single PDF.',accept:'image/jpeg,image/png',hint:'JPG or PNG images',multi:true,btn:'Create PDF',kw:'image jpg jpeg png photo picture to pdf',icon:'🖼️',ic:'amber',sdesc:'JPG/PNG to PDF'},
  pdf2img:{page:'pdf-to-jpg',title:'PDF → JPG',tab:'PDF → JPG',desc:'Export every page of a PDF as a JPG image.',accept:'application/pdf',hint:'One PDF file',multi:false,batch:true,btn:'Convert to JPG',opts:OPT.imgq,kw:'pdf to jpg jpeg image convert export',icon:'📸',ic:'pink',sdesc:'Convert to JPG'},
  pdf2png:{page:'pdf-to-png',title:'PDF → PNG',tab:'PDF → PNG',desc:'Export every page of a PDF as a PNG image.',accept:'application/pdf',hint:'One PDF file',multi:false,batch:true,btn:'Convert to PNG',opts:OPT.imgq,kw:'pdf to png image convert export transparent',icon:'🎨',ic:'pink',sdesc:'Convert to PNG'},
  rotate:{page:'rotate-pdf',title:'Rotate PDF',tab:'Rotate',desc:'Rotate all pages of a PDF.',accept:'application/pdf',hint:'One PDF file',multi:false,batch:true,btn:'Rotate PDF',opts:OPT.rotate,kw:'rotate turn sideways upside down orientation landscape portrait',icon:'🔄',ic:'teal',sdesc:'Fix page orientation'},
  pagenum:{page:'add-page-numbers-to-pdf',title:'Add page numbers',tab:'Page numbers',desc:'Stamp page numbers onto every page of a PDF.',accept:'application/pdf',hint:'One PDF file',multi:false,batch:true,btn:'Add page numbers',opts:OPT.pagenum,kw:'page numbers number pagination',icon:'#️⃣',ic:'orange',sdesc:'Stamp page numbers'},
  watermark:{page:'watermark-pdf',title:'Watermark PDF',tab:'Watermark',desc:'Add a diagonal text watermark to every page.',accept:'application/pdf',hint:'One PDF file',multi:false,batch:true,btn:'Add watermark',opts:OPT.watermark,kw:'watermark stamp confidential draft mark text overlay',icon:'💧',ic:'purple',sdesc:'Add text overlay'},
  extract:{page:'extract-text-from-pdf',title:'Extract text',tab:'Extract text',desc:'Pull all text out of a PDF and count pages, words and characters.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Extract text',kw:'extract text copy word count character count read',icon:'📝',ic:'blue',sdesc:'Copy text from PDF'},
  organize:{page:'organize-pdf',title:'Organize pages',tab:'Organize pages',desc:'Reorder (drag), rotate or delete individual pages, then save.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Save organized PDF',custom:'organize',kw:'organize reorder rearrange move sort arrange pages thumbnails manage',icon:'📋',ic:'teal',sdesc:'Reorder and arrange'},
  sign:{page:'sign-pdf',title:'Sign PDF',tab:'Sign PDF',desc:'Draw or upload a signature and place it on a page.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Sign & download',custom:'sign',kw:'sign signature esign electronic autograph initials',icon:'✍️',ic:'green',sdesc:'Draw your signature'},
  pdf2word:{page:'pdf-to-word',title:'PDF → Word (.docx)',tab:'PDF → Word',desc:'Extract the text into an editable Word (.docx) document — one paragraph per line.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Convert to Word (.docx)',kw:'pdf to word doc docx editable convert microsoft',icon:'📄',ic:'blue',sdesc:'Convert PDF to DOCX'},
  metadata:{page:'remove-pdf-metadata',title:'Metadata viewer & remover',tab:'Metadata',desc:"See a PDF’s hidden metadata, and download a clean copy with it stripped.",accept:'application/pdf',hint:'One PDF file',multi:false,batch:true,btn:'View & strip metadata',kw:'metadata properties author title info remove strip clean privacy exif',icon:'🔍',ic:'pink',sdesc:'View and strip info'},
  ocr:{page:'ocr-pdf',title:'OCR scanned PDF',tab:'OCR (scanned)',desc:'Read text from a scanned or image-only PDF (or an image) using on-device OCR.',accept:'application/pdf,image/jpeg,image/png',hint:'A scanned PDF or image',multi:false,btn:'Run OCR',opts:OPT.ocr,kw:'ocr scanned image searchable recognize text scan optical',icon:'👁️',ic:'amber',sdesc:'Read scanned text'},
  protect:{page:'protect-pdf',title:'Protect / Unlock PDF',tab:'Protect / Unlock',desc:'Add a password to a PDF, or remove one you know.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Apply',opts:OPT.protect,kw:'protect password encrypt lock secure unlock remove password decrypt permissions',icon:'🔒',ic:'red',sdesc:'Password encrypt'}
};

/* ---------- state + helpers ---------- */
var current='merge', files=[], customState={}, single=false, mount=null, pending=[];
var $=function(id){return document.getElementById(id);};
var fmt=function(b){return b<1024?b+' B': b<1048576?(b/1024).toFixed(0)+' KB':(b/1048576).toFixed(1)+' MB';};
function setStatus(msg,cls){var s=$('status'); if(!s)return; s.textContent=msg; s.className='status '+(cls||'');}
function showResult(html){var r=$('pdfresult'); if(!r)return; r.innerHTML=html; r.classList.remove('pdfhidden');}
function escapeHtml(s){return (''+s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
window.pdfDownload=function(bytes,name,type){var blob=new Blob([bytes],{type:type});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url);},4000);};
function parseRanges(str,max){var out=new Set();(str||'').split(',').forEach(function(part){part=part.trim();if(!part)return;if(part.indexOf('-')>-1){var ab=part.split('-').map(function(n){return parseInt(n);});var a=ab[0],b=ab[1];if(isNaN(a)||isNaN(b))return;for(var i=a;i<=b;i++)if(i>=1&&i<=max)out.add(i-1);}else{var n=parseInt(part);if(n>=1&&n<=max)out.add(n-1);}});return Array.from(out).sort(function(a,b){return a-b;});}
window.pdfMove=function(i,d){var j=i+d;if(j<0||j>=files.length)return;var t=files[i];files[i]=files[j];files[j]=t;render();};
window.pdfRemoveFile=function(i){files.splice(i,1);render();};

/* ---------- build the shell into #pdfApp ---------- */
function buildGridHTML(){
  return Object.keys(TOOLS).map(function(k){
    var t=TOOLS[k];
    var badge=t.badge?'<span class="tbbadge tbbg-green">'+t.badge+'</span>':'';
    return '<a class="toolbtn" href="/'+t.page+'" data-t="'+k+'">'
      +badge
      +'<span class="tbicon tbic-'+t.ic+'">'+t.icon+'</span>'
      +'<span class="tbname">'+(t.tab||t.title)+'</span>'
      +'<span class="tbdesc">'+(t.sdesc||'')+'</span>'
      +'</a>';
  }).join('');
}

function buildShell(){
  var html='';
  if(!single){
    html+='<div class="toolsearch"><div class="searchrow"><input type="text" id="toolSearch" placeholder="🔍 Search tools — e.g. make my PDF smaller" autocomplete="off"><button type="button" class="choosebtn" id="chooseFiles">📂 Choose files</button></div><div class="searchhits" id="searchHits"></div></div>';
    html+='<input type="file" id="homePicker" class="pdfhidden" multiple accept="application/pdf,image/jpeg,image/png">';
    html+='<div class="recent pdfhidden" id="recent"></div>';
    html+='<div class="dropsuggest pdfhidden" id="dropSuggest"></div>';
    html+='<div class="toolgrid" id="toolgrid">'+buildGridHTML()+'</div>';
  }
  html+='<div id="toolPane"'+(single?'':' class="pdfhidden"')+'>'
    +(single?'':'<button class="toolback" id="toolBack">← All tools</button>')
    +'<div class="pdfcard">'
    +'<div class="toolhead" id="toolTitle"></div>'
    +'<div class="tooldesc" id="toolDesc"></div>'
    +'<div class="drop" id="drop"><b>Drop files here</b> or click to choose<br><span id="accepthint"></span></div>'
    +'<input type="file" id="picker" class="pdfhidden" multiple>'
    +'<ul class="files" id="fileList"></ul>'
    +'<div id="optsMount"></div>'
    +'<div id="customUI" class="pdfhidden"></div>'
    +'<button class="go" id="go" disabled>Add files to start</button>'
    +'<div class="status" id="status"></div>'
    +'<div class="pdfresult pdfhidden" id="pdfresult"></div>'
    +'<button class="againbtn pdfhidden" id="again" type="button">↺ Process another file</button>'
    +'</div></div>';
  mount.innerHTML=html;
}

function showGrid(){
  var g=$('toolgrid'), p=$('toolPane');
  if(g) g.classList.remove('pdfhidden');
  if(p) p.classList.add('pdfhidden');
  files=[]; customState={}; hideSuggest(); renderRecent();
}

function setTool(t){
  current=t; files=[]; customState={}; recentAdd(t);
  var _ag=$('again'); if(_ag) _ag.classList.add('pdfhidden');
  if(!single){
    var g=$('toolgrid'), p=$('toolPane');
    if(g) g.classList.add('pdfhidden');
    if(p) p.classList.remove('pdfhidden');
    if(g)[].forEach.call(g.children,function(b){b.classList.toggle('on',b.dataset.t===t);});
  }
  var c=TOOLS[t];
  $('toolTitle').textContent=c.title; $('toolDesc').textContent=c.desc;
  $('accepthint').textContent=(c.batch?'One or more files — several are zipped together. ':'')+c.hint; $('picker').accept=c.accept; $('picker').multiple=!!(c.multi||c.batch);
  $('optsMount').innerHTML=c.opts||'';
  var cu=$('customUI'); cu.innerHTML=''; cu.classList.add('pdfhidden');
  $('pdfresult').classList.add('pdfhidden');
  if(t==='protect'){ var pm=$('prMode'); if(pm) pm.addEventListener('change',updateProtectUI); updateProtectUI(); }
  render(); setStatus('');
}

function addFiles(list){
  var c=TOOLS[current], wantPdf=c.accept.indexOf('pdf')>-1;
  function ok(f){ if(c.accept.split(',').indexOf(f.type)>-1) return true; if(!f.type){ return wantPdf ? /\.pdf$/i.test(f.name) : /\.(jpe?g|png)$/i.test(f.name); } return false; }
  var many=c.multi||c.batch;
  for(var i=0;i<list.length;i++){ var f=list[i]; if(ok(f)){ if(!many) files=[]; files.push(f); } }
  if(c.custom){ customState={}; $('customUI').innerHTML=''; }
  render();
}

function render(){
  var ul=$('fileList'); ul.innerHTML='';
  files.forEach(function(f,i){
    var li=document.createElement('li');
    var reorder = (TOOLS[current].multi && files.length>1)
      ? '<button class="mv" onclick="pdfMove('+i+',-1)" title="Move up" aria-label="Move file up">▲</button><button class="mv" onclick="pdfMove('+i+',1)" title="Move down" aria-label="Move file down">▼</button>':'';
    li.innerHTML='<span class="nm">'+escapeHtml(f.name)+'</span><span class="sz">'+fmt(f.size)+'</span>'+reorder+'<button onclick="pdfRemoveFile('+i+')" title="Remove" aria-label="Remove file">✕</button>';
    ul.appendChild(li);
  });
  var go=$('go');
  go.disabled=files.length===0;
  go.textContent=files.length===0?'Add files to start':TOOLS[current].btn;
  var custom=TOOLS[current].custom, cu=$('customUI');
  if(custom && files.length){
    cu.classList.remove('pdfhidden');
    if(custom==='organize' && !customState.built){ buildOrganizeUI(); }
    if(custom==='sign' && !customState.built){ buildSignUI(); }
  } else if(custom){ cu.classList.add('pdfhidden'); }
}

/* ---------- pdf.js / pdf-lib refs (lazy-loaded on first use) ---------- */
var PDFDocument, degrees, StandardFonts, rgb, _libs;
function ensureLibs(){
  if(_libs) return _libs;
  _libs=(async function(){
    if(!window.PDFLib) await loadScript('/vendor/pdf-lib.min.js');
    if(!window.pdfjsLib) await loadScript('/vendor/pdf.min.js');
    PDFDocument=PDFLib.PDFDocument; degrees=PDFLib.degrees; StandardFonts=PDFLib.StandardFonts; rgb=PDFLib.rgb;
    pdfjsLib.GlobalWorkerOptions.workerSrc='/vendor/pdf.worker.min.js';
  })();
  return _libs;
}
function renderPageToJpeg(page,scale,quality){
  var vp=page.getViewport({scale:scale});
  var canvas=document.createElement('canvas'); canvas.width=Math.floor(vp.width); canvas.height=Math.floor(vp.height);
  return page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise.then(function(){
    return new Promise(function(r){canvas.toBlob(function(b){r(b);},'image/jpeg',quality);});
  });
}

/* group pdf.js text items into visual lines by their y position */
function groupTextLines(items){
  var lines=[], cur=null, curY=null;
  items.forEach(function(it){
    if(it.str==null) return;
    if(!it.str){ if(it.hasEOL) curY=null; return; }
    var y=it.transform?Math.round(it.transform[5]):0;
    if(curY===null || Math.abs(y-curY)>3){ cur=[]; lines.push(cur); curY=y; }
    cur.push(it.str);
    if(it.hasEOL) curY=null;
  });
  return lines.map(function(a){ return a.join(' ').replace(/\s+/g,' ').trim(); }).filter(function(s){ return s.length; });
}

/* ---------- batch processing (batch:true tools, >1 file -> one zip) ---------- */
function baseName(f){ return (f.name||'file').replace(/\.[^.]+$/,''); }
async function batchProcess(tool,f){
  var base=baseName(f);
  if(tool==='compress'){
    var inBytes=await f.arrayBuffer(), inSize=inBytes.byteLength, clevel=$('clevel').value;
    if(clevel==='lossless'){
      var d=await PDFDocument.load(inBytes,{updateMetadata:false});
      d.setTitle('');d.setAuthor('');d.setSubject('');d.setKeywords([]);d.setProducer('');d.setCreator('');
      var lo=await d.save({useObjectStreams:true});
      return [{name:base+'-compressed.pdf', bytes: lo.byteLength<inSize?lo:new Uint8Array(inBytes)}];
    }
    var pdf=await pdfjsLib.getDocument({data:inBytes.slice(0)}).promise;
    var preset={strong:{scale:1.0,q:0.5},balanced:{scale:1.5,q:0.72},light:{scale:2.0,q:0.85}}[clevel];
    var out=await PDFDocument.create();
    for(var n=1;n<=pdf.numPages;n++){ var page=await pdf.getPage(n); var ptVp=page.getViewport({scale:1}); var blob=await renderPageToJpeg(page,preset.scale,preset.q); var img=await out.embedJpg(await blob.arrayBuffer()); var pg=out.addPage([ptVp.width,ptVp.height]); pg.drawImage(img,{x:0,y:0,width:ptVp.width,height:ptVp.height}); }
    var ob=await out.save();
    return [{name:base+'-compressed.pdf', bytes: ob.byteLength<inSize?ob:new Uint8Array(inBytes)}];
  }
  if(tool==='rotate'){
    var src=await PDFDocument.load(await f.arrayBuffer()); var a=parseInt($('angle').value);
    src.getPages().forEach(function(p){var cur=p.getRotation().angle; p.setRotation(degrees((cur+a)%360));});
    return [{name:base+'-rotated.pdf', bytes:await src.save()}];
  }
  if(tool==='pdf2img'||tool==='pdf2png'){
    var png=tool==='pdf2png'; var data=await f.arrayBuffer(); var pdf2=await pdfjsLib.getDocument({data:data}).promise; var scale=parseFloat($('scale').value); var res=[];
    for(var m=1;m<=pdf2.numPages;m++){ var p2=await pdf2.getPage(m); var vp=p2.getViewport({scale:scale}); var canvas=document.createElement('canvas'); canvas.width=vp.width; canvas.height=vp.height; await p2.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise; var type=png?'image/png':'image/jpeg'; var blob2=await new Promise(function(r){canvas.toBlob(r,type,0.92);}); res.push({name:base+'/page-'+m+'.'+(png?'png':'jpg'), bytes:new Uint8Array(await blob2.arrayBuffer())}); }
    return res;
  }
  if(tool==='pagenum'){
    var s1=await PDFDocument.load(await f.arrayBuffer()); var fnt=await s1.embedFont(StandardFonts.Helvetica);
    var pos=$('pnPos').value, fmtv=$('pnFmt').value, start=parseInt($('pnStart').value)||0;
    var pgs=s1.getPages(), total=pgs.length;
    pgs.forEach(function(p,i){ var num=start+i; var label = fmtv==='n_of' ? num+' / '+(start+total-1) : fmtv==='page_n' ? 'Page '+num : ''+num; var size=11, w=fnt.widthOfTextAtSize(label,size), width=p.getSize().width; var x = pos==='br'? width-w-36 : pos==='bl'? 36 : (width-w)/2; p.drawText(label,{x:x,y:24,size:size,font:fnt,color:rgb(.25,.28,.35)}); });
    return [{name:base+'-numbered.pdf', bytes:await s1.save()}];
  }
  if(tool==='watermark'){
    var text=($('wmText').value||'CONFIDENTIAL').trim(); var opacity=parseFloat($('wmOpacity').value);
    var s2=await PDFDocument.load(await f.arrayBuffer()); var fnt2=await s2.embedFont(StandardFonts.HelveticaBold);
    s2.getPages().forEach(function(p){ var sz=p.getSize(), width=sz.width, height=sz.height; var size=Math.min(width,height)/Math.max(6,text.length)*1.6; var w=fnt2.widthOfTextAtSize(text,size); p.drawText(text,{x:width/2 - w/2*Math.cos(Math.PI/4), y:height/2 - w/2*Math.sin(Math.PI/4), size:size,font:fnt2,color:rgb(.5,.5,.5),opacity:opacity,rotate:degrees(45)}); });
    return [{name:base+'-watermarked.pdf', bytes:await s2.save()}];
  }
  if(tool==='metadata'){
    var s3=await PDFDocument.load(await f.arrayBuffer(),{updateMetadata:false});
    s3.setTitle('');s3.setAuthor('');s3.setSubject('');s3.setKeywords([]);s3.setProducer('');s3.setCreator('');
    return [{name:base+'-no-metadata.pdf', bytes:await s3.save()}];
  }
  return [];
}
async function runBatch(){
  var outputs=[];
  for(var i=0;i<files.length;i++){ setStatus('Processing '+(i+1)+' of '+files.length+': '+files[i].name+'…'); try{ outputs=outputs.concat(await batchProcess(current,files[i])); }catch(e){ console.error(e); setStatus('Skipped '+files[i].name+' ('+e.message+') — continuing…','err'); } }
  if(!outputs.length){ setStatus('None of the files could be processed.','err'); return; }
  setStatus('Zipping '+outputs.length+' file(s)…');
  var fz=await ensureFflate();
  var zobj={}; outputs.forEach(function(o){ var nm=o.name, k=1; while(zobj[nm]){ nm=o.name.replace(/(\.[^.]+)$/, '-'+(k++)+'$1'); if(nm===o.name) nm=o.name+'-'+(k++); } zobj[nm]=(o.bytes instanceof Uint8Array)?o.bytes:new Uint8Array(o.bytes); });
  var zipped=fz.zipSync(zobj,{level:0});
  pdfDownload(zipped,'meldpdf-'+current+'.zip','application/zip');
  setStatus('✓ Processed '+files.length+' file(s) → meldpdf-'+current+'.zip ('+outputs.length+' output'+(outputs.length===1?'':'s')+').','ok');
}

/* ---------- run ---------- */
async function run(){
  await ensureLibs();
  if(TOOLS[current].batch && files.length>1){ return runBatch(); }
  if(current==='merge'){
    var out=await PDFDocument.create();
    for(const f of files){ var src=await PDFDocument.load(await f.arrayBuffer()); var pages=await out.copyPages(src,src.getPageIndices()); pages.forEach(function(p){out.addPage(p);}); }
    pdfDownload(await out.save(),'merged.pdf','application/pdf'); setStatus('✓ Merged '+files.length+' files.','ok');
  }
  else if(current==='split'){
    var src=await PDFDocument.load(await files[0].arrayBuffer());
    var idx=parseRanges($('ranges').value,src.getPageCount());
    if(!idx.length){setStatus('Enter valid page numbers (e.g. 1-3, 5).','err');return;}
    var out=await PDFDocument.create(); var pages=await out.copyPages(src,idx); pages.forEach(function(p){out.addPage(p);});
    pdfDownload(await out.save(),'extracted.pdf','application/pdf'); setStatus('✓ Extracted '+idx.length+' page(s).','ok');
  }
  else if(current==='img2pdf'){
    var out=await PDFDocument.create();
    for(const f of files){ var bytes=await f.arrayBuffer(); var img= f.type==='image/png'? await out.embedPng(bytes): await out.embedJpg(bytes); var page=out.addPage([img.width,img.height]); page.drawImage(img,{x:0,y:0,width:img.width,height:img.height}); }
    pdfDownload(await out.save(),'images.pdf','application/pdf'); setStatus('✓ Created PDF from '+files.length+' image(s).','ok');
  }
  else if(current==='rotate'){
    var src=await PDFDocument.load(await files[0].arrayBuffer()); var a=parseInt($('angle').value);
    src.getPages().forEach(function(p){var cur=p.getRotation().angle; p.setRotation(degrees((cur+a)%360));});
    pdfDownload(await src.save(),'rotated.pdf','application/pdf'); setStatus('✓ Rotated all pages by '+a+'°.','ok');
  }
  else if(current==='delete'){
    var src=await PDFDocument.load(await files[0].arrayBuffer()); var total=src.getPageCount();
    var del=new Set(parseRanges($('delRanges').value,total));
    if(!del.size){setStatus('Enter valid page numbers to delete (e.g. 2, 5-7).','err');return;}
    if(del.size>=total){setStatus('That would delete every page — nothing to save.','err');return;}
    var keep=[]; for(var i=0;i<total;i++) if(!del.has(i)) keep.push(i);
    var out=await PDFDocument.create(); var pages=await out.copyPages(src,keep); pages.forEach(function(p){out.addPage(p);});
    pdfDownload(await out.save(),'pages-deleted.pdf','application/pdf'); setStatus('✓ Deleted '+del.size+' page(s), kept '+keep.length+'.','ok');
  }
  else if(current==='pagenum'){
    var src=await PDFDocument.load(await files[0].arrayBuffer()); var font=await src.embedFont(StandardFonts.Helvetica);
    var pos=$('pnPos').value, fmtv=$('pnFmt').value, start=parseInt($('pnStart').value)||0;
    var pages=src.getPages(), total=pages.length;
    pages.forEach(function(p,i){
      var num=start+i;
      var label = fmtv==='n_of' ? num+' / '+(start+total-1) : fmtv==='page_n' ? 'Page '+num : ''+num;
      var size=11, w=font.widthOfTextAtSize(label,size), width=p.getSize().width;
      var x = pos==='br'? width-w-36 : pos==='bl'? 36 : (width-w)/2;
      p.drawText(label,{x:x,y:24,size:size,font:font,color:rgb(.25,.28,.35)});
    });
    pdfDownload(await src.save(),'numbered.pdf','application/pdf'); setStatus('✓ Added page numbers to '+total+' page(s).','ok');
  }
  else if(current==='watermark'){
    var text=($('wmText').value||'CONFIDENTIAL').trim(); var opacity=parseFloat($('wmOpacity').value);
    var src=await PDFDocument.load(await files[0].arrayBuffer()); var font=await src.embedFont(StandardFonts.HelveticaBold);
    src.getPages().forEach(function(p){
      var s=p.getSize(), width=s.width, height=s.height;
      var size=Math.min(width,height)/Math.max(6,text.length)*1.6;
      var w=font.widthOfTextAtSize(text,size);
      p.drawText(text,{x:width/2 - w/2*Math.cos(Math.PI/4), y:height/2 - w/2*Math.sin(Math.PI/4), size:size,font:font,color:rgb(.5,.5,.5),opacity:opacity,rotate:degrees(45)});
    });
    pdfDownload(await src.save(),'watermarked.pdf','application/pdf'); setStatus('✓ Watermarked '+src.getPageCount()+' page(s).','ok');
  }
  else if(current==='extract'){
    var data=await files[0].arrayBuffer(); var pdf=await pdfjsLib.getDocument({data:data}).promise; var all='';
    for(var n=1;n<=pdf.numPages;n++){ setStatus('Reading page '+n+' of '+pdf.numPages+'…'); var page=await pdf.getPage(n); var tc=await page.getTextContent(); all += tc.items.map(function(it){return it.str;}).join(' ')+'\n\n'; }
    var words=(all.trim().match(/\S+/g)||[]).length, chars=all.replace(/\s/g,'').length;
    pdfDownload(new Blob([all],{type:'text/plain'}),'extracted-text.txt','text/plain'); setStatus('✓ Extracted text from '+pdf.numPages+' page(s).','ok');
    showResult('<b>Done.</b> '+pdf.numPages+' pages · '+words.toLocaleString()+' words · '+chars.toLocaleString()+' characters.'+(words===0?'<br>No selectable text found — this looks like a scanned/image PDF (try OCR).':''));
  }
  else if(current==='compress'){
    var clevel=$('clevel').value;
    var inBytes=await files[0].arrayBuffer(); var inSize=inBytes.byteLength;
    if(clevel==='lossless'){
      setStatus('Rebuilding file structure (keeping text)…');
      var ldoc=await PDFDocument.load(inBytes,{updateMetadata:false});
      ldoc.setTitle('');ldoc.setAuthor('');ldoc.setSubject('');ldoc.setKeywords([]);ldoc.setProducer('');ldoc.setCreator('');
      var lout=await ldoc.save({useObjectStreams:true}); var lsize=lout.byteLength;
      if(lsize>=inSize){ setStatus("This PDF is already compact — a lossless pass can't make it smaller without rasterising.",'err'); showResult('Original: <b>'+fmt(inSize)+'</b> · Lossless attempt: '+fmt(lsize)+' (no gain). For a real size cut, switch to <b>Balanced</b> or <b>Strong</b> — those rasterise pages, so text becomes non-selectable.'); return; }
      var lpct=Math.round((1-lsize/inSize)*100);
      pdfDownload(lout,'compressed.pdf','application/pdf'); setStatus('✓ Compressed losslessly — text stays selectable.','ok');
      if(lpct<3){ showResult('Original: '+fmt(inSize)+' → New: <b>'+fmt(lsize)+'</b> · only <b>'+lpct+'% smaller</b>. Lossless only trims structure, so the gain is small here. For a bigger cut try <b>Balanced</b> or <b>Strong</b> (they rasterise pages, so text is no longer selectable).'); }
      else { showResult('Original: '+fmt(inSize)+' → New: <b>'+fmt(lsize)+'</b> · <b>'+lpct+'% smaller</b>. Text and links stay selectable.'); }
      return;
    }
    var pdf=await pdfjsLib.getDocument({data:inBytes.slice(0)}).promise;
    var preset={strong:{scale:1.0,q:0.5},balanced:{scale:1.5,q:0.72},light:{scale:2.0,q:0.85}}[clevel];
    var out=await PDFDocument.create();
    for(var n=1;n<=pdf.numPages;n++){ setStatus('Compressing page '+n+' of '+pdf.numPages+'…'); var page=await pdf.getPage(n); var ptVp=page.getViewport({scale:1}); var blob=await renderPageToJpeg(page,preset.scale,preset.q); var img=await out.embedJpg(await blob.arrayBuffer()); var pg=out.addPage([ptVp.width,ptVp.height]); pg.drawImage(img,{x:0,y:0,width:ptVp.width,height:ptVp.height}); }
    var outBytes=await out.save(), outSize=outBytes.byteLength;
    if(outSize>=inSize){ setStatus("This PDF is already well optimised — the compressed version isn't smaller, so the original is best.",'err'); showResult('Original: <b>'+fmt(inSize)+'</b> · Compressed attempt: '+fmt(outSize)+' (no gain). Try a stronger level, or your file is mostly text and already small.'); return; }
    pdfDownload(outBytes,'compressed.pdf','application/pdf'); var pct=Math.round((1-outSize/inSize)*100);
    setStatus('✓ Compressed successfully.','ok'); showResult('Original: '+fmt(inSize)+' → New: <b>'+fmt(outSize)+'</b> · <b>'+pct+'% smaller</b>.');
  }
  else if(current==='pdf2img'||current==='pdf2png'){
    var png=current==='pdf2png'; var data=await files[0].arrayBuffer(); var pdf=await pdfjsLib.getDocument({data:data}).promise; var scale=parseFloat($('scale').value);
    for(var n=1;n<=pdf.numPages;n++){ setStatus('Rendering page '+n+' of '+pdf.numPages+'…'); var page=await pdf.getPage(n); var vp=page.getViewport({scale:scale}); var canvas=document.createElement('canvas'); canvas.width=vp.width; canvas.height=vp.height; await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise; var type=png?'image/png':'image/jpeg'; var blob=await new Promise(function(r){canvas.toBlob(r,type,0.92);}); pdfDownload(blob,'page-'+n+'.'+(png?'png':'jpg'),type); }
    setStatus('✓ Exported '+pdf.numPages+' page(s) as '+(png?'PNG':'JPG')+'.','ok');
  }
  else if(current==='metadata'){
    var src=await PDFDocument.load(await files[0].arrayBuffer(),{updateMetadata:false});
    var g=function(fn){try{var v=fn();return v==null?'':(''+v);}catch(e){return '';}};
    var meta={Title:g(function(){return src.getTitle();}),Author:g(function(){return src.getAuthor();}),Subject:g(function(){return src.getSubject();}),Keywords:g(function(){return src.getKeywords();}),Creator:g(function(){return src.getCreator();}),Producer:g(function(){return src.getProducer();}),Created:g(function(){return src.getCreationDate()&&src.getCreationDate().toISOString();}),Modified:g(function(){return src.getModificationDate()&&src.getModificationDate().toISOString();})};
    var any=Object.keys(meta).some(function(k){return meta[k];});
    var rows=Object.keys(meta).map(function(k){var v=meta[k];return '<div><b style="color:var(--soft)">'+k+':</b> '+(v?escapeHtml(v):'<i style="opacity:.6">—</i>')+'</div>';}).join('');
    src.setTitle('');src.setAuthor('');src.setSubject('');src.setKeywords([]);src.setProducer('');src.setCreator('');
    pdfDownload(await src.save(),'no-metadata.pdf','application/pdf'); setStatus('✓ Downloaded a clean copy with metadata removed.','ok');
    showResult('<b>Metadata found'+(any?'':' — none')+' (stripped from your download):</b><br>'+rows+'<div style="margin-top:6px">Pages: '+src.getPageCount()+'</div>');
  }
  else if(current==='pdf2word'){
    var data=await files[0].arrayBuffer(); var pdf=await pdfjsLib.getDocument({data:data}).promise;
    setStatus('Loading Word engine…'); var D=await ensureDocx();
    var children=[], words=0;
    for(var n=1;n<=pdf.numPages;n++){
      setStatus('Reading page '+n+' of '+pdf.numPages+'…');
      var page=await pdf.getPage(n); var tc=await page.getTextContent();
      var lines=groupTextLines(tc.items);
      lines.forEach(function(line){ words+=(line.match(/\S+/g)||[]).length; children.push(new D.Paragraph({children:[new D.TextRun(line)]})); });
      if(n<pdf.numPages) children.push(new D.Paragraph({children:[new D.PageBreak()]}));
    }
    if(!children.length) children.push(new D.Paragraph({children:[new D.TextRun('')]}));
    var docFile=new D.Document({sections:[{children:children}]});
    var blob=await D.Packer.toBlob(docFile);
    pdfDownload(blob,'converted.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document'); setStatus('✓ Converted to Word (.docx).','ok');
    showResult('<b>Done.</b> '+pdf.numPages+' pages · ~'+words.toLocaleString()+' words. Opens in Word, Google Docs or LibreOffice with no compatibility warning. This keeps the <b>text</b> only — original layout, columns and images are not reproduced.'+(words===0?'<br>No selectable text found — for a scanned PDF, run OCR first.':''));
  }
  else if(current==='organize'){
    var order=customState.order.filter(function(o){return !o.del;});
    if(!order.length){setStatus('Every page is marked for removal — nothing to save.','err');return;}
    var src=await PDFDocument.load(customState.bytes.slice(0)); var out=await PDFDocument.create();
    var copied=await out.copyPages(src, order.map(function(o){return o.idx;}));
    copied.forEach(function(pg,i){ var rot=order[i].rot||0; if(rot){var cur=pg.getRotation().angle; pg.setRotation(degrees(((cur+rot)%360+360)%360));} out.addPage(pg); });
    pdfDownload(await out.save(),'organized.pdf','application/pdf'); setStatus('✓ Saved '+order.length+' page(s) in the new order.','ok');
  }
  else if(current==='sign'){
    var sig=customState.sigDataUrl; if(!sig){setStatus('Draw a signature or upload an image first.','err');return;}
    var src=await PDFDocument.load(await files[0].arrayBuffer()); var pages=src.getPages();
    var png=await src.embedPng(await(await fetch(sig)).arrayBuffer());
    var sel=$('sigPage').value; var targets = sel==='all'? pages : sel==='last'? [pages[pages.length-1]] : [pages[0]];
    var pos=$('sigPos').value, wRatio=0.30, m=28;
    targets.forEach(function(p){ var s=p.getSize(), width=s.width, height=s.height; var w=width*wRatio, h=w*(png.height/png.width); var x=pos.indexOf('r')>-1? width-w-m : pos.indexOf('l')>-1? m : (width-w)/2; var y=pos.indexOf('t')>-1? height-h-m : m; p.drawImage(png,{x:x,y:y,width:w,height:h}); });
    pdfDownload(await src.save(),'signed.pdf','application/pdf'); setStatus('✓ Signature placed on '+targets.length+' page(s).','ok');
  }
  else if(current==='ocr'){
    var lang=$('ocrLang').value; setStatus('Loading OCR engine (first run downloads the language model)…');
    var worker=await loadTesseract(lang); var text=''; var f=files[0];
    if(f.type.indexOf('image/')===0||/\.(jpe?g|png)$/i.test(f.name)){ setStatus('Recognising text…'); text=(await worker.recognize(f)).data.text; }
    else { var data=await f.arrayBuffer(); var pdf=await pdfjsLib.getDocument({data:data}).promise; for(var n=1;n<=pdf.numPages;n++){ setStatus('OCR page '+n+' of '+pdf.numPages+'…'); var page=await pdf.getPage(n); var vp=page.getViewport({scale:2}); var canvas=document.createElement('canvas'); canvas.width=vp.width; canvas.height=vp.height; await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise; text += (await worker.recognize(canvas)).data.text + '\n\n'; } }
    await worker.terminate(); var words=(text.trim().match(/\S+/g)||[]).length;
    pdfDownload(new Blob([text],{type:'text/plain'}),'ocr-text.txt','text/plain'); setStatus('✓ OCR complete.','ok');
    showResult('<b>Done.</b> ~'+words.toLocaleString()+' words recognised and saved as a text file.');
  }
  else if(current==='protect'){
    var mode=$('prMode').value, pass=$('prPass').value; if(!pass){setStatus('Enter a password.','err');return;}
    var bytes=new Uint8Array(await files[0].arrayBuffer()); setStatus('Loading security engine (first run downloads it)…');
    if(mode==='lock'){ var out=await qpdfRun(['--encrypt',pass,pass,'256','--','in.pdf','out.pdf'],bytes); pdfDownload(out,'protected.pdf','application/pdf'); setStatus('✓ Password added. Keep it safe — it can’t be recovered.','ok'); }
    else { var out2=await qpdfRun(['--decrypt','--password='+pass,'in.pdf','out.pdf'],bytes); pdfDownload(out2,'unlocked.pdf','application/pdf'); setStatus('✓ Password removed.','ok'); }
  }
}

/* ---------- organize + sign custom UIs ---------- */
async function buildOrganizeUI(){
  customState.built=true; customState._map=new Map();
  var cu=$('customUI'); cu.innerHTML='<div class="tooldesc">Loading pages…</div>';
  await ensureLibs();
  var bytes=await files[0].arrayBuffer(); customState.bytes=bytes;
  var pdf=await pdfjsLib.getDocument({data:bytes.slice(0)}).promise; customState.order=[];
  cu.innerHTML='';
  var hint=document.createElement('div'); hint.className='tooldesc'; hint.innerHTML='Drag pages to reorder · <b>⟳</b> rotate · <b>✕</b> remove/restore.';
  var grid=document.createElement('div'); grid.className='thumbgrid'; cu.appendChild(hint); cu.appendChild(grid);
  var rebuild=function(){ customState.order=[].map.call(grid.children,function(c){return customState._map.get(c);}); };
  for(var n=1;n<=pdf.numPages;n++){
    var o={idx:n-1,rot:0,del:false}; customState.order.push(o);
    var cell=document.createElement('div'); cell.className='thumb'; cell.draggable=true;
    var page=await pdf.getPage(n); var vp=page.getViewport({scale:0.32});
    var cv=document.createElement('canvas'); cv.width=vp.width; cv.height=vp.height;
    await page.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise; cell.appendChild(cv);
    var pg=document.createElement('div'); pg.className='pg'; pg.textContent='Page '+n; cell.appendChild(pg);
    var acts=document.createElement('div'); acts.className='acts';
    var rb=document.createElement('button'); rb.textContent='⟳'; rb.title='Rotate'; rb.setAttribute('aria-label','Rotate page '+n);
    var db=document.createElement('button'); db.textContent='✕'; db.title='Remove / restore'; db.setAttribute('aria-label','Remove or restore page '+n);
    acts.appendChild(rb); acts.appendChild(db); cell.appendChild(acts);
    (function(o,cv,cell,rb,db){
      rb.onclick=function(e){e.stopPropagation(); o.rot=(o.rot+90)%360; cv.style.transform='rotate('+o.rot+'deg)';};
      db.onclick=function(e){e.stopPropagation(); o.del=!o.del; cell.classList.toggle('del',o.del);};
    })(o,cv,cell,rb,db);
    cell.addEventListener('dragstart',function(){customState.dragEl=this; this.classList.add('dragging');});
    cell.addEventListener('dragend',function(){this.classList.remove('dragging'); [].forEach.call(grid.children,function(c){c.classList.remove('over');});});
    cell.addEventListener('dragover',function(e){e.preventDefault(); this.classList.add('over');});
    cell.addEventListener('dragleave',function(){this.classList.remove('over');});
    cell.addEventListener('drop',function(e){e.preventDefault(); this.classList.remove('over'); var from=customState.dragEl; if(!from||from===this)return; var kids=[].slice.call(grid.children); if(kids.indexOf(from)<kids.indexOf(this)) grid.insertBefore(from,this.nextSibling); else grid.insertBefore(from,this); rebuild();});
    customState._map.set(cell,o); grid.appendChild(cell);
  }
}

function buildSignUI(){
  customState.built=true;
  $('customUI').innerHTML='<div class="tooldesc">Draw your signature below (or upload a PNG/JPG), then choose where to place it.</div>'
    +'<canvas class="sigpad" id="sigPad" width="440" height="180"></canvas>'
    +'<div class="sigrow"><button type="button" id="sigClear" style="border:1.5px solid var(--line);background:var(--card);border-radius:8px;padding:9px 14px;cursor:pointer;color:var(--ink);font-weight:600">Clear</button>'
    +'<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:var(--brand);font-weight:600"><input type="file" id="sigUpload" accept="image/png,image/jpeg" class="pdfhidden"><span>Upload image instead</span></label>'
    +'<div><label>Place on</label><select id="sigPage"><option value="first">First page</option><option value="last">Last page</option><option value="all">All pages</option></select></div>'
    +'<div><label>Position</label><select id="sigPos"><option value="br">Bottom right</option><option value="bl">Bottom left</option><option value="bc">Bottom center</option><option value="tr">Top right</option><option value="tl">Top left</option></select></div></div>';
  var pad=$('sigPad'), ctx=pad.getContext('2d');
  ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#0a0a2a';
  var drawing=false,last=null;
  var at=function(e){var r=pad.getBoundingClientRect();return {x:(e.clientX-r.left)*(pad.width/r.width),y:(e.clientY-r.top)*(pad.height/r.height)};};
  pad.addEventListener('pointerdown',function(e){e.preventDefault();drawing=true;last=at(e);pad.setPointerCapture(e.pointerId);});
  pad.addEventListener('pointermove',function(e){if(!drawing)return;e.preventDefault();var p=at(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;customState.sigDataUrl=pad.toDataURL('image/png');});
  pad.addEventListener('pointerup',function(){drawing=false;});
  $('sigClear').onclick=function(){ctx.clearRect(0,0,pad.width,pad.height);customState.sigDataUrl=null;};
  $('sigUpload').onchange=function(e){var f=e.target.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){var img=new Image();img.onload=function(){ctx.clearRect(0,0,pad.width,pad.height);var s=Math.min(pad.width/img.width,pad.height/img.height);ctx.drawImage(img,0,0,img.width*s,img.height*s);customState.sigDataUrl=pad.toDataURL('image/png');};img.src=rd.result;};rd.readAsDataURL(f);};
}

function updateProtectUI(){
  var mode=$('prMode').value;
  $('prPassLabel').textContent = mode==='lock'?'New password':'Current password';
  $('prPass').placeholder = mode==='lock'?'Choose a password':"The PDF’s current password";
}

/* ---------- lazy engines ---------- */
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('Could not load '+src));};document.head.appendChild(s);});}
var _tess;
async function loadTesseract(lang){ if(!_tess){ await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'); _tess=true; } return await Tesseract.createWorker(lang); }
async function ensureFflate(){ if(!window.fflate){ await loadScript('/vendor/fflate.min.js'); } return window.fflate; }
async function ensureDocx(){ if(!window.docx){ await loadScript('/vendor/docx.min.js'); } return window.docx; }
var QPDF_BASE='https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.0/dist/';
var _qpdfFactory;
async function qpdfRun(args,bytes){
  if(!_qpdfFactory){ await loadScript(QPDF_BASE+'qpdf.js'); _qpdfFactory=window.Module; }
  var qpdf=await _qpdfFactory({locateFile:function(){return QPDF_BASE+'qpdf.wasm';},noInitialRun:true,print:function(){},printErr:function(){}});
  qpdf.FS.writeFile('in.pdf',bytes);
  var code=0; try{ code=qpdf.callMain(args); }catch(e){ code=(e&&e.status!=null)?e.status:1; }
  if(code&&code!==3){ throw new Error($('prMode').value==='unlock' ? "Could not remove the password — check that it’s correct." : 'The security engine reported an error (code '+code+').'); }
  var out; try{ out=qpdf.FS.readFile('out.pdf'); }catch(e){ throw new Error('No output was produced — the password may be wrong.'); }
  return out;
}

/* ---------- search (full mode only) ---------- */
function searchTools(q){ q=q.toLowerCase().trim(); if(!q) return []; return Object.keys(TOOLS).map(function(t){ var c=TOOLS[t]; var hay=(t+' '+c.title+' '+c.desc+' '+(c.kw||'')).toLowerCase(); var score=0; q.split(/\s+/).forEach(function(w){ if(w && hay.indexOf(w)>-1) score += hay.indexOf(w)<40?2:1; }); return {t:t,c:c,score:score}; }).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,5); }

/* ---------- drop-anywhere suggestions (full mode) ---------- */
function isPdfFile(f){ return f.type==='application/pdf' || (!f.type && /\.pdf$/i.test(f.name)) || /\.pdf$/i.test(f.name); }
function isImgFile(f){ return /^image\/(jpeg|png)$/.test(f.type) || /\.(jpe?g|png)$/i.test(f.name); }
function toolAcceptsFile(t,f){
  if(t.accept.split(',').indexOf(f.type)>-1) return true;
  var wantsPdf=t.accept.indexOf('pdf')>-1, wantsImg=t.accept.indexOf('image/')>-1;
  if(isPdfFile(f) && wantsPdf) return true;
  if(isImgFile(f) && wantsImg) return true;
  return false;
}
function suggestKeys(arr){
  var pdfs=arr.filter(isPdfFile), imgs=arr.filter(isImgFile), order;
  if(imgs.length && !pdfs.length) order=['img2pdf','ocr'];
  else if(pdfs.length && !imgs.length) order = pdfs.length>1
    ? ['merge','compress','split','rotate','organize','protect','pdf2img','pdf2png','pagenum','watermark','extract','pdf2word','metadata','delete']
    : ['compress','split','rotate','organize','protect','delete','pagenum','watermark','sign','pdf2img','pdf2png','pdf2word','extract','metadata','ocr'];
  else order=['merge','img2pdf'];
  return order.filter(function(k){ return arr.every(function(f){ return toolAcceptsFile(TOOLS[k],f); }); }).slice(0,6);
}
function showSuggest(list){
  var arr=[].slice.call(list).filter(function(f){ return isPdfFile(f)||isImgFile(f); });
  var panel=$('dropSuggest'); if(!panel) return;
  if(!arr.length){ setStatus(''); return; }
  pending=arr;
  var keys=suggestKeys(arr);
  var name=arr.length===1?arr[0].name:arr.length+' files';
  var chips=keys.map(function(k){ var t=TOOLS[k]; return '<button class="sgchip" data-sg="'+k+'"><span class="sgi tbic-'+t.ic+'">'+t.icon+'</span>'+(t.tab||t.title)+'</button>'; }).join('');
  panel.innerHTML='<div class="sghead">What do you want to do with <b>'+escapeHtml(name)+'</b>?<button class="sgx" id="sgClose" aria-label="Dismiss suggestions">✕</button></div><div class="sgchips">'+chips+'</div>';
  panel.classList.remove('pdfhidden');
  panel.scrollIntoView({block:'nearest'});
}
function hideSuggest(){ var p=$('dropSuggest'); if(p){ p.classList.add('pdfhidden'); p.innerHTML=''; } pending=[]; }

/* ---------- recently used tools (localStorage) ---------- */
function recentGet(){ try{ return (JSON.parse(localStorage.getItem('meld_recent')||'[]')||[]).filter(function(k){return Object.prototype.hasOwnProperty.call(TOOLS,k);}); }catch(e){ return []; } }
function recentAdd(t){ try{ var a=recentGet().filter(function(k){return k!==t;}); a.unshift(t); localStorage.setItem('meld_recent',JSON.stringify(a.slice(0,3))); }catch(e){} }
function renderRecent(){ var el=$('recent'); if(!el) return; var a=recentGet(); if(!a.length){ el.classList.add('pdfhidden'); el.innerHTML=''; return; } el.classList.remove('pdfhidden'); el.innerHTML='<span class="reclbl">Recently used</span>'+a.map(function(k){ var t=TOOLS[k]; return '<a class="recchip" href="/'+t.page+'" data-r="'+k+'"><span class="sgi tbic-'+t.ic+'">'+t.icon+'</span>'+(t.tab||t.title)+'</a>'; }).join(''); }

/* ---------- clear the tool for another file, without leaving it ---------- */
function processAnother(){ files=[]; customState={}; var cu=$('customUI'); if(cu){ cu.innerHTML=''; cu.classList.add('pdfhidden'); } var r=$('pdfresult'); if(r){ r.classList.add('pdfhidden'); r.innerHTML=''; } setStatus(''); var ag=$('again'); if(ag) ag.classList.add('pdfhidden'); render(); }

/* ---------- boot ---------- */
function boot(){
  mount=$('pdfApp'); if(!mount) return;
  single = mount.hasAttribute('data-tool');
  buildShell();

  // Warm the PDF libraries as soon as the user shows intent (hover/touch the drop zone),
  // so they're ready by the time a file is added — keeps them off the initial load path.
  var warm=function(){ ensureLibs(); $('drop').removeEventListener('pointerenter',warm); $('drop').removeEventListener('touchstart',warm); };
  $('drop').addEventListener('pointerenter',warm); $('drop').addEventListener('touchstart',warm,{passive:true});

  $('drop').onclick=function(){$('picker').click();};
  $('picker').onchange=function(e){addFiles(e.target.files);};
  ['dragover','dragenter'].forEach(function(ev){$('drop').addEventListener(ev,function(e){e.preventDefault();$('drop').classList.add('over');});});
  ['dragleave','drop'].forEach(function(ev){$('drop').addEventListener(ev,function(e){e.preventDefault();$('drop').classList.remove('over');});});
  $('drop').addEventListener('drop',function(e){addFiles(e.dataTransfer.files);});
  $('go').onclick=async function(){ $('go').disabled=true; setStatus('Working…'); $('pdfresult').classList.add('pdfhidden'); var ag=$('again'); if(ag) ag.classList.add('pdfhidden'); try{ await run(); if($('status').classList.contains('ok') && ag) ag.classList.remove('pdfhidden'); } catch(err){ console.error(err); setStatus('Something went wrong: '+err.message,'err'); } finally{ $('go').disabled=files.length===0; } };
  var againBtn=$('again'); if(againBtn) againBtn.addEventListener('click',processAnother);

  if(single){
    var t=mount.getAttribute('data-tool'); if(!TOOLS[t]) t='merge';
    var tp=$('toolPane'); if(tp) tp.classList.remove('pdfhidden');
    setTool(t);
  } else {
    var grid=$('toolgrid'); grid.addEventListener('click',function(e){var b=e.target.closest('.toolbtn');if(!b)return; if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button)return; e.preventDefault(); location.hash=b.dataset.t;});
    renderRecent();
    var rec=$('recent'); if(rec) rec.addEventListener('click',function(e){ var c=e.target.closest('.recchip'); if(!c) return; if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button) return; e.preventDefault(); location.hash=c.dataset.r; });
    var back=$('toolBack'); if(back) back.addEventListener('click',function(){location.hash=''; showGrid();});
    var searchBox=$('toolSearch'), hits=$('searchHits');
    searchBox.addEventListener('input',function(){ var res=searchTools(searchBox.value); hits.innerHTML=res.map(function(x){return '<a href="/'+x.c.page+'" data-go="'+x.t+'">'+x.c.title+' — <span style="color:var(--soft)">'+x.c.desc+'</span></a>';}).join(''); });
    hits.addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(!b)return; if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button)return; e.preventDefault(); location.hash=b.dataset.go; searchBox.value=''; hits.innerHTML=''; searchBox.blur();});
    searchBox.addEventListener('keydown',function(e){if(e.key==='Enter'){var r=searchTools(searchBox.value)[0]; if(r){location.hash=r.t;searchBox.value='';hits.innerHTML='';searchBox.blur();}}});
    document.addEventListener('click',function(e){if(!e.target.closest('.toolsearch'))hits.innerHTML='';});

    // "Choose files" button on the grid -> same suggestion flow as a drop.
    var homePicker=$('homePicker'), chooseBtn=$('chooseFiles');
    if(chooseBtn) chooseBtn.addEventListener('click',function(){ homePicker.value=''; homePicker.click(); });
    if(homePicker) homePicker.addEventListener('change',function(e){ if(e.target.files.length) showSuggest(e.target.files); });

    // Suggestion panel: a chip routes to the tool with the files already added.
    var suggest=$('dropSuggest');
    if(suggest) suggest.addEventListener('click',function(e){
      if(e.target.closest('#sgClose')){ hideSuggest(); return; }
      var chip=e.target.closest('.sgchip'); if(!chip) return;
      var keep=pending; var k=chip.dataset.sg;
      setTool(k); addFiles(keep);
      try{ history.replaceState(null,'','#'+k); }catch(_){}
      var ds=$('dropSuggest'); if(ds){ ds.classList.add('pdfhidden'); ds.innerHTML=''; } pending=[];
    });

    // Drop a file anywhere on the app while the grid is showing.
    var gridVisible=function(){ return !$('toolgrid').classList.contains('pdfhidden'); };
    ['dragover','dragenter'].forEach(function(ev){ mount.addEventListener(ev,function(e){ if(!gridVisible())return; if(e.target.closest('#drop'))return; e.preventDefault(); $('toolgrid').classList.add('dropactive'); }); });
    ['dragleave','dragend'].forEach(function(ev){ mount.addEventListener(ev,function(e){ if(e.relatedTarget && mount.contains(e.relatedTarget))return; $('toolgrid').classList.remove('dropactive'); }); });
    mount.addEventListener('drop',function(e){ if(!gridVisible())return; if(e.target.closest('#drop'))return; e.preventDefault(); $('toolgrid').classList.remove('dropactive'); if(e.dataTransfer&&e.dataTransfer.files.length) showSuggest(e.dataTransfer.files); });
    var validTool=function(t){return Object.prototype.hasOwnProperty.call(TOOLS,t);};
    var fromHash=function(){var h=location.hash.replace('#','');return validTool(h)?h:'';};
    var initHash=fromHash();
    if(initHash){ setTool(initHash); } else { showGrid(); }
    window.addEventListener('hashchange',function(){var h=fromHash(); if(h){setTool(h);} else {showGrid();}});
  }
  var yr=$('yr'); if(yr) yr.textContent=new Date().getFullYear();
  initAds();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
