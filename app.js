"use strict";

/* ================================================================
   1. CONFIGURAÇÕES, TIPOS E DADOS MOCKADOS
   Troque MAIN_MENU_URL pela rota corporativa quando ela existir.
   O valor interno "instruction" foi preservado para compatibilidade,
   mas toda a interface apresenta esse tipo como "Procedimento".
   ================================================================ */

const TYPE_LABELS={instruction:"Procedimento",flow:"Fluxo",method:"Método",meeting:"Pauta de Reunião"};
const TYPE_ICONS={instruction:"i-file",flow:"i-flow",method:"i-settings",meeting:"i-calendar"};
const FILTERS=[{value:"all",label:"Todos"},{value:"instruction",label:"Procedimentos"},{value:"flow",label:"Fluxos"},{value:"method",label:"Métodos"},{value:"meeting",label:"Pautas de Reunião"}];
const PAGE_SIZE=5;
const MAX_FILE_SIZE=100*1024*1024;
const MAIN_MENU_URL="";
const THEME_STORAGE_KEY="sistema-it-theme";
const DATABASE_NAME="sistema-it-local";
const DATABASE_VERSION=1;
const DATABASE_STORE="application-data";
const ITEMS_STORAGE_KEY="items";

const authors={maria:{name:"Maria Souza",initials:"MS"},carlos:{name:"Carlos Lima",initials:"CL"},joao:{name:"João Silva",initials:"JS"},ana:{name:"Ana Paula",initials:"AP"},roberto:{name:"Roberto Ferreira",initials:"RF"}};
const attachment=(name,mimeType="application/pdf")=>({name,mimeType,sizeBytes:1240000});
let items=[
  {id:"IT-028",type:"meeting",title:"Reunião Semanal da Qualidade",description:"Alinhamento sobre a inspeção FOS, resultados da auditoria interna e metas da semana.",attachment:attachment("Pauta_Qualidade_15-09.pdf"),author:authors.maria,createdAt:"2026-09-15T13:30:00Z",updatedAt:"2026-09-15T13:30:00Z",important:true},
  {id:"IT-027",type:"meeting",title:"Reunião de Planejamento — Setembro",description:"Planejamento das atividades do setor, responsáveis e prazos para o mês.",attachment:attachment("Planejamento_Setembro.pdf"),author:authors.carlos,createdAt:"2026-09-08T14:00:00Z",updatedAt:"2026-09-11T10:20:00Z",important:false},
  {id:"IT-026",type:"meeting",title:"Acompanhamento de Indicadores",description:"Revisão dos indicadores do setor e ações para melhoria contínua.",attachment:attachment("Indicadores_Setor.xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),author:authors.joao,createdAt:"2026-09-01T12:00:00Z",updatedAt:"2026-09-05T09:45:00Z",important:false},
  {id:"IT-025",type:"instruction",title:"Inspeção FOS",description:"Procedimento padrão para realização da inspeção final dos equipamentos FOS.",attachment:attachment("IT_Inspecao_FOS.pdf"),author:authors.maria,createdAt:"2026-08-28T18:32:00Z",updatedAt:"2026-09-14T13:18:00Z",important:true},
  {id:"IT-024",type:"instruction",title:"Atendimento ao Cliente Interno",description:"Procedimento para atendimento e acompanhamento das solicitações recebidas pelo setor.",attachment:attachment("Atendimento_Cliente_Interno.pdf"),author:authors.joao,createdAt:"2026-08-22T14:00:00Z",updatedAt:"2026-09-12T11:05:00Z",important:false}
];

/* ================================================================
   2. ESTADO DA INTERFACE E FUNÇÕES UTILITÁRIAS
   ================================================================ */

const state={search:"",type:"all",sort:"newest",page:1,selected:null,newType:"instruction",pendingPayload:null,lastFocused:null,themePreference:"system",editingId:null};
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const icon=(id,className="icon")=>`<svg class="${className}" aria-hidden="true"><use href="#${id}"></use></svg>`;
const normalize=value=>String(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const formatDate=(value,withTime=false)=>new Intl.DateTimeFormat("pt-BR",withTime?{dateStyle:"short",timeStyle:"short"}:{dateStyle:"short"}).format(new Date(value));
const formatBytes=bytes=>bytes>=1048576?`${(bytes/1048576).toFixed(1).replace(".",",")} MB`:`${Math.ceil(bytes/1024)} KB`;
const badge=type=>`<span class="badge badge--${type}">${esc(TYPE_LABELS[type])}</span>`;
const important=item=>item.important?`<span class="important-badge">${icon("i-pin")}Importante</span>`:"";

function extensionOf(fileName=""){
  return fileName.toLowerCase().split(".").pop()||"";
}

/* O IndexedDB armazena os itens e os arquivos reais sem exigir backend.
   Quando a API corporativa estiver pronta, estas funções serão substituídas
   pelas chamadas HTTP descritas na documentação. */
function openLocalDatabase(){
  return new Promise((resolve,reject)=>{
    if(!window.indexedDB){reject(new Error("indexeddb_indisponivel"));return;}
    const request=indexedDB.open(DATABASE_NAME,DATABASE_VERSION);
    request.onupgradeneeded=()=>{
      const database=request.result;
      if(!database.objectStoreNames.contains(DATABASE_STORE))database.createObjectStore(DATABASE_STORE);
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error("falha_ao_abrir_indexeddb"));
  });
}

function itemForStorage(item){
  if(!item.attachment)return {...item};
  const {objectUrl,...storedAttachment}=item.attachment;
  return {...item,attachment:storedAttachment};
}

function itemFromStorage(item){
  if(!item.attachment)return item;
  const hydrated={...item,attachment:{...item.attachment}};
  if(hydrated.attachment.file instanceof Blob)hydrated.attachment.objectUrl=URL.createObjectURL(hydrated.attachment.file);
  return hydrated;
}

async function persistItems(){
  const database=await openLocalDatabase();
  const storedItems=items.map(itemForStorage);
  await new Promise((resolve,reject)=>{
    const transaction=database.transaction(DATABASE_STORE,"readwrite");
    transaction.objectStore(DATABASE_STORE).put(storedItems,ITEMS_STORAGE_KEY);
    transaction.oncomplete=resolve;
    transaction.onerror=()=>reject(transaction.error||new Error("falha_ao_salvar_itens"));
    transaction.onabort=()=>reject(transaction.error||new Error("salvamento_cancelado"));
  });
  database.close();
}

async function loadStoredItems(){
  const database=await openLocalDatabase();
  const storedItems=await new Promise((resolve,reject)=>{
    const transaction=database.transaction(DATABASE_STORE,"readonly");
    const request=transaction.objectStore(DATABASE_STORE).get(ITEMS_STORAGE_KEY);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error("falha_ao_ler_itens"));
  });
  database.close();
  if(Array.isArray(storedItems))items=storedItems.map(itemFromStorage);
  else await persistItems();
}

function attachmentSource(attachment){
  if(!attachment)return "";
  if(!attachment.objectUrl&&attachment.file instanceof Blob)attachment.objectUrl=URL.createObjectURL(attachment.file);
  return attachment.objectUrl||attachment.url||"";
}

function applyTheme(preference,showFeedback=false){
  const allowed=["system","light","dark"];
  state.themePreference=allowed.includes(preference)?preference:"system";
  const systemIsDark=window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved=state.themePreference==="system"?(systemIsDark?"dark":"light"):state.themePreference;
  document.documentElement.dataset.theme=resolved;
  try{localStorage.setItem(THEME_STORAGE_KEY,state.themePreference);}catch(error){console.warn("Não foi possível salvar a preferência de tema.",error);}
  const select=$("#theme-select");
  if(select)select.value=state.themePreference;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content",resolved==="dark"?"#071522":"#073f81");
  if(showFeedback)toast(`Tema ${state.themePreference==="system"?"do sistema":state.themePreference==="dark"?"escuro":"claro"} ativado.`,"success");
}

function toast(message,type="info"){
  const element=document.createElement("div");
  element.className=`toast toast--${type}`;
  element.textContent=message;
  $("#toast-region").append(element);
  window.setTimeout(()=>element.remove(),3500);
}

/* ================================================================
   3. PESQUISA, FILTROS, ORDENAÇÃO E RENDERIZAÇÃO
   ================================================================ */

function counts(){return Object.fromEntries(FILTERS.map(filter=>[filter.value,filter.value==="all"?items.length:items.filter(item=>item.type===filter.value).length]));}
function filteredItems(){
  const term=normalize(state.search.trim());
  return items.filter(item=>(state.type==="all"||item.type===state.type)&&(!term||normalize([item.title,item.description,TYPE_LABELS[item.type],item.author.name].join(" ")).includes(term))).sort((a,b)=>{
    if(state.sort==="title")return a.title.localeCompare(b.title,"pt-BR");
    if(state.sort==="oldest")return new Date(a.createdAt)-new Date(b.createdAt);
    if(state.sort==="updated")return new Date(b.updatedAt)-new Date(a.updatedAt);
    return new Date(b.createdAt)-new Date(a.createdAt);
  });
}

function renderFilters(){
  const total=counts();
  $("#filter-buttons").innerHTML=FILTERS.map(filter=>`<button class="filter-button" type="button" data-filter="${filter.value}" aria-pressed="${state.type===filter.value}">${filter.label} <span aria-label="${total[filter.value]} itens">(${total[filter.value]})</span></button>`).join("");
}

function renderMeetings(){
  const show=state.type==="all"&&!state.search;
  $("#meetings-section").hidden=!show;
  if(!show)return;
  $("#meetings-grid").innerHTML=items.filter(item=>item.type==="meeting").slice(0,3).map(item=>`<article class="meeting-card">
    <div class="meeting-card__top">${badge(item.type)}${important(item)}</div>
    <h3>${esc(item.title)}</h3><p>${esc(item.description)}</p>
    <div class="meeting-card__footer"><span class="author"><span class="avatar">${esc(item.author.initials)}</span><span>${esc(item.author.name)}<br>${formatDate(item.createdAt)}</span></span><span class="mini-actions"><button class="mini-button" type="button" data-open="${item.id}" aria-label="Ver detalhes de ${esc(item.title)}">${icon("i-eye")}</button><button class="mini-button" type="button" data-download="${item.id}" ${item.attachment?"":"disabled"} aria-label="Baixar anexo de ${esc(item.title)}">${icon("i-download")}</button><button class="mini-button mini-button--danger" type="button" data-delete="${item.id}" aria-label="Excluir ${esc(item.title)}">${icon("i-trash")}</button></span></div>
  </article>`).join("");
}

function tableRow(item){return `<tr><td><strong>${esc(item.id)}</strong></td><td><div class="item-title"><span class="item-type-icon">${icon(TYPE_ICONS[item.type])}</span><span>${badge(item.type)}<strong>${esc(item.title)}</strong><small>${esc(item.description)}</small></span></div></td><td><span class="author"><span class="avatar">${esc(item.author.initials)}</span>${esc(item.author.name)}</span></td><td class="date-cell">${formatDate(item.updatedAt,true)}</td><td><span class="attachment-name">${icon("i-paperclip")}${item.attachment?esc(item.attachment.name):"Sem anexo"}</span></td><td><div class="row-actions"><button class="mini-button" type="button" data-open="${item.id}" aria-label="Ver detalhes de ${esc(item.title)}">${icon("i-eye")}</button><button class="mini-button" type="button" data-download="${item.id}" ${item.attachment?"":"disabled"} aria-label="Baixar anexo de ${esc(item.title)}">${icon("i-download")}</button><button class="mini-button mini-button--danger" type="button" data-delete="${item.id}" aria-label="Excluir ${esc(item.title)}">${icon("i-trash")}</button></div></td></tr>`;}
function mobileCard(item){return `<article class="mobile-item"><div class="mobile-item__head">${badge(item.type)}${important(item)}</div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="mobile-item__meta"><span><strong>ID:</strong> ${esc(item.id)}</span><span><strong>Autor:</strong> ${esc(item.author.name)}</span><span><strong>Atualização:</strong> ${formatDate(item.updatedAt)}</span><span><strong>Anexo:</strong> ${item.attachment?"Disponível":"Não possui"}</span></div><div class="mobile-item__actions"><button class="button button--outline" type="button" data-open="${item.id}">${icon("i-eye")}Detalhes</button><button class="button button--primary" type="button" data-download="${item.id}" ${item.attachment?"":"disabled"}>${icon("i-download")}Baixar</button><button class="button button--danger" type="button" data-delete="${item.id}">${icon("i-trash")}Excluir</button></div></article>`;}

function renderItems(){
  renderFilters();renderMeetings();
  const result=filteredItems();
  const totalPages=Math.max(1,Math.ceil(result.length/PAGE_SIZE));
  state.page=Math.min(state.page,totalPages);
  const start=(state.page-1)*PAGE_SIZE;
  const pageItems=result.slice(start,start+PAGE_SIZE);
  $("#empty-state").hidden=result.length!==0;
  $("#items-content").hidden=result.length===0;
  $("#items-table-body").innerHTML=pageItems.map(tableRow).join("");
  $("#items-cards").innerHTML=pageItems.map(mobileCard).join("");
  $("#pagination-summary").textContent=result.length?`Mostrando ${start+1} a ${Math.min(start+PAGE_SIZE,result.length)} de ${result.length} itens`:"";
  $("#pagination").innerHTML=`<button class="page-button" type="button" data-page="${state.page-1}" ${state.page===1?"disabled":""} aria-label="Página anterior">‹</button>${Array.from({length:totalPages},(_,index)=>index+1).map(page=>`<button class="page-button" type="button" data-page="${page}" ${page===state.page?'aria-current="page"':""} aria-label="Página ${page}">${page}</button>`).join("")}<button class="page-button" type="button" data-page="${state.page+1}" ${state.page===totalPages?"disabled":""} aria-label="Próxima página">›</button>`;
}

function openModal(id,trigger=document.activeElement){
  state.lastFocused=trigger;
  $("#modal-backdrop").hidden=false;
  const modal=$(id);modal.hidden=false;
  document.body.style.overflow="hidden";
  requestAnimationFrame(()=>{const focusable=modal.querySelector("button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])");focusable?.focus();});
}
function closeModal(modal){
  modal.hidden=true;
  if(!$$('.modal:not([hidden])').length){$("#modal-backdrop").hidden=true;document.body.style.overflow="";state.lastFocused?.focus?.();}
}
function closeTopModal(){const visible=$$('.modal:not([hidden])');if(visible.length)closeModal(visible.at(-1));}

/* ================================================================
   4. LEITOR DE ANEXOS
   - Imagens e PDF: visualização nativa do navegador.
   - TXT e CSV: leitura direta do arquivo.
   - DOCX, XLSX e PPTX: extração local do conteúdo XML compactado.
   Não há envio do arquivo para serviços externos.
   ================================================================ */

function xmlElements(root,localName){
  return [...root.getElementsByTagName("*")].filter(element=>element.localName===localName);
}

function parseXml(bytes){
  const source=new TextDecoder("utf-8").decode(bytes);
  return new DOMParser().parseFromString(source,"application/xml");
}

async function inflateZipEntry(compressed,method){
  if(method===0)return compressed;
  if(method!==8)throw new Error("compactacao_nao_suportada");
  if(typeof DecompressionStream==="undefined")throw new Error("navegador_sem_descompactacao");
  const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntries(file){
  const bytes=new Uint8Array(await file.arrayBuffer());
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let endRecord=-1;
  const minimum=Math.max(0,bytes.length-65557);
  for(let index=bytes.length-22;index>=minimum;index--){
    if(view.getUint32(index,true)===0x06054b50){endRecord=index;break;}
  }
  if(endRecord<0)throw new Error("arquivo_office_invalido");
  const totalEntries=view.getUint16(endRecord+10,true);
  let cursor=view.getUint32(endRecord+16,true);
  const entries=new Map();
  for(let entryIndex=0;entryIndex<totalEntries;entryIndex++){
    if(view.getUint32(cursor,true)!==0x02014b50)break;
    const method=view.getUint16(cursor+10,true);
    const compressedSize=view.getUint32(cursor+20,true);
    const nameLength=view.getUint16(cursor+28,true);
    const extraLength=view.getUint16(cursor+30,true);
    const commentLength=view.getUint16(cursor+32,true);
    const localOffset=view.getUint32(cursor+42,true);
    const name=new TextDecoder("utf-8").decode(bytes.slice(cursor+46,cursor+46+nameLength));
    const localNameLength=view.getUint16(localOffset+26,true);
    const localExtraLength=view.getUint16(localOffset+28,true);
    const dataStart=localOffset+30+localNameLength+localExtraLength;
    const compressed=bytes.slice(dataStart,dataStart+compressedSize);
    entries.set(name,await inflateZipEntry(compressed,method));
    cursor+=46+nameLength+extraLength+commentLength;
  }
  return entries;
}

async function readZipEntriesWithJsZip(file){
  if(typeof window.JSZip==="undefined")return readZipEntries(file);
  const archive=await window.JSZip.loadAsync(file);
  const entries=new Map();
  const xmlFiles=Object.values(archive.files).filter(entry=>!entry.dir&&entry.name.toLowerCase().endsWith(".xml"));
  await Promise.all(xmlFiles.map(async entry=>entries.set(entry.name,await entry.async("uint8array"))));
  return entries;
}

function previewDocx(entries){
  const documentBytes=entries.get("word/document.xml");
  if(!documentBytes)throw new Error("documento_word_sem_conteudo");
  const xml=parseXml(documentBytes);
  const paragraphs=xmlElements(xml,"p").map(paragraph=>xmlElements(paragraph,"t").map(node=>node.textContent||"").join("")).filter(Boolean).slice(0,250);
  return `<article class="office-document"><h3>Prévia do documento</h3>${paragraphs.length?paragraphs.map(text=>`<p>${esc(text)}</p>`).join(""):"<p>O documento não possui texto disponível para prévia.</p>"}</article>`;
}

function spreadsheetColumnIndex(reference="A1"){
  const letters=(reference.match(/[A-Z]+/i)||["A"])[0].toUpperCase();
  return [...letters].reduce((value,letter)=>value*26+letter.charCodeAt(0)-64,0)-1;
}

function previewXlsx(entries){
  const sharedBytes=entries.get("xl/sharedStrings.xml");
  const shared=sharedBytes?xmlElements(parseXml(sharedBytes),"si").map(item=>xmlElements(item,"t").map(node=>node.textContent||"").join("")):[];
  const sheetName=[...entries.keys()].filter(name=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))[0];
  if(!sheetName)throw new Error("planilha_sem_aba");
  const rows=xmlElements(parseXml(entries.get(sheetName)),"row").slice(0,100).map(row=>{
    const values=[];
    xmlElements(row,"c").slice(0,30).forEach(cell=>{
      const column=spreadsheetColumnIndex(cell.getAttribute("r")||"A1");
      const type=cell.getAttribute("t");
      const valueNode=xmlElements(cell,"v")[0];
      const inlineText=xmlElements(cell,"t").map(node=>node.textContent||"").join("");
      const raw=valueNode?.textContent||inlineText||"";
      values[column]=type==="s"?(shared[Number(raw)]??raw):raw;
    });
    return values;
  });
  const width=Math.min(30,Math.max(1,...rows.map(row=>row.length)));
  return `<div class="office-sheet"><p class="preview-note">Exibindo até 100 linhas e 30 colunas da primeira aba.</p><div class="preview-table-wrap"><table class="preview-table"><tbody>${rows.map(row=>`<tr>${Array.from({length:width},(_,index)=>`<td>${esc(row[index]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
}

function previewPptx(entries){
  const slides=[...entries.keys()].filter(name=>/^ppt\/slides\/slide\d+\.xml$/i.test(name)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).slice(0,40);
  if(!slides.length)throw new Error("apresentacao_sem_slides");
  return `<div class="office-slides">${slides.map((name,index)=>{const texts=xmlElements(parseXml(entries.get(name)),"t").map(node=>node.textContent||"").filter(Boolean);return `<section class="office-slide"><span>Slide ${index+1}</span>${texts.length?texts.map((text,textIndex)=>textIndex===0?`<h3>${esc(text)}</h3>`:`<p>${esc(text)}</p>`).join(""):"<p>Slide sem texto disponível para prévia.</p>"}</section>`;}).join("")}</div>`;
}

async function previewModernOffice(file,extension){
  const entries=await readZipEntriesWithJsZip(file);
  if(extension==="docx")return previewDocx(entries);
  if(extension==="xlsx")return previewXlsx(entries);
  if(extension==="pptx")return previewPptx(entries);
  throw new Error("formato_office_nao_suportado");
}

function parseCsv(text){
  const rows=[];let row=[],value="",quoted=false;
  for(let index=0;index<text.length;index++){
    const character=text[index];
    if(character==='"'&&quoted&&text[index+1]==='"'){value+='"';index++;}
    else if(character==='"'){quoted=!quoted;}
    else if((character===","||character===";")&&!quoted){row.push(value);value="";}
    else if((character==="\n"||character==="\r")&&!quoted){if(character==="\r"&&text[index+1]==="\n")index++;row.push(value);if(row.some(cell=>cell.trim()))rows.push(row);row=[];value="";}
    else value+=character;
  }
  row.push(value);if(row.some(cell=>cell.trim()))rows.push(row);
  return rows.slice(0,150);
}

function csvPreview(text){
  const rows=parseCsv(text);return `<div class="office-sheet"><p class="preview-note">Exibindo até 150 linhas do arquivo CSV.</p><div class="preview-table-wrap"><table class="preview-table"><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
}

function unavailablePreview(item,message){
  const attachment=item.attachment;
  return `${icon("i-file","icon icon--xl")}<h3>${esc(attachment.name)}</h3><p>${esc(message)}</p><small>${esc(attachment.mimeType||"Tipo não informado")} · ${formatBytes(attachment.sizeBytes)}</small>`;
}

function detailsMarkup(item){return `<div class="details-hero"><span class="item-type-icon">${icon(TYPE_ICONS[item.type],"icon icon--large")}</span><div><h3>${esc(item.title)}</h3>${badge(item.type)} ${important(item)}</div></div><p class="details-description">${esc(item.description)}</p><div class="details-grid"><div class="detail-field">${icon("i-user")}<span><strong>Criado por</strong>${esc(item.author.name)}</span></div><div class="detail-field">${icon("i-calendar")}<span><strong>Data de criação</strong>${formatDate(item.createdAt,true)}</span></div><div class="detail-field">${icon("i-calendar")}<span><strong>Última atualização</strong>${formatDate(item.updatedAt,true)}</span></div><div class="detail-field">${icon("i-paperclip")}<span><strong>Anexo</strong>${item.attachment?`${esc(item.attachment.name)} (${formatBytes(item.attachment.sizeBytes)})`:"Nenhum anexo"}</span></div></div>`;}
function showDetails(id,trigger){
  const item=items.find(entry=>entry.id===id);if(!item)return;
  state.selected=item;$("#details-title").textContent=item.title;$("#details-subtitle").textContent=`ID ${item.id} · informações e anexo do registro.`;$("#details-body").innerHTML=detailsMarkup(item);
  $("#preview-button").disabled=!item.attachment;$("#download-button").disabled=!item.attachment;openModal("#details-modal",trigger);
}
async function showPreview(){
  const item=state.selected;if(!item?.attachment)return;
  const attachment=item.attachment;
  const extension=extensionOf(attachment.name);
  const source=attachmentSource(attachment);
  const body=$("#preview-body");
  $("#preview-title").textContent=attachment.name;
  body.innerHTML='<div class="preview-loading"><div class="preview-spinner"></div><p>Preparando visualização...</p></div>';
  openModal("#preview-modal");
  try{
    if(source&&(attachment.mimeType?.startsWith("image/")||["jpg","jpeg","png","gif","webp"].includes(extension))){body.innerHTML=`<img class="preview-image" src="${esc(source)}" alt="Prévia de ${esc(attachment.name)}">`;return;}
    if(source&&(attachment.mimeType==="application/pdf"||extension==="pdf")){body.innerHTML=`<iframe class="preview-frame" src="${esc(source)}" title="Prévia de ${esc(attachment.name)}"></iframe>`;return;}
    if(attachment.file&&(extension==="txt"||extension==="csv"||attachment.mimeType?.startsWith("text/"))){const text=await attachment.file.text();body.innerHTML=extension==="csv"?csvPreview(text):`<pre class="text-preview">${esc(text.slice(0,200000))}</pre>`;return;}
    if(attachment.file&&["docx","xlsx","pptx"].includes(extension)){body.innerHTML=await previewModernOffice(attachment.file,extension);return;}
    if(attachment.file&&["doc","xls","ppt"].includes(extension)){body.innerHTML=`${unavailablePreview(item,"Este é um formato antigo do Microsoft Office e não pode ser renderizado diretamente pelo navegador. Salve o arquivo como DOCX, XLSX ou PPTX para visualizar seu conteúdo aqui.")}<a class="button button--outline preview-open-link" href="${esc(source)}" target="_blank" rel="noopener">Abrir arquivo</a>`;return;}
    if(attachment.url&&/^https:\/\//i.test(attachment.url)&&["doc","docx","xls","xlsx","ppt","pptx"].includes(extension)){const viewer=`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(attachment.url)}`;body.innerHTML=`<iframe class="preview-frame" src="${esc(viewer)}" title="Prévia de ${esc(attachment.name)}"></iframe>`;return;}
    if(source){body.innerHTML=`${unavailablePreview(item,"Este formato não possui visualização nativa completa no navegador.")}<a class="button button--outline preview-open-link" href="${esc(source)}" target="_blank" rel="noopener">Abrir arquivo</a>`;return;}
    body.innerHTML=unavailablePreview(item,"Este é um registro mockado. O conteúdo real será exibido quando o backend fornecer a URL ou o arquivo do anexo.");
  }catch(error){console.error("Falha ao gerar prévia:",error);body.innerHTML=`${unavailablePreview(item,"Não foi possível gerar a prévia deste arquivo. Você ainda pode baixá-lo normalmente.")}`;toast("Não foi possível preparar a visualização.","error");}
}
function downloadItem(id){
  const item=items.find(entry=>entry.id===id)||state.selected;if(!item?.attachment){toast("Este item não possui anexo.","error");return;}
  const source=attachmentSource(item.attachment);
  if(source){const link=document.createElement("a");link.href=source;link.download=item.attachment.name;link.click();}
  else{const content=`SISTEMA IT\n\nArquivo demonstrativo: ${item.attachment.name}\nItem: ${item.id} - ${item.title}\n\nEste download é um mock do front-end. A API do setor fornecerá o arquivo real.`;const blob=new Blob([content],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`${item.attachment.name}.txt`;link.click();URL.revokeObjectURL(url);}
  toast("Download iniciado.","success");
}

async function deleteItem(id){
  const item=items.find(entry=>entry.id===id);
  if(!item){toast("Item não encontrado.","error");return;}
  const confirmed=window.confirm(`Deseja realmente excluir “${item.title}”?\n\nEssa ação não poderá ser desfeita.`);
  if(!confirmed)return;
  if(item.attachment?.objectUrl)URL.revokeObjectURL(item.attachment.objectUrl);
  items=items.filter(entry=>entry.id!==id);
  if(state.selected?.id===id){state.selected=null;closeTopModal();}
  try{await persistItems();}catch(error){console.error("Falha ao salvar exclusão:",error);toast("A exclusão vale apenas até a página ser atualizada.","error");}
  renderItems();
  toast(`${TYPE_LABELS[item.type]} excluído(a) com sucesso.`,"success");
}

/* ================================================================
   5. FORMULÁRIO DE CRIAÇÃO, EDIÇÃO E EXCLUSÃO DE ITENS
   Os dados e anexos são guardados no IndexedDB deste navegador.
   O backend futuro permitirá compartilhá-los entre colaboradores.
   ================================================================ */

function renderTypeOptions(){
  $("#type-options").innerHTML=Object.entries(TYPE_LABELS).map(([type,label])=>`<button class="type-option" type="button" data-new-type="${type}" aria-pressed="${state.newType===type}">${icon(TYPE_ICONS[type],"icon icon--large")}<span>${label}</span></button>`).join("");
}
function clearErrors(){["title","description","file"].forEach(field=>{const input=field==="file"?$("#item-file"):$(field==="title"?"#item-title":"#item-description");input?.removeAttribute("aria-invalid");$(`#${field}-error`).textContent="";});}
function validateForm(){
  clearErrors();let valid=true;const title=$("#item-title");const description=$("#item-description");const file=$("#item-file").files[0];
  if(!title.value.trim()){title.setAttribute("aria-invalid","true");$("#title-error").textContent="Informe o título.";valid=false;}
  if(description.value.trim().length<10){description.setAttribute("aria-invalid","true");$("#description-error").textContent="Descreva o item com pelo menos 10 caracteres.";valid=false;}
  if(file&&file.size>MAX_FILE_SIZE){$("#item-file").setAttribute("aria-invalid","true");$("#file-error").textContent="O arquivo deve ter no máximo 100 MB.";valid=false;}
  if(!valid){($("#new-item-form").querySelector('[aria-invalid="true"]'))?.focus();return false;}
  state.pendingPayload={type:state.newType,title:title.value.trim(),description:description.value.trim(),important:$("#item-important").checked,file};return true;
}

function resetItemForm(){
  state.editingId=null;
  state.newType="instruction";
  state.pendingPayload=null;
  $("#new-item-form").reset();
  clearErrors();
  renderTypeOptions();
  $("#new-item-title").textContent="Novo item";
  $("#item-submit-button").textContent="Revisar e publicar";
  $("#file-label").textContent="Clique para selecionar um arquivo";
}

function openEditForm(id){
  const item=items.find(entry=>entry.id===id);
  if(!item){toast("Item não encontrado.","error");return;}

  state.editingId=item.id;
  state.newType=item.type;
  state.pendingPayload=null;
  $("#new-item-form").reset();
  clearErrors();
  $("#item-title").value=item.title;
  $("#item-description").value=item.description;
  $("#item-important").checked=item.important;
  $("#new-item-title").textContent=`Editar ${item.id}`;
  $("#item-submit-button").textContent="Revisar alterações";
  $("#file-label").textContent=item.attachment?`${item.attachment.name} — selecione outro para substituir`:"Clique para selecionar um arquivo";
  renderTypeOptions();

  if(!$("#details-modal").hidden)closeModal($("#details-modal"));
  openModal("#new-item-modal");
}

async function saveItem(){
  const payload=state.pendingPayload;if(!payload)return;
  const now=new Date().toISOString();
  let savedItem;
  let action;

  if(state.editingId){
    const index=items.findIndex(item=>item.id===state.editingId);
    if(index<0){toast("Item não encontrado.","error");return;}

    const current=items[index];
    let updatedAttachment=current.attachment;
    if(payload.file){
      if(current.attachment?.objectUrl)URL.revokeObjectURL(current.attachment.objectUrl);
      updatedAttachment={name:payload.file.name,mimeType:payload.file.type||"application/octet-stream",sizeBytes:payload.file.size,file:payload.file,objectUrl:URL.createObjectURL(payload.file)};
    }

    savedItem={...current,type:payload.type,title:payload.title,description:payload.description,important:payload.important,updatedAt:now};
    if(updatedAttachment)savedItem.attachment=updatedAttachment;
    else delete savedItem.attachment;
    items[index]=savedItem;
    if(state.selected?.id===savedItem.id)state.selected=savedItem;
    action="atualizado";
  }else{
    const maxId=items.length?Math.max(...items.map(item=>Number(item.id.split("-")[1]))):0;
    savedItem={id:`IT-${String(maxId+1).padStart(3,"0")}`,type:payload.type,title:payload.title,description:payload.description,author:authors.joao,createdAt:now,updatedAt:now,important:payload.important};
    if(payload.file)savedItem.attachment={name:payload.file.name,mimeType:payload.file.type||"application/octet-stream",sizeBytes:payload.file.size,file:payload.file,objectUrl:URL.createObjectURL(payload.file)};
    items=[savedItem,...items];
    action="publicado";
  }

  state.search="";state.type="all";state.sort="newest";state.page=1;
  $("#search-input").value="";$("#sort-select").value="newest";
  let persisted=true;
  try{await persistItems();}catch(error){persisted=false;console.error("Falha ao salvar no navegador:",error);}
  closeModal($("#confirm-modal"));closeModal($("#new-item-modal"));
  renderItems();
  toast(persisted?`Item ${savedItem.id} ${action} e salvo neste navegador.`:`Item ${savedItem.id} ${action}, mas ficará disponível somente nesta sessão.`,persisted?"success":"error");
  resetItemForm();
}

/* ================================================================
   6. EVENTOS, ACESSIBILIDADE E INICIALIZAÇÃO
   ================================================================ */

function bindEvents(){
  $("#main-menu-link").addEventListener("click",event=>{if(!MAIN_MENU_URL){event.preventDefault();toast("A URL do Menu Principal ainda não foi configurada.");}else event.currentTarget.href=MAIN_MENU_URL;});
  $$("[data-font]").forEach(button=>button.addEventListener("click",()=>{const size=button.dataset.font;if(size==="normal")document.documentElement.removeAttribute("data-font-size");else document.documentElement.dataset.fontSize=size;toast("Tamanho do texto atualizado.","success");}));
  $("#contrast-button").addEventListener("click",event=>{const active=document.documentElement.classList.toggle("high-contrast");event.currentTarget.setAttribute("aria-pressed",String(active));toast("Modo de alto contraste alterado.","success");});
  $("#theme-select").addEventListener("change",event=>applyTheme(event.target.value,true));
  $("#search-form").addEventListener("submit",event=>{event.preventDefault();state.search=$("#search-input").value;state.page=1;renderItems();});
  $("#sort-select").addEventListener("change",event=>{state.sort=event.target.value;state.page=1;renderItems();});
  $("#clear-filters").addEventListener("click",()=>{$("#search-input").value="";state.search="";state.type="all";state.page=1;renderItems();});
  $("#new-item-button").addEventListener("click",event=>{resetItemForm();openModal("#new-item-modal",event.currentTarget);});
  $("#item-file").addEventListener("change",event=>{$("#file-label").textContent=event.target.files[0]?.name||"Clique para selecionar um arquivo";});
  $("#new-item-form").addEventListener("submit",event=>{event.preventDefault();if(validateForm()){const editing=Boolean(state.editingId);$("#confirm-title").textContent=editing?"Salvar alterações?":"Publicar este item?";$("#confirm-text").textContent=editing?`As alterações realizadas em “${state.pendingPayload.title}” serão salvas.`:`“${state.pendingPayload.title}” ficará disponível na central para todos os colaboradores com acesso.`;$("#confirm-publish").textContent=editing?"Salvar alterações":"Confirmar publicação";openModal("#confirm-modal");}});
  $("#confirm-publish").addEventListener("click",saveItem);
  $("#edit-button").addEventListener("click",()=>{if(state.selected)openEditForm(state.selected.id);});
  $("#preview-button").addEventListener("click",showPreview);$("#download-button").addEventListener("click",()=>downloadItem(state.selected?.id));$("#preview-download-button").addEventListener("click",()=>downloadItem(state.selected?.id));
  document.addEventListener("click",event=>{
    const filter=event.target.closest("[data-filter]");if(filter){state.type=filter.dataset.filter;state.page=1;renderItems();return;}
    const page=event.target.closest("[data-page]");if(page&&!page.disabled){state.page=Number(page.dataset.page);renderItems();$("#documents-title").scrollIntoView({behavior:"smooth"});return;}
    const remove=event.target.closest("[data-delete]");if(remove){deleteItem(remove.dataset.delete);return;}
    const open=event.target.closest("[data-open]");if(open){showDetails(open.dataset.open,open);return;}
    const download=event.target.closest("[data-download]");if(download){downloadItem(download.dataset.download);return;}
    const type=event.target.closest("[data-new-type]");if(type){state.newType=type.dataset.newType;renderTypeOptions();return;}
    const close=event.target.closest("[data-close-modal]");if(close){closeModal(close.closest(".modal"));return;}
    if(event.target.closest("[data-close-confirm]")){closeModal($("#confirm-modal"));}
  });
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeTopModal();if(event.key==="Tab"){const modal=$$('.modal:not([hidden])').at(-1);if(!modal)return;const focusable=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')];if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
}

document.addEventListener("DOMContentLoaded",async()=>{
  let savedTheme="system";
  try{savedTheme=localStorage.getItem(THEME_STORAGE_KEY)||"system";}catch(error){console.warn("Não foi possível ler a preferência de tema.",error);}
  applyTheme(savedTheme);
  bindEvents();
  renderTypeOptions();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(state.themePreference==="system")applyTheme("system");});
  try{await loadStoredItems();}catch(error){console.error("Falha ao carregar dados locais:",error);toast("Não foi possível acessar o armazenamento local. Os dados funcionarão somente nesta sessão.","error");}
  window.setTimeout(()=>{$("#loading-state").hidden=true;renderItems();},350);
});
