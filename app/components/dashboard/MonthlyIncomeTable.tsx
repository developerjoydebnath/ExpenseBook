import { GET_INCOMES } from '@/services/queries';
import { supabase } from '@/services/supabase';
import { format } from 'date-fns';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, DataTable, Text, useTheme } from 'react-native-paper';
import { useQuery } from 'urql';
import MonthYearPicker from '../shared/MonthYearPicker';

interface IncomeItem {
  id: string;
  source: string;
  amount: number;
  date: string;
}

interface MonthlyIncomeTableProps {
  limitMonths?: number; // If set, only show last N months, no pagination
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function groupIncomesByMonth(incomes: IncomeItem[]) {
  const map: Record<string, number> = {};
  incomes.forEach((i) => {
    if (!i.date) return;
    const d = new Date(i.date);
    const key = format(d, 'MMM-yyyy');
    map[key] = (map[key] || 0) + i.amount;
  });
  return Object.entries(map)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => {
      const [am, ay] = a.month.split('-');
      const [bm, by] = b.month.split('-');
      const ad = new Date(`${am} 1, ${ay}`);
      const bd = new Date(`${bm} 1, ${by}`);
      return bd.getTime() - ad.getTime();
    });
}

const MonthlyIncomeTable: React.FC<MonthlyIncomeTableProps> = ({ limitMonths }) => {
  const theme = useTheme();
  const [filterDate, setFilterDate] = React.useState<Date | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const [{ data, fetching }] = useQuery({
    query: GET_INCOMES,
     variables: {
      filter: { 
        userId: { eq: userId },
      },
      orderBy: [{ date: "DescNullsLast" }],
      first: 1000, 
    },
    pause: !userId,
  });

  const incomes: IncomeItem[] = React.useMemo(() => {
    return data?.incomeCollection?.edges?.map((e: any) => e.node) || [];
  }, [data]);

  const filteredIncomes = React.useMemo(() => {
    if (!filterDate) return incomes;
    const key = getMonthKey(filterDate);
    return incomes.filter(i => i.date && format(new Date(i.date), 'yyyy-MM') === key);
  }, [incomes, filterDate]);

  const monthly = React.useMemo(() => {
    let m = groupIncomesByMonth(filteredIncomes);
    // If limitMonths is set, only show last N months (no pagination)
    if (limitMonths && m.length > limitMonths) {
      m = m.slice(0, limitMonths);
    }
    return m;
  }, [filteredIncomes, limitMonths]);

  // Pagination for all months (if not limited)
  const [page, setPage] = React.useState(0);
  const itemsPerPage = 12;
  const paginatedMonthly = limitMonths ? monthly : monthly.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const numberOfPages = limitMonths ? 1 : Math.ceil(monthly.length / itemsPerPage);

  if (fetching && !incomes.length) {
      return (
          <View style={[styles.container, { backgroundColor: theme.colors.elevation.level2, padding: 20, alignItems: 'center' }]}>
              <Text>Loading monthly stats...</Text>
          </View>
      );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.elevation.level2 }]}> 
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>Month Wise Incomes</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        {filterDate && (
          <Button mode="outlined" onPress={() => setFilterDate(undefined)} icon="close" style={{ marginRight: 8 }} labelStyle={{ fontSize: 12 }}>
            Month: {format(filterDate, 'MMM yyyy')}
          </Button>
        )}
        <Button mode="outlined" onPress={() => setPickerOpen(true)} icon="calendar" labelStyle={{ fontSize: 12 }}>
          {filterDate ? 'Change Month' : 'Filter by Month'}
        </Button>
      </View>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title style={{ flex: 1 }}>Month</DataTable.Title>
          <DataTable.Title style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>Total</DataTable.Title>
        </DataTable.Header>
        {paginatedMonthly.length === 0 ? (
           <DataTable.Row>
             <DataTable.Cell style={{ flex: 1 }}>No data</DataTable.Cell>
           </DataTable.Row>
        ) : (
            paginatedMonthly.map((item) => (
            <DataTable.Row key={item.month}>
                <DataTable.Cell style={{ flex: 1 }}>{item.month}</DataTable.Cell>
                <DataTable.Cell style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>৳{item.total.toLocaleString()}</DataTable.Cell>
            </DataTable.Row>
            ))
        )}
        {!limitMonths && numberOfPages > 1 && (
          <DataTable.Pagination
            page={page}
            numberOfPages={numberOfPages}
            onPageChange={setPage}
            label={`${page * itemsPerPage + 1}-${Math.min((page + 1) * itemsPerPage, monthly.length)} of ${monthly.length}`}
            showFastPaginationControls
            numberOfItemsPerPage={itemsPerPage}
            theme={{ colors: { text: theme.colors.onSurface, onSurface: theme.colors.onSurface } }}
          />
        )}
      </DataTable>
      <MonthYearPicker
        visible={pickerOpen}
        value={filterDate || new Date()}
        onSelect={(date: Date) => {
          setFilterDate(date);
          setPickerOpen(false);
        }}
        onDismiss={() => setPickerOpen(false)}
      />

      <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}> 
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Total: </Text>
        <Text variant="headlineSmall" style={[styles.totalAmount, { color: '#1b5e20' }]}> 
          ৳{monthly.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  totalAmount: {
    fontWeight: 'bold',
  },
});

export default MonthlyIncomeTable;
