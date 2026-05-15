import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FlashcardIcon from '../assets/icons/flashcard.svg';
import StarIcon from '../assets/icons/star.svg';
import { CustomAlertModal, AlertButton } from '../components/CustomAlertModal';
import { documentService, FlashcardListItem } from '../services/documentService';

type FlashcardSection = 'totalSets' | 'favourite';

interface FlashcardActionCardProps {
  label: string;
  icon: React.ReactNode;
  height: number;
  textSize: number;
  isActive: boolean;
  onPress: () => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function FlashcardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeSection, setActiveSection] =
    React.useState<FlashcardSection>('totalSets');
  const [sets, setSets] = React.useState<FlashcardListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [alertModalVisible, setAlertModalVisible] = React.useState(false);
  const [alertConfig, setAlertConfig] = React.useState<{
    title: string;
    message: string;
    icon: string;
    buttons: AlertButton[];
  }>({
    title: '',
    message: '',
    icon: '!',
    buttons: [],
  });

  const horizontalPadding = clamp(width * 0.055, 16, 28);
  const headerTop = Math.max(insets.top + 12, clamp(height * 0.04, 28, 48));
  const headerHeight = clamp(height * 0.13, 84, 112);
  const headerRadius = clamp(width * 0.035, 12, 18);
  const headerTitleSize = clamp(width * 0.072, 24, 32);
  const headerBottom = clamp(height * 0.024, 14, 24);
  const actionCardHeight = clamp(height * 0.085, 64, 88);
  const actionGap = clamp(width * 0.04, 12, 24);
  const actionIconSize = clamp(width * 0.065, 22, 30);
  const actionTextSize = clamp(width * 0.043, 15, 19);
  const actionBottom = clamp(height * 0.022, 12, 22);
  const dividerHeight = clamp(height * 0.01, 6, 10);
  const contentPaddingTop = clamp(height * 0.02, 12, 22);
  const setCardMinHeight = clamp(height * 0.09, 68, 88);
  const setCardRadius = clamp(width * 0.035, 12, 16);
  const setIconSize = clamp(width * 0.065, 24, 34);
  const setIconBox = clamp(width * 0.13, 46, 58);
  const setTitleSize = clamp(width * 0.045, 16, 20);
  const setMetaSize = clamp(width * 0.034, 12, 14);
  const setArrowSize = clamp(width * 0.065, 24, 32);

  const loadFlashcards = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await documentService.getFlashcardSets();
      setSets(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cannot load flashcards';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadFlashcards();
    }, [loadFlashcards])
  );

  const visibleSets =
    activeSection === 'favourite'
      ? sets.filter(set => set.is_favorite)
      : sets;

  const handleOpenSet = (set: FlashcardListItem) => {
    navigation.navigate('FlashcardDetail', {
      flashcardId: set.id,
      title: set.title,
      initialIndex: 0,
    });
  };

  const handleDeleteSet = (set: FlashcardListItem) => {
    setAlertConfig({
      title: 'Delete Flashcard Set',
      message: `Delete "${set.title}" and all of its flashcard data?`,
      icon: '!',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertModalVisible(false),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAlertModalVisible(false);
            try {
              setDeletingId(set.id);
              await documentService.deleteFlashcardSet(set.id);
              setSets(current => current.filter(item => item.id !== set.id));
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Cannot delete flashcard set';
              setAlertConfig({
                title: 'Error',
                message,
                icon: '!',
                buttons: [
                  {
                    text: 'OK',
                    onPress: () => setAlertModalVisible(false),
                    style: 'default',
                  },
                ],
              });
              setAlertModalVisible(true);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    });
    setAlertModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerSection,
          {
            height: headerHeight,
            marginTop: headerTop,
            marginHorizontal: horizontalPadding,
            marginBottom: headerBottom,
            borderRadius: headerRadius,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>
          FLASHCARD
        </Text>
      </View>

      <View
        style={[
          styles.sectionCards,
          {
            paddingHorizontal: horizontalPadding,
            columnGap: actionGap,
            marginBottom: actionBottom,
          },
        ]}
      >
        <FlashcardActionCard
          label="Total sets"
          isActive={activeSection === 'totalSets'}
          onPress={() => setActiveSection('totalSets')}
          height={actionCardHeight}
          textSize={actionTextSize}
          icon={<FlashcardIcon width={actionIconSize} height={actionIconSize} />}
        />
        <FlashcardActionCard
          label="Favourite"
          isActive={activeSection === 'favourite'}
          onPress={() => setActiveSection('favourite')}
          height={actionCardHeight}
          textSize={actionTextSize}
          icon={<StarIcon width={actionIconSize} height={actionIconSize} />}
        />
      </View>

      <View
        style={[
          styles.divider,
          {
            height: dividerHeight,
            marginHorizontal: horizontalPadding + 8,
            borderRadius: dividerHeight / 2,
          },
        ]}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: contentPaddingTop,
            paddingHorizontal: horizontalPadding,
            paddingBottom: 100 + insets.bottom,
          },
        ]}
      >
        <View style={styles.setsContainer}>
          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#6B9071" />
              <Text style={styles.stateText}>Loading flashcards...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={styles.stateText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadFlashcards}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : visibleSets.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={styles.stateText}>
                {activeSection === 'favourite'
                  ? 'No favourite flashcard sets yet.'
                  : 'No flashcard sets yet.'}
              </Text>
            </View>
          ) : visibleSets.map(set => (
            <TouchableOpacity
              key={set.id}
              style={[
                styles.setCard,
                {
                  minHeight: setCardMinHeight,
                  borderRadius: setCardRadius,
                  paddingHorizontal: clamp(width * 0.04, 14, 18),
                  paddingVertical: clamp(height * 0.016, 10, 16),
                },
              ]}
              activeOpacity={0.85}
              onPress={() => handleOpenSet(set)}
            >
              <View
                style={[
                  styles.setIconWrap,
                  {
                    width: setIconBox,
                    height: setIconBox,
                    borderRadius: setIconBox * 0.28,
                    marginRight: clamp(width * 0.032, 10, 14),
                  },
                ]}
              >
                <FlashcardIcon width={setIconSize} height={setIconSize} />
              </View>
              <View style={styles.setInfo}>
                <Text style={[styles.setTitle, { fontSize: setTitleSize }]}>
                  {set.title}
                </Text>
                <Text style={[styles.setMeta, { fontSize: setMetaSize }]}>
                  {set.total_cards} cards{set.is_favorite ? ' • Favourite' : ''}
                </Text>
              </View>
              <Text
                style={[
                  styles.setArrow,
                  {
                    fontSize: setArrowSize,
                    marginLeft: clamp(width * 0.025, 8, 12),
                  },
                ]}
              >
                {'>'}
              </Text>
              <TouchableOpacity
                style={styles.deleteSetButton}
                onPress={(event: any) => {
                  event.stopPropagation?.();
                  handleDeleteSet(set);
                }}
                disabled={deletingId === set.id}
              >
                <Text style={styles.deleteSetText}>
                  {deletingId === set.id ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <CustomAlertModal
        visible={alertModalVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertModalVisible(false)}
      />
    </View>
  );
}

function FlashcardActionCard({
  label,
  icon,
  height,
  textSize,
  isActive,
  onPress,
}: FlashcardActionCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.actionCard,
        {
          height,
          borderRadius: height * 0.18,
        },
        isActive && styles.actionCardActive,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.cardIcon}>{icon}</View>
      <Text style={[styles.cardLabel, { fontSize: textSize }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3EED4',
  },
  headerSection: {
    backgroundColor: '#83A385',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#AEC3B0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
  },
  actionCardActive: {
    backgroundColor: '#B3C6B6',
  },
  cardIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  cardLabel: {
    fontWeight: '500',
    color: '#142D23',
  },
  divider: {
    backgroundColor: '#6B826B',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  setsContainer: {
    rowGap: 12,
  },
  setCard: {
    backgroundColor: '#AEC3B0',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  setIconWrap: {
    backgroundColor: '#C5D8C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setInfo: {
    flex: 1,
  },
  setTitle: {
    fontWeight: '700',
    color: '#173528',
    marginBottom: 4,
  },
  setMeta: {
    fontWeight: '500',
    color: '#344E39',
  },
  setArrow: {
    color: '#344E39',
  },
  deleteSetButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  deleteSetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  centerState: {
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stateText: {
    color: '#344E39',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#6B9071',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default FlashcardScreen;
