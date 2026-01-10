import ExpenseTable from '@/components/dashboard/ExpenseTable';
import MonthlyExpenseTable from '@/components/dashboard/MonthlyExpenseTable';
import AddExpenseForm from '@/components/forms/AddExpenseForm';
import { DELETE_EXPENSE, EDIT_EXPENSE, GET_EXPENSES } from '@/services/queries';
import { supabase } from '@/services/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { useMutation, useQuery } from 'urql';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useToast } from '../../components/shared/ToastProvider';

export default function ExpensesScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // Date Filter & Pagination State
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const currentCursor = cursorStack[cursorStack.length - 1];

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const [{ data, fetching }, reexecute] = useQuery({
    query: GET_EXPENSES,
    variables: {
      filter: { 
        userId: { eq: userId },
        ...(filterDate ? { 
          date: { 
            gte: `${format(filterDate, 'yyyy-MM-dd')}T00:00:00`,
            lte: `${format(filterDate, 'yyyy-MM-dd')}T23:59:59.999`
          } 
        } : {})
      },
      orderBy: [{ date: "DescNullsLast" }],
      first: 10,
      after: currentCursor || undefined,
    },
    requestPolicy: 'cache-and-network',
    pause: !userId,
  });

  // Reset states on navigation focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchQuery('');
        setFilterDate(undefined);
        setCursorStack([null]);
      };
    }, [])
  );

  const [{ fetching: deleting }, deleteExpense] = useMutation(DELETE_EXPENSE);
  const [, editExpenseMutation] = useMutation(EDIT_EXPENSE);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCursorStack([null]);
    await reexecute({ requestPolicy: 'network-only' });
    setRefreshing(false);
  }, [reexecute]);

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setEditVisible(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      const result = await deleteExpense({ id });
      if (result.error) throw result.error;
      showToast('Expense deleted', 'success');
      reexecute({ requestPolicy: 'network-only' });
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleUpdate = async (formData: any) => {
    try {
      const result = await editExpenseMutation({
        id: editingExpense.id,
        set: {
          source: formData.source,
          amount: formData.amount,
        }
      });

      if (result.error) throw result.error;

      setEditVisible(false);
      reexecute({ requestPolicy: 'network-only' });
      showToast('Expense updated', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const onPickerChange = (_event: any, date?: Date) => {
    setPickerOpen(false);
    if (date) {
      setFilterDate(date);
      setCursorStack([null]); // Reset pagination
    }
  };

  const handleDateFilter = () => {
    setPickerOpen(true);
  };

  const resetFilter = () => {
    setFilterDate(undefined);
    setCursorStack([null]);
  };

  if (!userId || fetching) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const expenses = data?.expenseCollection?.edges?.map((e: any) => e.node) || [];
  const pageInfo = data?.expenseCollection?.pageInfo || { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null };
  // Warning: MonthlyExpenseTable below expects ALL expenses to calculate stats? 
  // If so, we have a problem. MonthlyExpenseTable logic checks 'expenses' array.
  // If we only fetch 10 items, MonthlyExpenseTable only shows 10 items' stats.
  // The 'MonthlyExpenseTable' component should probably use GET_SUMMARY or its own query if it needs aggregation.
  // But let's proceed with current logic.

  const handleNextPage = () => {
    if (pageInfo.hasNextPage && pageInfo.endCursor) {
      setCursorStack(prev => [...prev, pageInfo.endCursor]);
    }
  };

  const handlePrevPage = () => {
    if (cursorStack.length > 1) {
      setCursorStack(prev => prev.slice(0, -1));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>Expense History</Text>
        </View>

        {filterDate && (
          <View style={styles.filterChipContainer}>
            <Button 
              mode="outlined" 
              onPress={resetFilter} 
              icon="close" 
              style={styles.filterChip}
              labelStyle={{ fontSize: 12 }}
            >
              Day: {format(filterDate, 'dd/MM/yyyy')}
            </Button>
          </View>
        )}

        <ExpenseTable
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDateFilter={handleDateFilter}
          selectedDate={filterDate || new Date()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          hasNextPage={pageInfo.hasNextPage}
          hasPrevPage={cursorStack.length > 1}
          pageNumber={cursorStack.length}
          // totalCount is not available in App schema logic yet
        />

        {/* Month Wise Expense Table at the end of expenses tab */}
        {/* Note: This will only show stats for the currently fetched page, which is a tradeoff of server pagination without separate stats query */}
        <MonthlyExpenseTable />
      </ScrollView>

      <Portal>
        {pickerOpen && (
          <DateTimePicker
            value={filterDate || new Date()}
            mode="date"
            display="default"
            onChange={onPickerChange}
          />
        )}

        <Modal visible={editVisible} onDismiss={() => setEditVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          {editingExpense && (
            <AddExpenseForm
              initialValues={editingExpense}
              onSubmit={handleUpdate}
            />
          )}
        </Modal>
        <ConfirmDialog
          visible={!!deleteTargetId}
          title="Confirm Delete"
          message="Are you sure you want to delete this expense? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTargetId(null)}
          confirmLabel="Delete"
          type="danger"
          loading={deleting}
        />
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontWeight: 'bold',
  },
  modal: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  filterChipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    borderColor: '#7C4DFF',
  }
});
