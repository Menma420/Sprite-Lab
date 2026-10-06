const CELL_W = 16, CELL_H = 32;
const DIRECTIONS = { south:[3,0,4,0], north:[5,1,6,1], west:[7,2,8,2], east:[7,2,8,2] };
const LANDMARK_DEFAULTS = [
  {id:'headTop',label:'Head top',y:10,hint:'first visible row'},
  {id:'headBottom',label:'Head bottom',y:17,hint:'face / hair band'},
  {id:'shoulders',label:'Shoulder line',y:18,hint:'upper body entry'},
  {id:'torsoBottom',label:'Torso bottom',y:23,hint:'waist / hip entry'},
  {id:'legsBottom',label:'Legs bottom',y:29,hint:'ankle band'},
  {id:'footBaseline',label:'Foot baseline',y:30,hint:'last visible row'},
];
const BUNDLED_WALKING_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAgBAMAAAAPouz+AAAAMFBMVEVzxaT/1bT/xZTelHN7QUE5SnspOWIYKVIQIDne5u5zzXNKlFL/YlrFQUH///8AAAAvIM4SAAACp0lEQVRIie2SsWvbQBSH3yBDtsN08VAoJB26FaIM2aw0N5g2QV48dHGn/h9pmuFCcTUVohaSpUscmi5ZUkFMIWMgSwdTMJ4yJAUhEhVUZPH63lmS7Uvp0LHkhvt0j7vf904SwN24G//vaPJUMdb/MCoXPLebs+upwBnRH4RjVlrtC3qqtC9azWI9Gzgrui3M2b70/XcAz31/lwsVXrcmAlN0S1hyN7z0m5phSGwdhqHPhVxgikxhKRb73e77iDfsXoZ04O3Vvs8nK5SrBQVzUcGXubAgpMdXhx96AL/ouL8HcNLtHhzvNUuBKTKFBeHnlzA8eAGQcJAH8CwIArU3EZgiU1jQelylce1Y9R3f375xYLVaU8qbCEyRKSxoPay+qlWfONaS2t5Rqw6s1O4lFFQKDNGU8IEWFmJYXdx8tLBErCPeEFdqC9f1aCIwRKawJFj24oLtMOfnx7QXl6IpgSEyhCVBxLbt8tfJpBxyQdp2KXAB4lwUlyKiOxEWhGuFqB4D3DDrnCBlEOWC1LF6uShVUi7zH7wppRpOhKX4a9Lpe/cd6xRPfuAaKde95OgzCZYRvXRjrpcgviaRYLKA69yBtaUCzfUtpjVYV+rbYMMaxN2uO9gAaIzO39B/45FAJURFIqIgUcxBLgk5oIGKhSD7qIlxv+MmTCmZkGTDlDaOzpVyufVYqdE5X5VEpwBrTB14lrCQbnCWMgVKyQaBQaBNAhEJ2bAhmYCyk9E7sVjUB+gw+eXjAFkoGt4g1edcxHHLY3JQkccNgofjAovo5nNMbpT2IwlGCW3g1sV3N/7EQdKNJR/I1BGDktLx1Xo6B/K8omMhEVMO6lEDeiNGAqcp9D5+eMpfGbKP+jxkMsrrUtcRxJluIAIRwV9H0UF+HmfrOquY4DdB5yIxOmr04AAAAABJRU5ErkJggg==';

const state = {
  source:null,png:null,mode:null,palette:[],paletteAlpha:[],pixels:null,alpha:null,width:0,height:0,
  frameStats:[],activeFrame:0,displayMask:false,mirror:false,playing:false,timer:null,
  landmarks:Object.fromEntries(LANDMARK_DEFAULTS.map(x=>[x.id,x.y])),centerlineX:7,
  compareFrame:0,ignoreTranslation:false,
  forensicPairA:0, forensicPairB:3, forensicMode:'silhouette',
};

const els = {
  bundledBtn:document.querySelector('#bundledBtn'), fileInput:document.querySelector('#fileInput'), exportBtn:document.querySelector('#exportBtn'), copyReportBtn:document.querySelector('#copyReportBtn'),
  dropzone:document.querySelector('#dropzone'), statusDot:document.querySelector('#statusDot'), statusText:document.querySelector('#statusText'), formatBadge:document.querySelector('#formatBadge'),
  sheetTitle:document.querySelector('#sheetTitle'), sheetCanvas:document.querySelector('#sheetCanvas'), frameStrip:document.querySelector('#frameStrip'), metrics:document.querySelector('#metrics'), emptyState:document.querySelector('#emptyState'), frameNumber:document.querySelector('#frameNumber'), pixelReadout:document.querySelector('#pixelReadout'),
  zoomSelect:document.querySelector('#zoomSelect'), gridToggle:document.querySelector('#gridToggle'), bboxToggle:document.querySelector('#bboxToggle'), baselineToggle:document.querySelector('#baselineToggle'), anatomyToggle:document.querySelector('#anatomyToggle'), palette0Toggle:document.querySelector('#palette0Toggle'),
  blueprintCanvas:document.querySelector('#blueprintCanvas'), rowProfileCanvas:document.querySelector('#rowProfileCanvas'), colProfileCanvas:document.querySelector('#colProfileCanvas'), rowProfileMeta:document.querySelector('#rowProfileMeta'), colProfileMeta:document.querySelector('#colProfileMeta'),
  maskBtn:document.querySelector('#maskBtn'), mirrorBtn:document.querySelector('#mirrorBtn'), resetLandmarksBtn:document.querySelector('#resetLandmarksBtn'), landmarkControls:document.querySelector('#landmarkControls'), centerlineX:document.querySelector('#centerlineX'), autoCenterBtn:document.querySelector('#autoCenterBtn'), bandSummary:document.querySelector('#bandSummary'),
  geometryFacts:document.querySelector('#geometryFacts'), symmetryCanvas:document.querySelector('#symmetryCanvas'), symmetryMetrics:document.querySelector('#symmetryMetrics'), compareFrameSelect:document.querySelector('#compareFrameSelect'), ignoreTranslationToggle:document.querySelector('#ignoreTranslationToggle'), deltaCanvas:document.querySelector('#deltaCanvas'), deltaMetrics:document.querySelector('#deltaMetrics'),
  paletteGrid:document.querySelector('#paletteGrid'), geometryTable:document.querySelector('#geometryTable'), rowRunsPreview:document.querySelector('#rowRunsPreview'),
  forensicA:document.querySelector('#forensicA'), forensicB:document.querySelector('#forensicB'), forensicMetric:document.querySelector('#forensicMetric'), forensicCanvas:document.querySelector('#forensicCanvas'), forensicMetrics:document.querySelector('#forensicMetrics'), forensicTable:document.querySelector('#forensicTable'), motionSignature:document.querySelector('#motionSignature'), directionSelect:document.querySelector('#directionSelect'), speedSelect:document.querySelector('#speedSelect'), playBtn:document.querySelector('#playBtn'), sequence:document.querySelector('#sequence'), animCanvas:document.querySelector('#animCanvas'), sanityChecks:document.querySelector('#sanityChecks'),
  recipeJsonBtn:document.querySelector('#recipeJsonBtn'), recipeMdBtn:document.querySelector('#recipeMdBtn'), recomputeRecipeBtn:document.querySelector('#recomputeRecipeBtn'),
  recipeSummary:document.querySelector('#recipeSummary'), recipeRules:document.querySelector('#recipeRules'), recipeDirections:document.querySelector('#recipeDirections'), recipeBands:document.querySelector('#recipeBands'), recipePaletteRoles:document.querySelector('#recipePaletteRoles'), recipeDsl:document.querySelector('#recipeDsl'),
  recipeSilhouetteCanvas:document.querySelector('#recipeSilhouetteCanvas'), recipeInvariantCanvas:document.querySelector('#recipeInvariantCanvas'), recipeMotionCanvas:document.querySelector('#recipeMotionCanvas'),
  grammarJsonBtn:document.querySelector('#grammarJsonBtn'), grammarMdBtn:document.querySelector('#grammarMdBtn'), recomputeGrammarBtn:document.querySelector('#recomputeGrammarBtn'), rebuildBtn:document.querySelector('#rebuildBtn'), grammarSummary:document.querySelector('#grammarSummary'), grammarSilhouetteCanvas:document.querySelector('#grammarSilhouetteCanvas'), grammarPrimitiveTable:document.querySelector('#grammarPrimitiveTable'), grammarRegionTable:document.querySelector('#grammarRegionTable'), grammarSemanticTable:document.querySelector('#grammarSemanticTable'), grammarMotionTable:document.querySelector('#grammarMotionTable'), grammarRebuildCanvas:document.querySelector('#grammarRebuildCanvas'), grammarProofMetrics:document.querySelector('#grammarProofMetrics'), grammarDsl:document.querySelector('#grammarDsl'),
  v07RecomputeBtn:document.querySelector('#v07RecomputeBtn'), v07ResetBtn:document.querySelector('#v07ResetBtn'), v07ExportBtn:document.querySelector('#v07ExportBtn'), v07Mode:document.querySelector('#v07Mode'), v07PaletteTheme:document.querySelector('#v07PaletteTheme'), v07SourceCanvas:document.querySelector('#v07SourceCanvas'), v07RenderCanvas:document.querySelector('#v07RenderCanvas'), v07DiffCanvas:document.querySelector('#v07DiffCanvas'), v07RenderLabel:document.querySelector('#v07RenderLabel'), v07OutputLabel:document.querySelector('#v07OutputLabel'), v07ProofMetrics:document.querySelector('#v07ProofMetrics'), v07Program:document.querySelector('#v07Program'), v07Generator:document.querySelector('#v07Generator'), v07HeadWidth:document.querySelector('#v07HeadWidth'), v07HeadHeight:document.querySelector('#v07HeadHeight'), v07TorsoWidth:document.querySelector('#v07TorsoWidth'), v07LegWidth:document.querySelector('#v07LegWidth'), v07ShoeWidth:document.querySelector('#v07ShoeWidth'), v07HeadWidthOut:document.querySelector('#v07HeadWidthOut'), v07HeadHeightOut:document.querySelector('#v07HeadHeightOut'), v07TorsoWidthOut:document.querySelector('#v07TorsoWidthOut'), v07LegWidthOut:document.querySelector('#v07LegWidthOut'), v07ShoeWidthOut:document.querySelector('#v07ShoeWidthOut'), v07TokenSwatches:document.querySelector('#v07TokenSwatches'), v07SlotTable:document.querySelector('#v07SlotTable'), creatorShell:document.querySelector('#creatorShell'), creatorRandomBtn:document.querySelector('#creatorRandomBtn'), creatorResetBtn:document.querySelector('#creatorResetBtn'), creatorExportPngBtn:document.querySelector('#creatorExportPngBtn'), creatorExportSheetBtn:document.querySelector('#creatorExportSheetBtn'), creatorExportJsonBtn:document.querySelector('#creatorExportJsonBtn'), creatorName:document.querySelector('#creatorName'), creatorHair:document.querySelector('#creatorHair'), creatorFace:document.querySelector('#creatorFace'), creatorOutfit:document.querySelector('#creatorOutfit'), creatorDirection:document.querySelector('#creatorDirection'), creatorHeadWidth:document.querySelector('#creatorHeadWidth'), creatorHeadHeight:document.querySelector('#creatorHeadHeight'), creatorTorsoWidth:document.querySelector('#creatorTorsoWidth'), creatorLegWidth:document.querySelector('#creatorLegWidth'), creatorShoeWidth:document.querySelector('#creatorShoeWidth'), creatorHeadWidthOut:document.querySelector('#creatorHeadWidthOut'), creatorHeadHeightOut:document.querySelector('#creatorHeadHeightOut'), creatorTorsoWidthOut:document.querySelector('#creatorTorsoWidthOut'), creatorLegWidthOut:document.querySelector('#creatorLegWidthOut'), creatorShoeWidthOut:document.querySelector('#creatorShoeWidthOut'), creatorOutline:document.querySelector('#creatorOutline'), creatorSkinLight:document.querySelector('#creatorSkinLight'), creatorSkinMid:document.querySelector('#creatorSkinMid'), creatorSkinDark:document.querySelector('#creatorSkinDark'), creatorClothLight:document.querySelector('#creatorClothLight'), creatorClothMid:document.querySelector('#creatorClothMid'), creatorClothDark:document.querySelector('#creatorClothDark'), creatorAccent:document.querySelector('#creatorAccent'), creatorHighlight:document.querySelector('#creatorHighlight'), creatorCanvas:document.querySelector('#creatorCanvas'), creatorPreviewLabel:document.querySelector('#creatorPreviewLabel'), creatorStats:document.querySelector('#creatorStats'), creatorDirections:document.querySelector('#creatorDirections'),
};

els.fileInput.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)loadFile(f)});
els.bundledBtn.addEventListener('click',loadBundled);
els.dropzone.addEventListener('click',()=>els.fileInput.click());
els.dropzone.addEventListener('dragover',e=>{e.preventDefault();els.dropzone.classList.add('dragging')});
els.dropzone.addEventListener('dragleave',()=>els.dropzone.classList.remove('dragging'));
els.dropzone.addEventListener('drop',e=>{e.preventDefault();els.dropzone.classList.remove('dragging');const f=e.dataTransfer.files?.[0];if(f?.type==='image/png'||f?.name?.toLowerCase().endsWith('.png'))loadFile(f)});
for(const id of ['zoomSelect','gridToggle','bboxToggle','baselineToggle','anatomyToggle']) els[id].addEventListener('change',renderAll);
els.palette0Toggle.addEventListener('change',()=>{reanalyze();renderAll()});
els.maskBtn.addEventListener('click',()=>{state.displayMask=!state.displayMask;els.maskBtn.textContent=state.displayMask?'Color':'Mask';renderAll()});
els.mirrorBtn.addEventListener('click',()=>{state.mirror=!state.mirror;els.mirrorBtn.textContent=state.mirror?'Normal':'Mirror';renderAll()});
els.resetLandmarksBtn.addEventListener('click',()=>{state.landmarks=Object.fromEntries(LANDMARK_DEFAULTS.map(x=>[x.id,x.y]));renderAll()});
els.centerlineX.addEventListener('input',()=>{state.centerlineX=clampInt(Number(els.centerlineX.value),0,15);renderAll()});
els.autoCenterBtn.addEventListener('click',autoCenter);
els.compareFrameSelect.addEventListener('change',()=>{state.compareFrame=Number(els.compareFrameSelect.value)||0;renderComparisons()});
els.ignoreTranslationToggle.addEventListener('change',()=>{state.ignoreTranslation=els.ignoreTranslationToggle.checked;renderComparisons()});
els.forensicA.addEventListener('change',()=>{state.forensicPairA=Number(els.forensicA.value)||0;renderForensics()});
els.forensicB.addEventListener('change',()=>{state.forensicPairB=Number(els.forensicB.value)||0;renderForensics()});
els.forensicMetric.addEventListener('change',()=>{state.forensicMode=els.forensicMetric.value;renderForensics()});
els.directionSelect.addEventListener('change',renderSequence); els.speedSelect.addEventListener('change',restartAnimation);
els.playBtn.addEventListener('click',()=>{state.playing=!state.playing;els.playBtn.textContent=state.playing?'Pause':'Play';restartAnimation()});
els.exportBtn.addEventListener('click',exportJSON); els.copyReportBtn.addEventListener('click',copyReport);
els.recipeJsonBtn.addEventListener('click',exportRecipeJSON); els.recipeMdBtn.addEventListener('click',exportRecipeMarkdown); els.recomputeRecipeBtn.addEventListener('click',()=>{renderRecipe(true)});
els.grammarJsonBtn.addEventListener('click',exportGrammarJSON); els.grammarMdBtn.addEventListener('click',exportGrammarMarkdown); els.recomputeGrammarBtn.addEventListener('click',()=>{renderGrammar(true)}); els.rebuildBtn.addEventListener('click',()=>{renderGrammar(true,true)});
[els.v07Mode,els.v07PaletteTheme,els.v07HeadWidth,els.v07HeadHeight,els.v07TorsoWidth,els.v07LegWidth,els.v07ShoeWidth].forEach(el=>el&&el.addEventListener('input',renderV07)); els.v07RecomputeBtn?.addEventListener('click',()=>renderV07(true)); els.v07ResetBtn?.addEventListener('click',resetV07); els.v07ExportBtn?.addEventListener('click',exportV07);
initCreatorEvents();
els.sheetCanvas.addEventListener('mousemove',onSheetHover); els.sheetCanvas.addEventListener('mouseleave',()=>els.pixelReadout.classList.add('hidden'));

async function loadBundled(){try{setStatus('Loading bundled walking.png…','ok','BUNDLED');const raw=atob(BUNDLED_WALKING_PNG.split(',')[1]);const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);await loadBlob(new Blob([bytes],{type:'image/png'}),'walking.png')}catch(err){setStatus('Could not load bundled walking.png: '+err.message,'warn','ERROR')}}
async function loadFile(file){await loadBlob(file,file.name)}
async function loadBlob(blob,name){let png;try{const buf=await blob.arrayBuffer();png=await decodePNG(new Uint8Array(buf));}catch(err){setStatus(`PNG decode failed: ${err.message}`,'warn','DECODE ERROR');return}try{state.source=name;state.png=png;state.mode=png.colorType===3?'indexed':'rgba';state.palette=png.palette;state.paletteAlpha=png.paletteAlpha;state.pixels=png.indices;state.alpha=png.alpha;state.width=png.width;state.height=png.height;state.activeFrame=0;state.compareFrame=0;state.displayMask=false;state.mirror=false;reanalyze();initCompareOptions();els.sheetTitle.textContent=`${name} · ${state.width}×${state.height}`;els.emptyState.classList.add('hidden');els.metrics.classList.remove('hidden');els.pixelReadout.classList.remove('hidden');els.exportBtn.disabled=false;els.copyReportBtn.disabled=false;els.playBtn.disabled=state.frameStats.length<1;renderAll();setStatus(`Loaded ${name}. ${state.width}×${state.height}, ${state.mode==='indexed'?`${state.palette.length}-entry indexed PNG`:'RGBA PNG'}.`,'ok',state.mode.toUpperCase());}catch(err){setStatus(`Render failed: ${err.message}`,'warn','RENDER ERROR');console.error(err)}}

async function inflateBytes(data){
  // Prefer a bundled, deterministic inflater so local file:// usage does not
  // depend on browser DecompressionStream quirks. Fall back to the browser
  // primitive where available.
  if(typeof pako!=='undefined' && typeof pako.inflate==='function') return Uint8Array.from(pako.inflate(data));
  if(typeof DecompressionStream!=='undefined'){
    return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  }
  throw new Error('No PNG inflater available.');
}
async function decodePNG(bytes){
  const sig=[137,80,78,71,13,10,26,10]; if(!sig.every((v,i)=>bytes[i]===v)) throw new Error('Not a PNG file.');
  let pos=8,width=0,height=0,bitDepth=0,colorType=0,interlace=0,palette=[],trns=null,idatParts=[];
  while(pos+8<=bytes.length){const len=readU32(bytes,pos);pos+=4;const type=ascii(bytes.slice(pos,pos+4));pos+=4;const data=bytes.slice(pos,pos+len);pos+=len;pos+=4;
    if(type==='IHDR'){width=readU32(data,0);height=readU32(data,4);bitDepth=data[8];colorType=data[9];interlace=data[12]}
    else if(type==='PLTE'){palette=[];for(let i=0;i<data.length;i+=3)palette.push([data[i],data[i+1],data[i+2]])}
    else if(type==='tRNS')trns=Uint8Array.from(data); else if(type==='IDAT')idatParts.push(data); else if(type==='IEND')break;
  }
  if(!width||!height)throw new Error('Missing IHDR.'); if(interlace!==0)throw new Error('Interlaced PNGs are not supported.'); if(![0,2,3,4,6].includes(colorType))throw new Error('Unsupported PNG color type '+colorType+'.'); if(colorType===3&&!palette.length)throw new Error('Indexed PNG is missing PLTE.');
  const idat=concatBytes(idatParts); if(!idat.length)throw new Error('PNG has no IDAT data.');
  const raw=await inflateBytes(idat);
  const channels=colorType===6?4:colorType===2?3:colorType===4?2:1,bitsPerPixel=channels*bitDepth,bytesPerRow=Math.ceil(width*bitsPerPixel/8),bpp=Math.max(1,Math.ceil(bitsPerPixel/8));
  const out=new Uint8Array(width*height),alpha=new Uint8Array(width*height);alpha.fill(255);let rp=0,prev=new Uint8Array(bytesPerRow),cur=new Uint8Array(bytesPerRow);
  const expectedRaw=(bytesPerRow+1)*height;
  if(raw.length<expectedRaw) throw new Error(`Inflated IDAT is too short (${raw.length} < ${expectedRaw} bytes).`);
  for(let y=0;y<height;y++){const filter=raw[rp++];if(filter>4)throw new Error(`Unsupported PNG filter ${filter} at row ${y}.`);cur.set(raw.slice(rp,rp+bytesPerRow));rp+=bytesPerRow;unfilterRow(cur,prev,filter,bpp);if(colorType===3){for(let x=0;x<width;x++){const idx=readPackedIndex(cur,x,bitDepth);if(idx>=palette.length)throw new Error(`Palette index ${idx} out of range at (${x},${y}).`);out[y*width+x]=idx;alpha[y*width+x]=trns&&idx<trns.length?trns[idx]:255}}else decodeDirectRow(cur,out,alpha,y,width,colorType,bitDepth,palette);[prev,cur]=[cur,prev]}
  return {width,height,bitDepth,colorType,palette,paletteAlpha:palette.map((_,i)=>trns&&i<trns.length?trns[i]:255),alpha,indices:out};
}
function decodeDirectRow(row,out,alpha,y,width,colorType,bitDepth,palette){if(bitDepth!==8)throw new Error('Direct-color v0.3 decoder requires 8-bit channels.');let p=0;for(let x=0;x<width;x++){let rgb,a=255;if(colorType===6){rgb=[row[p++],row[p++],row[p++]];a=row[p++]}else if(colorType===2)rgb=[row[p++],row[p++],row[p++]];else if(colorType===4){const g=row[p++];rgb=[g,g,g];a=row[p++]}else{const g=row[p++];rgb=[g,g,g]}const idx=y*width+x;let found=palette.findIndex(c=>sameRGB(c,rgb));if(found<0){found=palette.length;palette.push(rgb)}out[idx]=found;alpha[idx]=a}}
function sameRGB(a,b){return a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]}
function readPackedIndex(row,x,bitDepth){if(bitDepth===8)return row[x];const perByte=8/bitDepth,byte=row[Math.floor(x/perByte)],shift=(perByte-1-(x%perByte))*bitDepth;return(byte>>shift)&((1<<bitDepth)-1)}
function unfilterRow(cur,prev,type,bpp){if(type===0)return;for(let i=0;i<cur.length;i++){const left=i>=bpp?cur[i-bpp]:0,up=prev[i]||0,upLeft=i>=bpp?prev[i-bpp]||0:0;if(type===1)cur[i]=(cur[i]+left)&255;else if(type===2)cur[i]=(cur[i]+up)&255;else if(type===3)cur[i]=(cur[i]+Math.floor((left+up)/2))&255;else if(type===4)cur[i]=(cur[i]+paeth(left,up,upLeft))&255;else throw new Error('Unsupported PNG filter '+type)}}
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c}
function readU32(b,p){return(((b[p]<<24)>>>0)|(b[p+1]<<16)|(b[p+2]<<8)|b[p+3])>>>0}function ascii(bytes){return String.fromCharCode(...bytes)}function concatBytes(parts){const n=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(n);let p=0;for(const part of parts){out.set(part,p);p+=part.length}return out}
function isVisible(index,alpha){if(alpha===0)return false;if(index==null)return false;if(state.mode==='indexed'&&els.palette0Toggle.checked&&index===0)return false;return true}

function reanalyze(){if(!state.pixels)return;const cols=Math.floor(state.width/CELL_W),rows=Math.floor(state.height/CELL_H);state.frameStats=Array.from({length:cols*rows},(_,i)=>analyzeFrame(i));renderMetrics();renderPalette();renderGeometryTable();renderChecks()}
function analyzeFrame(frameIndex){const cols=Math.floor(state.width/CELL_W),ox=(frameIndex%cols)*CELL_W,oy=Math.floor(frameIndex/cols)*CELL_H;let minX=CELL_W,minY=CELL_H,maxX=-1,maxY=-1,visible=0;const colors=new Map(),rowRuns=[];for(let y=0;y<CELL_H;y++){const runs=[];let runStart=null,lastKey=null;for(let x=0;x<CELL_W;x++){const pos=(oy+y)*state.width+(ox+x),idx=state.pixels[pos],vis=isVisible(idx,state.alpha[pos],pos),key=vis?String(idx):null;if(vis){visible++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);colors.set(idx,(colors.get(idx)||0)+1)}if(key!==lastKey){if(runStart!==null)runs.push({x0:runStart,x1:x-1,paletteIndex:Number(lastKey)});runStart=vis?x:null;lastKey=key}}if(runStart!==null)runs.push({x0:runStart,x1:CELL_W-1,paletteIndex:Number(lastKey)});rowRuns.push(runs)}const bbox=maxX<0?null:{x0:minX,y0:minY,x1:maxX,y1:maxY,width:maxX-minX+1,height:maxY-minY+1};return{frame:frameIndex,origin:{x:ox,y:oy},visiblePixels:visible,occupancy:visible/(CELL_W*CELL_H),bbox,footBaseline:maxY,colors:[...colors.entries()].sort((a,b)=>b[1]-a[1]).map(([paletteIndex,count])=>({paletteIndex,count})),rowRuns}}
function pixelAt(frame,x,y){if(!state.pixels||x<0||y<0||x>=CELL_W||y>=CELL_H||frame<0||frame>=state.frameStats.length)return{idx:0,alpha:0,visible:false};const cols=Math.floor(state.width/CELL_W),ox=(frame%cols)*CELL_W,oy=Math.floor(frame/cols)*CELL_H,pos=(oy+y)*state.width+(ox+x),idx=state.pixels[pos],a=state.alpha[pos];return{idx,alpha:a,visible:isVisible(idx,a)}}
function renderPixelGrid(ctx,frame,scale,mask=false,mirror=false){for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){const sx=mirror?CELL_W-1-x:x,p=pixelAt(frame,sx,y);if(!p.visible)continue;if(mask)ctx.fillStyle='#23362b';else{const c=state.palette[p.idx]||[0,0,0];ctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`}ctx.fillRect(x*scale,y*scale,scale,scale)}}
function renderAll(){if(!state.pixels)return;renderSheet();renderFrameStrip();renderBlueprint();renderProfiles();renderSymmetry();renderComparisons();renderForensics();renderSequence();renderRowRuns();renderGeometryFacts()}

function renderSheet(){const z=Number(els.zoomSelect.value),cols=Math.floor(state.width/CELL_W),rows=Math.floor(state.height/CELL_H);els.sheetCanvas.width=state.width*z;els.sheetCanvas.height=state.height*z;const ctx=els.sheetCanvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,els.sheetCanvas.width,els.sheetCanvas.height);for(let y=0;y<state.height;y++)for(let x=0;x<state.width;x++){const pos=y*state.width+x,idx=state.pixels[pos];if(!isVisible(idx,state.alpha[pos],pos))continue;const c=state.palette[idx]||[0,0,0];ctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;ctx.fillRect(x*z,y*z,z,z)}if(els.gridToggle.checked){ctx.strokeStyle='rgba(50,50,50,.28)';ctx.lineWidth=1;for(let x=0;x<=cols;x++){const px=x*CELL_W*z+.5;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,els.sheetCanvas.height);ctx.stroke()}for(let y=0;y<=rows;y++){const py=y*CELL_H*z+.5;ctx.beginPath();ctx.moveTo(0,py);ctx.lineTo(els.sheetCanvas.width,py);ctx.stroke()}}state.frameStats.forEach(s=>drawSheetOverlay(ctx,s,z,s.frame===state.activeFrame))}
function drawSheetOverlay(ctx,s,z,active){const ox=s.origin.x*z,oy=s.origin.y*z;if(els.bboxToggle.checked&&s.bbox){ctx.save();ctx.strokeStyle=active?'#8b4d2c':'rgba(139,77,44,.45)';ctx.lineWidth=active?2:1;ctx.strokeRect(ox+s.bbox.x0*z+.5,oy+s.bbox.y0*z+.5,s.bbox.width*z-1,s.bbox.height*z-1);ctx.restore()}if(els.baselineToggle.checked&&s.footBaseline>=0){ctx.save();ctx.strokeStyle=active?'#9b5b24':'rgba(155,91,36,.4)';ctx.lineWidth=active?2:1;const y=oy+s.footBaseline*z+.5;ctx.beginPath();ctx.moveTo(ox,y);ctx.lineTo(ox+CELL_W*z,y);ctx.stroke();ctx.restore()}if(active&&els.anatomyToggle.checked){ctx.save();ctx.strokeStyle='rgba(115,85,156,.8)';ctx.lineWidth=Math.max(1,z/2);const cx=ox+(state.centerlineX+.5)*z;ctx.beginPath();ctx.moveTo(cx,oy);ctx.lineTo(cx,oy+CELL_H*z);ctx.stroke();for(const lm of LANDMARK_DEFAULTS){ctx.strokeStyle='rgba(65,107,142,.6)';ctx.lineWidth=1;const y=oy+(state.landmarks[lm.id]+.5)*z;ctx.beginPath();ctx.moveTo(ox,y);ctx.lineTo(ox+CELL_W*z,y);ctx.stroke()}}if(active){ctx.save();ctx.strokeStyle='#28483a';ctx.lineWidth=Math.max(2,z>2?2:1);ctx.strokeRect(ox+1,oy+1,CELL_W*z-2,CELL_H*z-2);ctx.restore()}}
function renderFrameStrip(){els.frameStrip.innerHTML='';state.frameStats.forEach((s,i)=>{const chip=document.createElement('button');chip.className=`frame-chip${i===state.activeFrame?' active':''}`;const c=document.createElement('canvas');c.width=16;c.height=32;const cx=c.getContext('2d');cx.imageSmoothingEnabled=false;renderPixelGrid(cx,i,1,state.displayMask,state.mirror);chip.appendChild(c);const label=document.createElement('span');label.className='frame-label';label.textContent=`${i} · ${s.bbox?s.bbox.width+'×'+s.bbox.height:'empty'}`;chip.appendChild(label);chip.addEventListener('click',()=>{state.activeFrame=i;renderAll()});els.frameStrip.appendChild(chip)})}
function renderMetrics(){const s=state.frameStats[state.activeFrame];if(!s)return;els.frameNumber.textContent=s.frame;const rows=[['Cell','16 × 32 px'],['Visible pixels',s.visiblePixels],['Occupancy',`${(s.occupancy*100).toFixed(2)}%`],['Figure bbox',s.bbox?`(${s.bbox.x0},${s.bbox.y0}) → (${s.bbox.x1},${s.bbox.y1})`:'empty'],['Figure size',s.bbox?`${s.bbox.width} × ${s.bbox.height} px`:'0 × 0 px'],['Foot baseline',s.footBaseline>=0?`y=${s.footBaseline}`:'n/a'],['Visible colors',s.colors.length],['Palette mode',state.mode==='indexed'?'indexed / palette':'direct color']];els.metrics.innerHTML=rows.map(([k,v])=>`<div class="metric"><span>${escapeHTML(k)}</span><b>${escapeHTML(String(v))}</b></div>`).join('')}

function renderBlueprint(){const s=state.frameStats[state.activeFrame];if(!s)return;const ctx=els.blueprintCanvas.getContext('2d');ctx.clearRect(0,0,256,512);ctx.imageSmoothingEnabled=false;renderPixelGrid(ctx,state.activeFrame,16,state.displayMask,state.mirror);drawBlueprintGrid(ctx);if(s.bbox){ctx.strokeStyle='#8b4d2c';ctx.lineWidth=2;ctx.strokeRect(s.bbox.x0*16+.5,s.bbox.y0*16+.5,s.bbox.width*16-1,s.bbox.height*16-1)}ctx.save();ctx.strokeStyle='#73559c';ctx.lineWidth=2;const cx=(state.centerlineX+.5)*16;ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,512);ctx.stroke();for(const lm of LANDMARK_DEFAULTS){const y=(state.landmarks[lm.id]+.5)*16;ctx.strokeStyle='#416b8e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();ctx.fillStyle='#416b8e';ctx.font='10px ui-monospace,monospace';ctx.fillText(`${lm.label} y=${state.landmarks[lm.id]}`,3,Math.max(10,y-2))}ctx.restore()}
function drawBlueprintGrid(ctx){ctx.strokeStyle='rgba(40,40,40,.25)';ctx.lineWidth=1;for(let x=0;x<=16;x++){const px=x*16+.5;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,512);ctx.stroke()}for(let y=0;y<=32;y++){const py=y*16+.5;ctx.beginPath();ctx.moveTo(0,py);ctx.lineTo(256,py);ctx.stroke()}}
function countRows(s){return s.rowRuns.map(runs=>runs.reduce((n,r)=>n+(r.x1-r.x0+1),0))}
function countCols(frame){const counts=Array(16).fill(0);for(let y=0;y<32;y++)for(let x=0;x<16;x++)if(pixelAt(frame,x,y).visible)counts[x]++;return counts}
function drawProfile(canvas,data,vertical,title){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#f7f5ef';ctx.fillRect(0,0,w,h);const max=Math.max(...data,1),pad=28;ctx.fillStyle='#526a5a';if(vertical){const bh=(h-20)/data.length;for(let i=0;i<data.length;i++){const y=10+i*bh,bw=data[i]/Math.max(16,max)* (w-pad-10);ctx.fillRect(pad,y,Math.max(1,bw),Math.max(1,bh-2));ctx.fillStyle='#77746d';ctx.font='9px ui-monospace,monospace';ctx.fillText(String(i).padStart(2,'0'),4,y+bh-4);ctx.fillStyle='#526a5a'}}else{const bw=(w-pad-10)/data.length;for(let i=0;i<data.length;i++){const bh=data[i]/max*(h-35),x=pad+i*bw;ctx.fillRect(x,h-18-bh,Math.max(1,bw-2),bh);ctx.fillStyle='#77746d';ctx.font='9px ui-monospace,monospace';ctx.fillText(String(i).padStart(2,'0'),x+1,h-5);ctx.fillStyle='#526a5a'}}ctx.fillStyle='#77746d';ctx.font='10px Inter,sans-serif';ctx.fillText(title,pad,12)}
function renderProfiles(){const s=state.frameStats[state.activeFrame];if(!s)return;const rows=countRows(s),cols=countCols(state.activeFrame);drawProfile(els.rowProfileCanvas,rows,true,'row occupied width');drawProfile(els.colProfileCanvas,cols,false,'column occupied height');const mr=Math.max(...rows),mc=Math.max(...cols);els.rowProfileMeta.textContent=`max ${mr}px @ y=${rows.indexOf(mr)}`;els.colProfileMeta.textContent=`max ${mc}px @ x=${cols.indexOf(mc)}`}

function renderLandmarkControls(){els.landmarkControls.innerHTML='';for(const lm of LANDMARK_DEFAULTS){const row=document.createElement('div');row.className='landmark-row';row.innerHTML=`<div><strong>${escapeHTML(lm.label)}</strong><div class="hint">${escapeHTML(lm.hint)}</div></div>`;const input=document.createElement('input');input.type='number';input.min=0;input.max=31;input.step=1;input.value=state.landmarks[lm.id];input.addEventListener('input',()=>{state.landmarks[lm.id]=clampInt(Number(input.value),0,31);renderAll()});row.appendChild(input);const dot=document.createElement('div');dot.className='landmark-color';dot.style.background='#416b8e';row.appendChild(dot);els.landmarkControls.appendChild(row)}}
function bandRange(a,b){return[Math.min(a,b),Math.max(a,b)]}function bandStats(a,b){const rows=countRows(state.frameStats[state.activeFrame]),[y0,y1]=bandRange(a,b),vals=rows.slice(y0,y1+1),total=vals.reduce((a,b)=>a+b,0);return{y0,y1,rows:vals.length,total,max:Math.max(...vals,0),avg:vals.length?total/vals.length:0}}
function renderBandSummary(){const lm=state.landmarks,bands=[['Head',lm.headTop,lm.headBottom],['Upper body',lm.headBottom,lm.torsoBottom],['Lower body',lm.torsoBottom,lm.legsBottom],['Feet',lm.legsBottom,lm.footBaseline]];els.bandSummary.innerHTML=bands.map(([label,a,b])=>{const z=bandStats(a,b);return`<div class="band-row"><strong>${label}</strong> · y ${z.y0}–${z.y1}<br>pixels ${z.total} · max row width ${z.max} · avg row width ${z.avg.toFixed(2)}</div>`}).join('')}
function renderLandmarks(){renderLandmarkControls();renderBandSummary();els.centerlineX.value=state.centerlineX}

function weightedCentroidX(frame){let sx=0,n=0;for(let y=0;y<32;y++)for(let x=0;x<16;x++)if(pixelAt(frame,x,y).visible){sx+=x;n++}return n?sx/n:0}
function weightedCentroidY(frame){let sy=0,n=0;for(let y=0;y<32;y++)for(let x=0;x<16;x++)if(pixelAt(frame,x,y).visible){sy+=y;n++}return n?sy/n:0}
function leftRightMass(frame){let l=0,r=0;for(let y=0;y<32;y++)for(let x=0;x<16;x++)if(pixelAt(frame,x,y).visible){if(x<state.centerlineX+.5)l++;else r++}return`${l} / ${r}`}
function autoCenter(){state.centerlineX=clampInt(Math.round(weightedCentroidX(state.activeFrame)),0,15);renderAll()}
function mirrorMismatchPercent(frame){let mismatch=0,total=0;for(let y=0;y<32;y++)for(let x=0;x<8;x++){if(pixelAt(frame,x,y).visible!==pixelAt(frame,15-x,y).visible)mismatch++;total++}return total?mismatch/total*100:0}

function renderGeometryFacts(){const s=state.frameStats[state.activeFrame],rows=countRows(s),cols=countCols(state.activeFrame),bbox=s.bbox||{};const facts=[['Top occupied row',bbox.y0??'—'],['Bottom occupied row',bbox.y1??'—'],['Max row span',Math.max(...rows)],['Max column span',Math.max(...cols)],['Centerline',state.centerlineX],['Centroid X',weightedCentroidX(state.activeFrame).toFixed(3)],['Centroid Y',weightedCentroidY(state.activeFrame).toFixed(3)],['Horizontal mass L/R',leftRightMass(state.activeFrame)]];els.geometryFacts.innerHTML=facts.map(([k,v])=>`<div class="fact"><span>${escapeHTML(k)}</span><b>${escapeHTML(String(v))}</b></div>`).join('')}
function renderSymmetry(){const frame=state.activeFrame,ctx=els.symmetryCanvas.getContext('2d');ctx.clearRect(0,0,256,512);ctx.imageSmoothingEnabled=false;const scale=16;for(let y=0;y<32;y++)for(let x=0;x<8;x++){const l=pixelAt(frame,x,y).visible,r=pixelAt(frame,15-x,y).visible;if(l||r){ctx.fillStyle=l&&r?'#526a5a':l?'#8c6b49':'#73559c';ctx.fillRect(x*scale,y*scale,scale,scale);ctx.fillRect((15-x)*scale,y*scale,scale,scale)}}ctx.strokeStyle='#416b8e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo((state.centerlineX+.5)*scale,0);ctx.lineTo((state.centerlineX+.5)*scale,512);ctx.stroke();let matches=0,mismatches=0,leftOnly=0,rightOnly=0;for(let y=0;y<32;y++)for(let x=0;x<8;x++){const l=pixelAt(frame,x,y).visible,r=pixelAt(frame,15-x,y).visible;if(l===r)matches++;else mismatches++;if(l&&!r)leftOnly++;if(r&&!l)rightOnly++}const total=matches+mismatches;els.symmetryMetrics.innerHTML=[['Mirror match',`${(matches/total*100).toFixed(1)}%`],['Mismatched mirrored pairs',mismatches],['Left-only pixels',leftOnly],['Right-only pixels',rightOnly],['Visible pixels',state.frameStats[frame].visiblePixels]].map(([k,v])=>`<div class="fact"><span>${k}</span><b>${v}</b></div>`).join('')}

function initCompareOptions(){els.compareFrameSelect.innerHTML=state.frameStats.map((_,i)=>`<option value="${i}">Frame ${i}</option>`).join('');els.compareFrameSelect.value=String(state.compareFrame);populateForensicSelectors()}
function compareMasks(a,b,dx=0,dy=0){let diff=0,changed=[];for(let y=0;y<32;y++)for(let x=0;x<16;x++){const pa=pixelAt(a,x,y).visible,rx=x+dx,ry=y+dy,pb=rx>=0&&rx<16&&ry>=0&&ry<32?pixelAt(b,rx,ry).visible:false;if(pa!==pb){diff++;changed.push([x,y])}}return{diff,changed}}
function bestTranslation(a,b){let best={diff:Infinity,dx:0,dy:0};for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const r=compareMasks(a,b,dx,dy);if(r.diff<best.diff)best={diff:r.diff,dx,dy}}return{...best,changed:compareMasks(a,b,best.dx,best.dy).changed}}
function pixelChange(a,b,x,y,dx=0,dy=0){
  const pa=pixelAt(a,x,y), rx=x+dx, ry=y+dy;
  const pb=rx>=0&&rx<16&&ry>=0&&ry<32?pixelAt(b,rx,ry):{visible:false,index:0};
  const av=pa.visible,bv=pb.visible;
  if(!av&&!bv)return 'none';
  if(av&&!bv)return 'removed';
  if(!av&&bv)return 'added';
  if(pa.idx!==pb.idx)return 'recolored';
  return 'same';
}
function frameDelta(a,b,dx=0,dy=0){
  const counts={same:0,added:0,removed:0,recolored:0,none:0};
  const changedByRow=Array(32).fill(0),changedByCol=Array(16).fill(0),points=[];
  for(let y=0;y<32;y++)for(let x=0;x<16;x++){
    const type=pixelChange(a,b,x,y,dx,dy);counts[type]++;
    if(type!=='same'&&type!=='none'){
      changedByRow[y]++;changedByCol[x]++;points.push([x,y,type]);
    }
  }
  let unionArea=0,interArea=0;
  for(let y=0;y<32;y++)for(let x=0;x<16;x++){
    const av=pixelAt(a,x,y).visible;
    const rx=x+dx,ry=y+dy;
    const bv=rx>=0&&rx<16&&ry>=0&&ry<32?pixelAt(b,rx,ry).visible:false;
    if(av||bv)unionArea++;
    if(av&&bv)interArea++;
  }
  return {counts,changedByRow,changedByCol,points,silhouetteIoU:unionArea?interArea/unionArea:1};
}
function bestTranslationDetailed(a,b){
  let best=null;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    const d=frameDelta(a,b,dx,dy),score=d.counts.added+d.counts.removed;
    const candidate={dx,dy,score,detail:d};
    if(!best||score<best.score||(score===best.score&&Math.abs(dx)+Math.abs(dy)<Math.abs(best.dx)+Math.abs(best.dy)))best=candidate;
  }
  return best;
}
function frameSignature(a,b){
  const raw=frameDelta(a,b,0,0),aligned=bestTranslationDetailed(a,b);
  const centroidA=[weightedCentroidX(a),weightedCentroidY(a)],centroidB=[weightedCentroidX(b),weightedCentroidY(b)];
  return {a,b,raw,aligned,centroidA,centroidB,centroidShift:[centroidB[0]-centroidA[0],centroidB[1]-centroidA[1]],visibleDelta:state.frameStats[b].visiblePixels-state.frameStats[a].visiblePixels};
}
function populateForensicSelectors(){
  for(const el of [els.forensicA,els.forensicB]){
    el.innerHTML=state.frameStats.map((_,i)=>`<option value="${i}">Frame ${i}</option>`).join('');
  }
  els.forensicA.value=String(state.forensicPairA); els.forensicB.value=String(state.forensicPairB);
}
function drawChangeMap(canvas, detail, mode='silhouette', scale=16){
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,512);ctx.imageSmoothingEnabled=false;
  const a=state.forensicPairA,b=state.forensicPairB;
  renderPixelGrid(ctx,a,scale,false,false);
  for(const [x,y,type] of detail.points){
    let show=true;
    if(mode==='mask') show=type!=='same';
    if(mode==='added') show=type==='added';
    if(mode==='removed') show=type==='removed';
    if(mode==='recolored') show=type==='recolored';
    if(mode==='silhouette') show=type!=='same';
    if(!show)continue;
    const alpha=mode==='silhouette'?0.72:0.8;
    ctx.fillStyle=type==='added'?`rgba(44,139,77,${alpha})`:type==='removed'?`rgba(190,70,48,${alpha})`:type==='recolored'?`rgba(164,115,44,${alpha})`:`rgba(90,100,170,${alpha})`;
    ctx.fillRect(x*scale,y*scale,scale,scale);
  }
  ctx.strokeStyle='#73559c';ctx.lineWidth=2;ctx.strokeRect(.5,.5,255,511);
}
function regionSilhouetteStats(a,b,dx,dy,y0,y1){
  let aVisible=0,bVisible=0,intersection=0,union=0,changed=0;
  const clampedY0=clampInt(y0,0,31),clampedY1=clampInt(y1,0,31);
  for(let y=clampedY0;y<=clampedY1;y++)for(let x=0;x<16;x++){
    const av=pixelAt(a,x,y).visible;
    const rx=x+dx,ry=y+dy;
    const bv=rx>=0&&rx<16&&ry>=0&&ry<32?pixelAt(b,rx,ry).visible:false;
    if(av)aVisible++; if(bv)bVisible++;
    if(av&&bv)intersection++;
    if(av||bv)union++;
    if(av!==bv)changed++;
  }
  return {y0:clampedY0,y1:clampedY1,aVisible,bVisible,intersection,union,changed,area:(clampedY1-clampedY0+1)*16, iou:union?intersection/union:1};
}
function deformationBreakdown(a,b,alignedDx,alignedDy){
  const raw=frameDelta(a,b,0,0),aligned=frameDelta(a,b,alignedDx,alignedDy);
  const rawShape=raw.counts.added+raw.counts.removed;
  const alignedShape=aligned.counts.added+aligned.counts.removed;
  const globalShiftExplainedPct=rawShape?Math.max(0,(rawShape-alignedShape)/rawShape*100):0;
  const localDeformationPct=rawShape?alignedShape/rawShape*100:0;
  const lm=state.landmarks;
  const bands=[
    ['Head',lm.headTop,lm.headBottom],
    ['Upper body',lm.shoulders,lm.torsoBottom],
    ['Lower body',lm.torsoBottom+1,lm.legsBottom],
    ['Feet',lm.footBaseline,Math.min(31,lm.footBaseline+1)]
  ];
  const regions=bands.map(([name,y0,y1])=>{
    const r=regionSilhouetteStats(a,b,alignedDx,alignedDy,y0,y1);
    return {name,...r,stabilityPct:r.iou*100,changePct:r.area?r.changed/r.area*100:0};
  });
  const totalUnion=aligned.silhouetteIoU?null:null;
  return {rawShapeChanges:rawShape,alignedShapeChanges:alignedShape,globalShiftExplainedPct,localDeformationPct,regions};
}
function renderForensics(){
  if(!state.pixels||!els.forensicA)return;
  const a=Number.isInteger(state.forensicPairA)?state.forensicPairA:0,b=Number.isInteger(state.forensicPairB)?state.forensicPairB:3,base=frameSignature(a,b),detail=state.forensicMode==='aligned'?base.aligned.detail:base.raw;
  drawChangeMap(els.forensicCanvas,detail,state.forensicMode,16);
  const c=base.raw.counts,al=base.aligned;
  const changed=c.added+c.removed+c.recolored;
  const changedAligned=al.detail.counts.added+al.detail.counts.removed+al.detail.counts.recolored;
  const sa=state.frameStats[a]||state.frameStats[0]||{visiblePixels:0,footBaseline:0},sb=state.frameStats[b]||state.frameStats[0]||{visiblePixels:0,footBaseline:0};
  const breakdown=deformationBreakdown(a,b,al.dx,al.dy);
  els.forensicMetrics.innerHTML=[
    ['Changed pixels',changed],['Added',c.added],['Removed',c.removed],['Recolored',c.recolored],
    ['Silhouette IoU',`${(base.raw.silhouetteIoU*100).toFixed(1)}%`],
    ['Best translation',`dx=${al.dx}, dy=${al.dy}`],['Aligned shape changes',changedAligned],
    ['Global shift explained',`${breakdown.globalShiftExplainedPct.toFixed(1)}%`],
    ['Local deformation remaining',`${breakdown.localDeformationPct.toFixed(1)}%`],
    ['Centroid shift',`${(base.centroidShift?.[0]??0).toFixed(2)}, ${(base.centroidShift?.[1]??0).toFixed(2)}`],
    ['Visible pixel Δ',base.visibleDelta>0?`+${base.visibleDelta}`:String(base.visibleDelta)],
    ['Baseline Δ',(sb.footBaseline-sa.footBaseline)>0?`+${sb.footBaseline-sa.footBaseline}`:String(sb.footBaseline-sa.footBaseline)]
  ].map(([k,v])=>`<div class="fact"><span>${k}</span><b>${v}</b></div>`).join('');
  const rows=Array.from({length:32},(_,y)=>[y,base.raw.changedByRow[y],base.raw.changedByCol[y<16?y:0]||0]);
  els.forensicTable.innerHTML=`<div class="forensic-row head"><span>Y</span><span>changed px</span><span>col max</span></div>`+rows.filter(r=>r[1]>0).map(r=>`<div class="forensic-row"><span>${String(r[0]).padStart(2,'0')}</span><span>${r[1]}</span><span>${r[0]<16?base.raw.changedByCol[r[0]]: '—'}</span></div>`).join('');
  renderDeformationBands(breakdown.regions);
  renderMotionSignature();
}
function renderDeformationBands(regions){
  const el=document.querySelector('#deformationBands');
  if(!el)return;
  el.innerHTML=regions.map(r=>`<div class="deformation-row"><div><strong>${r.name}</strong><span>y ${r.y0}–${r.y1}</span></div><b>${r.stabilityPct.toFixed(1)}%</b><small>silhouette stability · ${r.changed} changed</small></div>`).join('');
}
function renderMotionSignature(){
  const pairs=[['SOUTH','idle 0→step 3',0,3],['SOUTH','idle 0→step 4',0,4],['NORTH','idle 1→step 5',1,5],['NORTH','idle 1→step 6',1,6],['WEST','idle 2→step 7',2,7],['WEST','idle 2→step 8',2,8]];
  els.motionSignature.innerHTML=pairs.map(([dir,label,a,b])=>{
    const s=frameSignature(a,b),shape=s.raw.counts.added+s.raw.counts.removed,alignedShape=s.aligned.detail.counts.added+s.aligned.detail.counts.removed;
    const explained=shape?Math.max(0,(shape-alignedShape)/shape*100):0;
    return `<div class="signature-card"><div class="signature-title">${dir}</div><div class="signature-sub">${label}</div><div class="signature-line"><b>${shape}</b><span>raw shape changes</span></div><div class="signature-line"><b>${alignedShape}</b><span>after translation</span></div><div class="signature-line"><b>${explained.toFixed(0)}%</b><span>shift explained</span></div><div class="signature-line"><b>${s.aligned.dx}, ${s.aligned.dy}</b><span>best-fit shift</span></div><div class="signature-line"><b>${(s.raw.silhouetteIoU*100).toFixed(1)}%</b><span>raw silhouette IoU</span></div></div>`
  }).join('');
}

function renderComparisons(){if(!state.pixels)return;const a=state.activeFrame,b=state.compareFrame,result=state.ignoreTranslation?bestTranslation(a,b):compareMasks(a,b);const ctx=els.deltaCanvas.getContext('2d');ctx.clearRect(0,0,256,512);renderPixelGrid(ctx,a,16,state.displayMask,false);for(const[x,y]of result.changed){ctx.fillStyle='rgba(205,67,53,.8)';ctx.fillRect(x*16,y*16,16,16)}ctx.strokeStyle='#73559c';ctx.lineWidth=2;ctx.strokeRect(.5,.5,255,511);const sa=state.frameStats[a]||state.frameStats[0]||{visiblePixels:0,footBaseline:0},sb=state.frameStats[b]||state.frameStats[0]||{visiblePixels:0,footBaseline:0};const dv=sa.visiblePixels-sb.visiblePixels,dh=(sa.bbox?.height||0)-(sb.bbox?.height||0);els.deltaMetrics.innerHTML=[['Active',a],['Reference',b],['Mask difference',result.diff],['Best translation',state.ignoreTranslation?`dx=${result.dx}, dy=${result.dy}`:'disabled'],['Visible pixel Δ',dv>0?`+${dv}`:String(dv)],['BBox height Δ',dh>0?`+${dh}`:String(dh)]].map(([k,v])=>`<div class="fact"><span>${k}</span><b>${v}</b></div>`).join('')}

function renderRowRuns(){const s=state.frameStats[state.activeFrame];if(!s)return;els.rowRunsPreview.textContent=s.rowRuns.map((runs,y)=>runs.length?`${String(y).padStart(2,'0')}: `+runs.map(r=>`[${r.x0}-${r.x1}:i${r.paletteIndex}]`).join(' '):`${String(y).padStart(2,'0')}: —`).join('\n')}
function renderPalette(){els.paletteGrid.innerHTML='';const used=new Set(state.frameStats.flatMap(s=>s.colors).map(x=>x.paletteIndex));state.palette.forEach((rgb,index)=>{const chip=document.createElement('div');chip.className='palette-chip';const color=document.createElement('div');color.className='palette-color';color.style.background=`rgb(${rgb.join(',')})`;chip.appendChild(color);const meta=document.createElement('div');meta.className='palette-meta';const count=state.frameStats[state.activeFrame]?.colors.find(x=>x.paletteIndex===index)?.count||0;const transparent=state.mode==='indexed'&&els.palette0Toggle.checked&&index===0||(state.mode==='indexed'&&state.paletteAlpha[index]===0);meta.innerHTML=`<div class="palette-index">Index ${index}${transparent?' · transparent':''}</div><div>RGB ${rgb.join(', ')}</div><div>${used.has(index)?`${count} px in frame ${state.activeFrame}`:'unused in sheet'}</div>`;chip.appendChild(meta);els.paletteGrid.appendChild(chip)})}
function renderGeometryTable(){const s=state.frameStats[state.activeFrame],b=s.bbox;const rows=[['Canvas','16 × 32'],['BBox width',b?.width??0],['BBox height',b?.height??0],['Top margin',b?.y0??'—'],['Bottom margin',b?(31-b.y1):'—'],['Left margin',b?.x0??'—'],['Right margin',b?(15-b.x1):'—'],['Centroid',`${weightedCentroidX(state.activeFrame).toFixed(2)}, ${weightedCentroidY(state.activeFrame).toFixed(2)}`],['Centerline X',state.centerlineX],['Foot baseline',s.footBaseline]];els.geometryTable.innerHTML=rows.map(([k,v])=>`<div class="geo-row"><span>${escapeHTML(String(k))}</span><b>${escapeHTML(String(v))}</b></div>`).join('')}

function renderChecks(){const f=state.frameStats,vals=[];vals.push(check('Sheet divisible by 16×32',state.width%16===0&&state.height%32===0,`${state.width}×${state.height}`));vals.push(check('9-frame Emerald walking sheet',state.width===144&&state.height===32&&f.length===9,`${f.length} frames`));vals.push(check('All 9 frames are 14×21',f.length===9&&f.every(s=>s.bbox?.width===14&&s.bbox?.height===21),[...new Set(f.map(s=>`${s.bbox?.width}×${s.bbox?.height}`))].join(', ')));vals.push(check('Foot baseline constrained to 30–31',f.length>0&&[...new Set(f.map(s=>s.footBaseline))].every(y=>y===30||y===31),[...new Set(f.map(s=>s.footBaseline))].sort().join(', ')));vals.push(check('Indexed 4-bit source',state.mode==='indexed'&&state.png.bitDepth===4,`${state.mode}${state.mode==='indexed'?` / ${state.png.bitDepth}-bit`:''}`));vals.push(check('Palette index 0 transparent mode',state.mode!=='indexed'||els.palette0Toggle.checked,'viewer setting'));vals.push(check('Landmark order is valid',landmarksValid(),'ordered'));els.sanityChecks.innerHTML=vals.join('')}
function landmarksValid(){const y=LANDMARK_DEFAULTS.map(x=>state.landmarks[x.id]);return y.every((v,i)=>i===0||v>=y[i-1])}
function check(label,pass,detail){return`<div class="check"><span>${escapeHTML(label)} · ${escapeHTML(detail)}</span><b class="${pass?'pass':'fail'}">${pass?'PASS':'CHECK'}</b></div>`}
function renderSequence(){const dir=els.directionSelect?.value||'south',frames=DIRECTIONS[dir]||DIRECTIONS.south;els.sequence.innerHTML=frames.map((f,i)=>`${i?'<span class="seq-arrow">→</span>':''}<div class="seq-frame">${f}${dir==='east'?' ↔':''}</div>`).join('');if(state.pixels)drawAnimFrame(frames[0],dir);restartAnimation()}
function drawAnimFrame(frame,dir){const c=els.animCanvas,ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.save();if(dir==='east'){ctx.translate(c.width,0);ctx.scale(-1,1)}renderPixelGrid(ctx,frame,8,false,false);ctx.restore()}
function restartAnimation(){if(state.timer)clearInterval(state.timer);state.timer=null;if(!state.playing||!state.pixels)return;const dir=els.directionSelect?.value||'south',frames=DIRECTIONS[dir]||DIRECTIONS.south;let i=0;drawAnimFrame(frames[0]??0,dir);const interval=Math.max(35,Number(els.speedSelect.value)*18);state.timer=setInterval(()=>{i=(i+1)%frames.length;drawAnimFrame(frames[i],els.directionSelect.value)},interval)}
function onSheetHover(e){if(!state.pixels)return;const rect=els.sheetCanvas.getBoundingClientRect(),z=Number(els.zoomSelect.value),x=Math.floor((e.clientX-rect.left)*(els.sheetCanvas.width/rect.width)/z),y=Math.floor((e.clientY-rect.top)*(els.sheetCanvas.height/rect.height)/z);if(x<0||y<0||x>=state.width||y>=state.height)return;const pos=y*state.width+x,idx=state.pixels[pos],c=state.palette[idx]||[0,0,0],vis=isVisible(idx,state.alpha[pos],pos),frame=Math.floor(x/CELL_W)+Math.floor(y/CELL_H)*Math.floor(state.width/CELL_W),lx=x%CELL_W,ly=y%CELL_H;els.pixelReadout.textContent=`sheet (${x},${y}) · frame ${frame} · local (${lx},${ly}) · palette index ${idx} · RGB ${c.join(',')} · ${vis?'VISIBLE':'TRANSPARENT'}`}

function renderDetails(){renderLandmarks();renderMetrics();renderPalette();renderGeometryTable();renderChecks()}
function buildReport(){
  const forensicBase=frameSignature(state.forensicPairA,state.forensicPairB);
  const breakDown=deformationBreakdown(state.forensicPairA,state.forensicPairB,forensicBase.aligned.dx,forensicBase.aligned.dy);
  return {
    tool:'Sprite Lab v0.4',
    source:state.source,
    decoder:{mode:state.mode,bitDepth:state.png?.bitDepth??null,colorType:state.png?.colorType??null,paletteIndex0Transparent:state.mode==='indexed'&&els.palette0Toggle.checked},
    sheet:{width:state.width,height:state.height},
    cell:{width:CELL_W,height:CELL_H},
    frameCount:state.frameStats.length,
    activeFrame:state.activeFrame,
    landmarks:state.landmarks,
    centerlineX:state.centerlineX,
    palette:state.palette.map((rgb,index)=>({index,rgb,used:state.frameStats.some(s=>s.colors.some(c=>c.paletteIndex===index))})),
    frames:state.frameStats,
    activeGeometry:{centroidX:weightedCentroidX(state.activeFrame),centroidY:weightedCentroidY(state.activeFrame),rowProfile:countRows(state.frameStats[state.activeFrame]),columnProfile:countCols(state.activeFrame),mirrorMismatchPercent:mirrorMismatchPercent(state.activeFrame)},
    forensic:{
      pair:{a:state.forensicPairA,b:state.forensicPairB},
      raw:forensicBase.raw,
      aligned:forensicBase.aligned,
      deformationBreakdown:breakDown,
      animationPairs:[[0,3],[0,4],[1,5],[1,6],[2,7],[2,8]].map(([a,b])=>{const sig=frameSignature(a,b);return{a,b,...sig,deformationBreakdown:deformationBreakdown(a,b,sig.aligned.dx,sig.aligned.dy)}})
    },
    animation:{normalTicks:8,south:DIRECTIONS.south,north:DIRECTIONS.north,west:DIRECTIONS.west,east:DIRECTIONS.east.map(frame=>({frame,hFlip:true}))}
  }
}
function getReportText(){return JSON.stringify(buildReport(),null,2)}
async function copyReport(){
  const text=getReportText();
  try{
    if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'&&window.isSecureContext){
      await navigator.clipboard.writeText(text);
      setStatus('Copied v0.5 forensic report to clipboard.','ok','COPIED');
      return;
    }
  }catch{}
  try{
    const ta=document.createElement('textarea');
    ta.value=text;
    ta.setAttribute('readonly','');
    ta.style.position='fixed';
    ta.style.left='-9999px';
    ta.style.top='0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0,ta.value.length);
    const copied=document.execCommand('copy');
    ta.remove();
    if(copied){
      setStatus('Copied v0.5 forensic report to clipboard.','ok','COPIED');
      return;
    }
  }catch{}
  try{
    const blob=new Blob([text],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const opened=window.open(url,'_blank','noopener,noreferrer');
    if(opened){
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      setStatus('Clipboard is blocked here; report opened in a new tab for manual copy.','warn','OPENED');
      return;
    }
    URL.revokeObjectURL(url);
  }catch{}
  setStatus('Clipboard is blocked. Use Download JSON instead.','warn','COPY BLOCKED');
}
function exportJSON(){
  const text=getReportText();
  try{
    const blob=new Blob([text],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='sprite-analysis-v0.5.json';
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    setStatus('Downloaded v0.5 forensic report as JSON.','ok','DOWNLOADED');
  }catch(err){
    try{
      const href='data:application/json;charset=utf-8,'+encodeURIComponent(text);
      const a=document.createElement('a');
      a.href=href;
      a.download='sprite-analysis-v0.5.json';
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatus('Downloaded v0.5 forensic report as JSON.','ok','DOWNLOADED');
    }catch{
      setStatus('JSON download failed: '+err.message,'warn','EXPORT FAILED');
    }
  }
}
function escapeHTML(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}function clampInt(v,min,max){return Math.max(min,Math.min(max,Number.isFinite(v)?Math.round(v):min))}function setStatus(t,s,b){els.statusText.textContent=t;els.statusDot.className=`dot ${s||''}`;els.formatBadge.textContent=b||''}
function renderAll(){if(!state.pixels)return;renderSheet();renderFrameStrip();renderBlueprint();renderProfiles();renderLandmarks();renderSymmetry();renderComparisons();renderForensics();renderSequence();renderRowRuns();renderGeometryFacts()}
window.addEventListener('DOMContentLoaded',loadBundled);


/* =========================
   Sprite Lab v0.5 — Construction Grammar Lab
   ========================= */
function recipeLuma(rgb){return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2]}
function recipeWarm(rgb){return rgb[0]>rgb[1]+22 && rgb[0]>rgb[2]+20}
function recipeGreen(rgb){return rgb[1]>rgb[0]+18 && rgb[1]>rgb[2]+15}
function recipeBlue(rgb){return rgb[2]>rgb[0]+18 && rgb[2]>rgb[1]+8}
function recipeNearWhite(rgb){return Math.min(...rgb)>=220}
function recipeNearBlack(rgb){return Math.max(...rgb)<=35}
function recipeColorRole(index,rgb,usedCount){
  if(index===0)return {role:'transparent',confidence:'fact',basis:'palette index 0 is configured as transparent'};
  if(recipeNearBlack(rgb))return {role:'outline / deepest dark',confidence:usedCount>10?'high':'medium',basis:'near-black palette entry'};
  if(recipeNearWhite(rgb))return {role:'highlight / lightest mark',confidence:'medium',basis:'near-white palette entry'};
  if(recipeWarm(rgb)&&rgb[0]>185&&rgb[1]>90)return {role:'warm skin / red-family accent',confidence:'medium',basis:'warm RGB cluster'};
  if(recipeGreen(rgb))return {role:'green clothing / environmental accent',confidence:'medium',basis:'green RGB cluster'};
  if(recipeBlue(rgb))return {role:'blue clothing / cool shadow',confidence:'medium',basis:'blue RGB cluster'};
  if(recipeWarm(rgb))return {role:'warm midtone / skin shadow',confidence:'low',basis:'warm RGB cluster'};
  const lum=recipeLuma(rgb);
  if(lum<90)return {role:'dark interior shade',confidence:'low',basis:'low luminance'};
  if(lum>190)return {role:'light interior shade',confidence:'low',basis:'high luminance'};
  return {role:'interior accent / shade',confidence:'low',basis:'residual palette class'};
}
function normalizeLandmarks(){
  const ids=['headTop','headBottom','shoulders','torsoBottom','legsBottom','footBaseline'];
  let vals=ids.map(id=>clampInt(Number(state.landmarks?.[id]),0,31));
  for(let i=1;i<vals.length;i++)vals[i]=Math.max(vals[i],vals[i-1]+1);
  if(vals[vals.length-1]>31){vals[vals.length-1]=31;for(let i=vals.length-2;i>=0;i--)vals[i]=Math.min(vals[i],vals[i+1]-1);}
  for(let i=0;i<vals.length;i++)state.landmarks[ids[i]]=clampInt(vals[i],0,31);
  return state.landmarks;
}

function recipeBandList(){
  const l=normalizeLandmarks();
  return [
    {id:'head',label:'Head',y0:l.headTop,y1:l.headBottom},
    {id:'upperBody',label:'Upper body',y0:l.headBottom+1,y1:l.torsoBottom},
    {id:'lowerBody',label:'Lower body',y0:l.torsoBottom+1,y1:l.legsBottom},
    {id:'feet',label:'Feet',y0:l.legsBottom+1,y1:l.footBaseline},
  ].map(b=>({...b,y0:clampInt(b.y0,0,31),y1:clampInt(b.y1,0,31)}));
}
function recipeBandGeometry(frame,band){
  const rows=countRows(state.frameStats[frame]).slice(band.y0,band.y1+1);
  let minX=16,maxX=-1,pixels=0,maxWidth=0;
  for(let y=band.y0;y<=band.y1;y++)for(let x=0;x<16;x++){
    if(pixelAt(frame,x,y).visible){minX=Math.min(minX,x);maxX=Math.max(maxX,x);pixels++;maxWidth=Math.max(maxWidth,rows[y-band.y0]||0)}
  }
  return {id:band.id,label:band.label,y0:band.y0,y1:band.y1,height:band.y1-band.y0+1,minX:minX<16?minX:null,maxX:maxX>=0?maxX:null,width:minX<=maxX?maxX-minX+1:0,pixels,maxRowWidth:maxWidth,avgRowWidth:rows.length?rows.reduce((a,b)=>a+b,0)/rows.length:0,rowWidths:rows};
}
function recipeAlignedVisible(frame,x,y,dx,dy){
  const rx=x+dx,ry=y+dy;
  if(rx<0||rx>=16||ry<0||ry>=32)return false;
  return pixelAt(frame,rx,ry).visible;
}
function recipeMaskGrid(frame,dx=0,dy=0){
  const grid=Array.from({length:32},()=>Array(16).fill(false));
  for(let y=0;y<32;y++)for(let x=0;x<16;x++)grid[y][x]=recipeAlignedVisible(frame,x,y,dx,dy);
  return grid;
}
function recipeCombineMasks(masks,mode){
  const out=Array.from({length:32},()=>Array(16).fill(false));
  for(let y=0;y<32;y++)for(let x=0;x<16;x++){
    const vals=masks.map(m=>m[y][x]);
    out[y][x]=mode==='and'?vals.every(Boolean):vals.some(Boolean);
  }
  return out;
}
function recipeMaskCounts(mask){let n=0;for(const row of mask)for(const v of row)if(v)n++;return n}
function recipeMaskByBand(mask,band){let n=0;for(let y=band.y0;y<=band.y1;y++)for(let x=0;x<16;x++)if(mask[y][x])n++;return n}
function recipeBandStability(maskA,maskB,band){
  let inter=0,union=0;
  for(let y=band.y0;y<=band.y1;y++)for(let x=0;x<16;x++){
    const a=maskA[y][x],b=maskB[y][x]; if(a&&b)inter++; if(a||b)union++;
  }
  return union?inter/union:1;
}
function recipeDirection(name,idle,walkA,walkB){
  const sigA=frameSignature(idle,walkA),sigB=frameSignature(idle,walkB);
  const idleMask=recipeMaskGrid(idle), wa=recipeMaskGrid(walkA,sigA.aligned.dx,sigA.aligned.dy), wb=recipeMaskGrid(walkB,sigB.aligned.dx,sigB.aligned.dy);
  const stable=recipeCombineMasks([idleMask,wa,wb],'and');
  const union=recipeCombineMasks([idleMask,wa,wb],'or');
  const motion=Array.from({length:32},(_,y)=>Array.from({length:16},(_,x)=>union[y][x]&&!stable[y][x]));
  const bands=recipeBandList().map(b=>({
    ...b,
    stableVsUnionPct:recipeBandStability(stable,union,b)*100,
    stablePixels:recipeMaskByBand(stable,b),
    unionPixels:recipeMaskByBand(union,b),
    motionPixels:recipeMaskByBand(motion,b)
  }));
  return {
    name,idle,walk:[walkA,walkB],
    alignment:[{from:idle,to:walkA,dx:sigA.aligned.dx,dy:sigA.aligned.dy,shapeChanges:sigA.aligned.detail.counts.added+sigA.aligned.detail.counts.removed},
               {from:idle,to:walkB,dx:sigB.aligned.dx,dy:sigB.aligned.dy,shapeChanges:sigB.aligned.detail.counts.added+sigB.aligned.detail.counts.removed}],
    stablePixels:recipeMaskCounts(stable),unionPixels:recipeMaskCounts(union),motionPixels:recipeMaskCounts(motion),
    stablePercent:recipeMaskCounts(union)?recipeMaskCounts(stable)/recipeMaskCounts(union)*100:100,
    bands,
    masks:{stable,union,motion}
  };
}
function recipePaletteData(){
  const totals=Array(state.palette.length).fill(0);
  for(const fs of state.frameStats)for(const c of fs.colors)totals[c.paletteIndex]+=c.count;
  return state.palette.map((rgb,index)=>{const role=recipeColorRole(index,rgb,totals[index]||0);return{index,rgb,totalPixels:totals[index]||0,role:role.role,confidence:role.confidence,basis:role.basis,used:totals[index]>0}});
}
function recipeCanonicalRows(frame=0){
  const s=state.frameStats[frame];
  return s.rowRuns.map((runs,y)=>({y,runs:runs.map(r=>({x0:r.x0,x1:r.x1,paletteIndex:r.paletteIndex}))}));
}
function recipeHash(obj){
  const text=JSON.stringify(obj);
  let h=2166136261;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
  return (h>>>0).toString(16).padStart(8,'0');
}
function buildRecipe(){
  if(!state.pixels||state.frameStats.length<3)return null;
  const bands=recipeBandList();
  const directions={
    south:recipeDirection('South',0,3,4),
    north:recipeDirection('North',1,5,6),
    west:recipeDirection('West',2,7,8)
  };
  const front=state.frameStats[0], side=state.frameStats[2];
  const palette=recipePaletteData();
  const summary={
    canvas:{width:CELL_W,height:CELL_H},
    figure:{width:front.bbox?.width??0,height:front.bbox?.height??0},
    margins:{top:front.bbox?.y0??null,bottom:front.bbox?(31-front.bbox.y1):null,left:front.bbox?.x0??null,right:front.bbox?(15-front.bbox.x1):null},
    centerlineX:state.centerlineX,
    canonicalFrames:{southIdle:0,northIdle:1,westIdle:2},
    visibleColors:[...new Set(front.colors.map(c=>c.paletteIndex))].length,
    sheetUsedColors:[...new Set(state.frameStats.flatMap(f=>f.colors.map(c=>c.paletteIndex)))].length,
    indexedPaletteSize:state.palette.length
  };
  const rules=[
    {kind:'FACT',text:`Canonical object cell is ${CELL_W}×${CELL_H}px.`},
    {kind:'FACT',text:`South idle figure measures ${front.bbox?.width||0}×${front.bbox?.height||0}px inside the cell.`},
    {kind:'FACT',text:`South idle bbox is x=${front.bbox?.x0}..${front.bbox?.x1}, y=${front.bbox?.y0}..${front.bbox?.y1}.`},
    {kind:'FACT',text:`Walking poses retain the same measured figure height while their bbox shifts down one pixel (baseline 31 versus 30).`},
    {kind:'DERIVED',text:`Best-fit walking alignment for South/North/West is expected to prefer a 0,+1 source-frame offset before judging local deformation.`},
    {kind:'DERIVED',text:`The construction model should anchor the head and upper body, then apply local lower-body/foot deformation for the walk cycle.`},
    {kind:'DERIVED',text:`Horizontal visual mass should remain close to the centerline; avoid torso-wide side-to-side bobbing.`},
    {kind:'METHOD',text:`Palette roles are heuristic RGB classifications. They are not source-authored semantic labels.`}
  ];
  const directionRows=Object.entries(directions).map(([dir,d])=>({direction:dir,idle:d.idle,walk:d.walk.join(', '),alignment:d.alignment.map(a=>`(${a.dx},${a.dy})`).join(' / '),stablePercent:+d.stablePercent.toFixed(2),motionPixels:d.motionPixels}));
  const recipe={
    schemaVersion:'0.4',tool:'Sprite Lab v0.4',source:state.source,
    evidence:{decoder:{mode:state.mode,bitDepth:state.png?.bitDepth??null,colorType:state.png?.colorType??null,paletteIndex0Transparent:state.mode==='indexed'&&els.palette0Toggle.checked},sheet:{width:state.width,height:state.height},cell:{width:CELL_W,height:CELL_H},frameCount:state.frameStats.length},
    summary,landmarks:{...state.landmarks},bands:bands.map(b=>{const g=recipeBandGeometry(0,b);return g}),
    directions:{south:{...directions.south,masks:undefined},north:{...directions.north,masks:undefined},west:{...directions.west,masks:undefined}},
    palette,
    rules,
    canonicalRowRuns:{frame:0,rows:recipeCanonicalRows(0)},
    sourceIntegrity:{recipeHash:null}
  };
  recipe.sourceIntegrity.recipeHash=recipeHash({...recipe,sourceIntegrity:{recipeHash:null}});
  return {recipe,directions};
}
function drawRecipeMask(canvas,mask,mode){
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,512);ctx.imageSmoothingEnabled=false;
  // checkerboard backdrop
  for(let y=0;y<32;y++)for(let x=0;x<16;x++){ctx.fillStyle=((x+y)&1)?'#e4e1d7':'#f4f2eb';ctx.fillRect(x*16,y*16,16,16)}
  for(let y=0;y<32;y++)for(let x=0;x<16;x++)if(mask[y][x]){ctx.fillStyle=mode==='stable'?'#315946':'#8b4d2c';ctx.fillRect(x*16,y*16,16,16)}
  ctx.strokeStyle='#73559c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo((state.centerlineX+.5)*16,0);ctx.lineTo((state.centerlineX+.5)*16,512);ctx.stroke();
}
function drawRecipeScaffold(){
  const ctx=els.recipeSilhouetteCanvas.getContext('2d');ctx.clearRect(0,0,256,512);renderPixelGrid(ctx,0,16,false,false);
  for(const b of recipeBandList()){
    const y=b.y0*16;ctx.strokeStyle=b.id==='head'?'#416b8e':b.id==='upperBody'?'#5b7f68':b.id==='lowerBody'?'#8b6b3d':'#8b4d2c';ctx.lineWidth=1;ctx.strokeRect(0,y,255,(b.y1-b.y0+1)*16-1);
    ctx.fillStyle='#263c31';ctx.font='bold 10px ui-monospace,monospace';ctx.fillText(`${b.label.toUpperCase()} y=${b.y0}–${b.y1}`,3,Math.max(10,y+11));
  }
  ctx.strokeStyle='#73559c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo((state.centerlineX+.5)*16,0);ctx.lineTo((state.centerlineX+.5)*16,512);ctx.stroke();
}
function renderRecipe(force=false){
  if(!state.pixels||!els.recipeSummary)return;
  const data=buildRecipe();if(!data)return;
  const {recipe,directions}=data;state.recipe=recipe;
  els.recipeSummary.innerHTML=[
    ['Cell',`${recipe.summary.canvas.width}×${recipe.summary.canvas.height}`],
    ['Figure',`${recipe.summary.figure.width}×${recipe.summary.figure.height}`],
    ['South idle colors',recipe.summary.visibleColors],
    ['Sheet-used colors',recipe.summary.sheetUsedColors],
    ['Centerline',`x=${recipe.summary.centerlineX}`],
    ['South stable core',`${directions.south.stablePercent.toFixed(1)}%`],
    ['Recipe hash',recipe.sourceIntegrity.recipeHash]
  ].map(([k,v])=>`<div class="recipe-summary-card"><span>${escapeHTML(String(k))}</span><b>${escapeHTML(String(v))}</b></div>`).join('');
  els.recipeRules.innerHTML=recipe.rules.map(r=>`<div class="recipe-rule"><b class="rule-${r.kind.toLowerCase()}">${r.kind}</b><span>${escapeHTML(r.text)}</span></div>`).join('');
  els.recipeDirections.innerHTML=`<div class="recipe-dir-head"><span>Direction</span><span>Idle</span><span>Walk</span><span>Align</span><span>Stable core</span></div>`+Object.entries(directions).map(([dir,d])=>`<div class="recipe-dir-row"><b>${dir.toUpperCase()}</b><span>${d.idle}</span><span>${d.walk.join(', ')}</span><span>${d.alignment.map(a=>`${a.dx},${a.dy}`).join(' / ')}</span><span>${d.stablePercent.toFixed(1)}%</span></div>`).join('');
  els.recipeBands.innerHTML=`<div class="recipe-band-head"><span>Band</span><span>Y</span><span>Pixels</span><span>Max W</span><span>Avg W</span><span>BBox</span></div>`+recipe.bands.map(b=>`<div class="recipe-band-row"><b>${b.label}</b><span>${b.y0}–${b.y1}</span><span>${b.pixels}</span><span>${b.maxRowWidth}</span><span>${b.avgRowWidth.toFixed(2)}</span><span>${b.width?`${b.minX}–${b.maxX}`:'—'}</span></div>`).join('');
  els.recipePaletteRoles.innerHTML=`<div class="recipe-band-head"><span>Idx</span><span>RGB</span><span>Total px</span><span>Suggested role</span><span>Confidence</span></div>`+recipe.palette.map(p=>`<div class="recipe-palette-row"><b>${p.index}</b><span>${p.rgb.join(', ')}</span><span>${p.totalPixels}</span><span>${escapeHTML(p.role)}</span><span>${escapeHTML(p.confidence)}</span></div>`).join('');
  const dsl={schemaVersion:recipe.schemaVersion,source:recipe.source,summary:recipe.summary,landmarks:recipe.landmarks,bands:recipe.bands,directions:Object.fromEntries(Object.entries(directions).map(([k,d])=>[k,{idle:d.idle,walk:d.walk,alignment:d.alignment,stablePercent:d.stablePercent,motionPixels:d.motionPixels,bands:d.bands}])),palette:recipe.palette,rules:recipe.rules,recipeHash:recipe.sourceIntegrity.recipeHash};
  els.recipeDsl.textContent=JSON.stringify(dsl,null,2);
  drawRecipeScaffold();drawRecipeMask(els.recipeInvariantCanvas,directions.south.masks.stable,'stable');drawRecipeMask(els.recipeMotionCanvas,directions.south.masks.motion,'motion');
  if(els.recipeJsonBtn)els.recipeJsonBtn.disabled=false;if(els.recipeMdBtn)els.recipeMdBtn.disabled=false;
}
function recipeMarkdown(){
  const r=state.recipe||buildRecipe()?.recipe;if(!r)return '';
  const data=buildRecipe();const dirs=data.directions;
  const lines=[];
  lines.push('# Sprite Lab v0.4 — Construction Recipe\n');
  lines.push(`Source: **${r.source}**  `);lines.push(`Recipe hash: **${r.sourceIntegrity.recipeHash}**\n`);
  lines.push('## Evidence boundary\n');lines.push('Measured facts are reproduced from the loaded indexed PNG. Derived rules are explicitly labeled. Palette roles are heuristic RGB classifications.\n');
  lines.push('## Core geometry\n');lines.push(`- Cell: ${r.summary.canvas.width}×${r.summary.canvas.height}px`);lines.push(`- Figure: ${r.summary.figure.width}×${r.summary.figure.height}px`);lines.push(`- Centerline: x=${r.summary.centerlineX}`);lines.push(`- South idle visible colours: ${r.summary.visibleColors}`);lines.push(`- Sheet-used visible colours: ${r.summary.sheetUsedColors}`);lines.push(`- South idle bbox: x=${r.summary.figure.bbox.x0}..${r.summary.figure.bbox.x1}, y=${r.summary.figure.bbox.y0}..${r.summary.figure.bbox.y1}\n`);
  lines.push('## Construction bands\n');lines.push('| Band | Y range | Pixels | Max row width | Avg row width | X span |');lines.push('|---|---:|---:|---:|---:|---:|');for(const b of r.bands)lines.push(`| ${b.label} | ${b.y0}–${b.y1} | ${b.pixels} | ${b.maxRowWidth} | ${b.avgRowWidth.toFixed(2)} | ${b.minX}–${b.maxX} |`);lines.push('');
  lines.push('## Direction model\n');lines.push('| Direction | Idle | Walk frames | Best-fit alignment | Stable core | Motion px |');lines.push('|---|---:|---|---|---:|---:|');for(const [k,d] of Object.entries(dirs))lines.push(`| ${k} | ${d.idle} | ${d.walk.join(', ')} | ${d.alignment.map(a=>`(${a.dx},${a.dy})`).join(' / ')} | ${d.stablePercent.toFixed(1)}% | ${d.motionPixels} |`);lines.push('');
  lines.push('## Derived rules\n');for(const rule of r.rules)lines.push(`- **${rule.kind}:** ${rule.text}`);lines.push('');
  lines.push('## Palette role suggestions\n');lines.push('| Idx | RGB | Total px | Role suggestion | Confidence | Basis |');lines.push('|---:|---|---:|---|---|---|');for(const p of r.palette)lines.push(`| ${p.index} | ${p.rgb.join(', ')} | ${p.totalPixels} | ${p.role} | ${p.confidence} | ${p.basis} |`);lines.push('');
  lines.push('## Canonical south idle row runs\n');lines.push('```json');lines.push(JSON.stringify(r.canonicalRowRuns,null,2));lines.push('```\n');
  lines.push('## Interpretation\n');lines.push('The recipe is intended as a reproducible construction model: keep the cell and canonical silhouette constraints fixed, preserve the head/upper-body scaffold, and introduce walking motion through measured lower-body/foot deformation plus the observed alignment offset.');
  return lines.join('\n');
}
function downloadTextFile(filename,text,type){
  try{const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);return true}catch(err){return false}
}
function exportRecipeJSON(){const r=state.recipe||buildRecipe()?.recipe;if(!r){setStatus('Recipe unavailable until a sprite is loaded.','warn','NO RECIPE');return}const ok=downloadTextFile('brendan-construction-recipe-v0.4.json',JSON.stringify(r,null,2),'application/json;charset=utf-8');setStatus(ok?'Downloaded construction recipe JSON.':'Recipe JSON download failed.','ok','RECIPE JSON')}
function exportRecipeMarkdown(){const md=recipeMarkdown();if(!md){setStatus('Recipe unavailable until a sprite is loaded.','warn','NO RECIPE');return}const ok=downloadTextFile('brendan-construction-recipe-v0.4.md',md,'text/markdown;charset=utf-8');setStatus(ok?'Downloaded construction recipe Markdown.':'Recipe Markdown download failed.','ok','RECIPE MD')}


/* =========================
   Sprite Lab v0.5 — Construction Grammar / Template Extraction
   ========================= */
function grammarVisible(frame,x,y){return x>=0&&x<CELL_W&&y>=0&&y<CELL_H&&pixelAt(frame,x,y).visible}
function grammarIndex(frame,x,y){const p=pixelAt(frame,x,y);return p.visible?p.idx:0}
function grammarMask(frame){return Array.from({length:CELL_H},(_,y)=>Array.from({length:CELL_W},(_,x)=>grammarVisible(frame,x,y)))}
function grammarRowSignature(frame,y){
  const runs=[];let x=0;
  while(x<CELL_W){
    if(!grammarVisible(frame,x,y)){x++;continue}
    const x0=x;
    while(x<CELL_W&&grammarVisible(frame,x,y))x++;
    runs.push([x0,x-1]);
  }
  return {y,x0:runs.length?runs[0][0]:null,x1:runs.length?runs[runs.length-1][1]:null,width:runs.length?runs[runs.length-1][1]-runs[0][0]+1:0,runCount:runs.length,runs};
}
function grammarRowSpanPrimitives(frame){
  const rows=Array.from({length:CELL_H},(_,y)=>grammarRowSignature(frame,y));
  const primitives=[];let start=null,last=null;
  const same=(a,b)=>a.x0===b.x0&&a.x1===b.x1&&a.runCount===b.runCount&&JSON.stringify(a.runs)===JSON.stringify(b.runs);
  for(const row of rows){
    if(start===null){if(row.width){start=row.y;last={...row};}continue;}
    if(row.width&&same(row,last)){last={...row};continue;}
    primitives.push({y0:start,y1:last.y,x0:last.x0,x1:last.x1,height:last.y-start+1,width:last.width,runCount:last.runCount,runs:last.runs});
    start=null;last=null;
    if(row.width){start=row.y;last={...row};}
  }
  if(start!==null)primitives.push({y0:start,y1:last.y,x0:last.x0,x1:last.x1,height:last.y-start+1,width:last.width,runCount:last.runCount,runs:last.runs});
  return {rows,primitives};
}
function grammarBandForBBox(y0,y1){
  const bands=recipeBandList();let best=null,bestOverlap=-1;
  for(const b of bands){const ov=Math.max(0,Math.min(y1,b.y1)-Math.max(y0,b.y0)+1);if(ov>bestOverlap){best=b;bestOverlap=ov;}}
  return best?best.id:'unbanded';
}
function grammarPaletteComponents(frame){
  const visited=new Set(),comps=[],paletteComponentOrdinal={};
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){
    if(!grammarVisible(frame,x,y))continue;
    const idx=grammarIndex(frame,x,y),key=`${x},${y}`;
    if(visited.has(key))continue;
    const q=[[x,y]],pts=[];visited.add(key);
    while(q.length){
      const [cx,cy]=q.pop();pts.push([cx,cy]);
      for(const [nx,ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]]){
        if(nx<0||nx>=CELL_W||ny<0||ny>=CELL_H)continue;
        const nk=`${nx},${ny}`;
        if(visited.has(nk)||!grammarVisible(frame,nx,ny)||grammarIndex(frame,nx,ny)!==idx)continue;
        visited.add(nk);q.push([nx,ny]);
      }
    }
    const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
    const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const ordinal=paletteComponentOrdinal[idx]||0;paletteComponentOrdinal[idx]=ordinal+1;
    comps.push({id:`p${idx}-c${ordinal}`,paletteIndex:idx,pixels:pts.length,bbox:{x0,x1,y0,y1,width:x1-x0+1,height:y1-y0+1},band:grammarBandForBBox(y0,y1),connectivity:4});
  }
  return comps.sort((a,b)=>b.pixels-a.pixels);
}
function grammarPaletteAdjacency(frame){
  const edges={};
  const add=(a,b)=>{if(a===0||b===0||a===b)return;const k=a<b?`${a}-${b}`:`${b}-${a}`;edges[k]=(edges[k]||0)+1};
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++)if(grammarVisible(frame,x,y)){
    const a=grammarIndex(frame,x,y);
    if(grammarVisible(frame,x+1,y))add(a,grammarIndex(frame,x+1,y));
    if(grammarVisible(frame,x,y+1))add(a,grammarIndex(frame,x,y+1));
  }
  return Object.entries(edges).map(([key,count])=>{const[a,b]=key.split('-').map(Number);return{a,b,count}}).sort((a,b)=>b.count-a.count);
}
function grammarSymmetry(frame){
  const mask=grammarMask(frame);let compared=0,mismatch=0;const asymmetric=[];
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){
    const mx=2*state.centerlineX-x+1;if(mx<0||mx>=CELL_W)continue;
    const a=mask[y][x],b=mask[y][mx];compared++;if(a!==b){mismatch++;if(a)asymmetric.push([x,y]);}
  }
  return{centerlineX:state.centerlineX,compared,mismatch,mismatchPercent:compared?mismatch/compared*100:0,asymmetricPixels:asymmetric.slice(0,160),asymmetricCount:asymmetric.length};
}
function grammarBandPaletteCounts(frame,band){
  const out={};
  for(let y=band.y0;y<=band.y1;y++)for(let x=0;x<CELL_W;x++)if(grammarVisible(frame,x,y)){const i=grammarIndex(frame,x,y);out[i]=(out[i]||0)+1;}
  return Object.fromEntries(Object.entries(out).sort((a,b)=>b[1]-a[1]));
}
function grammarSlotStats(frame,slot){
  let pixels=0;const palette={},xs=[],ys=[];
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++)if(slot.contains(x,y)&&grammarVisible(frame,x,y)){
    pixels++;xs.push(x);ys.push(y);const i=grammarIndex(frame,x,y);palette[i]=(palette[i]||0)+1;
  }
  const bbox=pixels?{x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys),width:Math.max(...xs)-Math.min(...xs)+1,height:Math.max(...ys)-Math.min(...ys)+1}:null;
  return{...slot,pixels,bbox,palette:Object.fromEntries(Object.entries(palette).sort((a,b)=>b[1]-a[1]))};
}
function grammarSemanticSlots(frame){
  const measured=recipeBandList().map(b=>({...b,...recipeBandGeometry(frame,b)}));
  const head=measured.find(b=>b.id==='head'),upper=measured.find(b=>b.id==='upperBody'),lower=measured.find(b=>b.id==='lowerBody'),feet=measured.find(b=>b.id==='feet');
  const cx=state.centerlineX;
  const safeSpan=(b,fallback0,fallback1)=>({x0:Number.isFinite(b?.minX)?b.minX:fallback0,x1:Number.isFinite(b?.maxX)?b.maxX:fallback1});
  const hs=safeSpan(head,0,15), us=safeSpan(upper,0,15), ls=safeSpan(lower,0,15), fs=safeSpan(feet,0,15);
  const slots=[
    {id:'head-mass',label:'Head mass',status:'AUTHOR-ASSIGNED',basis:'measured head band bbox',x0:hs.x0,x1:hs.x1,y0:head.y0,y1:head.y1,contains(x,y){return x>=this.x0&&x<=this.x1&&y>=this.y0&&y<=this.y1;}},
    {id:'torso-core',label:'Torso core',status:'AUTHOR-ASSIGNED',basis:'upper-body band with symmetric core around centerline',x0:Math.max(us.x0,4),x1:Math.min(us.x1,11),y0:upper.y0,y1:upper.y1,contains(x,y){return x>=this.x0&&x<=this.x1&&y>=this.y0&&y<=this.y1;}},
    {id:'arm-envelope',label:'Arm envelope',status:'AUTHOR-ASSIGNED',basis:'upper-body lateral envelope outside torso core',x0:us.x0,x1:us.x1,y0:upper.y0,y1:upper.y1,contains(x,y){return y>=this.y0&&y<=this.y1&&(x<=this.x0+(Math.min(2,this.x1-this.x0))||x>=this.x1-(Math.min(2,this.x1-this.x0)));}},
    {id:'left-leg',label:'Left leg candidate',status:'AUTHOR-ASSIGNED',basis:'lower-body half split at centerline',x0:ls.x0,x1:cx,y0:lower.y0,y1:lower.y1,contains(x,y){return y>=this.y0&&y<=this.y1&&x>=this.x0&&x<=this.x1;}},
    {id:'right-leg',label:'Right leg candidate',status:'AUTHOR-ASSIGNED',basis:'lower-body half split at centerline',x0:cx+1,x1:ls.x1,y0:lower.y0,y1:lower.y1,contains(x,y){return y>=this.y0&&y<=this.y1&&x>=this.x0&&x<=this.x1;}},
    {id:'feet',label:'Feet / shoe contact',status:'AUTHOR-ASSIGNED',basis:'measured foot baseline bbox',x0:fs.x0,x1:fs.x1,y0:feet.y0,y1:feet.y1,contains(x,y){return x>=this.x0&&x<=this.x1&&y>=this.y0&&y<=this.y1;}}
  ];
  const stats=slots.map(s=>grammarSlotStats(frame,s)).map(s=>{const{contains,...out}=s;return out;});
  const owners=Array.from({length:CELL_H},()=>Array(CELL_W).fill(0));
  const bySlot=slots.map((s,i)=>({s,i}));
  let overlapPixels=0,coveredPixels=0,visiblePixels=0;
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++)if(grammarVisible(frame,x,y)){
    visiblePixels++;
    const hits=bySlot.filter(({s})=>s.contains(x,y)).map(({i})=>i);
    if(hits.length)coveredPixels++;
    if(hits.length>1)overlapPixels++;
    if(hits.length)owners[y][x]=hits[0]+1;
  }
  const byId=Object.fromEntries(stats.map(s=>[s.id,s]));
  // Recompute slot pixel counts from the disjoint owner partition so coverage is mathematically auditable.
  for(let i=0;i<stats.length;i++){
    let n=0;for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++)if(owners[y][x]===i+1)n++;
    stats[i].pixels=n;
    const palette={};const xs=[],ys=[];
    for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++)if(owners[y][x]===i+1){const idx=grammarIndex(frame,x,y);palette[idx]=(palette[idx]||0)+1;xs.push(x);ys.push(y);}
    stats[i].palette=Object.fromEntries(Object.entries(palette).sort((a,b)=>b[1]-a[1]));
    if(n)stats[i].bbox={x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys),width:Math.max(...xs)-Math.min(...xs)+1,height:Math.max(...ys)-Math.min(...ys)+1};
  }
  const unassignedPixels=visiblePixels-coveredPixels;
  return {slots:stats,coveragePixels:coveredPixels,targetVisiblePixels:visiblePixels,coveragePercent:visiblePixels?coveredPixels/visiblePixels*100:100,unassignedPixels,overlapPixels,partitionComplete:coveredPixels===visiblePixels&&overlapPixels===0,ownerMap:owners};
}
// frameSignature.raw is a frameDelta; only aligned has the {detail: frameDelta} wrapper.
function grammarWalkTransforms(){
  const defs={south:[0,3,4],north:[1,5,6],west:[2,7,8]};const out={};
  for(const[dir,[idle,a,b]]of Object.entries(defs)){
    const pairs=[a,b].map(frame=>{const sig=frameSignature(idle,frame),d=deformationBreakdown(idle,frame,sig.aligned.dx,sig.aligned.dy);return{from:idle,to:frame,dx:sig.aligned.dx,dy:sig.aligned.dy,rawShapeChanges:sig.raw.counts.added+sig.raw.counts.removed,alignedShapeChanges:sig.aligned.detail.counts.added+sig.aligned.detail.counts.removed,stablePercent:(sig.aligned.detail.silhouetteIoU||0)*100,deformationByBand:d.regions.map(x=>({band:x.name,stable:x.stabilityPct,changed:x.changed}))};});
    out[dir]={idle,walk:[a,b],pairs};
  }
  return out;
}
function grammarRegionSummary(frame){
  const comps=grammarPaletteComponents(frame);
  return{
    componentCount:comps.length,
    components:comps,
    largeComponents:comps.slice(0,24),
    paletteAdjacency:grammarPaletteAdjacency(frame),
    bandPalette:Object.fromEntries(recipeBandList().map(b=>[b.id,grammarBandPaletteCounts(frame,b)])),
    componentPaletteCounts:Object.fromEntries(Object.entries(comps.reduce((m,c)=>{m[c.paletteIndex]=(m[c.paletteIndex]||0)+1;return m},{})).sort((a,b)=>Number(a[0])-Number(b[0])))
  };
}
function grammarBuild(){
  if(!state.pixels||state.frameStats.length<9)return null;
  const span=grammarRowSpanPrimitives(0),regions=grammarRegionSummary(0),symmetry=grammarSymmetry(0),motion=grammarWalkTransforms(),semantics=grammarSemanticSlots(0),visiblePixels=state.frameStats[0].visiblePixels||0;
  const recipe=(state.recipe||buildRecipe()?.recipe);if(!recipe)return null;
  const grammar={
    schemaVersion:'0.5.3',tool:'Sprite Lab v0.8',source:state.source,
    evidenceBoundary:{facts:['indexed PNG decode','16×32 cell geometry','visible-pixel occupancy','palette indices','row spans','connected same-palette components'],derived:['row-span primitive compression','best-fit walk translation','symmetry mismatch','walk residual deformation','semantic slot proposals from measured bands and centerline'],interpretation:['semantic anatomy labels are hypotheses / author assignments','palette roles are heuristic RGB classifications; palette topology is measured']},
    coordinateSystem:{cellWidth:CELL_W,cellHeight:CELL_H,origin:'top-left',integerPixels:true,centerlineX:state.centerlineX},
    canonical:{frame:0,figure:recipe.summary.figure,landmarks:{...state.landmarks},rowSpans:span.rows,primitives:span.primitives,canonicalRowRuns:recipe.canonicalRowRuns.rows},
    bands:recipe.bands,
    palette:recipe.palette,
    regions,
    symmetry,
    semantics:{status:semantics.partitionComplete?'PARTITIONED-HYPOTHESIS':'INCOMPLETE-HYPOTHESIS',slots:semantics.slots,coveragePixels:semantics.coveragePixels,targetVisiblePixels:visiblePixels,coveragePercent:semantics.coveragePercent,unassignedPixels:semantics.unassignedPixels,overlapPixels:semantics.overlapPixels,partitionComplete:semantics.partitionComplete,notes:['Slots are construction aids, not source-authored anatomy labels.','Do not use slot labels as evidence of original artist intent.','Slot predicates are explicit author assignments constrained by measured bands and centerline.','Coverage and overlap are audited on visible source pixels; the semantic partition is disjoint when partitionComplete is true.']} ,
    motion,
    reconstruction:{mode:'exact-raster-program',sourceFrame:0,program:'canonicalRowRuns + paletteIndex + transparentIndex0',targetPixels:state.frameStats[0].visiblePixels||0},
    grammarRules:[
      {kind:'FACT',text:'Visible geometry is authored inside a 16×32 object cell; the frame 0 figure is 14×21.'},
      {kind:'DERIVED',text:'Silhouette can be represented as contiguous row-span primitives without resizing or anti-aliasing.'},
      {kind:'DERIVED',text:'Same-palette connected components and palette adjacency are measured from indexed pixel topology.'},
      {kind:'DERIVED',text:'Walk transforms are modeled as an integer translation plus a residual local deformation mask.'},
      {kind:'INTERPRETATION',text:'Semantic anatomy should be mapped onto measured topology rather than inferred from color alone.'},
      {kind:'INTERPRETATION',text:'v0.5.2 semantic slots are explicit author-assigned hypotheses, not claims about original anatomy.'},
      {kind:'INTERPRETATION',text:'A new-character generator still needs parameterized semantic region drawing rules and substitutions; reconstruction proof remains a source replay proof.'}
    ]
  };
  grammar.proof=rebuildFromGrammar(0,grammar);return grammar;
}
function drawGrammarSilhouette(){
  const canvas=els.grammarSilhouetteCanvas,ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,512);ctx.imageSmoothingEnabled=false;
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){ctx.fillStyle=((x+y)&1)?'#e4e1d7':'#f4f2eb';ctx.fillRect(x*16,y*16,16,16);}
  const span=grammarRowSpanPrimitives(0);span.rows.forEach(r=>{if(!r.width)return;ctx.fillStyle='#315946';for(const[x0,x1]of r.runs)ctx.fillRect(x0*16,r.y*16,(x1-x0+1)*16,16);});
  ctx.strokeStyle='#73559c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo((state.centerlineX+.5)*16,0);ctx.lineTo((state.centerlineX+.5)*16,512);ctx.stroke();
  ctx.fillStyle='#1f2a23';ctx.font='bold 10px ui-monospace,monospace';for(const p of span.primitives)ctx.fillText(`P ${p.y0}–${p.y1} · ${p.x0}–${p.x1}`,3,Math.max(10,p.y0*16+11));
}
function renderGrammarPrimitiveTable(g){els.grammarPrimitiveTable.innerHTML='<div class="grammar-row span head"><span>Y</span><span>X0</span><span>X1</span><span>W</span><span>Span program</span></div>'+g.canonical.primitives.map(p=>`<div class="grammar-row span"><span class="grammar-mono">${p.y0}–${p.y1}</span><span>${p.x0??'—'}</span><span>${p.x1??'—'}</span><span>${p.width||0}</span><span class="grammar-mono">${p.runs.map(r=>r.join('–')).join(' | ')}</span></div>`).join('');}
function renderGrammarRegions(g){
  const rows=g.regions.largeComponents;
  els.grammarRegionTable.innerHTML='<div class="grammar-row region head"><span>Pal</span><span>Pixels</span><span>BBox</span><span>Band</span><span>Role / topology</span></div>'+rows.map(r=>{const p=g.palette.find(x=>x.index===r.paletteIndex);return`<div class="grammar-row region"><span class="grammar-mono">${r.paletteIndex}</span><span>${r.pixels}</span><span class="grammar-mono">${r.bbox.x0}–${r.bbox.x1} × ${r.bbox.y0}–${r.bbox.y1}</span><span>${r.band}</span><span>${escapeHTML(p?.role||'palette region')} · ${r.connectivity}-connected</span></div>`;}).join('')+`<div class="grammar-note">${g.regions.componentCount} same-palette connected components in frame 0. The table shows the largest components; component identity is topological, not anatomical.</div>`;
}
function renderGrammarSemantics(g){
  const slots=g.semantics.slots;
  const note=`Coverage ${g.semantics.coveragePixels}/${g.semantics.targetVisiblePixels} (${g.semantics.coveragePercent.toFixed(1)}%) · unassigned ${g.semantics.unassignedPixels} · overlap ${g.semantics.overlapPixels} · ${g.semantics.partitionComplete?'DISJOINT PARTITION':'INCOMPLETE PARTITION'}`;
  els.grammarSemanticTable.innerHTML='<div class="grammar-row semantic head"><span>Slot</span><span>Y</span><span>X</span><span>Pixels</span><span>Status / basis</span></div>'+slots.map(s=>`<div class="grammar-row semantic"><span><strong>${escapeHTML(s.label)}</strong><small>${escapeHTML(s.id)}</small></span><span>${s.y0}–${s.y1}</span><span>${s.x0}–${s.x1}</span><span>${s.pixels}</span><span><b>${escapeHTML(s.status)}</b><small>${escapeHTML(s.basis)}</small></span></div>`).join('')+`<div class="grammar-note">${escapeHTML(note)}. Semantic slots are construction hypotheses; they do not assert original artist intent.</div>`;
}
function renderGrammarMotion(g){
  let html='<div class="grammar-row motion head"><span>Dir</span><span>Pair</span><span>Align</span><span>IoU</span><span>Residual deformation</span></div>';
  for(const[dir,d]of Object.entries(g.motion))for(const p of d.pairs){const residual=p.deformationByBand.map(b=>`${b.band}:${b.changed}`).join(' · ');html+=`<div class="grammar-row motion"><span>${dir.toUpperCase()}</span><span>${p.to}</span><span class="grammar-mono">(${p.dx},${p.dy})</span><span>${p.stablePercent.toFixed(1)}%</span><span class="grammar-mono">${residual}</span></div>`;}
  html+=`<div class="grammar-note">Transform model: integer best-fit translation first, then local residual deformation. This keeps the global bounce separate from feet/leg reshaping.</div>`;els.grammarMotionTable.innerHTML=html;
}
function rebuildFromGrammar(frame,grammar){
  const target=state.frameStats[frame];if(!target)return{status:'fail',reason:'frame unavailable'};
  const out=Array.from({length:CELL_H},()=>Array(CELL_W).fill(0)),rows=grammar.canonical.canonicalRowRuns;
  for(const row of rows)for(const run of row.runs)for(let x=run.x0;x<=run.x1;x++)out[row.y][x]=run.paletteIndex;
  let targetN=0,same=0,diff=0;
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){const t=pixelAt(frame,x,y).idx??0;targetN+=t!==0?1:0;if(out[y][x]===t)same++;else diff++;}
  return{status:diff===0?'pass':'warn',targetPixels:targetN,samePixels:same,diffPixels:diff,accuracy:(CELL_W*CELL_H?same/(CELL_W*CELL_H)*100:0),reconstructed:out};
}
function drawRebuild(g,proof){
  const canvas=els.grammarRebuildCanvas,ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,512);ctx.imageSmoothingEnabled=false;
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){ctx.fillStyle=((x+y)&1)?'#e4e1d7':'#f4f2eb';ctx.fillRect(x*16,y*16,16,16);}
  if(!proof.reconstructed)return;
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){const idx=proof.reconstructed[y][x];if(idx===0)continue;const rgb=state.palette[idx]||[0,0,0];ctx.fillStyle=`rgb(${rgb.join(',')})`;ctx.fillRect(x*16,y*16,16,16);}
  const b=state.frameStats[0].bbox;if(b){ctx.strokeStyle='#73559c';ctx.lineWidth=2;ctx.strokeRect(b.x0*16,b.y0*16,b.width*16,b.height*16);}
}
function renderGrammar(force=false,doRebuild=false){
  if(!state.pixels||!els.grammarSummary)return;const g=grammarBuild();if(!g)return;state.grammar=g;const p=g.proof;
  els.grammarSummary.innerHTML=[['Primitives',g.canonical.primitives.length],['Palette regions',g.regions.componentCount],['Palette edges',g.regions.paletteAdjacency.length],['Semantic partition',`${g.semantics.coveragePixels}/${g.semantics.targetVisiblePixels}`],['South walk IoU',`${((g.motion?.south?.pairs?.[0]?.stablePercent)??0).toFixed(1)}%`],['Rebuild diff',p.diffPixels===0?'0 px':`${p.diffPixels} px`]].map(([k,v])=>`<div class="grammar-summary-card"><span>${escapeHTML(String(k))}</span><b>${escapeHTML(String(v))}</b></div>`).join('');
  drawGrammarSilhouette();renderGrammarPrimitiveTable(g);renderGrammarRegions(g);renderGrammarSemantics(g);renderGrammarMotion(g);drawRebuild(g,p);
  const cls=p.status==='pass'?'grammar-pass':p.status==='warn'?'grammar-warn':'grammar-fail';
  els.grammarProofMetrics.innerHTML=[['Status',`<span class="grammar-status ${cls}">${p.status.toUpperCase()}</span>`],['Pixels compared',CELL_W*CELL_H],['Exact matches',p.samePixels],['Pixel diff',p.diffPixels],['Cell accuracy',`${p.accuracy.toFixed(2)}%`],['Mode','Exact raster replay; semantic partition audited separately']].map(([k,v])=>`<div class="fact"><span>${escapeHTML(String(k))}</span><b>${typeof v==='string'&&v.includes('grammar-status')?v:escapeHTML(String(v))}</b></div>`).join('');
  els.grammarDsl.textContent=JSON.stringify(g,null,2);els.grammarJsonBtn.disabled=false;els.grammarMdBtn.disabled=false;
  if(doRebuild)setStatus(p.diffPixels===0?'Grammar rebuilt the canonical frame exactly.':'Grammar rebuilt with residual differences.','ok',p.diffPixels===0?'GRAMMAR PROOF':'GRAMMAR WARN');
}
function grammarMarkdown(){
  const g=state.grammar||grammarBuild();if(!g)return '';
  const lines=[`# Sprite Lab ${g.tool} — Construction Grammar`,`Source: **${g.source}**`,`Schema: **${g.schemaVersion}**`,'','## Evidence boundary'];
  for(const e of g.evidenceBoundary.facts)lines.push(`- FACT: ${e}`);for(const e of g.evidenceBoundary.derived)lines.push(`- DERIVED: ${e}`);for(const e of g.evidenceBoundary.interpretation)lines.push(`- INTERPRETATION: ${e}`);
  lines.push('','## Canonical geometry',`- Cell: ${g.coordinateSystem.cellWidth}×${g.coordinateSystem.cellHeight}px`,`- Frame: ${g.canonical.frame}`,`- Figure: ${g.canonical.figure.width}×${g.canonical.figure.height}px`,`- Centerline: x=${g.coordinateSystem.centerlineX}`,'');
  lines.push('## Silhouette primitives','| Y | X0 | X1 | Width | Row runs |','|---:|---:|---:|---:|---|');for(const p of g.canonical.primitives)lines.push(`| ${p.y0}–${p.y1} | ${p.x0} | ${p.x1} | ${p.width} | ${p.runs.map(r=>`${r[0]}–${r[1]}`).join(' / ')} |`);
  lines.push('','## Region topology',`Frame 0 contains **${g.regions.componentCount}** same-palette connected components. Component identity is topological, not anatomical.`,'');lines.push('| Palette | Pixels | BBox | Band |','|---:|---:|---|---|');for(const r of g.regions.largeComponents)lines.push(`| ${r.paletteIndex} | ${r.pixels} | ${r.bbox.x0}–${r.bbox.x1} × ${r.bbox.y0}–${r.bbox.y1} | ${r.band} |`);
  lines.push('','## Semantic construction slots','| Slot | Y | X | Pixels | Status | Basis |','|---|---:|---:|---:|---|---|');for(const s of g.semantics.slots)lines.push(`| ${s.label} | ${s.y0}–${s.y1} | ${s.x0}–${s.x1} | ${s.pixels} | ${s.status} | ${s.basis} |`);lines.push('');
  lines.push('## Walk transform grammar','| Direction | Pair | Align | IoU | Changed by band |','|---|---:|---|---:|---|');for(const[dir,d]of Object.entries(g.motion))for(const p of d.pairs)lines.push(`| ${dir} | ${p.to} | (${p.dx}, ${p.dy}) | ${p.stablePercent.toFixed(2)}% | ${p.deformationByBand.map(b=>`${b.band}:${b.changed}`).join(', ')} |`);
  lines.push('','## Reconstruction proof',`- Status: **${g.proof.status.toUpperCase()}**`,`- Exact matches: **${g.proof.samePixels}/${CELL_W*CELL_H}**`,`- Pixel diff: **${g.proof.diffPixels}**`,`- Cell accuracy: **${g.proof.accuracy.toFixed(2)}%**`,'','## Grammar rules');for(const r of g.grammarRules)lines.push(`- **${r.kind}:** ${r.text}`);lines.push('','## Machine-readable form','```json',JSON.stringify(g,null,2),'```');return lines.join('\n');
}
function exportGrammarJSON(){const g=state.grammar||grammarBuild();if(!g){setStatus('Grammar unavailable until a sprite is loaded.','warn','NO GRAMMAR');return}setStatus(downloadTextFile('construction-grammar-v0.7.json',JSON.stringify(g,null,2),'application/json;charset=utf-8')?'Downloaded v0.7 construction grammar JSON.':'Grammar JSON download failed.','ok','GRAMMAR JSON')}
function exportGrammarMarkdown(){const md=grammarMarkdown();if(!md){setStatus('Grammar unavailable until a sprite is loaded.','warn','NO GRAMMAR');return}setStatus(downloadTextFile('construction-grammar-v0.7.md',md,'text/markdown;charset=utf-8')?'Downloaded v0.7 construction grammar Markdown.':'Grammar Markdown download failed.','ok','GRAMMAR MD')}

/* =========================
   Sprite Lab v0.7 — Semantic Renderer + Character Generator
   ========================= */
const V07_DEFAULTS={mode:'brendan',theme:'brendan',headWidth:12,headHeight:8,torsoWidth:8,legWidth:3,shoeWidth:3};
const V07_THEMES={
  brendan:{name:'Brendan',map:{1:1,2:2,3:3,4:4,5:5,6:6,8:8,9:9,10:10,11:11,12:12,13:13,14:14,15:15}},
  uttkarsh:{name:'Uttkarsh',tokens:{outline:[18,30,28],skinLight:[255,224,190],skinMid:[239,168,136],skinDark:[181,102,91],clothLight:[116,205,193],clothMid:[57,151,141],clothDark:[28,91,86],accent:[238,92,88],highlight:[255,255,244]}},
  mono:{name:'Monochrome',tokens:{outline:[28,32,31],skinLight:[220,220,214],skinMid:[166,166,160],skinDark:[104,104,100],clothLight:[192,192,186],clothMid:[128,128,124],clothDark:[74,74,71],accent:[150,150,145],highlight:[246,246,240]}}
};
function v07Params(){return{headWidth:Number(els.v07HeadWidth?.value||12),headHeight:Number(els.v07HeadHeight?.value||8),torsoWidth:Number(els.v07TorsoWidth?.value||8),legWidth:Number(els.v07LegWidth?.value||3),shoeWidth:Number(els.v07ShoeWidth?.value||3)}}
function v07SetOutputs(){for(const [id,out] of [['v07HeadWidth','v07HeadWidthOut'],['v07HeadHeight','v07HeadHeightOut'],['v07TorsoWidth','v07TorsoWidthOut'],['v07LegWidth','v07LegWidthOut'],['v07ShoeWidth','v07ShoeWidthOut']])if(els[id]&&els[out])els[out].value=els[id].value}
function v07ReadOwnerMap(grammar){return grammar?.semantics?.ownerMap||grammarSemanticSlots(0).ownerMap}
function v07CompressRows(pixels){
  const height=Array.isArray(pixels)?pixels.length:0;
  const width=height&&Array.isArray(pixels[0])?pixels[0].length:0;
  const rows=[];
  for(let y=0;y<height;y++){
    const row=Array.isArray(pixels[y])?pixels[y]:[];
    let x=0;const runs=[];
    while(x<width){const v=row[x]??0;if(v===0){x++;continue}const x0=x;while(x+1<width&&(row[x+1]??0)===v)x++;runs.push({x0,x1:x,paletteIndex:v});x++}
    rows.push({y,runs});
  }
  return rows;
}
function v07BuildSemanticProgram(){
  if(!state.pixels)return null;const g=state.grammar||grammarBuild();if(!g)return null;const owner=v07ReadOwnerMap(g),slots=g.semantics.slots;
  return{schemaVersion:'0.7',sourceFrame:0,sourcePixels:state.frameStats[0].visiblePixels,cell:{width:CELL_W,height:CELL_H},slots:slots.map((s,i)=>{
    const pts=[];for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++)if(owner[y][x]===i+1&&grammarVisible(0,x,y))pts.push({x,y,paletteIndex:grammarIndex(0,x,y)});
    const bbox=s.bbox||{x0:s.x0,x1:s.x1,y0:s.y0,y1:s.y1,width:s.x1-s.x0+1,height:s.y1-s.y0+1};
    const local=pts.map(p=>({x:p.x-bbox.x0,y:p.y-bbox.y0,paletteIndex:p.paletteIndex}));
    return{id:s.id,label:s.label,status:s.status,basis:s.basis,sourceBBox:bbox,sourcePixelCount:pts.length,localPixels:local,localRuns:null};
  })};
}
function v07ProgramRowsForSlot(slot){
  const b=slot?.sourceBBox;
  const w=Number.isFinite(b?.width)?Math.max(0,Math.floor(b.width)):0;
  const h=Number.isFinite(b?.height)?Math.max(0,Math.floor(b.height)):0;
  if(!w||!h)return[];
  const grid=Array.from({length:h},()=>Array(w).fill(0));
  for(const p of (slot?.localPixels||[])){if(!Number.isInteger(p?.x)||!Number.isInteger(p?.y)||p.x<0||p.y<0||p.x>=w||p.y>=h)continue;grid[p.y][p.x]=Number.isFinite(p.paletteIndex)?p.paletteIndex:0;}
  return v07CompressRows(grid);
}
function v07TargetBoxes(p){
  const cx=7, headX0=cx-Math.floor((p.headWidth-1)/2),headX1=headX0+p.headWidth-1;
  const torsoX0=cx-Math.floor((p.torsoWidth-1)/2),torsoX1=torsoX0+p.torsoWidth-1;
  const sideMargin=Math.max(1,Math.floor((14-p.torsoWidth)/2));
  const armX0=Math.max(1,torsoX0-sideMargin),armX1=Math.min(14,torsoX1+sideMargin);
  return{
    'head-mass':{x0:headX0,x1:headX1,y0:10,y1:10+p.headHeight-1},
    'torso-core':{x0:torsoX0,x1:torsoX1,y0:18,y1:23},
    'arm-envelope':{x0:armX0,x1:armX1,y0:18,y1:23},
    'left-leg':{x0:1,x1:7,y0:24,y1:29},
    'right-leg':{x0:8,x1:14,y0:24,y1:29},
    'feet':{x0:4,x1:11,y0:30,y1:30}
  };
}
function v07TransformPixel(px,srcB,tgtB){
  const sw=Math.max(1,srcB.width),sh=Math.max(1,srcB.height),tw=Math.max(1,tgtB.x1-tgtB.x0+1),th=Math.max(1,tgtB.y1-tgtB.y0+1);
  const tx=tw===1?tgtB.x0:tgtB.x0+Math.round(px.x*(tw-1)/Math.max(1,sw-1));
  const ty=th===1?tgtB.y0:tgtB.y0+Math.round(px.y*(th-1)/Math.max(1,sh-1));
  return{x:clampInt(tx,0,15),y:clampInt(ty,0,31),paletteIndex:px.paletteIndex};
}
function v07RoleFromIndex(idx){
  if(idx===15)return'outline';if([1,2].includes(idx))return'skinLight';if([3].includes(idx))return'skinMid';if([4,12,13].includes(idx))return'skinDark';if([5,6].includes(idx))return'clothMid';if(idx===8)return'clothDark';if([10,11].includes(idx))return'clothLight';if([9,14].includes(idx))return'highlight';return'accent';
}
function v07MapColor(idx,theme){
  if(theme==='brendan'){const rgb=state.palette[idx]||[0,0,0];return`rgb(${rgb.join(',')})`}
  const t=V07_THEMES[theme].tokens, role=v07RoleFromIndex(idx);const c=t[role]||t.accent;return`rgb(${c.join(',')})`;
}
function v07BuildFrame(mode,theme,params){
  const program=v07BuildSemanticProgram();if(!program)return{pixels:null,program:null,mode,theme};
  const out=Array.from({length:CELL_H},()=>Array(CELL_W).fill(0)), boxes=v07TargetBoxes(params);
  const order=['head-mass','arm-envelope','torso-core','left-leg','right-leg','feet'];
  for(const id of order){const slot=program.slots.find(s=>s.id===id);if(!slot)continue;const target=mode==='brendan'?slot.sourceBBox:boxes[id];
    if(id==='feet'&&mode!=='brendan'){
      const w=params.shoeWidth;for(const [x0,x1] of [[7-w,6],[9,8+w]]){const a=Math.max(0,x0),b=Math.min(15,x1);for(let x=a;x<=b;x++)out[30][x]=15;}
      continue;
    }
    for(const px of slot.localPixels){let t;
      if(mode!=='brendan'&&(id==='left-leg'||id==='right-leg')&&px.y>=3){
        const w=Math.max(2,Math.min(4,params.legWidth));
        const ankle=id==='left-leg'?{x0:7-w,x1:6,y0:27,y1:29}:{x0:9,x1:8+w,y0:27,y1:29};
        const local={x:px.x,y:px.y-3,paletteIndex:px.paletteIndex};
        const sourceH=slot.sourceBBox.height-3;const sy=Math.max(0,local.y);
        const tx=v07TransformPixel({x:px.x,y:0,paletteIndex:px.paletteIndex},slot.sourceBBox,{...ankle,y0:27,y1:29}).x;
        const ty=27+Math.round(sy*2/Math.max(1,sourceH-1));t={x:tx,y:ty,paletteIndex:px.paletteIndex};
      } else t=v07TransformPixel(px,slot.sourceBBox,target);
      out[t.y][t.x]=t.paletteIndex;}
  }
  return{pixels:out,program,boxes};
}
function v07CompareToSource(arr){let same=0,diff=0;for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){const t=pixelAt(0,x,y).idx??0;if(arr[y][x]===t)same++;else diff++;}return{same,diff,accuracy:same/(CELL_W*CELL_H)*100};}
function v07DrawCanvas(canvas,pixels,mode='source',diffAgainst=null,theme='brendan'){
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,512);ctx.imageSmoothingEnabled=false;
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){ctx.fillStyle=((x+y)&1)?'#e4e1d7':'#f4f2eb';ctx.fillRect(x*16,y*16,16,16)}
  if(diffAgainst){for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){const a=diffAgainst[y][x]??0,b=pixels[y][x]??0;if(a!==b){ctx.fillStyle=a===0?'#3bb273':b===0?'#d95b53':'#8b5bb0';ctx.fillRect(x*16,y*16,16,16)}}return}
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){const idx=pixels[y][x];if(!idx)continue;ctx.fillStyle=v07MapColor(idx,theme);ctx.fillRect(x*16,y*16,16,16)}
  ctx.strokeStyle='#73559c';ctx.lineWidth=2;ctx.strokeRect(1.5,10*16+.5,14*16-1,21*16-1);
}
function v07DrawSource(){if(!state.pixels)return;const src=Array.from({length:CELL_H},(_,y)=>Array.from({length:CELL_W},(_,x)=>pixelAt(0,x,y).idx||0));v07DrawCanvas(els.v07SourceCanvas,src,'source',null,'brendan')}
function v07TokenRender(theme){if(!els.v07TokenSwatches)return;const entries=theme==='brendan'?[['outline',15],['skin',3],['clothing',5],['accent',10],['highlight',14]]:Object.entries(V07_THEMES[theme].tokens);els.v07TokenSwatches.innerHTML=entries.map(([name,val])=>{const rgb=theme==='brendan'?(state.palette[val]||[0,0,0]):val;return`<span class="v07-token"><i style="background:rgb(${rgb.join(',')})"></i>${escapeHTML(name)}</span>`}).join('')}
function renderV07(force=false){
  if(!state.pixels||!els.v07RenderCanvas)return;v07SetOutputs();v07DrawSource();
  const mode=els.v07Mode.value,theme=mode==='brendan'?'brendan':els.v07PaletteTheme.value,params=v07Params();const built=v07BuildFrame(mode,theme,params);if(!built.pixels)return;
  state.v07={mode,theme,params,program:built.program,pixels:built.pixels};v07TokenRender(theme);
  v07DrawCanvas(els.v07RenderCanvas,built.pixels,'generated',null,theme);
  if(mode==='brendan'){
    const proof=v07CompareToSource(built.pixels);v07DrawCanvas(els.v07DiffCanvas,built.pixels,'diff',Array.from({length:CELL_H},(_,y)=>Array.from({length:CELL_W},(_,x)=>pixelAt(0,x,y).idx||0)),theme);
    els.v07RenderLabel.textContent='semantic slots · source palette';els.v07OutputLabel.textContent=proof.diff===0?'0-DIFF PROOF':'DIFF';
    const cls=proof.diff===0?'v07-status-pass':'v07-status-warn';els.v07ProofMetrics.innerHTML=[['Status',`<span class="${cls}">${proof.diff===0?'PASS':'WARN'}</span>`],['Pixels compared',CELL_W*CELL_H],['Exact matches',proof.same],['Pixel diff',proof.diff],['Cell accuracy',`${proof.accuracy.toFixed(2)}%`],['Renderer','Semantic slot programs · no canonicalRowRuns']].map(([k,v])=>`<div class="fact"><span>${escapeHTML(k)}</span><b>${v}</b></div>`).join('');
  }else{
    v07DrawCanvas(els.v07DiffCanvas,built.pixels,'generated',null,theme);els.v07RenderLabel.textContent=`parameterized · ${V07_THEMES[theme].name}`;els.v07OutputLabel.textContent='GENERATED CHARACTER';
    els.v07ProofMetrics.innerHTML=[['Status','<span class="v07-status-pass">GENERATED</span>'],['Theme',escapeHTML(V07_THEMES[theme].name)],['Head',`${params.headWidth}×${params.headHeight}`],['Torso width',params.torsoWidth],['Ankle width',params.legWidth],['Shoe width',params.shoeWidth],['Constraint','16×32 integer pixel cell']].map(([k,v])=>`<div class="fact"><span>${escapeHTML(k)}</span><b>${v}</b></div>`).join('');
  }
  const prog={schemaVersion:'0.7',source:built.program?.sourceFrame??0,mode,theme,params,slots:(built.program?.slots||[]).map(s=>({id:s.id,label:s.label,status:s.status,basis:s.basis,sourceBBox:s.sourceBBox,sourcePixelCount:s.sourcePixelCount,localRuns:v07ProgramRowsForSlot(s)}))};els.v07Program.textContent=JSON.stringify(prog,null,2);
  const slots=built.program?.slots||[];els.v07SlotTable.innerHTML='<div class="v07-slot-row header"><span>Semantic slot</span><span>Source W</span><span>Source H</span><span>Pixels</span><span>Construction primitive</span></div>'+slots.map(s=>`<div class="v07-slot-row"><strong>${escapeHTML(s.label)}</strong><span>${s.sourceBBox.width}</span><span>${s.sourceBBox.height}</span><span>${s.sourcePixelCount}</span><code>${s.id} · local indexed runs · ${s.status}</code></div>`).join('');
  if(els.v07Generator)els.v07Generator.classList.toggle('v07-hidden-generator',mode==='brendan');
}
function resetV07(){els.v07Mode.value=V07_DEFAULTS.mode;els.v07PaletteTheme.value=V07_DEFAULTS.theme;for(const [id,key] of [['v07HeadWidth','headWidth'],['v07HeadHeight','headHeight'],['v07TorsoWidth','torsoWidth'],['v07LegWidth','legWidth'],['v07ShoeWidth','shoeWidth']])els[id].value=V07_DEFAULTS[key];renderV07(true)}
function exportV07(){if(!state.v07){renderV07(true);if(!state.v07)return}const g=state.grammar||grammarBuild();const payload={schemaVersion:'0.7',tool:'Sprite Lab v0.8',source:state.source,semanticProgram:state.v07.program,activeRenderer:{mode:state.v07.mode,theme:state.v07.theme,params:state.v07.params},proof:state.v07.mode==='brendan'?v07CompareToSource(state.v07.pixels):null,notes:['Brendan mode uses semantic slot programs and source palette; canonicalRowRuns is not used by the renderer.','Uttkarsh mode is an authored parameterized mutation of the measured semantic construction grammar.','Semantic anatomy labels remain author assignments, not claims about original artist intent.']};downloadTextFile('construction-grammar-v0.7.json',JSON.stringify(payload,null,2),'application/json;charset=utf-8');setStatus('Exported v0.7 semantic construction grammar.','ok','V0.7 JSON')}


/* =========================
   Sprite Lab v0.8 — Character Creator
   ========================= */
const V08_DEFAULTS={name:'Uttkarsh',hair:'short',face:'standard',outfit:'teal',direction:'south',headWidth:12,headHeight:8,torsoWidth:8,legWidth:3,shoeWidth:3,
  colors:{outline:'#121e1c',skinLight:'#ffe0be',skinMid:'#efa888',skinDark:'#b56659',clothLight:'#74cdbd',clothMid:'#39978d',clothDark:'#1c5b56',accent:'#ee5c58',highlight:'#fffff4'}};
function v08HexToRgb(hex){const h=String(hex||'#000000').replace('#','');return [parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0]}
function v08Params(){return {name:(els.creatorName?.value||'Uttkarsh').trim()||'Uttkarsh',hair:els.creatorHair?.value||'short',face:els.creatorFace?.value||'standard',outfit:els.creatorOutfit?.value||'teal',direction:els.creatorDirection?.value||'south',headWidth:+(els.creatorHeadWidth?.value||12),headHeight:+(els.creatorHeadHeight?.value||8),torsoWidth:+(els.creatorTorsoWidth?.value||8),legWidth:+(els.creatorLegWidth?.value||3),shoeWidth:+(els.creatorShoeWidth?.value||3),colors:{outline:els.creatorOutline?.value||V08_DEFAULTS.colors.outline,skinLight:els.creatorSkinLight?.value||V08_DEFAULTS.colors.skinLight,skinMid:els.creatorSkinMid?.value||V08_DEFAULTS.colors.skinMid,skinDark:els.creatorSkinDark?.value||V08_DEFAULTS.colors.skinDark,clothLight:els.creatorClothLight?.value||V08_DEFAULTS.colors.clothLight,clothMid:els.creatorClothMid?.value||V08_DEFAULTS.colors.clothMid,clothDark:els.creatorClothDark?.value||V08_DEFAULTS.colors.clothDark,accent:els.creatorAccent?.value||V08_DEFAULTS.colors.accent,highlight:els.creatorHighlight?.value||V08_DEFAULTS.colors.highlight}}}
function v08SetValues(p){for(const [id,key] of [['creatorHeadWidth','headWidth'],['creatorHeadHeight','headHeight'],['creatorTorsoWidth','torsoWidth'],['creatorLegWidth','legWidth'],['creatorShoeWidth','shoeWidth']]){if(els[id])els[id].value=p[key];const o=els[id.replace('creator','creator')+'Out'];if(o)o.value=p[key]} const map=[['creatorName','name'],['creatorHair','hair'],['creatorFace','face'],['creatorOutfit','outfit'],['creatorDirection','direction'],['creatorOutline','colors.outline'],['creatorSkinLight','colors.skinLight'],['creatorSkinMid','colors.skinMid'],['creatorSkinDark','colors.skinDark'],['creatorClothLight','colors.clothLight'],['creatorClothMid','colors.clothMid'],['creatorClothDark','colors.clothDark'],['creatorAccent','colors.accent'],['creatorHighlight','colors.highlight']];for(const [id,key] of map){const el=els[id];if(!el)continue;let v=p;for(const part of key.split('.'))v=v?.[part];el.value=v}}
function v08UpdateOutputs(){for(const [a,b] of [['creatorHeadWidth','creatorHeadWidthOut'],['creatorHeadHeight','creatorHeadHeightOut'],['creatorTorsoWidth','creatorTorsoWidthOut'],['creatorLegWidth','creatorLegWidthOut'],['creatorShoeWidth','creatorShoeWidthOut']])if(els[a]&&els[b])els[b].value=els[a].value}
function v08Slots(){const p=V08_DEFAULTS;return state.v07?.program||v07BuildSemanticProgram()}
function v08ColorForSourceIndex(idx,p){const role=v07RoleFromIndex(idx),c={...p.colors}; if(p.outfit==='dark'){c.clothLight='#a4b6b2';c.clothMid='#536662';c.clothDark='#263c39';} else if(p.outfit==='sport'){c.clothLight='#e8f0ee';c.clothMid='#2d8d82';c.clothDark='#174e49';c.accent='#e24b45';} const map={outline:c.outline,skinLight:c.skinLight,skinMid:c.skinMid,skinDark:c.skinDark,clothMid:c.clothMid,clothLight:c.clothLight,highlight:c.highlight,accent:c.accent};return map[role]||c.accent}
function v08SourceFramePixels(frame){return Array.from({length:CELL_H},(_,y)=>Array.from({length:CELL_W},(_,x)=>pixelAt(frame,x,y).idx||0))}
function v08TransformMask(src,p,frame){
  const out=Array.from({length:CELL_H},()=>Array(CELL_W).fill(0));
  // measured frame shape, normalized to author-controlled canonical boxes; preserves the proven integer construction workflow
  const base=v07BuildSemanticProgram(); const boxes=v07TargetBoxes({headWidth:p.headWidth,headHeight:p.headHeight,torsoWidth:p.torsoWidth,legWidth:p.legWidth,shoeWidth:p.shoeWidth});
  const srcPx=v08SourceFramePixels(frame); const srcVisible=[];
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++)if(srcPx[y][x]!==0){
    let slotId;
    if(y<=17)slotId='head-mass'; else if(y<=23)slotId=(x<4||x>11)?'arm-envelope':'torso-core'; else if(y<=29)slotId=x<=7?'left-leg':'right-leg'; else slotId='feet';
    srcVisible.push({x,y,idx:srcPx[y][x],slotId});
  }
  for(const q of srcVisible){const target=boxes[q.slotId]||{x0:1,x1:14,y0:10,y1:30};
    // Find slot source bounds from canonical slot program when possible; for direction-specific shapes use measured band bounds.
    const srcB=(base?.slots?.find(s=>s.id===q.slotId)?.sourceBBox)||{x0:1,x1:14,y0:10,y1:30,width:14,height:14};
    const local={x:q.x-srcB.x0,y:q.y-srcB.y0,paletteIndex:q.idx};
    let t=v07TransformPixel(local,srcB,target);
    out[t.y][t.x]=q.idx;
  }
  // Author-facing hair/face variants are sparse shape modifications on the semantic head mask.
  if(p.hair==='spiky'){
    for(let x=5;x<=9;x++)if((x%2)===0)out[9][x]=15;
  }else if(p.hair==='short'){
    for(let x=4;x<=12;x++)if(out[10][x]===5)out[10][x]=9;
  }
  if(p.face==='minimal'){
    for(let y=15;y<=17;y++)for(let x=5;x<=9;x++)if(out[y][x]===9||out[y][x]===14)out[y][x]=0;
  }
  return out;
}
function v08RenderPixels(p,frame=0){
  const src=v08TransformMask(null,p,frame), out=Array.from({length:CELL_H},()=>Array(CELL_W).fill(0));
  const east=p?.direction==='east';
  for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){const idx=east?src[y][CELL_W-1-x]:src[y][x];if(idx)out[y][x]=idx}
  return out;
}
function v08PaletteCanvas(canvas,pixels,p,scale=16){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,512);ctx.imageSmoothingEnabled=false;for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){ctx.fillStyle=((x+y)&1)?'#e5e2d8':'#f4f2eb';ctx.fillRect(x*scale,y*scale,scale,scale)}for(let y=0;y<CELL_H;y++)for(let x=0;x<CELL_W;x++){const idx=pixels[y][x];if(!idx)continue;ctx.fillStyle=v08ColorForSourceIndex(idx,p);ctx.fillRect(x*scale,y*scale,scale,scale)}}
function v08DirectionFrame(direction){return direction==='south'?0:direction==='north'?1:direction==='west'?2:2}
function v08AuthorProgram(p){const dir=v08DirectionFrame(p.direction);return{direction:p.direction,frame:dir,generatedFromMeasuredDirection:true,parameters:p,notes:['Semantic construction authoring; no canonicalRowRuns used by the creator renderer.','Direction shapes originate from measured directional frames and are remapped through the shared construction slots.']}}
function renderCreator(){if(!state.pixels||!els.creatorCanvas)return;const p=v08Params();v08UpdateOutputs();const frame=v08DirectionFrame(p.direction),pix=v08RenderPixels(p,frame);state.creator={params:p,pixels:pix,program:v08AuthorProgram(p)};v08PaletteCanvas(els.creatorCanvas,pix,p);if(els.creatorPreviewLabel){const dd=p.direction||'south';els.creatorPreviewLabel.textContent=`${p.name} · ${dd[0].toUpperCase()+dd.slice(1)}`;}let visible=0;for(const row of pix)for(const v of row)if(v)visible++;const coverage=visible/(CELL_W*CELL_H)*100;if(els.creatorStats)els.creatorStats.innerHTML=[['Visible pixels',visible],['Cell occupancy',coverage.toFixed(1)+'%'],['Art box','16×32'],['Grammar','parameterized semantic slots'],['Mode','Author']].map(([k,v])=>`<div class="fact"><span>${escapeHTML(k)}</span><b>${escapeHTML(String(v))}</b></div>`).join('');
  if(els.creatorDirections){let html='<div class="creator-dir-grid">';for(const d of ['south','north','west','east']){const q={...p,direction:d};const im=v08RenderPixels(q,v08DirectionFrame(d));const data=im.flat().some(Boolean)?d:'south';html+=`<button class="creator-dir-card ${d===p.direction?'active':''}" data-dir="${d}"><span>${d.toUpperCase()}</span><canvas width="96" height="192"></canvas></button>`}html+='</div>';els.creatorDirections.innerHTML=html;for(const b of els.creatorDirections.querySelectorAll('button[data-dir]')){const c=b.querySelector('canvas');const d=b.dataset.dir;v08PaletteCanvas(c,v08RenderPixels({...p,direction:d},v08DirectionFrame(d)),p,6);b.addEventListener('click',()=>{els.creatorDirection.value=d;renderCreator()})}}
}
function creatorPayload(){if(!state.creator)renderCreator();return{schemaVersion:'0.8',tool:'Sprite Lab v0.8',source:state.source,character:state.creator?.params||v08Params(),program:state.creator?.program||v08AuthorProgram(v08Params())}}
function exportCreatorJson(){const payload=creatorPayload();downloadTextFile(`${payload.character.name||'character'}-sprite-lab.json`,JSON.stringify(payload,null,2),'application/json;charset=utf-8');setStatus('Exported character construction JSON.','ok','CHARACTER JSON')}
function exportCreatorPng(){if(!state.creator)renderCreator();if(!state.creator)return;const src=els.creatorCanvas;const out=document.createElement('canvas');out.width=16;out.height=32;const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;for(let y=0;y<32;y++)for(let x=0;x<16;x++){const rgb=v08ColorForSourceIndex(state.creator.pixels[y][x],state.creator.params);if(state.creator.pixels[y][x]){ctx.fillStyle=rgb;ctx.fillRect(x,y,1,1)}}const a=document.createElement('a');a.download=`${state.creator.params.name||'character'}.png`;a.href=out.toDataURL('image/png');a.click();setStatus(`Exported ${state.creator.params.name||'character'}.png.`,'ok','PNG EXPORTED')}
function exportCreatorSheet(){if(!state.pixels) return; const p=v08Params(), dirs=['south','north','west','east']; const out=document.createElement('canvas'); out.width=16*dirs.length; out.height=32; const ctx=out.getContext('2d'); ctx.imageSmoothingEnabled=false; dirs.forEach((d,i)=>{const q={...p,direction:d};const pix=v08RenderPixels(q,v08DirectionFrame(d)); for(let y=0;y<32;y++)for(let x=0;x<16;x++){const idx=pix[y][x];if(!idx)continue;ctx.fillStyle=v08ColorForSourceIndex(idx,q);ctx.fillRect(i*16+x,y,1,1)}}); const a=document.createElement('a');a.download=`${p.name||'character'}-4dir.png`;a.href=out.toDataURL('image/png');a.click();setStatus(`Exported ${p.name||'character'} 4-direction sheet.`,'ok','4-DIR EXPORTED')}
function creatorReset(){v08SetValues(V08_DEFAULTS);renderCreator()}
function creatorRandomize(){const names=['Nova','Uttkarsh','Trainer','Builder','Rival'];const hairs=['cap','short','spiky'];const faces=['standard','minimal'];const outfits=['teal','dark','sport'];const pick=a=>a[Math.floor(Math.random()*a.length)];const p={...V08_DEFAULTS,name:pick(names),hair:pick(hairs),face:pick(faces),outfit:pick(outfits),direction:pick(['south','north','west','east']),headWidth:10+Math.floor(Math.random()*5),headHeight:7+Math.floor(Math.random()*3),torsoWidth:6+Math.floor(Math.random()*5),legWidth:2+Math.floor(Math.random()*3),shoeWidth:2+Math.floor(Math.random()*3),colors:{...V08_DEFAULTS.colors}};v08SetValues(p);renderCreator()}
function initCreatorEvents(){const inputs=['creatorName','creatorHair','creatorFace','creatorOutfit','creatorDirection','creatorHeadWidth','creatorHeadHeight','creatorTorsoWidth','creatorLegWidth','creatorShoeWidth','creatorOutline','creatorSkinLight','creatorSkinMid','creatorSkinDark','creatorClothLight','creatorClothMid','creatorClothDark','creatorAccent','creatorHighlight'];for(const id of inputs)els[id]?.addEventListener('input',renderCreator);els.creatorResetBtn?.addEventListener('click',creatorReset);els.creatorRandomBtn?.addEventListener('click',creatorRandomize);els.creatorExportJsonBtn?.addEventListener('click',exportCreatorJson);els.creatorExportPngBtn?.addEventListener('click',exportCreatorPng);els.creatorExportSheetBtn?.addEventListener('click',exportCreatorSheet)}

// Final renderer keeps all analysis panels synchronized and adds v0.7.
function renderAll(){if(!state.pixels)return;renderSheet();renderFrameStrip();renderBlueprint();renderProfiles();renderLandmarks();renderComparisons();renderForensics();renderSequence();renderRowRuns();renderGeometryFacts();renderRecipe();renderGrammar();renderV07();renderCreator()}
