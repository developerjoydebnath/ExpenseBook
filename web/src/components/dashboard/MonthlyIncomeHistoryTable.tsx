'use client';

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIncomes } from "@/hooks/useIncomes";
import { Income } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function MonthlyIncomeHistoryTable({ refreshTrigger }: { refreshTrigger?: number }) {
  const { incomes, isLoading, mutate } = useIncomes(undefined, 1000, null, null, [{ date: "DescNullsFirst" }]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      mutate();
    }
  }, [refreshTrigger, mutate]);

  const months = [
    { label: "January", value: "01" },
    { label: "February", value: "02" },
    { label: "March", value: "03" },
    { label: "April", value: "04" },
    { label: "May", value: "05" },
    { label: "June", value: "06" },
    { label: "July", value: "07" },
    { label: "August", value: "08" },
    { label: "September", value: "09" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const aggregatedData = useMemo(() => {
    if (!incomes) return [];

    const totals: Record<string, number> = {};
    incomes.forEach((i: Income) => {
      const date = parseISO(i.date);
      const key = format(date, "yyyy-MM");
      totals[key] = (totals[key] || 0) + i.amount;
    });

    return Object.entries(totals)
      .map(([key, amount]) => {
        const [year, month] = key.split("-");
        return {
          key,
          year,
          month,
          date: parseISO(key + "-01"),
          amount
        };
      })
      .filter(item => {
        const monthMatch = selectedMonth === "all" || item.month === selectedMonth;
        const yearMatch = selectedYear === "all" || item.year === selectedYear;
        return monthMatch && yearMatch;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [incomes, selectedMonth, selectedYear]);

  const years = useMemo(() => {
    const uniqueYears = new Set<string>();
    incomes?.forEach((i: Income) => {
      uniqueYears.add(format(parseISO(i.date), "yyyy"));
    });
    return Array.from(uniqueYears).sort((a, b) => b.localeCompare(a));
  }, [incomes]);

  const handleReset = () => {
    setSelectedMonth("all");
    setSelectedYear("all");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(aggregatedData.length / pageSize);
  const paginatedData = aggregatedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 w-full animate-pulse bg-muted rounded" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedMonth} onValueChange={(val) => { setSelectedMonth(val); setCurrentPage(1); }}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={(val) => { setSelectedYear(val); setCurrentPage(1); }}>
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(selectedMonth !== "all" || selectedYear !== "all") && (
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="text-muted-foreground hover:text-primary gap-2"
          >
            <RotateCcw size={14} />
            Reset
          </Button>
        )}
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold">Month</TableHead>
              <TableHead className="font-bold text-right">Total Income</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">No data found for selected filters</TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.key} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{format(item.date, "MMMM yyyy")}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">৳ {item.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {paginatedData.length > 0 && (
            <TableFooter>
                <TableRow>
                  <TableCell className="font-bold italic">Total:</TableCell>
                  <TableCell className="text-right font-extrabold text-lg text-primary">
                    ৳ {aggregatedData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                  </TableCell>
                </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {aggregatedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px] h-8 text-xs">
                <SelectValue placeholder={pageSize} />
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
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
