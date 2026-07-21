import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useWalletStore } from '../store/useWalletStore';

export function usePaymentNotifications() {
  const cards = useWalletStore(s => s.cards);
  const billingCycles = useWalletStore(s => s.billingCycles);
  const transactions = useWalletStore(s => s.transactions);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    async function scheduleNotifications() {
      // 1. Cancel all previously scheduled notifications to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 2. Determine which cards have an active, unpaid generated bill
      for (const card of cards) {
        if (!card.billingDate) continue;

        // Find current/latest cycle
        const cardCycles = billingCycles
          .filter(c => c.cardId === card.id)
          .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
        if (cardCycles.length === 0) continue;
        const latestCycle = cardCycles[cardCycles.length - 1];

        // Is bill generated?
        if (latestCycle.billingDate) {
          const cycleBillDate = new Date(latestCycle.billingDate);
          cycleBillDate.setHours(0, 0, 0, 0);

          if (cycleBillDate.getTime() <= today.getTime()) {
            // Bill is generated.
            const cycleTxs = transactions.filter(t => t.cardId === card.id && t.billingCycleId === latestCycle.id);
            const totalDue = cycleTxs.reduce((sum, t) => t.type === 'debit' ? sum + t.amount : sum - t.amount, 0);

            // Only notify if there is a positive due amount
            if (totalDue > 0 && card.dueDaysAfterBilling !== undefined && card.dueDaysAfterBilling !== null) {
              const dueDate = new Date(cycleBillDate);
              dueDate.setDate(dueDate.getDate() + card.dueDaysAfterBilling);
              
              const diffMs = dueDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

              let statusText = '';
              if (diffDays < 0) {
                statusText = `Overdue by ${Math.abs(diffDays)} Day${Math.abs(diffDays) > 1 ? 's' : ''}`;
              } else if (diffDays === 0) {
                statusText = 'Due Today';
              } else {
                statusText = `${diffDays} Day${diffDays > 1 ? 's' : ''} Left`;
              }

              try {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: `${card.bankName} Payment Due`,
                    body: `Total Due: ₹${totalDue} (${statusText})`,
                    sound: true,
                  },
                  trigger: {
                    seconds: 10,
                    repeats: true,
                  },
                });
              } catch (error) {
                console.log('Error scheduling 10s notification, falling back to 60s (iOS limitation)', error);
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: `${card.bankName} Payment Due`,
                    body: `Total Due: ₹${totalDue} (${statusText})`,
                    sound: true,
                  },
                  trigger: {
                    seconds: 60,
                    repeats: true,
                  },
                });
              }
            }
          }
        } else {
          // Legacy logic fallback (if cycle lacks billingDate, use card.billingDate)
          const getBillingDateForMonth = (year: number, month: number, day: number) => {
            const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
            return new Date(year, month, Math.min(day, lastDayOfMonth));
          };

          let lastBillDate = getBillingDateForMonth(today.getFullYear(), today.getMonth(), card.billingDate);
          if (today.getTime() < lastBillDate.getTime()) {
            lastBillDate = getBillingDateForMonth(today.getFullYear(), today.getMonth() - 1, card.billingDate);
          }

          if (lastBillDate.getTime() <= today.getTime()) {
            // Bill is generated
            const cycleTxs = transactions.filter(t => t.cardId === card.id && t.billingCycleId === latestCycle.id);
            const totalDue = cycleTxs.reduce((sum, t) => t.type === 'debit' ? sum + t.amount : sum - t.amount, 0);

            if (totalDue > 0 && card.dueDaysAfterBilling !== undefined && card.dueDaysAfterBilling !== null) {
              const dueDate = new Date(lastBillDate);
              dueDate.setDate(dueDate.getDate() + card.dueDaysAfterBilling);

              const diffMs = dueDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

              let statusText = '';
              if (diffDays < 0) {
                statusText = `Overdue by ${Math.abs(diffDays)} Day${Math.abs(diffDays) > 1 ? 's' : ''}`;
              } else if (diffDays === 0) {
                statusText = 'Due Today';
              } else {
                statusText = `${diffDays} Day${diffDays > 1 ? 's' : ''} Left`;
              }

              try {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: `${card.bankName} Payment Due`,
                    body: `Total Due: ₹${totalDue} (${statusText})`,
                    sound: true,
                  },
                  trigger: {
                    seconds: 10,
                    repeats: true,
                  },
                });
              } catch (error) {
                console.log('Error scheduling 10s notification, falling back to 60s (iOS limitation)', error);
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: `${card.bankName} Payment Due`,
                    body: `Total Due: ₹${totalDue} (${statusText})`,
                    sound: true,
                  },
                  trigger: {
                    seconds: 60,
                    repeats: true,
                  },
                });
              }
            }
          }
        }
      }
    }

    scheduleNotifications();
  }, [cards, billingCycles, transactions]);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
  }
}
