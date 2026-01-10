'use client';

import { EditIncomeForm } from "@/components/forms/EditIncomeForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteIncome, useIncomes } from "@/hooks/useIncomes";
import { Income } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Edit, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function IncomeTable({ 
  initialDate, 
  hideFilter, 
  limit: initialLimit = 10,
  orderBy,
  refreshTrigger 
}: { 
  initialDate?: string; 
  hideFilter?: boolean; 
  limit?: number;
  orderBy?: Record<string, string>[];
  refreshTrigger?: number;
}) {
  const [date, setDate] = useState<Date | undefined>(initialDate ? new Date(initialDate) : undefined);
  const [limit, setLimit] = useState(initialLimit);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const currentCursor = cursorStack[cursorStack.length - 1];

  const { 
    incomes, 
    isLoading, 
    mutate,
    totalCount,
    pageInfo 
  } = useIncomes(
    date ? format(date, "yyyy-MM-dd") : undefined,
    limit,
    currentCursor,
    null,
    orderBy
  );
  
  const prevRefreshTrigger = useRef(refreshTrigger);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    
    if (refreshTrigger !== undefined && refreshTrigger !== prevRefreshTrigger.current) {
      prevRefreshTrigger.current = refreshTrigger;
      setTimeout(() => {
        mutate();
      }, 100);
    }
  }, [refreshTrigger, mutate]);
  
  const { executeMutation: deleteIncome, fetching: deleting } = useDeleteIncome();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editIncome, setEditIncome] = useState<Income | null>(null);

  const handleNextPage = () => {
    if (pageInfo.hasNextPage && pageInfo.endCursor) {
      setCursorStack(prev => [...prev, pageInfo.endCursor]);
    }
  };

  const handlePreviousPage = () => {
    if (cursorStack.length > 1) {
      setCursorStack(prev => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    setSearch("");
    setDate(undefined);
    setCursorStack([null]);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteIncome({ id: deleteId });
      mutate();
      toast.success("Income deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete income");
    } finally {
      setDeleteId(null);
    }
  };

  const handleEditSuccess = () => {
    mutate();
    setEditIncome(null);
  };

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 w-full animate-pulse bg-muted rounded" />)}</div>;
  
  // Client-side search filtering on current page results
  const filtered = (incomes || []).filter((i: Income) =>
    i.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {!hideFilter && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Input
            placeholder="Search income..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  setCursorStack([null]); // Reset pagination on date change
                }}
                initialFocus
                disabled={(date) => date > new Date()}
              />
              {date && (
                <div className="p-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setDate(undefined);
                    setCursorStack([null]);
                  }} className="w-full text-xs h-7">Clear Filter</Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          {(search || date) && (
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="w-full sm:w-auto text-muted-foreground hover:text-primary gap-2"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          )}
        </div>
      )}

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold">Source</TableHead>
              <TableHead className="font-bold text-right">Amount</TableHead>
              <TableHead className="font-bold text-center">Date</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No incomes found</TableCell>
              </TableRow>
            ) : (
              filtered.map((income: Income) => (
                <TableRow key={income.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{income.source}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">৳ {income.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-muted-foreground text-sm">{format(new Date(income.date), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => setEditIncome(income)}>
                        <Edit size={16} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                        onClick={() => setDeleteId(income.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {filtered.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-bold text-right italic">
                  Total (Page {cursorStack.length}):
                </TableCell>
                <TableCell className="text-right font-extrabold text-lg text-primary">
                  ৳ {filtered.reduce((sum: number, i: Income) => sum + i.amount, 0).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select 
            value={limit.toString()} 
            onValueChange={(v) => {
              setLimit(Number(v));
              setCursorStack([null]); // Reset pagination on limit change
            }}
          >
            <SelectTrigger className="w-17.5 h-8 text-xs">
              <SelectValue placeholder={limit} />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map(size => (
                <SelectItem key={size} value={size.toString()} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm text-muted-foreground">
             {totalCount > 0 ? `${(cursorStack.length - 1) * limit + 1}-${Math.min(cursorStack.length * limit, totalCount)} of ${totalCount}` : '0 items'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePreviousPage}
              disabled={cursorStack.length <= 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextPage}
              disabled={!pageInfo.hasNextPage}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Income"
        message="Are you sure you want to delete this income? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
        confirmLabel="Delete"
      />

      <Dialog open={!!editIncome} onOpenChange={(open) => !open && setEditIncome(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Edit Income</DialogTitle></DialogHeader>
          {editIncome && (
            <EditIncomeForm income={editIncome} onSuccess={handleEditSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}