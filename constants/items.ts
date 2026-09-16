import type{ItemType}from"@/types/item";
export const TYPE_LABELS:Record<ItemType,string>={instruction:"Instrução de Trabalho",flow:"Fluxo",method:"Método",meeting:"Pauta de Reunião"};
export const FILTERS:Array<{value:ItemType|"all";label:string}>=[{value:"all",label:"Todos"},{value:"instruction",label:"Instruções"},{value:"flow",label:"Fluxos"},{value:"method",label:"Métodos"},{value:"meeting",label:"Pautas de Reunião"}];
export const PAGE_SIZE=5;export const MAX_FILE_SIZE=10*1024*1024;export const ACCEPTED_FILES=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png";export const MAIN_MENU_URL=process.env.NEXT_PUBLIC_MAIN_MENU_URL?.trim()??"";
