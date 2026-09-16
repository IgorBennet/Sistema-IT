"use strict";

const TYPE_LABELS={instruction:"Instrução de Trabalho",flow:"Fluxo",method:"Método",meeting:"Pauta de Reunião"};
const TYPE_ICONS={instruction:"i-file",flow:"i-flow",method:"i-settings",meeting:"i-calendar"};
const FILTERS=[{value:"all",label:"Todos"},{value:"instruction",label:"Instruções"},{value:"flow",label:"Fluxos"},{value:"method",label:"Métodos"},{value:"meeting",label:"Pautas de Reunião"}];
const PAGE_SIZE=5;
const MAX_FILE_SIZE=10*1024*1024;
const MAIN_MENU_URL="";

const authors={maria:{name:"Maria Souza",initials:"MS"},carlos:{name:"Carlos Lima",initials:"CL"},joao:{name:"João Silva",initials:"JS"},ana:{name:"Ana Paula",initials:"AP"},roberto:{name:"Roberto Ferreira",initials:"RF"}};
const attachment=(name,mimeType="application/pdf")=>({name,mimeType,sizeBytes:1240000});
let items=[
  {id:"IT-028",type:"meeting",title:"Reunião Semanal da Qualidade",description:"Alinhamento sobre a inspeção FOS, resultados da auditoria interna e metas da semana.",attachment:attachment("Pauta_Qualidade_15-09.pdf"),author:authors.maria,createdAt:"2026-09-15T13:30:00Z",updatedAt:"2026-09-15T13:30:00Z",important:true},
  {id:"IT-027",type:"meeting",title:"Reunião de Planejamento — Setembro",description:"Planejamento das atividades do setor, responsáveis e prazos para o mês.",attachment:attachment("Planejamento_Setembro.pdf"),author:authors.carlos,createdAt:"2026-09-08T14:00:00Z",updatedAt:"2026-09-11T10:20:00Z",important:false},
  {id:"IT-026",type:"meeting",title:"Acompanhamento de Indicadores",description:"Revisão dos indicadores do setor e ações para melhoria contínua.",attachment:attachment("Indicadores_Setor.xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),author:authors.joao,createdAt:"2026-09-01T12:00:00Z",updatedAt:"2026-09-05T09:45:00Z",important:false},
  {id:"IT-025",type:"instruction",title:"Inspeção FOS",description:"Procedimento padrão para realização da inspeção final dos equipamentos FOS.",attachment:attachment("IT_Inspecao_FOS.pdf"),author:authors.maria,createdAt:"2026-08-28T18:32:00Z",updatedAt:"2026-09-14T13:18:00Z",important:true},
  {id:"IT-024",type:"flow",title:"Fluxo de Retrabalho",description:"Fluxo para tratamento de produtos bloqueados e direcionamento das áreas responsáveis.",attachment:attachment("Fluxo_Retrabalho.pdf"),author:authors.carlos,createdAt:"2026-08-22T14:00:00Z",updatedAt:"2026-09-12T11:05:00Z",important:false},
  {id:"IT-023",type:"method",title:"Método de Controle de Estoque",description:"Método para controle, conferência e atualização dos materiais do setor.",attachment:attachment("Metodo_Estoque.pdf"),author:authors.ana,createdAt:"2026-08-18T14:00:00Z",updatedAt:"2026-09-10T12:00:00Z",important:false},
  {id:"IT-022",type:"instruction",title:"Atendimento ao Cliente Interno",description:"Diretrizes para atendimento das solicitações recebidas pelo setor.",attachment:attachment("Atendimento.pdf"),author:authors.joao,createdAt:"2026-08-12T14:00:00Z",updatedAt:"2026-08-12T14:00:00Z",important:false},
  {id:"IT-021",type:"instruction",title:"Política de Segurança da Informação",description:"Regras para o uso seguro das informações e dos recursos corporativos.",attachment:attachment("Politica_SI.pdf"),author:authors.roberto,createdAt:"2026-08-04T14:00:00Z",updatedAt:"2026-09-01T14:00:00Z",important:true},
  {id:"IT-020",type:"method",title:"Método de Auditoria de Processo",description:"Orientações para planejar, executar e registrar auditorias internas de processo.",attachment:attachment("Metodo_Auditoria.docx","application/vnd.openxmlformats-officedocument.wordprocessingml.document"),author:authors.maria,createdAt:"2026-07-28T14:00:00Z",updatedAt:"2026-08-16T14:00:00Z",important:false},
  {id:"IT-019",type:"flow",title:"Fluxo de Aprovação de Documentos",description:"Etapas e responsáveis pela revisão e aprovação de documentos do setor.",attachment:attachment("Fluxo_Aprovacao.pdf"),author:authors.ana,createdAt:"2026-07-17T14:00:00Z",updatedAt:"2026-08-02T14:00:00Z",important:false},
  {id:"IT-018",type:"meeting",title:"Reunião de Lições Aprendidas",description:"Registro de melhorias, aprendizados e acordos após o fechamento do projeto.",author:authors.roberto,createdAt:"2026-07-10T14:00:00Z",updatedAt:"2026-07-10T14:00:00Z",important:false},
  {id:"IT-017",type:"instruction",title:"Abertura de Chamados",description:"Passo a passo para registro, classificação e acompanhamento de chamados internos.",attachment:attachment("IT_Chamados.pdf"),author:authors.joao,createdAt:"2026-06-30T14:00:00Z",updatedAt:"2026-07-03T14:00:00Z",important:false}
];

const state={search:"",type:"all",sort:"newest",page:1,selected:null,newType:"instruction",pendingPayload:null,lastFocused:null};
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const icon=(id,className="icon")=>`<svg class="${className}" aria-hidden="true"><use href="#${id}"></use></svg>`;
const normalize=value=>String(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const formatDate=(value,withTime=false)=>new Intl.DateTimeFormat("pt-BR",withTime?{dateStyle:"short",timeStyle:"short"}:{dateStyle:"short"}).format(new Date(value));
const formatBytes=bytes=>bytes>=1048576?`${(bytes/1048576).toFixed(1).replace(".",",")} MB`:`${Math.ceil(bytes/1024)} KB`;
const badge=type=>`<span class="badge badge--${type}">${esc(TYPE_LABELS[type])}</span>`;
const important=item=>item.important?`<span class="important-badge">${icon("i-pin")}Importante</span>`:"";

function toast(message,type="info"){
  const element=document.createElement("div");
  element.className=`toast toast--${type}`;
  element.textContent=message;
  $("#toast-region").append(element);
  window.setTimeout(()=>element.remove(),3500);
}

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
    <div class="meeting-card__footer"><span class="author"><span class="avatar">${esc(item.author.initials)}</span><span>${esc(item.author.name)}<br>${formatDate(item.createdAt)}</span></span><span class="mini-actions"><button class="mini-button" type="button" data-open="${item.id}" aria-label="Ver detalhes de ${esc(item.title)}">${icon("i-eye")}</button><button class="mini-button" type="button" data-download="${item.id}" ${item.attachment?"":"disabled"} aria-label="Baixar anexo de ${esc(item.title)}">${icon("i-download")}</button></span></div>
  </article>`).join("");
}

function tableRow(item){return `<tr><td><strong>${esc(item.id)}</strong></td><td><div class="item-title"><span class="item-type-icon">${icon(TYPE_ICONS[item.type])}</span><span>${badge(item.type)}<strong>${esc(item.title)}</strong><small>${esc(item.description)}</small></span></div></td><td><span class="author"><span class="avatar">${esc(item.author.initials)}</span>${esc(item.author.name)}</span></td><td class="date-cell">${formatDate(item.updatedAt,true)}</td><td><span class="attachment-name">${icon("i-paperclip")}${item.attachment?esc(item.attachment.name):"Sem anexo"}</span></td><td><div class="row-actions"><button class="mini-button" type="button" data-open="${item.id}" aria-label="Ver detalhes de ${esc(item.title)}">${icon("i-eye")}</button><button class="mini-button" type="button" data-download="${item.id}" ${item.attachment?"":"disabled"} aria-label="Baixar anexo de ${esc(item.title)}">${icon("i-download")}</button></div></td></tr>`;}
function mobileCard(item){return `<article class="mobile-item"><div class="mobile-item__head">${badge(item.type)}${important(item)}</div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="mobile-item__meta"><span><strong>ID:</strong> ${esc(item.id)}</span><span><strong>Autor:</strong> ${esc(item.author.name)}</span><span><strong>Atualização:</strong> ${formatDate(item.updatedAt)}</span><span><strong>Anexo:</strong> ${item.attachment?"Disponível":"Não possui"}</span></div><div class="mobile-item__actions"><button class="button button--outline" type="button" data-open="${item.id}">${icon("i-eye")}Detalhes</button><button class="button button--primary" type="button" data-download="${item.id}" ${item.attachment?"":"disabled"}>${icon("i-download")}Baixar</button></div></article>`;}

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

function detailsMarkup(item){return `<div class="details-hero"><span class="item-type-icon">${icon(TYPE_ICONS[item.type],"icon icon--large")}</span><div><h3>${esc(item.title)}</h3>${badge(item.type)} ${important(item)}</div></div><p class="details-description">${esc(item.description)}</p><div class="details-grid"><div class="detail-field">${icon("i-user")}<span><strong>Criado por</strong>${esc(item.author.name)}</span></div><div class="detail-field">${icon("i-calendar")}<span><strong>Data de criação</strong>${formatDate(item.createdAt,true)}</span></div><div class="detail-field">${icon("i-calendar")}<span><strong>Última atualização</strong>${formatDate(item.updatedAt,true)}</span></div><div class="detail-field">${icon("i-paperclip")}<span><strong>Anexo</strong>${item.attachment?`${esc(item.attachment.name)} (${formatBytes(item.attachment.sizeBytes)})`:"Nenhum anexo"}</span></div></div>`;}
function showDetails(id,trigger){
  const item=items.find(entry=>entry.id===id);if(!item)return;
  state.selected=item;$("#details-title").textContent=item.title;$("#details-subtitle").textContent=`ID ${item.id} · informações e anexo do registro.`;$("#details-body").innerHTML=detailsMarkup(item);
  $("#preview-button").disabled=!item.attachment;$("#download-button").disabled=!item.attachment;openModal("#details-modal",trigger);
}
function showPreview(){
  const item=state.selected;if(!item?.attachment)return;
  $("#preview-title").textContent=item.attachment.name;
  $("#preview-body").innerHTML=`${icon("i-file","icon icon--xl")}<h3>${esc(item.attachment.name)}</h3><p>Pré-visualização demonstrativa do anexo associado a <strong>${esc(item.title)}</strong>.</p><p>Na integração com o backend, o arquivo real será exibido nesta área.</p><small>${esc(item.attachment.mimeType)} · ${formatBytes(item.attachment.sizeBytes)}</small>`;
  openModal("#preview-modal");
}
function downloadItem(id){
  const item=items.find(entry=>entry.id===id)||state.selected;if(!item?.attachment){toast("Este item não possui anexo.","error");return;}
  if(item.attachment.objectUrl){const link=document.createElement("a");link.href=item.attachment.objectUrl;link.download=item.attachment.name;link.click();}
  else{const content=`SISTEMA IT\n\nArquivo demonstrativo: ${item.attachment.name}\nItem: ${item.id} - ${item.title}\n\nEste download é um mock do front-end. A API do setor fornecerá o arquivo real.`;const blob=new Blob([content],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`${item.attachment.name}.txt`;link.click();URL.revokeObjectURL(url);}
  toast("Download iniciado.","success");
}

function renderTypeOptions(){
  $("#type-options").innerHTML=Object.entries(TYPE_LABELS).map(([type,label])=>`<button class="type-option" type="button" data-new-type="${type}" aria-pressed="${state.newType===type}">${icon(TYPE_ICONS[type],"icon icon--large")}<span>${label}</span></button>`).join("");
}
function clearErrors(){["title","description","file"].forEach(field=>{const input=field==="file"?$("#item-file"):$(field==="title"?"#item-title":"#item-description");input?.removeAttribute("aria-invalid");$(`#${field}-error`).textContent="";});}
function validateForm(){
  clearErrors();let valid=true;const title=$("#item-title");const description=$("#item-description");const file=$("#item-file").files[0];
  if(!title.value.trim()){title.setAttribute("aria-invalid","true");$("#title-error").textContent="Informe o título.";valid=false;}
  if(description.value.trim().length<10){description.setAttribute("aria-invalid","true");$("#description-error").textContent="Descreva o item com pelo menos 10 caracteres.";valid=false;}
  if(file&&file.size>MAX_FILE_SIZE){$("#item-file").setAttribute("aria-invalid","true");$("#file-error").textContent="O arquivo deve ter no máximo 10 MB.";valid=false;}
  if(!valid){($("#new-item-form").querySelector('[aria-invalid="true"]'))?.focus();return false;}
  state.pendingPayload={type:state.newType,title:title.value.trim(),description:description.value.trim(),important:$("#item-important").checked,file};return true;
}
function publishItem(){
  const payload=state.pendingPayload;if(!payload)return;
  const maxId=Math.max(...items.map(item=>Number(item.id.split("-")[1])));const now=new Date().toISOString();
  const newItem={id:`IT-${String(maxId+1).padStart(3,"0")}`,type:payload.type,title:payload.title,description:payload.description,author:authors.joao,createdAt:now,updatedAt:now,important:payload.important};
  if(payload.file)newItem.attachment={name:payload.file.name,mimeType:payload.file.type||"application/octet-stream",sizeBytes:payload.file.size,objectUrl:URL.createObjectURL(payload.file)};
  items=[newItem,...items];state.search="";state.type="all";state.sort="newest";state.page=1;$("#search-input").value="";$("#sort-select").value="newest";
  $("#new-item-form").reset();state.newType="instruction";renderTypeOptions();$("#file-label").textContent="Clique para selecionar um arquivo";state.pendingPayload=null;
  closeModal($("#confirm-modal"));closeModal($("#new-item-modal"));renderItems();toast(`Item ${newItem.id} publicado com sucesso.`,"success");
}

function bindEvents(){
  $("#main-menu-link").addEventListener("click",event=>{if(!MAIN_MENU_URL){event.preventDefault();toast("A URL do Menu Principal ainda não foi configurada.");}else event.currentTarget.href=MAIN_MENU_URL;});
  $$("[data-font]").forEach(button=>button.addEventListener("click",()=>{const size=button.dataset.font;if(size==="normal")document.documentElement.removeAttribute("data-font-size");else document.documentElement.dataset.fontSize=size;toast("Tamanho do texto atualizado.","success");}));
  $("#contrast-button").addEventListener("click",event=>{const active=document.documentElement.classList.toggle("high-contrast");event.currentTarget.setAttribute("aria-pressed",String(active));toast("Modo de alto contraste alterado.","success");});
  $("#search-form").addEventListener("submit",event=>{event.preventDefault();state.search=$("#search-input").value;state.page=1;renderItems();});
  $("#sort-select").addEventListener("change",event=>{state.sort=event.target.value;state.page=1;renderItems();});
  $("#clear-filters").addEventListener("click",()=>{$("#search-input").value="";state.search="";state.type="all";state.page=1;renderItems();});
  $("#new-item-button").addEventListener("click",event=>{clearErrors();renderTypeOptions();openModal("#new-item-modal",event.currentTarget);});
  $("#item-file").addEventListener("change",event=>{$("#file-label").textContent=event.target.files[0]?.name||"Clique para selecionar um arquivo";});
  $("#new-item-form").addEventListener("submit",event=>{event.preventDefault();if(validateForm()){$("#confirm-text").textContent=`“${state.pendingPayload.title}” ficará disponível na central para todos os colaboradores com acesso.`;openModal("#confirm-modal");}});
  $("#confirm-publish").addEventListener("click",publishItem);
  $("#preview-button").addEventListener("click",showPreview);$("#download-button").addEventListener("click",()=>downloadItem(state.selected?.id));$("#preview-download-button").addEventListener("click",()=>downloadItem(state.selected?.id));
  document.addEventListener("click",event=>{
    const filter=event.target.closest("[data-filter]");if(filter){state.type=filter.dataset.filter;state.page=1;renderItems();return;}
    const page=event.target.closest("[data-page]");if(page&&!page.disabled){state.page=Number(page.dataset.page);renderItems();$("#documents-title").scrollIntoView({behavior:"smooth"});return;}
    const open=event.target.closest("[data-open]");if(open){showDetails(open.dataset.open,open);return;}
    const download=event.target.closest("[data-download]");if(download){downloadItem(download.dataset.download);return;}
    const type=event.target.closest("[data-new-type]");if(type){state.newType=type.dataset.newType;renderTypeOptions();return;}
    const close=event.target.closest("[data-close-modal]");if(close){closeModal(close.closest(".modal"));return;}
    if(event.target.closest("[data-close-confirm]")){closeModal($("#confirm-modal"));}
  });
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeTopModal();if(event.key==="Tab"){const modal=$$('.modal:not([hidden])').at(-1);if(!modal)return;const focusable=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')];if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
}

document.addEventListener("DOMContentLoaded",()=>{bindEvents();renderTypeOptions();window.setTimeout(()=>{$("#loading-state").hidden=true;renderItems();},350);});
