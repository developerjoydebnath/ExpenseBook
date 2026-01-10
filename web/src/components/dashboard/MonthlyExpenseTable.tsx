// 'use client';

// import { Button } from "@/components/ui/button";
// import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { useExpenses } from "@/hooks/useExpenses";
// import { Expense } from "@/lib/types";
// import { format, parseISO, startOfMonth, subMonths } from "date-fns";
// import { useEffect, useMemo, useState } from "react";
// import { MonthYearPicker } from "../shared/MonthYearPicker";

// export function MonthlyExpenseTable({ refreshTrigger }: { refreshTrigger?: number }) {
//   const { expenses, isLoading, mutate } = useExpenses(undefined, 1000, [{ date: "DescNullsFirst" }]);
//   const [selectedMonth, setSelectedMonth] = useState<string | undefined>("all");

//   useEffect(() => {
//     if (refreshTrigger !== undefined) {
//       mutate();
//     }
//   }, [refreshTrigger, mutate]);

//   const aggregatedData = useMemo(() => {
//     if (!expenses) return [];

//     const now = new Date();
//     const twelveMonthsAgo = startOfMonth(subMonths(now, 11));

//     // Aggregate data
//     const totals: Record<string, number> = {};
    
//     // Initialize last 12 months
//     for (let i = 0; i < 12; i++) {
//         const d = subMonths(now, i);
//         const key = format(d, "yyyy-MM");
//         totals[key] = 0;
//     }

//     expenses.forEach((e: Expense) => {
//       const date = parseISO(e.date);
//       if (date >= twelveMonthsAgo) {
//         const key = format(date, "yyyy-MM");
//         if (totals[key] !== undefined) {
//           totals[key] += e.amount;
//         }
//       }
//     });

//     // Convert back to array and filter by selectedMonth if not "all"
//     return Object.entries(totals)
//       .map(([key, amount]) => ({
//         key,
//         date: parseISO(key + "-01"),
//         amount
//       }))
//       .filter(item => selectedMonth === "all" || item.key === selectedMonth)
//       .sort((a, b) => b.date.getTime() - a.date.getTime());
//   }, [expenses, selectedMonth]);

//   const totalAmount = useMemo(() => {
//     return aggregatedData.reduce((sum, item) => sum + item.amount, 0);
//   }, [aggregatedData]);

//   if (isLoading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 w-full animate-pulse bg-muted rounded" />)}</div>;

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center gap-3">
//         <MonthYearPicker 
//             value={selectedMonth} 
//             onChange={(val) => setSelectedMonth(val || "all")} 
//             className="flex-1"
//         />
//         {selectedMonth !== "all" && (
//           <Button 
//             variant="ghost" 
//             onClick={() => setSelectedMonth("all")}
//             className="text-muted-foreground hover:text-primary"
//           >
//             Reset Filter
//           </Button>
//         )}
//       </div>

//       <div className="rounded-md border overflow-hidden">
//         <Table>
//           <TableHeader>
//             <TableRow className="bg-muted/50">
//               <TableHead className="font-bold">Month + Year</TableHead>
//               <TableHead className="font-bold text-right">Expense</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {aggregatedData.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">No data found</TableCell>
//               </TableRow>
//             ) : (
//               aggregatedData.map((item) => (
//                 <TableRow key={item.key} className="hover:bg-muted/30 transition-colors">
//                   <TableCell className="font-medium">{format(item.date, "MMMM yyyy")}</TableCell>
//                   <TableCell className="text-right font-semibold text-destructive">৳ {item.amount.toLocaleString()}</TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//           {aggregatedData.length > 0 && (
//             <TableFooter>
//               <TableRow>
//                 <TableCell className="font-bold text-right italic">Total:</TableCell>
//                 <TableCell className="text-right font-extrabold text-lg text-destructive">
//                   ৳ {totalAmount.toLocaleString()}
//                 </TableCell>
//               </TableRow>
//             </TableFooter>
//           )}
//         </Table>
//       </div>
//     </div>
//   );
// }


// components/dashboard/MonthlyExpenseTable.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useExpenses } from "@/hooks/useExpenses";
import { Expense } from "@/lib/types";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { MonthYearPicker } from "../shared/MonthYearPicker";

export function MonthlyExpenseTable({ refreshTrigger }: { refreshTrigger?: number }) {
  const { expenses, isLoading, mutate } = useExpenses(undefined, 1000, null, null, [{ date: "DescNullsFirst" }]);
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>("all");
  
  const prevRefreshTrigger = useRef(refreshTrigger);
  const hasMounted = useRef(false);

  useEffect(() => {
    // Skip on initial mount
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    
    // Only run if refreshTrigger actually changed
    if (refreshTrigger !== undefined && refreshTrigger !== prevRefreshTrigger.current) {
      prevRefreshTrigger.current = refreshTrigger;
      
      // Force mutation with a small delay
      setTimeout(() => {
        mutate();
      }, 100);
    }
  }, [refreshTrigger, mutate]);

  const aggregatedData = useMemo(() => {
    if (!expenses) return [];

    const now = new Date();
    const twelveMonthsAgo = startOfMonth(subMonths(now, 11));

    // Aggregate data
    const totals: Record<string, number> = {};
    
    // Initialize last 12 months
    for (let i = 0; i < 12; i++) {
        const d = subMonths(now, i);
        const key = format(d, "yyyy-MM");
        totals[key] = 0;
    }

    expenses.forEach((e: Expense) => {
      const date = parseISO(e.date);
      if (date >= twelveMonthsAgo) {
        const key = format(date, "yyyy-MM");
        if (totals[key] !== undefined) {
          totals[key] += e.amount;
        }
      }
    });

    // Convert back to array and filter by selectedMonth if not "all"
    return Object.entries(totals)
      .map(([key, amount]) => ({
        key,
        date: parseISO(key + "-01"),
        amount
      }))
      .filter(item => selectedMonth === "all" || item.key === selectedMonth)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses, selectedMonth]);

  const totalAmount = useMemo(() => {
    return aggregatedData.reduce((sum, item) => sum + item.amount, 0);
  }, [aggregatedData]);

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 w-full animate-pulse bg-muted rounded" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MonthYearPicker 
            value={selectedMonth} 
            onChange={(val) => setSelectedMonth(val || "all")} 
            className="flex-1"
        />
        {selectedMonth !== "all" && (
          <Button 
            variant="ghost" 
            onClick={() => setSelectedMonth("all")}
            className="text-muted-foreground hover:text-primary"
          >
            Reset Filter
          </Button>
        )}
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold">Month + Year</TableHead>
              <TableHead className="font-bold text-right">Expense</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aggregatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">No data found</TableCell>
              </TableRow>
            ) : (
              aggregatedData.map((item) => (
                <TableRow key={item.key} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{format(item.date, "MMMM yyyy")}</TableCell>
                  <TableCell className="text-right font-semibold text-destructive">৳ {item.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {aggregatedData.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold text-right italic">Total:</TableCell>
                <TableCell className="text-right font-extrabold text-lg text-destructive">
                  ৳ {totalAmount.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
