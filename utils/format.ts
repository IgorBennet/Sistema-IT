export const formatDate=(value:string,withTime=false)=>new Intl.DateTimeFormat("pt-BR",withTime?{dateStyle:"short",timeStyle:"short"}:{dateStyle:"short"}).format(new Date(value));
export const formatBytes=(bytes:number)=>bytes<1024*1024?`${Math.max(1,Math.round(bytes/1024))} KB`:`${(bytes/(1024*1024)).toFixed(1).replace(".",",")} MB`;
