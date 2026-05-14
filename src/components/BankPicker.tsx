import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Modal, Portal, Searchbar, List, Avatar, Text, useTheme, Button, TextInput } from 'react-native-paper';
import { BANKS } from '../constants/banks';

interface BankPickerProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (bankName: string) => void;
}

const BankPicker: React.FC<BankPickerProps> = ({ visible, onDismiss, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const theme = useTheme();

  const filteredBanks = BANKS.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const listData = [...filteredBanks, { name: 'Others (Enter Manually)', symbol: null, isOther: true }];

  const handleDismiss = () => {
    setIsCustom(false);
    setCustomName('');
    setSearchQuery('');
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        {isCustom ? (
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.title}>Enter Bank Name</Text>
            <TextInput
              mode="outlined"
              label="Custom Bank Name"
              value={customName}
              onChangeText={setCustomName}
              autoFocus
              style={{ marginBottom: 20 }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button mode="outlined" style={{ flex: 1 }} onPress={() => setIsCustom(false)}>Back</Button>
              <Button mode="contained" style={{ flex: 1 }} onPress={() => {
                if (customName.trim()) {
                  onSelect(customName.trim());
                  handleDismiss();
                }
              }}>Confirm</Button>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.title}>Select Bank</Text>
            <Searchbar
              placeholder="Search bank name..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.search}
              mode="view"
            />
            <FlatList
              data={listData}
              keyExtractor={(item, index) => item.name + index}
              renderItem={({ item }) => (
                <List.Item
                  title={item.name}
                  left={(props) => item.isOther ? (
                    <Avatar.Icon
                      {...props}
                      size={32}
                      icon="bank-plus"
                      style={{ backgroundColor: theme.colors.surfaceVariant }}
                    />
                  ) : (
                    <Avatar.Image
                      {...props}
                      size={32}
                      source={item.symbol}
                      style={{ backgroundColor: 'white' }}
                    />
                  )}
                  onPress={() => {
                    if (item.isOther) {
                      setIsCustom(true);
                    } else {
                      onSelect(item.name);
                      handleDismiss();
                    }
                  }}
                />
              )}
              style={styles.list}
              ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.colors.surfaceVariant }]} />}
            />
          </View>
        )}
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
    fontFamily: 'SpaceGrotesk',
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
});

export default BankPicker;
