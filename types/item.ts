export const ITEM_TYPES=["instruction","flow","method","meeting"] as const;
export type ItemType=(typeof ITEM_TYPES)[number];
export interface Attachment{id:string;name:string;mimeType:string;sizeBytes:number;url?:string}
export interface Author{id:string;name:string;initials:string}
export interface KnowledgeItem{id:string;type:ItemType;title:string;description:string;attachment?:Attachment;author:Author;createdAt:string;updatedAt:string;important:boolean}
export interface CreateItemPayload{type:ItemType;title:string;description:string;important:boolean;attachment?:File}
export interface ItemQuery{search?:string;type?:ItemType|"all";sort?:"newest"|"oldest"|"title"|"updated";page?:number;pageSize?:number}
export interface PaginatedResponse<T>{data:T[];page:number;pageSize:number;total:number;totalPages:number}
export interface ApiError{code:string;message:string;fieldErrors?:Record<string,string>}
