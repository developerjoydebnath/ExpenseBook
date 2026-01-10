import IncomeTable from '@/components/dashboard/IncomeTable';
import MonthlyIncomeTable from '@/components/dashboard/MonthlyIncomeTable';
import AddMoneyForm from '@/components/forms/AddMoneyForm';
import { DELETE_INCOME, EDIT_INCOME, GET_INCOMES } from '@/services/queries';
import { supabase } from '@/services/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { useMutation, useQuery } from 'urql';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import MonthYearPicker from '../../components/shared/MonthYearPicker';
import { useToast } from '../../components/shared/ToastProvider';

export default function IncomesScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);

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

  // Re-calculate filter variables properly
  const queryVariables = {
    filter: { 
      userId: { eq: userId },
    },
    orderBy: [{ date: "DescNullsLast" }],
    first: 10,
    after: currentCursor || undefined,
  };

  if (filterDate) {
    const startOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
    const endOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0);
    // @ts-ignore
    queryVariables.filter.date = {
      gte: `${format(startOfMonth, 'yyyy-MM-dd')}T00:00:00`,
      lte: `${format(endOfMonth, 'yyyy-MM-dd')}T23:59:59.999`
    };
  }

  // Use the constructed variables in a separate useQuery call?
  // No, useQuery hook takes variables directly. 
  // Refactor: Pass constructed variables to useQuery.

  const [{ data: qData, fetching: qFetching }, qReexecute] = useQuery({
    query: GET_INCOMES,
    variables: queryVariables,
    requestPolicy: 'cache-and-network',
    pause: !userId,
  });

  // Use qData and qFetching
  const incomesData = qData?.incomeCollection?.edges?.map((e: any) => e.node) || [];
  const pageInfo = qData?.incomeCollection?.pageInfo || { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null };


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

  const [{ fetching: deleting }, deleteIncome] = useMutation(DELETE_INCOME);
  const [, editIncomeMutation] = useMutation(EDIT_INCOME);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCursorStack([null]);
    await qReexecute({ requestPolicy: 'network-only' });
    setRefreshing(false);
  }, [qReexecute]);

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
      qReexecute({ requestPolicy: 'network-only' });
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
      qReexecute({ requestPolicy: 'network-only' });
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
    setCursorStack([null]);
  };

  if (!userId || qFetching) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
          incomes={incomesData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDateFilter={handleDateFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          hasNextPage={pageInfo.hasNextPage}
          hasPrevPage={cursorStack.length > 1}
          pageNumber={cursorStack.length}
        />

        {/* Month Wise Income Table at the end of incomes tab */}
        <MonthlyIncomeTable />
      </ScrollView>

      <Portal>
        {pickerOpen && (
          <MonthYearPicker
            visible={pickerOpen}
            value={filterDate || new Date()}
            onSelect={(date: Date) => {
              setFilterDate(date);
              setPickerOpen(false);
              setCursorStack([null]);
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
