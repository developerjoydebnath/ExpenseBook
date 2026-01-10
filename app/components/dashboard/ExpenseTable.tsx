import { Calendar } from 'lucide-react-native';
import React from 'react'; // Removed useState as it is lifted up
import { StyleSheet, View } from 'react-native';
import { DataTable, IconButton, Searchbar, Text, useTheme } from 'react-native-paper';

interface ExpenseItem {
  id: string;
  source: string;
  amount: number;
  date: string;
}

interface ExpenseTableProps {
  expenses: ExpenseItem[];
  onEdit: (item: ExpenseItem) => void;
  onDelete: (id: string) => void;
  onDateFilter: () => void;
  selectedDate: Date;
  hidePagination?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // Server-side pagination props
  onNextPage?: () => void;
  onPrevPage?: () => void;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  pageNumber?: number;
  totalCount?: number;
}

export default function ExpenseTable({ 
  expenses, 
  onEdit, 
  onDelete, 
  onDateFilter, 
  selectedDate, 
  hidePagination,
  searchQuery,
  onSearchChange,
  onNextPage,
  onPrevPage,
  hasNextPage,
  hasPrevPage,
  pageNumber = 1,
  totalCount = 0
}: ExpenseTableProps) {
  const theme = useTheme();

  // Client-side filtering only for search on the current page
  // Note: search only filters the *fetched* page.
  const filteredExpenses = expenses.filter(item => 
    !searchQuery || item.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpense = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.elevation.level2 }]}>
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>Day Wise Expense</Text>
      
      <View style={styles.filterRow}>
        <Searchbar
          placeholder="Search product..."
          onChangeText={onSearchChange}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.elevation.level5 }]}
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          inputStyle={{ color: theme.colors.onSurface, paddingVertical: 0 }}
          iconColor={theme.colors.onSurface}
        />
        <IconButton
          icon={() => <Calendar size={20} color={theme.colors.primary} />}
          onPress={onDateFilter}
          style={[styles.calendarButton, { backgroundColor: theme.colors.elevation.level5 }]}
        />
      </View>

      <View style={styles.tableContainer}>
        <DataTable>
          <DataTable.Header style={{paddingHorizontal: 0}}>
            <DataTable.Title style={{ flex: 1, paddingHorizontal: 0 }} textStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>Date</DataTable.Title>
            <DataTable.Title style={{ flex: 1.5, paddingHorizontal: 0 }} textStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>Source</DataTable.Title>
            <DataTable.Title style={{ flex: 1, paddingHorizontal: 0 }} textStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>Amount</DataTable.Title>
            <DataTable.Title style={{ flex: 0.8, paddingHorizontal: 0 }} textStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>Action</DataTable.Title>
          </DataTable.Header>

          {filteredExpenses.length === 0 ? (
             <DataTable.Row style={{paddingHorizontal: 0, borderBottomColor: theme.colors.outlineVariant}}>
               <DataTable.Cell style={{ justifyContent: 'center' }}>No expenses found</DataTable.Cell>
             </DataTable.Row>
          ) : (
            filteredExpenses.map((item) => (
              <DataTable.Row key={item.id} style={{paddingHorizontal: 0, borderBottomColor: theme.colors.outlineVariant}}>
                <DataTable.Cell style={{ flex: 1, paddingHorizontal: 0 }} textStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}>
                  {item.date ? (() => {
                    const d = new Date(item.date);
                    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)}`;
                  })() : 'N/A'}
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.5, paddingHorizontal: 0 }} textStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>{item.source}</DataTable.Cell>
                <DataTable.Cell style={{ flex: 1, paddingHorizontal: 0 }} textStyle={{ color: theme.colors.onSurfaceVariant }}>৳{item.amount}</DataTable.Cell>
                <DataTable.Cell style={{ flex: 0.8, paddingHorizontal: 0 }}>
                  <View style={[styles.actions, { justifyContent: 'flex-start' }]}>
                    <IconButton icon="pencil" size={14} iconColor={theme.colors.onSurfaceVariant} onPress={() => onEdit(item)} style={styles.actionButton} />
                    <IconButton icon="delete" size={14} iconColor={theme.colors.error} onPress={() => onDelete(item.id)} style={styles.actionButton} />
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))
          )}

          {!hidePagination && (
             <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 8 }}>
                 <Text variant="labelSmall" style={{ marginRight: 10 }}>
                   Page {pageNumber} {totalCount > 0 ? `(${totalCount} items)` : ''}
                 </Text>
                 <IconButton 
                    icon="chevron-left" 
                    size={20} 
                    onPress={onPrevPage} 
                    disabled={!hasPrevPage} 
                 />
                 <IconButton 
                    icon="chevron-right" 
                    size={20} 
                    onPress={onNextPage} 
                    disabled={!hasNextPage} 
                 />
             </View>
          )}
        </DataTable>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Total Expense: </Text>
        <Text variant="headlineSmall" style={[styles.totalAmount, { color: theme.colors.error }]}>
          ৳{totalExpense.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    height: 48,
  },
  calendarButton: {
    margin: 0,
    borderRadius: 8,
  },
  tableContainer: {
    minHeight: 'auto',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  actionButton: {
    margin: 0,
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
