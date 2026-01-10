import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import React from 'react';
import { Platform, View } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';

interface DateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
}

const DateField: React.FC<DateFieldProps> = ({ value, onChange, label }) => {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const theme = useTheme()

  return (
    <View style={{ marginBottom: 12 }}>
      <TextInput
        label={label || 'Date'}
        value={format(value, 'yyyy-MM-dd')}
        mode="outlined"
        editable={false}
        right={<TextInput.Icon icon="calendar" onPress={() => setPickerOpen(true)} />}
        style={{ backgroundColor: 'transparent' }}
        theme={{ colors: { background: theme.colors.elevation?.level3 || theme.colors.surface } }}
      />
      {pickerOpen && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_e, date) => {
            setPickerOpen(false);
            if (date) onChange(date);
          }}
        />
      )}
    </View>
  );
};

export default DateField;
