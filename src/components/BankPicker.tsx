import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Modal, Portal, Searchbar, List, Avatar, Text, useTheme, Surface } from 'react-native-paper';
import { BANKS } from '../constants/banks';

interface BankPickerProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (bankName: string) => void;
}

const BankPicker: React.FC<BankPickerProps> = ({ visible, onDismiss, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  const filteredBanks = BANKS.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleMedium" style={styles.title}>Select Bank</Text>
        <Searchbar
          placeholder="Search bank name..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.search}
          mode="view"
        />
        <FlatList
          data={filteredBanks}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              left={(props) => (
                <Avatar.Image
                  {...props}
                  size={32}
                  source={item.symbol}
                  style={{ backgroundColor: 'white' }}
                />
              )}
              onPress={() => {
                onSelect(item.name);
                onDismiss();
                setSearchQuery('');
              }}
            />
          )}
          style={styles.list}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.colors.surfaceVariant }]} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No banks found. Try another search.</Text>
          }
        />
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 16,
    padding: 16,
    height: '70%',
  },
  title: {
    marginBottom: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  search: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  list: {
    flex: 1,
  },
  separator: {
    height: 1,
  },
  empty: {
    textAlign: 'center',
    padding: 20,
    color: '#79747E',
  },
});

export default BankPicker;
