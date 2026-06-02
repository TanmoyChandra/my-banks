import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  Surface,
  ActivityIndicator,
  Portal,
  Modal,
  IconButton,
} from 'react-native-paper';
import { useWalletStore } from '../store/useWalletStore';
import { useUiStore } from '../store/useUiStore';
import {
  exportBackup,
  importBackup,
  BackupPayload,
  FILE_MAGIC,
  BACKUP_VERSION,
} from '../services/backupService';

type Status = 'idle' | 'loading' | 'success' | 'error';

function ConfirmImportModal({
  payload,
  onConfirm,
  onCancel,
}: {
  payload: BackupPayload;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const d = new Date(payload.exportedAt);
  const dateStr = d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  const counts = [
    { label: 'UPI / QR Codes', count: payload.wallet.upis.length, icon: '📱' },
    { label: 'Cards', count: payload.wallet.cards.length, icon: '💳' },
    { label: 'Bank Accounts', count: payload.wallet.accounts.length, icon: '🏦' },
    { label: 'Merchant QRs', count: payload.wallet.merchantQRs.length, icon: '🏪' },
    { label: 'Transactions', count: payload.wallet.transactions.length, icon: '📋' },
    { label: 'Billing Cycles', count: payload.wallet.billingCycles?.length || 0, icon: '🔄' },
  ];

  return (
    <Portal>
      <Modal
        visible
        onDismiss={onCancel}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.elevation.level3 },
        ]}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Restore Backup?
          </Text>
          <IconButton icon="close" size={20} onPress={onCancel} />
        </View>

        <View style={[styles.warningBox, { backgroundColor: theme.colors.errorContainer }]}>
          <Text style={[styles.warningText, { color: theme.colors.onErrorContainer }]}>
            ⚠️  This will replace ALL current data. This action cannot be undone.
          </Text>
        </View>

        <Text style={[styles.backupMeta, { color: theme.colors.onSurfaceVariant }]}>
          Backup from {dateStr} at {timeStr}
        </Text>
        {payload.preferences.userName ? (
          <Text style={[styles.backupUser, { color: theme.colors.onSurface }]}>
            User: {payload.preferences.userName}
          </Text>
        ) : null}

        <View style={styles.countGrid}>
          {counts.map((item) => (
            <View
              key={item.label}
              style={[styles.countItem, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Text style={styles.countEmoji}>{item.icon}</Text>
              <Text style={[styles.countNumber, { color: theme.colors.onSurface }]}>
                {item.count}
              </Text>
              <Text style={[styles.countLabel, { color: theme.colors.onSurfaceVariant }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk', fontWeight: '600' }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={[styles.restoreBtn, { backgroundColor: '#AAEF00' }]}
          >
            <Text style={{ color: '#000', fontFamily: 'SpaceGrotesk', fontWeight: '700' }}>
              Restore Now
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
}

export default function BackupRestoreSettings() {
  const theme = useTheme();
  const isDark = theme.dark;

  // Wallet store
  const upis = useWalletStore(s => s.upis);
  const cards = useWalletStore(s => s.cards);
  const accounts = useWalletStore(s => s.accounts);
  const transactions = useWalletStore(s => s.transactions);
  const merchantQRs = useWalletStore(s => s.merchantQRs);
  const payees = useWalletStore(s => s.payees);
  const billingCycles = useWalletStore(s => s.billingCycles);

  // UI store
  const userName = useUiStore(s => s.userName);
  const userImage = useUiStore(s => s.userImage);
  const isDarkPref = useUiStore(s => s.isDark);
  const isAppLockEnabled = useUiStore(s => s.isAppLockEnabled);

  const [exportStatus, setExportStatus] = useState<Status>('idle');
  const [importStatus, setImportStatus] = useState<Status>('idle');
  const [pendingPayload, setPendingPayload] = useState<BackupPayload | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // ── Export ──────────────────────────────────────────────────
  const handleExport = async () => {
    setExportStatus('loading');
    setStatusMessage('');

    const payload: BackupPayload = {
      magic: FILE_MAGIC,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      wallet: { upis, cards, accounts, transactions, merchantQRs, payees, billingCycles },
      preferences: { userName, userImage, isDark: isDarkPref, isAppLockEnabled },
    };

    const result = await exportBackup(payload);

    if (result.success) {
      setExportStatus('success');
      setStatusMessage(`Saved as ${result.fileName}`);
    } else {
      setExportStatus('error');
      setStatusMessage(result.error ?? 'Export failed.');
    }

    setTimeout(() => { setExportStatus('idle'); setStatusMessage(''); }, 4000);
  };

  // ── Import ──────────────────────────────────────────────────
  const handleImport = async () => {
    setImportStatus('loading');
    setStatusMessage('');

    const result = await importBackup();

    if (!result.success) {
      setImportStatus('error');
      setStatusMessage(result.error);
      setTimeout(() => { setImportStatus('idle'); setStatusMessage(''); }, 4000);
      return;
    }

    setImportStatus('idle');
    setPendingPayload(result.payload);
  };

  // ── Confirm restore ─────────────────────────────────────────
  const handleConfirmRestore = () => {
    if (!pendingPayload) return;
    setPendingPayload(null);

    // Restore wallet data via direct store manipulation
    const walletState = useWalletStore.getState() as any;
    walletState.setState?.({
      upis: pendingPayload.wallet.upis,
      cards: pendingPayload.wallet.cards,
      accounts: pendingPayload.wallet.accounts,
      transactions: pendingPayload.wallet.transactions,
      merchantQRs: pendingPayload.wallet.merchantQRs,
      billingCycles: pendingPayload.wallet.billingCycles || [],
    });

    // Use the Zustand internal API directly
    useWalletStore.setState({
      upis: pendingPayload.wallet.upis,
      cards: pendingPayload.wallet.cards,
      accounts: pendingPayload.wallet.accounts,
      transactions: pendingPayload.wallet.transactions,
      merchantQRs: pendingPayload.wallet.merchantQRs,
      payees: pendingPayload.wallet.payees || ['Me'],
      billingCycles: pendingPayload.wallet.billingCycles || [],
    });

    // Restore UI preferences
    useUiStore.setState({
      userName: pendingPayload.preferences.userName,
      userImage: pendingPayload.preferences.userImage,
      isDark: pendingPayload.preferences.isDark,
      isAppLockEnabled: pendingPayload.preferences.isAppLockEnabled ?? false,
    });

    setImportStatus('success');
    setStatusMessage('Backup restored successfully!');
    setTimeout(() => { setImportStatus('idle'); setStatusMessage(''); }, 4000);
  };

  // ── Helpers ─────────────────────────────────────────────────
  const totalItems = upis.length + cards.length + accounts.length + merchantQRs.length + billingCycles.length;

  const ActionCard = ({
    icon, title, subtitle, onPress, status, color, textColor,
  }: {
    icon: string; title: string; subtitle: string;
    onPress: () => void; status: Status; color: string; textColor: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={status === 'loading'}
      activeOpacity={0.8}
      style={[
        styles.actionCard,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Text style={styles.actionEmoji}>{icon}</Text>
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionTitle, { color: theme.colors.onSurface }]}>{title}</Text>
        <Text style={[styles.actionSub, { color: theme.colors.onSurfaceVariant }]}>{subtitle}</Text>
      </View>
      {status === 'loading' ? (
        <ActivityIndicator size={20} color={color} />
      ) : (
        <Text style={styles.actionChevron}>›</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Info box */}
      <Surface style={[styles.infoBox, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
        <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
          🔐  Encrypted Backup
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
          Your data is AES-encrypted before saving. The backup file (.mbk) can only
          be restored via this app. Store it in Google Drive, WhatsApp, email, or
          any safe location.
        </Text>
        <View style={[styles.badge, { backgroundColor: '#AAEF0022' }]}>
          <Text style={[styles.badgeText, { color: '#AAEF00' }]}>
            {totalItems} item{totalItems !== 1 ? 's' : ''} in current data
          </Text>
        </View>
      </Surface>

      {/* Status messages */}
      {statusMessage ? (
        <View
          style={[
            styles.statusBar,
            {
              backgroundColor:
                exportStatus === 'error' || importStatus === 'error'
                  ? theme.colors.errorContainer
                  : '#AAEF0022',
            },
          ]}
        >
          <Text
            style={{
              fontFamily: 'SpaceGrotesk',
              fontSize: 13,
              color:
                exportStatus === 'error' || importStatus === 'error'
                  ? theme.colors.onErrorContainer
                  : '#AAEF00',
            }}
          >
            {exportStatus === 'success' || importStatus === 'success' ? '✅  ' : '❌  '}
            {statusMessage}
          </Text>
        </View>
      ) : null}

      {/* Action cards */}
      <Surface style={[styles.listCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
        <ActionCard
          icon="📤"
          title="Export Backup"
          subtitle="Save an encrypted .mbk file to share or store"
          onPress={handleExport}
          status={exportStatus}
          color="#AAEF00"
          textColor="#000"
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
        <ActionCard
          icon="📥"
          title="Import Backup"
          subtitle="Restore from a previously exported .mbk file"
          onPress={handleImport}
          status={importStatus}
          color={theme.colors.primaryContainer}
          textColor={theme.colors.onPrimaryContainer}
        />
      </Surface>

      <Text style={[styles.footerNote, { color: theme.colors.onSurfaceVariant }]}>
        Note: Data persists automatically across app updates. Use this backup when switching phones or after a reinstall.
      </Text>

      {/* Confirm restore modal */}
      {pendingPayload ? (
        <ConfirmImportModal
          payload={pendingPayload}
          onConfirm={handleConfirmRestore}
          onCancel={() => setPendingPayload(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  infoBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
  },

  statusBar: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },

  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionEmoji: { fontSize: 22 },
  actionText: { flex: 1, gap: 2 },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
  },
  actionSub: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
  },
  actionChevron: {
    fontSize: 24,
    opacity: 0.4,
  },

  footerNote: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    opacity: 0.6,
  },

  // Modal
  modal: {
    margin: 20,
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
  },
  warningBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    lineHeight: 20,
  },
  backupMeta: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk',
    marginBottom: 4,
  },
  backupUser: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk',
    fontWeight: '700',
    marginBottom: 16,
  },
  countGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  countItem: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
  },
  countEmoji: { fontSize: 20, marginBottom: 4 },
  countNumber: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
  },
  countLabel: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk',
    textAlign: 'center',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  restoreBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
