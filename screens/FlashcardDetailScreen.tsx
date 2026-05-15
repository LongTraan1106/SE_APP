import React from 'react';
import {
  Animated,
  ActivityIndicator,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAlertModal, AlertButton } from '../components/CustomAlertModal';
import { documentService, FlashcardBlock, FlashcardSet } from '../services/documentService';

type CardStatus = 'known' | 'unknown' | null;

interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  isFavourite: boolean;
  status: CardStatus;
}

interface ActionButtonProps {
  label: string;
  height: number;
  wideWidth: number;
  middleWidth: number;
  labelSize: number;
  isFavourite?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const flattenFlashcards = (set: Pick<FlashcardSet, 'id' | 'flashcard_data'>): FlashcardItem[] => {
  const cards: FlashcardItem[] = [];

  set.flashcard_data.forEach((block, blockIndex) => {
    block.flashcards?.forEach((card, cardIndex) => {
      cards.push({
        id: `${set.id}-${block.page}-${block.group_idx}-${block.box_idx}-${blockIndex}-${cardIndex}`,
        question: card.question,
        answer: card.answer,
        isFavourite: false,
        status: null,
      });
    });
  });

  return cards;
};

const countValidFlashcards = (flashcardData: FlashcardBlock[] = []) =>
  flashcardData.reduce(
    (total, block) =>
      total +
      (block.flashcards || []).filter(
        card => card.question?.trim() && card.answer?.trim(),
      ).length,
    0,
  );

function FlashcardDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const initialFlashcardId = Number(route.params?.flashcardId) || 0;
  const draftFlashcardData = route.params?.draftFlashcardData as FlashcardBlock[] | undefined;
  const saveOptions = route.params?.saveOptions || {};
  const isDraftFlow = Array.isArray(draftFlashcardData);
  const allowLeaveRef = React.useRef(false);
  const isHandlingLeaveRef = React.useRef(false);
  const [savedFlashcardId, setSavedFlashcardId] = React.useState(initialFlashcardId);
  const [flashcardData, setFlashcardData] = React.useState<FlashcardBlock[]>(draftFlashcardData || []);
  const [isSaved, setIsSaved] = React.useState(!isDraftFlow);
  const [isSaving, setIsSaving] = React.useState(false);
  const [setTitle, setSetTitle] = React.useState(route.params?.title || 'Flashcards');
  const [setFavourite, setSetFavourite] = React.useState(false);
  const [cards, setCards] = React.useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isBackSide, setIsBackSide] = React.useState(false);
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
  const flipAnim = React.useRef(new Animated.Value(0)).current;
  const pan = React.useRef(new Animated.ValueXY()).current;

  const currentCard = cards[currentIndex];
  const visibleCards = cards.slice(currentIndex, currentIndex + 3);
  const progress = cards.length > 0 ? currentIndex / cards.length : 0;
  const progressPercent = Math.round(progress * 100);

  const horizontalPadding = clamp(width * 0.05, 16, 28);
  const contentWidth = width - horizontalPadding * 2;
  const headerTop = Math.max(insets.top + 10, clamp(height * 0.035, 24, 48));
  const backButtonSize = clamp(width * 0.105, 38, 54);
  const progressTop = clamp(height * 0.024, 14, 28);
  const progressHeight = clamp(height * 0.012, 8, 12);
  const draftSaveHeight = isDraftFlow ? 58 : 0;
  const deckTop = clamp(height * 0.02, 10, 22);
  const actionTop = clamp(height * 0.022, 12, 24);
  const actionHeight = clamp(height * 0.065, 46, 68);
  const stackOffsetX = clamp(contentWidth * 0.028, 8, 16);
  const stackOffsetY = clamp(height * 0.012, 8, 14);
  const cardRightOffset = clamp(contentWidth * 0.055, 16, 32);
  const availableCardHeight =
    height -
    headerTop -
    backButtonSize -
    draftSaveHeight -
    progressTop -
    progressHeight -
    deckTop -
    stackOffsetY * 2 -
    actionTop -
    actionHeight -
    insets.bottom -
    28;
  const cardHeight = clamp(
    availableCardHeight,
    Math.min(220, height * 0.34),
    Math.min(480, height * 0.5),
  );
  const deckHeight = cardHeight + stackOffsetY * 2;
  const actionGap = clamp(contentWidth * 0.045, 10, 22);
  const favouriteButtonWidth = clamp(contentWidth * 0.16, 48, 68);
  const wideButtonWidth = Math.max(
    68,
    (contentWidth - favouriteButtonWidth - actionGap * 2) / 2,
  );
  const titleFontSize = clamp(width * 0.064, 22, 30);
  const cardFontSize = clamp(width * 0.048, 16, 22);
  const cardLineHeight = Math.round(cardFontSize * 1.35);
  const cardRadius = clamp(width * 0.035, 14, 22);
  const cardPaddingHorizontal = clamp(width * 0.052, 16, 26);
  const cardPaddingVertical = clamp(height * 0.028, 18, 30);
  const actionLabelSize = clamp(actionHeight * 0.54, 26, 40);
  const progressTextFontSize = clamp(width * 0.038, 13, 16);

  React.useEffect(() => {
    const loadFlashcardDetail = async () => {
      if (isDraftFlow) {
        if (!draftFlashcardData || countValidFlashcards(draftFlashcardData) <= 0) {
          setError('No valid flashcards to preview');
          setIsLoading(false);
          return;
        }

        const draftSet = {
          id: 0,
          flashcard_data: draftFlashcardData,
        };
        const nextCards = flattenFlashcards(draftSet);
        setCards(nextCards);
        setFlashcardData(draftFlashcardData);
        setCurrentIndex(0);
        setSetTitle(route.params?.title || 'Flashcards');
        setSetFavourite(false);
        setIsLoading(false);
        return;
      }

      if (!savedFlashcardId) {
        setError('Invalid flashcard set');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const detail = await documentService.getFlashcardDetail(savedFlashcardId);
        const nextCards = flattenFlashcards(detail);
        const safeInitialIndex = Math.min(
          Number(route.params?.initialIndex) || 0,
          nextCards.length,
        );
        setCards(nextCards);
        setFlashcardData(detail.flashcard_data);
        setCurrentIndex(safeInitialIndex);
        setSetTitle(detail.title);
        setSetFavourite(detail.is_favorite);
        setIsSaved(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Cannot load flashcard set';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlashcardDetail();
  }, [draftFlashcardData, isDraftFlow, route.params?.initialIndex, route.params?.title, savedFlashcardId]);

  React.useEffect(() => {
    flipAnim.setValue(0);
    setIsBackSide(false);
    pan.setValue({ x: 0, y: 0 });
  }, [currentIndex, flipAnim, pan]);

  const completeCurrentCard = React.useCallback(
    (status: Exclude<CardStatus, null>, direction: 'left' | 'right') => {
      if (!currentCard) {
        return;
      }

      setCards(prevCards =>
        prevCards.map(card =>
          card.id === currentCard.id ? { ...card, status } : card,
        ),
      );

      Animated.timing(pan, {
        toValue: { x: direction === 'right' ? width : -width, y: 22 },
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(index => Math.min(index + 1, cards.length));
        pan.setValue({ x: 0, y: 0 });
      });
    },
    [cards.length, currentCard, pan, width],
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > width * 0.24) {
            completeCurrentCard('known', 'right');
            return;
          }

          if (gesture.dx < -width * 0.24) {
            completeCurrentCard('unknown', 'left');
            return;
          }

          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }).start();
        },
      }),
    [completeCurrentCard, pan, width],
  );

  const handleFlipCard = () => {
    Animated.timing(flipAnim, {
      toValue: isBackSide ? 0 : 1,
      duration: 360,
      useNativeDriver: true,
    }).start();
    setIsBackSide(value => !value);
  };

  const navigateToFlashcardScreen = React.useCallback(() => {
    allowLeaveRef.current = true;
    navigation.navigate('TabNavigator', { screen: 'Flashcard' });
  }, [navigation]);

  const saveDraftFlashcardSet = React.useCallback(async () => {
    if (isSaved && savedFlashcardId) {
      return savedFlashcardId;
    }

    if (countValidFlashcards(flashcardData) <= 0) {
      throw new Error('Cannot save an empty flashcard set');
    }

    setIsSaving(true);
    try {
      const savedSet = await documentService.saveFlashcardSet(
        setTitle,
        flashcardData,
        {
          documentId: saveOptions.documentId,
          sourceFileName: saveOptions.sourceFileName,
          tags: saveOptions.tags || ['Flashcard'],
        },
      );
      setSavedFlashcardId(savedSet.id);
      setSetTitle(savedSet.title);
      setSetFavourite(savedSet.is_favorite);
      setIsSaved(true);
      return savedSet.id;
    } finally {
      setIsSaving(false);
    }
  }, [flashcardData, isSaved, saveOptions.documentId, saveOptions.sourceFileName, saveOptions.tags, savedFlashcardId, setTitle]);

  const promptDoneWithUnsavedDraft = React.useCallback(() => {
    setAlertConfig({
      title: 'Unsaved Flashcard Set',
      message: 'Do you want to save this flashcard set before finishing?',
      icon: '!',
      buttons: [
        {
          text: 'No',
          style: 'destructive',
          onPress: () => {
            setAlertModalVisible(false);
            allowLeaveRef.current = true;
            navigation.goBack();
          },
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await saveDraftFlashcardSet();
              setAlertModalVisible(false);
              navigateToFlashcardScreen();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Cannot save flashcard set';
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
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setAlertModalVisible(false),
        },
      ],
    });
    setAlertModalVisible(true);
  }, [navigateToFlashcardScreen, navigation, saveDraftFlashcardSet]);

  const promptBackWithUnsavedDraft = React.useCallback(
    (continueBack?: () => void) => {
      setAlertConfig({
        title: 'Unsaved Flashcard Set',
        message: 'If you go back, this flashcard set will not be saved.',
        icon: '!',
        buttons: [
          {
            text: 'Stay',
            style: 'cancel',
            onPress: () => setAlertModalVisible(false),
          },
          {
            text: 'Go Back',
            style: 'destructive',
            onPress: () => {
              setAlertModalVisible(false);
              allowLeaveRef.current = true;
              if (continueBack) {
                continueBack();
              } else {
                navigation.goBack();
              }
            },
          },
        ],
      });
      setAlertModalVisible(true);
    },
    [navigation],
  );
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (!isDraftFlow || isSaved || allowLeaveRef.current) {
        return;
      }

      event.preventDefault();
      if (isHandlingLeaveRef.current) {
        return;
      }

      isHandlingLeaveRef.current = true;
      promptBackWithUnsavedDraft(() => navigation.dispatch(event.data.action));
      setTimeout(() => {
        isHandlingLeaveRef.current = false;
      }, 500);
    });

    return unsubscribe;
  }, [isDraftFlow, isSaved, navigation, promptBackWithUnsavedDraft]);

  const handleBackPress = () => {
    if (isDraftFlow && !isSaved) {
      promptBackWithUnsavedDraft();
      return;
    }

    navigation.goBack();
  };

  const handleDonePress = () => {
    if (isDraftFlow && !isSaved) {
      promptDoneWithUnsavedDraft();
      return;
    }

    navigateToFlashcardScreen();
  };

  const handleSavePress = async () => {
    try {
      await saveDraftFlashcardSet();
      setAlertConfig({
        title: 'Saved',
        message: 'Flashcard set has been saved.',
        icon: 'OK',
        buttons: [
          {
            text: 'OK',
            onPress: () => setAlertModalVisible(false),
            style: 'default',
          },
        ],
      });
      setAlertModalVisible(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cannot save flashcard set';
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
    }
  };

  const handleToggleFavourite = () => {
    if (!savedFlashcardId || !isSaved) {
      return;
    }

    const nextValue = !setFavourite;
    setSetFavourite(nextValue);
    documentService.toggleFlashcardFavorite(savedFlashcardId, nextValue).catch(() => {
      setSetFavourite(!nextValue);
    });
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const swipeRotate = pan.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      <View style={[styles.header, { marginTop: headerTop }]}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              width: backButtonSize,
              height: backButtonSize,
              borderRadius: backButtonSize * 0.28,
            },
          ]}
          activeOpacity={0.8}
          onPress={handleBackPress}
        >
          <Text
            style={[
              styles.backIcon,
              {
                fontSize: backButtonSize * 0.68,
                lineHeight: backButtonSize * 0.68,
              },
            ]}
          >
            {'<'}
          </Text>
        </TouchableOpacity>
        <Text
          style={[styles.title, { fontSize: titleFontSize }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {setTitle}
        </Text>
        <TouchableOpacity
          style={[styles.doneButton, { width: backButtonSize + 28 }]}
          activeOpacity={0.8}
          onPress={handleDonePress}
          disabled={isSaving}
        >
          <Text style={styles.doneText}>{isSaving ? 'Saving' : 'Done'}</Text>
        </TouchableOpacity>
      </View>

      {isDraftFlow ? (
        <TouchableOpacity
          style={[
            styles.saveSetButton,
            (isSaved || isSaving || isLoading || !!error) && styles.saveSetButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleSavePress}
          disabled={isSaved || isSaving || isLoading || !!error}
        >
          <Text style={styles.saveSetText}>
            {isSaved ? 'Flashcard set saved' : isSaving ? 'Saving flashcard set...' : 'Save flashcard set'}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={[styles.progressRow, { marginTop: progressTop }]}>
        <View
          style={[
            styles.progressTrack,
            { height: progressHeight, borderRadius: progressHeight / 2 },
          ]}
        >
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text
          style={[
            styles.progressText,
            { fontSize: progressTextFontSize, width: progressTextFontSize * 3 },
          ]}
        >
          {progressPercent}%
        </Text>
      </View>

      <View style={[styles.deck, { height: deckHeight, marginTop: deckTop }]}>
        {isLoading ? (
          <View
            style={[
              styles.finishedCard,
              { height: cardHeight, borderRadius: cardRadius },
            ]}
          >
            <ActivityIndicator size="large" color="#344E39" />
            <Text style={styles.finishedText}>Loading cards...</Text>
          </View>
        ) : error ? (
          <View
            style={[
              styles.finishedCard,
              { height: cardHeight, borderRadius: cardRadius },
            ]}
          >
            <Text style={styles.finishedTitle}>Error</Text>
            <Text style={styles.finishedText}>{error}</Text>
          </View>
        ) : visibleCards.length === 0 ? (
          <View
            style={[
              styles.finishedCard,
              { height: cardHeight, borderRadius: cardRadius },
            ]}
          >
            <Text style={styles.finishedTitle}>Completed</Text>
            <Text style={styles.finishedText}>You reviewed all cards.</Text>
          </View>
        ) : (
          visibleCards
            .map((card, stackIndex) => {
              const isTopCard = stackIndex === 0;
              const stackStyle =
                stackIndex === 0
                  ? styles.stackCard0
                  : stackIndex === 1
                  ? styles.stackCard1
                  : styles.stackCard2;
              const dynamicStackStyle =
                stackIndex === 0
                  ? { right: cardRightOffset }
                  : stackIndex === 1
                  ? {
                      top: stackOffsetY,
                      left: stackOffsetX,
                      right: cardRightOffset / 2,
                    }
                  : {
                      top: stackOffsetY * 2,
                      left: stackOffsetX * 2,
                      right: 0,
                    };
              const cardStyle = [
                styles.flashcard,
                stackStyle,
                {
                  height: cardHeight,
                  borderRadius: cardRadius,
                },
                dynamicStackStyle,
              ];

              if (!isTopCard) {
                return (
                  <View key={card.id} pointerEvents="none" style={cardStyle} />
                );
              }

              return (
                <Animated.View
                  key={card.id}
                  style={[
                    cardStyle,
                    {
                      transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { rotate: swipeRotate },
                      ],
                    },
                  ]}
                  {...panResponder.panHandlers}
                >
                  <Pressable style={styles.cardPressArea} onPress={handleFlipCard}>
                    <Animated.View
                      style={[
                        styles.cardFace,
                        styles.cardFront,
                        {
                          borderRadius: cardRadius,
                          paddingHorizontal: cardPaddingHorizontal,
                          paddingVertical: cardPaddingVertical,
                          transform: [{ rotateY: frontRotate }],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.faceLabel,
                          { top: cardPaddingVertical, fontSize: clamp(width * 0.028, 10, 13) },
                        ]}
                      >
                        QUESTION
                      </Text>
                      <Text
                        style={[
                          styles.cardText,
                          {
                            fontSize: cardFontSize,
                            lineHeight: cardLineHeight,
                          },
                        ]}
                      >
                        {card.question}
                      </Text>
                    </Animated.View>
                    <Animated.View
                      style={[
                        styles.cardFace,
                        styles.cardBack,
                        {
                          borderRadius: cardRadius,
                          paddingHorizontal: cardPaddingHorizontal,
                          paddingVertical: cardPaddingVertical,
                          transform: [{ rotateY: backRotate }],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.faceLabel,
                          { top: cardPaddingVertical, fontSize: clamp(width * 0.028, 10, 13) },
                        ]}
                      >
                        ANSWER
                      </Text>
                      <Text
                        style={[
                          styles.cardText,
                          {
                            fontSize: cardFontSize,
                            lineHeight: cardLineHeight,
                          },
                        ]}
                      >
                        {card.answer}
                      </Text>
                    </Animated.View>
                  </Pressable>
                </Animated.View>
              );
            })
            .reverse()
        )}
      </View>

      <View
        style={[
          styles.actions,
          {
            marginTop: actionTop,
            columnGap: actionGap,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <ActionButton
          label="x"
          height={actionHeight}
          wideWidth={wideButtonWidth}
          middleWidth={favouriteButtonWidth}
          labelSize={actionLabelSize}
          onPress={() => completeCurrentCard('unknown', 'left')}
          disabled={!currentCard}
        />
        <ActionButton
          label={setFavourite ? '*' : '+'}
          height={actionHeight}
          wideWidth={wideButtonWidth}
          middleWidth={favouriteButtonWidth}
          labelSize={actionLabelSize}
          isFavourite={setFavourite}
          onPress={handleToggleFavourite}
          disabled={!savedFlashcardId || !isSaved}
        />
        <ActionButton
          label="v"
          height={actionHeight}
          wideWidth={wideButtonWidth}
          middleWidth={favouriteButtonWidth}
          labelSize={actionLabelSize}
          onPress={() => completeCurrentCard('known', 'right')}
          disabled={!currentCard}
        />
      </View>

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

function ActionButton({
  label,
  height,
  wideWidth,
  middleWidth,
  labelSize,
  isFavourite,
  disabled,
  onPress,
}: ActionButtonProps) {
  const isFavouriteButton = label === '+' || label === '*';

  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        {
          height,
          width: isFavouriteButton ? middleWidth : wideWidth,
          borderRadius: height * 0.16,
        },
        isFavourite && styles.actionButtonFavourite,
        disabled && styles.actionButtonDisabled,
      ]}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        style={[
          styles.actionLabel,
          { fontSize: labelSize, lineHeight: labelSize + 6 },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3EED4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    borderWidth: 3,
    borderColor: '#344E39',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#344E39',
    fontWeight: '300',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
    color: '#000000',
  },
  doneButton: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  doneText: {
    color: '#344E39',
    fontSize: 16,
    fontWeight: '800',
  },
  saveSetButton: {
    marginTop: 12,
    backgroundColor: '#6B9071',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSetButtonDisabled: {
    opacity: 0.55,
  },
  saveSetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 17,
    borderRadius: 12,
    backgroundColor: '#BFD1BD',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 12,
    backgroundColor: '#344E39',
  },
  progressText: {
    width: 56,
    marginLeft: 15,
    fontSize: 20,
    color: '#4D5A4D',
  },
  deck: {},
  flashcard: {
    position: 'absolute',
    left: 0,
  },
  stackCard0: {
    backgroundColor: '#83A385',
    zIndex: 3,
  },
  stackCard1: {
    backgroundColor: '#8C9F82',
    zIndex: 2,
  },
  stackCard2: {
    backgroundColor: '#344E39',
    zIndex: 1,
  },
  cardPressArea: {
    flex: 1,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#83A385',
  },
  cardBack: {
    backgroundColor: '#AEC3B0',
  },
  faceLabel: {
    position: 'absolute',
    top: 32,
    fontSize: 14,
    fontWeight: '800',
    color: '#2D5341',
  },
  cardText: {
    fontWeight: '700',
    color: '#173528',
    textAlign: 'center',
  },
  finishedCard: {
    backgroundColor: '#AEC3B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#173528',
    marginBottom: 10,
  },
  finishedText: {
    fontSize: 16,
    color: '#344E39',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#C1D2C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonFavourite: {
    backgroundColor: '#D5E3C6',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionLabel: {
    color: '#344E39',
    fontWeight: '300',
  },
});

export default FlashcardDetailScreen;
