"use client";

import { useRef } from "react";
import { CalendarClock, Download, Eye, Paperclip, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { KnowledgeItem } from "@/types/item";
import { formatBytes, formatDate } from "@/utils/format";
import { ItemTypeIcon } from "./item-type-icon";
import { TypeBadge } from "./type-badge";

export function ItemDetailsDialog({ item, open, onOpenChange, onPreview, onDownload }: {
  item: KnowledgeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreview: () => void;
  onDownload: () => void;
}) {
  const openingPreview = useRef(false);
  if (!item) return null;

  const preview = () => {
    openingPreview.current = true;
    onPreview();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && openingPreview.current) {
      openingPreview.current = false;
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detalhes do item</DialogTitle>
          <DialogDescription>ID {item.id} · informações e anexo do registro.</DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 rounded-xl bg-[#edf6ff] p-4 text-[#0a467f]">
          <span className="rounded-lg bg-white p-2"><ItemTypeIcon type={item.type} className="size-6" /></span>
          <div><h2 className="text-lg font-bold">{item.title}</h2><div className="mt-1"><TypeBadge type={item.type} /></div></div>
        </div>
        <p className="leading-7 text-[#3f5873]">{item.description}</p>
        <dl className="grid gap-3 rounded-xl border border-[#d8e3ef] p-4 text-sm sm:grid-cols-2">
          <div className="flex gap-2"><UserRound className="size-5 text-[#1268b7]" /><span><dt className="font-bold">Criado por</dt><dd>{item.author.name}</dd></span></div>
          <div className="flex gap-2"><CalendarClock className="size-5 text-[#1268b7]" /><span><dt className="font-bold">Data de criação</dt><dd>{formatDate(item.createdAt, true)}</dd></span></div>
          <div className="flex gap-2"><CalendarClock className="size-5 text-[#1268b7]" /><span><dt className="font-bold">Última atualização</dt><dd>{formatDate(item.updatedAt, true)}</dd></span></div>
          <div className="flex gap-2"><Paperclip className="size-5 text-[#1268b7]" /><span><dt className="font-bold">Anexo</dt><dd>{item.attachment ? `${item.attachment.name} (${formatBytes(item.attachment.sizeBytes)})` : "Nenhum anexo"}</dd></span></div>
        </dl>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button onClick={preview} disabled={!item.attachment} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#7ea9d4] px-4 font-bold text-[#075ba7] disabled:opacity-35"><Eye className="size-5" />Visualizar</button>
          <button onClick={onDownload} disabled={!item.attachment} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0768c6] px-4 font-bold text-white disabled:opacity-35"><Download className="size-5" />Baixar anexo</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
