import{CalendarDays,FileText,GitBranch,Settings2}from"lucide-react";import type{ItemType}from"@/types/item";
export function ItemTypeIcon({type,className="size-5"}:{type:ItemType;className?:string}){const Icon=type==="meeting"?CalendarDays:type==="flow"?GitBranch:type==="method"?Settings2:FileText;return <Icon className={className} aria-hidden="true"/>}
