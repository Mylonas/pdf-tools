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
#toolSearch{width:100%;padding:13px 15px;border:1.5px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);font-size:15px;font-family:inherit}
#toolSearch:focus{outline:none;border-color:var(--brand)}
.searchhits{position:absolute;left:0;right:0;top:calc(100% + 6px);background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;z-index:9;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.searchhits:empty{display:none}
.searchhits button{display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--ink);padding:11px 15px;font-size:14px;cursor:pointer;font-family:inherit}
.searchhits button:hover{background:var(--brand-soft);color:var(--brand)}
.pdftabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
.pdftabs button{border:1.5px solid var(--line);background:var(--card);color:var(--soft);padding:9px 15px;border-radius:22px;font-weight:700;cursor:pointer;font-size:14px}
.pdftabs button.on{border-color:var(--brand);background:var(--brand);color:#fff}
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
  compress:`<div class="opts"><div><label>Compression level</label><select id="clevel"><option value="strong">Strong — smallest file</option><option value="balanced" selected>Balanced — recommended</option><option value="light">Light — best quality</option></select></div><div class="optnote">Rebuilds pages as compressed images. Text becomes non-selectable.</div></div>`,
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
  compress:{title:'Compress PDF',tab:'Compress PDF',desc:'Shrink a PDF for email or upload limits — see the before/after size.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Compress PDF',opts:OPT.compress,kw:'compress reduce shrink smaller size make small mb optimize'},
  merge:{title:'Merge PDF',tab:'Merge PDF',desc:'Combine several PDFs into one. Drag to reorder.',accept:'application/pdf',hint:'PDF files',multi:true,btn:'Merge PDFs',kw:'merge combine join together'},
  split:{title:'Split / Extract pages',tab:'Split / Extract',desc:'Extract specific pages or ranges from a PDF.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Extract pages',opts:OPT.split,kw:'split extract separate pull pages range'},
  delete:{title:'Delete pages',tab:'Delete pages',desc:'Remove specific pages from a PDF.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Delete pages',opts:OPT.delete,kw:'delete remove pages get rid'},
  img2pdf:{title:'Images → PDF',tab:'Images → PDF',desc:'Combine JPG/PNG images into a single PDF.',accept:'image/jpeg,image/png',hint:'JPG or PNG images',multi:true,btn:'Create PDF',kw:'image jpg jpeg png photo picture to pdf'},
  pdf2img:{title:'PDF → JPG',tab:'PDF → JPG',desc:'Export every page of a PDF as a JPG image.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Convert to JPG',opts:OPT.imgq,kw:'pdf to jpg jpeg image convert export'},
  pdf2png:{title:'PDF → PNG',tab:'PDF → PNG',desc:'Export every page of a PDF as a PNG image.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Convert to PNG',opts:OPT.imgq,kw:'pdf to png image convert export transparent'},
  rotate:{title:'Rotate PDF',tab:'Rotate',desc:'Rotate all pages of a PDF.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Rotate PDF',opts:OPT.rotate,kw:'rotate turn sideways upside down orientation landscape portrait'},
  pagenum:{title:'Add page numbers',tab:'Page numbers',desc:'Stamp page numbers onto every page of a PDF.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Add page numbers',opts:OPT.pagenum,kw:'page numbers number pagination'},
  watermark:{title:'Watermark PDF',tab:'Watermark',desc:'Add a diagonal text watermark to every page.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Add watermark',opts:OPT.watermark,kw:'watermark stamp confidential draft mark text overlay'},
  extract:{title:'Extract text',tab:'Extract text',desc:'Pull all text out of a PDF and count pages, words and characters.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Extract text',kw:'extract text copy word count character count read'},
  organize:{title:'Organize pages',tab:'Organize pages',desc:'Reorder (drag), rotate or delete individual pages, then save.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Save organized PDF',custom:'organize',kw:'organize reorder rearrange move sort arrange pages thumbnails manage'},
  sign:{title:'Sign PDF',tab:'Sign PDF',desc:'Draw or upload a signature and place it on a page.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Sign & download',custom:'sign',kw:'sign signature esign electronic autograph initials'},
  pdf2word:{title:'PDF → Word',tab:'PDF → Word',desc:'Extract the text into an editable Word (.doc) document.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Convert to Word',kw:'pdf to word doc docx editable convert microsoft'},
  metadata:{title:'Metadata viewer & remover',tab:'Metadata',desc:'See a PDF’s hidden metadata, and download a clean copy with it stripped.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'View & strip metadata',kw:'metadata properties author title info remove strip clean privacy exif'},
  ocr:{title:'OCR scanned PDF',tab:'OCR (scanned)',desc:'Read text from a scanned or image-only PDF (or an image) using on-device OCR.',accept:'application/pdf,image/jpeg,image/png',hint:'A scanned PDF or image',multi:false,btn:'Run OCR',opts:OPT.ocr,kw:'ocr scanned image searchable recognize text scan optical'},
  protect:{title:'Protect / Unlock PDF',tab:'Protect / Unlock',desc:'Add a password to a PDF, or remove one you know.',accept:'application/pdf',hint:'One PDF file',multi:false,btn:'Apply',opts:OPT.protect,kw:'protect password encrypt lock secure unlock remove password decrypt permissions'}
};

/* ---------- state + helpers ---------- */
var current='merge', files=[], customState={}, single=false, mount=null;
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
function buildShell(){
  var html='';
  if(!single){
    html+='<div class="toolsearch"><input type="text" id="toolSearch" placeholder="🔍 What do you want to do with your PDF? (e.g. “make my PDF smaller”)" autocomplete="off"><div class="searchhits" id="searchHits"></div></div>';
    html+='<div class="pdftabs" id="pdftabs">'+Object.keys(TOOLS).map(function(k){return '<button data-t="'+k+'">'+(TOOLS[k].tab||TOOLS[k].title)+'</button>';}).join('')+'</div>';
  }
  html+='<div class="pdfcard">'
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
    +'</div>';
  mount.innerHTML=html;
}

function setTool(t){
  current=t; files=[]; customState={};
  if(!single){ var tb=$('pdftabs'); if(tb)[].forEach.call(tb.children,function(b){b.classList.toggle('on',b.dataset.t===t);}); }
  var c=TOOLS[t];
  $('toolTitle').textContent=c.title; $('toolDesc').textContent=c.desc;
  $('accepthint').textContent=c.hint; $('picker').accept=c.accept; $('picker').multiple=!!c.multi;
  $('optsMount').innerHTML=c.opts||'';
  var cu=$('customUI'); cu.innerHTML=''; cu.classList.add('pdfhidden');
  $('pdfresult').classList.add('pdfhidden');
  if(t==='protect'){ var pm=$('prMode'); if(pm) pm.addEventListener('change',updateProtectUI); updateProtectUI(); }
  render(); setStatus('');
}

function addFiles(list){
  var c=TOOLS[current], wantPdf=c.accept.indexOf('pdf')>-1;
  function ok(f){ if(c.accept.split(',').indexOf(f.type)>-1) return true; if(!f.type){ return wantPdf ? /\.pdf$/i.test(f.name) : /\.(jpe?g|png)$/i.test(f.name); } return false; }
  for(var i=0;i<list.length;i++){ var f=list[i]; if(ok(f)){ if(!c.multi) files=[]; files.push(f); } }
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

/* ---------- run ---------- */
async function run(){
  await ensureLibs();
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
    var inBytes=await files[0].arrayBuffer(); var inSize=inBytes.byteLength;
    var pdf=await pdfjsLib.getDocument({data:inBytes.slice(0)}).promise;
    var preset={strong:{scale:1.0,q:0.5},balanced:{scale:1.5,q:0.72},light:{scale:2.0,q:0.85}}[$('clevel').value];
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
    var data=await files[0].arrayBuffer(); var pdf=await pdfjsLib.getDocument({data:data}).promise; var paras=[];
    for(var n=1;n<=pdf.numPages;n++){ setStatus('Reading page '+n+' of '+pdf.numPages+'…'); var page=await pdf.getPage(n); var tc=await page.getTextContent(); var line=tc.items.map(function(it){return it.str;}).join(' ').replace(/\s+/g,' ').trim(); if(line) paras.push(line); if(n<pdf.numPages) paras.push(null); }
    var words=(paras.filter(Boolean).join(' ').match(/\S+/g)||[]).length;
    var body=paras.map(function(p){return p===null?'<br clear="all" style="page-break-before:always">':'<p>'+escapeHtml(p)+'</p>';}).join('\n');
    var doc="<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><title>Converted document</title></head><body>"+body+"</body></html>";
    pdfDownload(new Blob(['﻿'+doc],{type:'application/msword'}),'converted.doc','application/msword'); setStatus('✓ Converted to Word (.doc).','ok');
    showResult('<b>Done.</b> '+pdf.numPages+' pages · ~'+words.toLocaleString()+' words. Opens in Word, Google Docs or LibreOffice. This keeps the <b>text</b> only — original layout, columns and images are not reproduced.'+(words===0?'<br>No selectable text found — for a scanned PDF, run OCR first.':''));
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
  $('prPass').placeholder = mode==='lock'?'Choose a password':'The PDF’s current password';
}

/* ---------- lazy engines ---------- */
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('Could not load '+src));};document.head.appendChild(s);});}
var _tess;
async function loadTesseract(lang){ if(!_tess){ await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'); _tess=true; } return await Tesseract.createWorker(lang); }
var QPDF_BASE='https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.0/dist/';
var _qpdfFactory;
async function qpdfRun(args,bytes){
  if(!_qpdfFactory){ await loadScript(QPDF_BASE+'qpdf.js'); _qpdfFactory=window.Module; }
  var qpdf=await _qpdfFactory({locateFile:function(){return QPDF_BASE+'qpdf.wasm';},noInitialRun:true,print:function(){},printErr:function(){}});
  qpdf.FS.writeFile('in.pdf',bytes);
  var code=0; try{ code=qpdf.callMain(args); }catch(e){ code=(e&&e.status!=null)?e.status:1; }
  if(code&&code!==3){ throw new Error($('prMode').value==='unlock' ? 'Could not remove the password — check that it’s correct.' : 'The security engine reported an error (code '+code+').'); }
  var out; try{ out=qpdf.FS.readFile('out.pdf'); }catch(e){ throw new Error('No output was produced — the password may be wrong.'); }
  return out;
}

/* ---------- ads (guarded; runs anywhere .adslot exists) ---------- */
var ADSENSE_CLIENT="";
function initAds(){ if(!ADSENSE_CLIENT) return; var s=document.createElement('script'); s.async=true; s.crossOrigin='anonymous'; s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+ADSENSE_CLIENT; document.head.appendChild(s); document.querySelectorAll('.adslot').forEach(function(slot){ slot.dataset.live='1'; slot.style.display='flex'; slot.textContent=''; var ins=document.createElement('ins'); ins.className='adsbygoogle'; ins.style.display='block'; ins.style.width='100%'; ins.setAttribute('data-ad-client',ADSENSE_CLIENT); ins.setAttribute('data-ad-format','auto'); ins.setAttribute('data-full-width-responsive','true'); slot.appendChild(ins); (window.adsbygoogle=window.adsbygoogle||[]).push({}); }); }

/* ---------- search (full mode only) ---------- */
function searchTools(q){ q=q.toLowerCase().trim(); if(!q) return []; return Object.keys(TOOLS).map(function(t){ var c=TOOLS[t]; var hay=(t+' '+c.title+' '+c.desc+' '+(c.kw||'')).toLowerCase(); var score=0; q.split(/\s+/).forEach(function(w){ if(w && hay.indexOf(w)>-1) score += hay.indexOf(w)<40?2:1; }); return {t:t,c:c,score:score}; }).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,5); }

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
  $('go').onclick=async function(){ $('go').disabled=true; setStatus('Working…'); $('pdfresult').classList.add('pdfhidden'); try{ await run(); } catch(err){ console.error(err); setStatus('Something went wrong: '+err.message,'err'); } finally{ $('go').disabled=files.length===0; } };

  if(single){
    var t=mount.getAttribute('data-tool'); if(!TOOLS[t]) t='merge';
    setTool(t);
  } else {
    var tb=$('pdftabs'); [].forEach.call(tb.children,function(b){ b.onclick=function(){ setTool(b.dataset.t); }; });
    var searchBox=$('toolSearch'), hits=$('searchHits');
    searchBox.addEventListener('input',function(){ var res=searchTools(searchBox.value); hits.innerHTML=res.map(function(x){return '<button data-go="'+x.t+'">'+x.c.title+' — <span style="color:var(--soft)">'+x.c.desc+'</span></button>';}).join(''); });
    hits.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return; location.hash=b.dataset.go; searchBox.value=''; hits.innerHTML=''; searchBox.blur();});
    searchBox.addEventListener('keydown',function(e){if(e.key==='Enter'){var r=searchTools(searchBox.value)[0]; if(r){location.hash=r.t;searchBox.value='';hits.innerHTML='';searchBox.blur();}}});
    document.addEventListener('click',function(e){if(!e.target.closest('.toolsearch'))hits.innerHTML='';});
    var validTool=function(t){return Object.prototype.hasOwnProperty.call(TOOLS,t);};
    var fromHash=function(){var h=location.hash.replace('#','');return validTool(h)?h:'merge';};
    setTool(fromHash());
    window.addEventListener('hashchange',function(){setTool(fromHash());});
  }
  var yr=$('yr'); if(yr) yr.textContent=new Date().getFullYear();
  initAds();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
