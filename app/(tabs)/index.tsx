import ExpenseGraph from '@/components/dashboard/ExpenseGraph';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { useMutation, useQuery } from 'urql';
import ExpenseTable from '../components/dashboard/ExpenseTable';
import IncomeTable from '../components/dashboard/IncomeTable';
import SummaryStats from '../components/dashboard/SummaryStats';
import AddExpenseForm from '../components/forms/AddExpenseForm';
import AddMoneyForm from '../components/forms/AddMoneyForm';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import MonthYearPicker from '../components/shared/MonthYearPicker';
import { useToast } from '../components/shared/ToastProvider';
import { ADD_EXPENSE, ADD_INCOME, DELETE_EXPENSE, DELETE_INCOME, EDIT_EXPENSE, EDIT_INCOME, GET_SUMMARY } from '../services/queries';


import { supabase } from '../services/supabase';

export default function DashboardScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [incomeEditVisible, setIncomeEditVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const theme = useTheme();

  // Delete Confirmation State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'expense' | 'income' | null>(null);

  // Independent Date Filter States
  const [expenseFilterDate, setExpenseFilterDate] = useState<Date | undefined>(undefined);
  const [incomeFilterDate, setIncomeFilterDate] = useState<Date | undefined>(undefined);
  const [expensePickerOpen, setExpensePickerOpen] = useState(false);
  const [incomePickerOpen, setIncomePickerOpen] = useState(false);

  // Independent Search States
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [incomeSearchQuery, setIncomeSearchQuery] = useState('');

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const [{ data, fetching, error }, reexecuteSummary] = useQuery({
    query: GET_SUMMARY,
    variables: {
      expenseFilter: userId ? { userId: { eq: userId } } : {},
      incomeFilter: userId ? { userId: { eq: userId } } : {},
      expenseOrderBy: [{ date: 'DescNullsLast' }],
      incomeOrderBy: [{ date: 'DescNullsLast' }],
      first: 1000,
    },
    requestPolicy: 'cache-and-network',
    pause: !userId,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reexecuteSummary({ requestPolicy: 'network-only' });
    setRefreshing(false);
  }, [reexecuteSummary]);

  const [{ fetching: deletingExpense }, deleteExpense] = useMutation(DELETE_EXPENSE);
  const [{ fetching: deletingIncome }, deleteIncome] = useMutation(DELETE_INCOME);
  const [, addIncomeMutation] = useMutation(ADD_INCOME);
  const [, editExpenseMutation] = useMutation(EDIT_EXPENSE);
  const [, editIncomeMutation] = useMutation(EDIT_INCOME);
  const [, addExpenseMutation] = useMutation(ADD_EXPENSE);

  const [addExpenseVisible, setAddExpenseVisible] = useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const showAddExpenseModal = () => setAddExpenseVisible(true);
  const hideAddExpenseModal = () => setAddExpenseVisible(false);

  const handleAddDashboardExpense = async (formData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      const result = await addExpenseMutation({
        object: {
          ...formData,
          userId: user.id,
        }
      });

      if (result.error) throw result.error;

      hideAddExpenseModal();
      reexecuteSummary({ requestPolicy: 'network-only' });
      showToast('Expense added successfully', 'success');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const showEditModal = (expense: any) => {
    setEditingExpense(expense);
    setEditVisible(true);
  };
  const hideEditModal = () => {
    setEditingExpense(null);
    setEditVisible(false);
  };

  const showIncomeEditModal = (income: any) => {
    setEditingIncome(income);
    setIncomeEditVisible(true);
  };
  const hideIncomeEditModal = () => {
    setEditingIncome(null);
    setIncomeEditVisible(false);
  };

  const handleAddMoney = async (formData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      const result = await addIncomeMutation({
        object: {
          ...formData,
          userId: user.id,
        }
      });

      if (result.error) throw result.error;

      hideModal();
      reexecuteSummary({ requestPolicy: 'network-only' });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteExpense = (id: string) => {
    setDeleteTargetId(id);
    setDeleteType('expense');
  };

  const handleDeleteIncome = (id: string) => {
    setDeleteTargetId(id);
    setDeleteType('income');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId || !deleteType) return;

    const id = deleteTargetId;
    const type = deleteType;
    setDeleteTargetId(null);
    setDeleteType(null);

    try {
      const mutation = type === 'expense' ? deleteExpense : deleteIncome;
      const result = await mutation({ id });

      if (result.error) throw result.error;

      showToast(`${type === 'expense' ? 'Expense' : 'Income'} deleted successfully`, 'success');
      reexecuteSummary({ requestPolicy: 'network-only' });
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleUpdateExpense = async (formData: any) => {
    try {
      const result = await editExpenseMutation({
        id: editingExpense.id,
        set: {
          source: formData.source,
          amount: formData.amount,
        }
      });

      if (result.error) throw result.error;

      hideEditModal();
      reexecuteSummary({ requestPolicy: 'network-only' });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateIncome = async (formData: any) => {
    try {
      const result = await editIncomeMutation({
        id: editingIncome.id,
        set: {
          source: formData.source,
          amount: formData.amount,
        }
      });

      if (result.error) throw result.error;

      hideIncomeEditModal();
      reexecuteSummary({ requestPolicy: 'network-only' });
      showToast('Income updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const onExpensePickerChange = (_event: any, date?: Date) => {
    setExpensePickerOpen(false);
    if (date) {
      setExpenseFilterDate(date);
    }
  };


  const handleExpenseDateFilter = () => {
    setExpensePickerOpen(true);
  };

  const handleIncomeDateFilter = () => {
    setIncomePickerOpen(true);
  };

  const resetExpenseFilter = () => {
    setExpenseFilterDate(undefined);
  };

  const resetIncomeFilter = () => {
    setIncomeFilterDate(undefined);
  };

  // Reset states on navigation focus
  useFocusEffect(
    useCallback(() => {
      // Refetch data when screen gains focus (e.g. coming back from Add Expense)
      if (userId) {
        reexecuteSummary({ requestPolicy: 'network-only' });
      }

      return () => {
        // Optional: clear on blur or focus? User said "if page changed all state should be reset".
        // Usually, resetting ON FOCUS is better so when you land on the page it's fresh.
        setExpenseSearchQuery('');
        setIncomeSearchQuery('');
        setExpenseFilterDate(undefined);
        setIncomeFilterDate(undefined);
      };
    }, [reexecuteSummary, userId])
  );

  const stats = useMemo(() => {
    const allExpenses = data?.expenseCollection?.edges?.map((e: any) => e.node) || [];
    const allIncomes = data?.incomeCollection?.edges?.map((e: any) => e.node) || [];

    const totalIncome = allIncomes.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
    const totalExpense = allExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const thisMonthStr = format(now, 'yyyy-MM');

    // Filter expenses independently
    let filteredExpenses = allExpenses;
    if (expenseFilterDate) {
      const targetDate = format(expenseFilterDate, 'yyyy-MM-dd');
      filteredExpenses = allExpenses.filter((e: any) => e.date && format(new Date(e.date), 'yyyy-MM-dd') === targetDate);
    } else if (!expenseSearchQuery) {
      // Default: show today's expenses on the dashboard table ONLY IF NOT SEARCHING
      filteredExpenses = allExpenses.filter((e: any) => e.date && format(new Date(e.date), 'yyyy-MM-dd') === todayStr);
    }

    if (expenseSearchQuery) {
      filteredExpenses = filteredExpenses.filter((e: any) =>
        (e.source || '').toLowerCase().includes(expenseSearchQuery.toLowerCase())
      );
    }

    // Filter incomes independently - MONTH/YEAR ONLY
    let filteredIncomes = allIncomes;
    if (incomeFilterDate) {
      const targetMonth = format(incomeFilterDate, 'yyyy-MM');
      filteredIncomes = allIncomes.filter((i: any) => i.date && format(new Date(i.date), 'yyyy-MM') === targetMonth);
    } else if (!incomeSearchQuery) {
      // Default: show recent incomes ONLY IF NOT SEARCHING
      filteredIncomes = allIncomes.slice(0, 5);
    }

    if (incomeSearchQuery) {
      filteredIncomes = filteredIncomes.filter((i: any) =>
        (i.source || '').toLowerCase().includes(incomeSearchQuery.toLowerCase())
      );
    }

    const todayExpense = allExpenses
      .filter((e: any) => e.date && format(new Date(e.date), 'yyyy-MM-dd') === todayStr)
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    const thisMonthExpense = allExpenses
      .filter((e: any) => e.date && format(new Date(e.date), 'yyyy-MM') === thisMonthStr)
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    // Graph data (always last 7 days or whatever logic you prefer)
    // Graph data: TODAY first, then previous days (Mon, Sun, Sat, Fri...)
    const today = new Date();
    const todayIndex = today.getDay(); // 0 = Sun ... 6 = Sat

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Build backward order starting from today
    const finalDays = Array.from({ length: 7 }, (_, i) => {
      const index = (todayIndex - i + 7) % 7;
      return days[index];
    });

    // Initialize graph data
    const dataMap = finalDays.map(day => ({ x: day, y: 0 }));

    // Sum expenses per weekday
    allExpenses.forEach((e: any) => {
      if (!e.date) return;

      const date = new Date(e.date);
      const dayName = days[date.getDay()];

      const found = dataMap.find(d => d.x === dayName);
      if (found) {
        found.y += e.amount || 0;
      }
    });



    return {
      todayExpense,
      availableMoney: totalIncome - totalExpense,
      thisMonthExpense,
      filteredExpenses,
      filteredIncomes,
      graphData: dataMap
    };
  }, [data, expenseFilterDate, incomeFilterDate, expenseSearchQuery, incomeSearchQuery]);



  if (!userId || (!data && fetching)) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: theme.colors.background }}>
        <Text variant="headlineSmall" style={{ color: 'red', textAlign: 'center' }}>Error loading data</Text>
        <Text style={{ textAlign: 'center', marginTop: 10, color: theme.colors.onSurface }}>{error.message}</Text>
        <Button
          mode="contained"
          onPress={() => reexecuteSummary({ requestPolicy: 'network-only' })}
          loading={fetching}
          disabled={fetching}
          style={[
            { marginTop: 20, backgroundColor: '#7C4DFF' },
            fetching && { backgroundColor: '#B388FF' }
          ]}
          labelStyle={{
            color: '#fff',
            fontWeight: 'bold'
          }}
        >
          {fetching ? 'Retrying...' : 'Retry'}
        </Button>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <SummaryStats
        todayExpense={stats.todayExpense}
        availableMoney={stats.availableMoney}
        thisMonthExpense={stats.thisMonthExpense}
        onAddMoney={showModal}
        onAddExpense={showAddExpenseModal}
      />

      <Button
        mode="contained"
        onPress={showAddExpenseModal}
        style={styles.addButton}
        labelStyle={styles.addButtonLabel}
        icon="plus"
      >
        Add Expense
      </Button>

      <ExpenseGraph data={stats.graphData} />

      {expenseFilterDate && (
        <View style={styles.filterChipContainer}>
          <Button
            mode="outlined"
            onPress={resetExpenseFilter}
            icon="close"
            style={styles.filterChip}
            labelStyle={{ fontSize: 12 }}
          >
            Expense: {format(expenseFilterDate, 'dd/MM/yyyy')}
          </Button>
        </View>
      )}

      <ExpenseTable
        expenses={stats.filteredExpenses}
        onEdit={showEditModal}
        onDelete={handleDeleteExpense}
        onDateFilter={handleExpenseDateFilter}
        selectedDate={expenseFilterDate || new Date()}
        hidePagination={false}
        searchQuery={expenseSearchQuery}
        onSearchChange={setExpenseSearchQuery}
      />

      {incomeFilterDate && (
        <View style={styles.filterChipContainer}>
          <Button
            mode="outlined"
            onPress={resetIncomeFilter}
            icon="close"
            style={styles.filterChip}
            labelStyle={{ fontSize: 12 }}
          >
            Income: {format(incomeFilterDate, 'MMM yyyy')}
          </Button>
        </View>
      )}

      <IncomeTable
        incomes={stats.filteredIncomes}
        onEdit={showIncomeEditModal}
        onDelete={handleDeleteIncome}
        onDateFilter={handleIncomeDateFilter}
        hidePagination={incomeFilterDate || incomeSearchQuery ? false : true}
        searchQuery={incomeSearchQuery}
        onSearchChange={setIncomeSearchQuery}
      />

      <Portal>
        {expensePickerOpen && (
          <DateTimePicker
            value={expenseFilterDate || new Date()}
            mode="date"
            display="default"
            onChange={onExpensePickerChange}
          />
        )}

        {incomePickerOpen && (
          <MonthYearPicker
            visible={incomePickerOpen}
            value={incomeFilterDate || new Date()}
            onSelect={(date: Date) => {
              setIncomeFilterDate(date);
              setIncomePickerOpen(false);
            }}
            onDismiss={() => setIncomePickerOpen(false)}
          />
        )}

        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.transparentModal}>
          <AddMoneyForm onSubmit={handleAddMoney} onCancel={hideModal} />
        </Modal>

        <Modal visible={addExpenseVisible} onDismiss={hideAddExpenseModal} contentContainerStyle={styles.transparentModal}>
          <AddExpenseForm onSubmit={handleAddDashboardExpense} />
        </Modal>

        <Modal visible={editVisible} onDismiss={hideEditModal} contentContainerStyle={styles.transparentModal}>
          {editingExpense && (
            <AddExpenseForm
              initialValues={editingExpense}
              onSubmit={handleUpdateExpense}
            />
          )}
        </Modal>

        <Modal visible={incomeEditVisible} onDismiss={hideIncomeEditModal} contentContainerStyle={styles.transparentModal}>
          {editingIncome && (
            <AddMoneyForm
              initialValues={editingIncome}
              onSubmit={handleUpdateIncome}
              onCancel={hideIncomeEditModal}
            />
          )}
        </Modal>

        <ConfirmDialog
          visible={!!deleteTargetId}
          title="Confirm Delete"
          message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteTargetId(null);
            setDeleteType(null);
          }}
          confirmLabel="Delete"
          type="danger"
          loading={deletingExpense || deletingIncome}
        />
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  calendarModal: {
    margin: 20, // Add margin to make it look like a dialog
    borderRadius: 16,
    overflow: 'hidden',
  },
  filterChipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    borderColor: '#7C4DFF',
  },
  transparentModal: {
    margin: 20,
  },
  addButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  addButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 4,
  },
});
