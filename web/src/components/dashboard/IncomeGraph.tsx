// 'use client';

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useIncomes } from "@/hooks/useIncomes";
// import { Income } from "@/lib/types";
// import { format, parseISO, startOfMonth, subMonths } from "date-fns";
// import { motion } from "framer-motion";
// import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// import { useEffect } from "react";

// export function IncomeGraph({ refreshTrigger }: { refreshTrigger?: number }) {
//   const { incomes, isLoading, mutate } = useIncomes();

//   useEffect(() => {
//     if (refreshTrigger !== undefined) {
//       mutate();
//     }
//   }, [refreshTrigger, mutate]);

//   // Group by month (last 12 months)
//   const data = Array.from({ length: 12 }).map((_, i) => {
//     const date = subMonths(startOfMonth(new Date()), i);
//     const key = format(date, "yyyy-MM");
//     const label = format(date, "MMM yyyy");
    
//     const total = (incomes || [])
//       .filter((inc: Income) => {
//         const incomeDate = parseISO(inc.date);
//         return format(incomeDate, "yyyy-MM") === key;
//       })
//       .reduce((sum: number, inc: Income) => sum + inc.amount, 0);
      
//     return { 
//       fullDate: key,
//       month: label,
//       amount: total 
//     };
//   });

//   if (isLoading) return <Card className="mt-8 h-[300px] animate-pulse bg-muted" />;

//   return (
//     <Card className="mt-8 border-primary/20 shadow-lg bg-linear-to-br from-primary/5 to-transparent">
//       <CardHeader>
//         <CardTitle className="text-primary flex items-center gap-2">
//           Monthly Income Graph
//           <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Last 12 Months</span>
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
//           <ResponsiveContainer width="100%" height={220}>
//             <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
//               <XAxis 
//                 dataKey="month" 
//                 tick={{ fontSize: 12, fontWeight: 600 }} 
//                 axisLine={false}
//                 tickLine={false}
//               />
//               <YAxis 
//                 tick={{ fontSize: 10 }} 
//                 axisLine={false}
//                 tickLine={false}
//               />
//               <Tooltip 
//                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
//                 cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
//               />
//               <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
//                 <LabelList dataKey="amount" position="top" style={{ fontSize: 10, fill: '#3b82f6', fontWeight: 'bold' }} />
//               </Bar>
//             </BarChart>
//           </ResponsiveContainer>
//         </motion.div>
//       </CardContent>
//     </Card>
//   );
// }


'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncomes } from "@/hooks/useIncomes";
import { Income } from "@/lib/types";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function IncomeGraph({ refreshTrigger }: { refreshTrigger?: number }) {
  const { incomes, isLoading, mutate } = useIncomes(undefined, 1000);
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

  // Loading skeleton
  if (isLoading) {
    // Create predictable heights for skeleton bars
    const skeletonHeights = [40, 60, 30, 70, 50, 65, 45, 75, 35, 55, 80, 25];
    
    return (
      <Card className="mt-8 border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <div className="h-6 w-48 bg-primary/20 rounded animate-pulse"></div>
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            {/* Skeleton chart bars */}
            <div className="flex items-end justify-between h-full">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-6 bg-primary/20 rounded-t-sm animate-pulse" 
                    style={{ 
                      height: `${skeletonHeights[index]}%`,
                      animationDelay: `${index * 0.05}s`
                    }}
                  ></div>
                  <div className="h-4 w-10 bg-muted rounded mt-2 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by month (last 12 months)
  const data = Array.from({ length: 12 }).map((_, i) => {
    const date = subMonths(startOfMonth(new Date()), i);
    const key = format(date, "yyyy-MM");
    const label = format(date, "MMM yyyy");
    
    const total = (incomes || [])
      .filter((inc: Income) => {
        const incomeDate = parseISO(inc.date);
        return format(incomeDate, "yyyy-MM") === key;
      })
      .reduce((sum: number, inc: Income) => sum + inc.amount, 0);
      
    return { 
      fullDate: key,
      month: label,
      amount: total 
    };
  });

  return (
    <Card className="mt-8 border-primary/20 shadow-lg bg-linear-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          Monthly Income Graph
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Last 12 Months</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fontWeight: 600 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="amount" position="top" style={{ fontSize: 10, fill: '#3b82f6', fontWeight: 'bold' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}