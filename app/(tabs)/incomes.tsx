import IncomeTable from '@/components/dashboard/IncomeTable';
import AddMoneyForm from '@/components/forms/AddMoneyForm';
import { DELETE_INCOME, EDIT_INCOME, GET_INCOMES } from '@/services/queries';
import { supabase } from '@/services/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { useMutation, useQuery } from 'urql';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import MonthYearPicker from '../components/shared/MonthYearPicker';
import { useToast } from '../components/shared/ToastProvider';

export default function IncomesScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);

  // Date Filter State
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const [{ data, fetching }, reexecute] = useQuery({
    query: GET_INCOMES,
    variables: {
      filter: userId ? { 
        userId: { eq: userId },
      } : {},
      orderBy: [{ date: 'DescNullsLast' }],
      first: 1000,
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
      };
    }, [])
  );

  const [{ fetching: deleting }, deleteIncome] = useMutation(DELETE_INCOME);
  const [, editIncomeMutation] = useMutation(EDIT_INCOME);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reexecute({ requestPolicy: 'network-only' });
    setRefreshing(false);
  }, [reexecute]);

  const handleEdit = (income: any) => {
    setEditingIncome(income);
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
      const result = await deleteIncome({ id });
      if (result.error) throw result.error;
      showToast('Income record deleted', 'success');
      reexecute({ requestPolicy: 'network-only' });
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleUpdate = async (formData: any) => {
    try {
      const result = await editIncomeMutation({
        id: editingIncome.id,
        set: {
          source: formData.source,
          amount: formData.amount,
        }
      });

      if (result.error) throw result.error;

      setEditVisible(false);
      reexecute({ requestPolicy: 'network-only' });
      showToast('Income updated', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };


  const handleDateFilter = () => {
    setPickerOpen(true);
  };

  const resetFilter = () => {
    setFilterDate(undefined);
  };

  if (!userId || fetching) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const allIncomes = data?.incomeCollection?.edges?.map((e: any) => e.node) || [];
  const incomes = allIncomes.filter((item: any) => {
    // Search Filter
    const matchesSearch = !searchQuery || 
      (item.source || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Month-Year Filter
    const matchesDate = !filterDate || 
      (item.date && format(new Date(item.date), 'yyyy-MM') === format(filterDate, 'yyyy-MM'));

    return matchesSearch && matchesDate;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>Income History</Text>
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
              Month: {format(filterDate, 'MMM yyyy')}
            </Button>
          </View>
        )}

        <IncomeTable
          incomes={incomes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDateFilter={handleDateFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </ScrollView>

      <Portal>
        {pickerOpen && (
          <MonthYearPicker
            visible={pickerOpen}
            value={filterDate || new Date()}
            onSelect={(date: Date) => {
              setFilterDate(date);
              setPickerOpen(false);
            }}
            onDismiss={() => setPickerOpen(false)}
          />
        )}

        <Modal visible={editVisible} onDismiss={() => setEditVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          {editingIncome && (
            <AddMoneyForm
              initialValues={editingIncome}
              onSubmit={handleUpdate}
              onCancel={() => setEditVisible(false)}
            />
          )}
        </Modal>
        <ConfirmDialog
          visible={!!deleteTargetId}
          title="Confirm Delete"
          message="Are you sure you want to delete this income record? This action cannot be undone."
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
