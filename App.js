import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import assetMap from './assetMap';
import serie from './serie.json';

const { width } = Dimensions.get('window');
const ALBUM_CARD_WIDTH = Math.min(width * 0.56, 250);
const ALBUM_SPACING = 16;
const ALBUM_SNAP = ALBUM_CARD_WIDTH + ALBUM_SPACING;

const SimpsonPalette = {
  sky: '#74C9FF',
  cloud: '#EAF7FF',
  yellow: '#FFD90F',
  pink: '#FF72B0',
  black: '#121212',
  darkBlue: '#114866',
};

const assetMapLower = Object.fromEntries(
  Object.entries(assetMap).map(([key, value]) => [key.toLowerCase(), value])
);

const resolveAsset = (assetPath) => {
  if (!assetPath) {
    return null;
  }

  const direct = assetMap[assetPath];
  if (direct) {
    return direct;
  }

  const normalized = assetPath
    .replace('Season_30_Icon.webp', 'Season_30_icon.webp')
    .replace('Season_35_Icon.webp', 'Season_35_artwork.webp')
    .toLowerCase();

  return assetMapLower[normalized] || null;
};

export default function App() {
  const temporadas = serie.temporadas || [];
  const [selectedSeason, setSelectedSeason] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const seasonListRef = useRef(null);

  const temporadaActiva = useMemo(
    () => temporadas[selectedSeason] || temporadas[0],
    [selectedSeason, temporadas]
  );

  const onSeasonPress = (index) => {
    setSelectedSeason(index);
    seasonListRef.current?.scrollToOffset({
      offset: index * ALBUM_SNAP,
      animated: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Control Remoto Simpson</Text>
        <Text style={styles.subtitle}>Temporadas y capítulos</Text>
      </View>

      <Animated.FlatList
        ref={seasonListRef}
        data={temporadas}
        keyExtractor={(item) => `season-${item.temporada}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ALBUM_SNAP}
        decelerationRate="fast"
        bounces={false}
        contentContainerStyle={styles.albumList}
        onMomentumScrollEnd={(event) => {
          const offset = event.nativeEvent.contentOffset.x;
          const index = Math.round(offset / ALBUM_SNAP);
          setSelectedSeason(Math.max(0, Math.min(index, temporadas.length - 1)));
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * ALBUM_SNAP,
            index * ALBUM_SNAP,
            (index + 1) * ALBUM_SNAP,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.82, 1, 0.82],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.55, 1, 0.55],
            extrapolate: 'clamp',
          });

          const isSelected = index === selectedSeason;
          const seasonArt = resolveAsset(item.imagen);

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onSeasonPress(index)}
              style={styles.albumCardWrap}
            >
              <Animated.View style={[styles.albumCard, { transform: [{ scale }], opacity }]}>
                {seasonArt ? (
                  <Image source={seasonArt} style={styles.albumImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.albumImage, styles.fallbackImage]}>
                    <Text style={styles.fallbackText}>Temporada {item.temporada}</Text>
                  </View>
                )}

                <View style={styles.albumLabel}>
                  <Text style={styles.albumText}>Temporada {item.temporada}</Text>
                  {isSelected && <Text style={styles.selectedBadge}>Seleccionada</Text>}
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        }}
      />

      {temporadaActiva && (
        <>
          <View style={styles.episodesHeader}>
            <Text style={styles.episodesTitle}>Capítulos T{temporadaActiva.temporada}</Text>
            <Text style={styles.episodesCount}>{temporadaActiva.capitulos.length} episodios</Text>
          </View>

          <FlatList
            data={temporadaActiva.capitulos}
            keyExtractor={(item) => item.codigo}
            numColumns={3}
            contentContainerStyle={styles.episodesGrid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const chapterArt = resolveAsset(item.imagen);

              return (
                <TouchableOpacity style={styles.episodeCard} activeOpacity={0.9}>
                  {chapterArt ? (
                    <Image source={chapterArt} style={styles.episodeImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.episodeImage, styles.fallbackImage]}>
                      <Text style={styles.fallbackText}>{item.codigo}</Text>
                    </View>
                  )}
                  <View style={styles.episodeCodeContainer}>
                    <Text style={styles.episodeCode}>{item.codigo}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SimpsonPalette.sky,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 4,
  },
  title: {
    color: SimpsonPalette.black,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: SimpsonPalette.darkBlue,
    fontSize: 16,
    marginTop: 2,
    fontWeight: '700',
  },
  albumList: {
    paddingHorizontal: (width - ALBUM_CARD_WIDTH) / 2,
    paddingVertical: 14,
  },
  albumCardWrap: {
    width: ALBUM_CARD_WIDTH,
    marginRight: ALBUM_SPACING,
  },
  albumCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: SimpsonPalette.cloud,
    borderWidth: 3,
    borderColor: SimpsonPalette.yellow,
    shadowColor: '#004f7d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 7,
  },
  albumImage: {
    width: '100%',
    height: ALBUM_CARD_WIDTH * 1.22,
  },
  albumLabel: {
    padding: 10,
    backgroundColor: SimpsonPalette.yellow,
  },
  albumText: {
    fontWeight: '900',
    color: SimpsonPalette.black,
    fontSize: 16,
  },
  selectedBadge: {
    marginTop: 4,
    fontWeight: '800',
    color: '#8A2A55',
  },
  episodesHeader: {
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  episodesTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: SimpsonPalette.black,
  },
  episodesCount: {
    fontWeight: '700',
    color: SimpsonPalette.darkBlue,
  },
  episodesGrid: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  episodeCard: {
    flex: 1,
    margin: 6,
    maxWidth: '31%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: SimpsonPalette.pink,
    backgroundColor: '#FFF2A8',
  },
  episodeImage: {
    width: '100%',
    aspectRatio: 1,
  },
  episodeCodeContainer: {
    backgroundColor: SimpsonPalette.pink,
    paddingVertical: 6,
    alignItems: 'center',
  },
  episodeCode: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  fallbackImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffe570',
  },
  fallbackText: {
    fontWeight: '800',
    color: SimpsonPalette.black,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
