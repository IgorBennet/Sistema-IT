import{TYPE_LABELS}from"@/constants/items";import type{ItemType}from"@/types/item";
const colors:Record<ItemType,string>={instruction:"bg-[#e1efff] text-[#0756a3]",flow:"bg-[#e9f5ff] text-[#075b87]",method:"bg-[#eef0f3] text-[#26384b]",meeting:"bg-[#e6f2ff] text-[#075ca8]"};
export function TypeBadge({type,short=false}:{type:ItemType;short?:boolean}){const label=short&&type==="instruction"?"Instrução":short&&type==="meeting"?"Pauta":TYPE_LABELS[type];return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${colors[type]}`}>{label}</span>}
