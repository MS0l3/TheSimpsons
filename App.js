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
import simpsons from './simpsons';

const { width } = Dimensions.get('window');
const ALBUM_CARD_WIDTH = Math.min(width * 0.6, 265);
const ALBUM_SPACING = 18;
const ALBUM_SNAP = ALBUM_CARD_WIDTH + ALBUM_SPACING;

const SimpsonPalette = {
  sky: '#72C9FF',
  cloud: '#EAF7FF',
  yellow: '#FFD90F',
  pink: '#FF72B0',
  orange: '#F28C28',
  black: '#121212',
  navy: '#114866',
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

const DecorativeCloud = ({ style }) => <View style={[styles.cloud, style]} />;

export default function App() {
  const temporadas = Array.isArray(simpsons) ? simpsons : simpsons.temporadas || [];
  const [screen, setScreen] = useState('seasons');
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
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

  const openEpisodes = () => {
    if (temporadaActiva) {
      setScreen('episodes');
    }
  };

  const openEpisodeDetail = (episode) => {
    setSelectedEpisode(episode);
    setScreen('episodeDetail');
  };

  const closeEpisodeDetail = () => {
    setScreen('episodes');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" hidden />
      <DecorativeCloud style={styles.cloudOne} />
      <DecorativeCloud style={styles.cloudTwo} />

      {screen === 'seasons' ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Temporadas</Text>
            <Text style={styles.subtitle}>Elige una temporada de Los Simpson</Text>
          </View>

          <View style={styles.seasonsCenterZone}>
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
                  outputRange: [0.8, 1, 0.8],
                  extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.55, 1, 0.55],
                  extrapolate: 'clamp',
                });

                const seasonArt = resolveAsset(item.imagen);
                const isSelected = index === selectedSeason;

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

            <View style={styles.footerBox}>
              <Text style={styles.footerText}>
                Temporada activa: {temporadaActiva?.temporada ?? '-'}
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={openEpisodes} activeOpacity={0.9}>
                <Text style={styles.primaryButtonText}>Ver capítulos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : screen === 'episodes' ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Capítulos T{temporadaActiva?.temporada}</Text>
            <Text style={styles.subtitle}>Fotos cuadradas estilo álbum</Text>
          </View>

          <View style={styles.episodesActionsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setScreen('seasons')}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryButtonText}>← Volver a temporadas</Text>
            </TouchableOpacity>
            <Text style={styles.episodesCounter}>{temporadaActiva?.capitulos.length ?? 0} episodios</Text>
          </View>

          <FlatList
            data={temporadaActiva?.capitulos || []}
            keyExtractor={(item) => item.codigo}
            numColumns={2}
            contentContainerStyle={styles.episodesGrid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const chapterArt = resolveAsset(item.imagen);

              return (
                <TouchableOpacity
                  style={styles.photoCard}
                  activeOpacity={0.9}
                  onPress={() => openEpisodeDetail(item)}
                >
                  {chapterArt ? (
                    <Image source={chapterArt} style={styles.photoImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.photoImage, styles.fallbackImage]}>
                      <Text style={styles.fallbackText}>{item.codigo}</Text>
                    </View>
                  )}
                  <View style={styles.photoLabel}>
                    <Text style={styles.photoLabelText}>{item.codigo}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Ficha del capítulo</Text>
            <Text style={styles.subtitle}>Detalles y reproducción</Text>
          </View>

          <View style={styles.episodesActionsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={closeEpisodeDetail} activeOpacity={0.9}>
              <Text style={styles.secondaryButtonText}>← Volver a capítulos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>{selectedEpisode?.title || selectedEpisode?.titulo || selectedEpisode?.codigo || 'Sin título'}</Text>
            </View>

            <View style={styles.detailImageWrap}>
              {selectedEpisode && resolveAsset(selectedEpisode.imagen) ? (
                <Image
                  source={resolveAsset(selectedEpisode.imagen)}
                  style={styles.detailImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.detailImage, styles.fallbackImage]}>
                  <Text style={styles.fallbackText}>{selectedEpisode?.codigo ?? 'Sin imagen'}</Text>
                </View>
              )}

              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{selectedEpisode?.duration ?? '-'}</Text>
              </View>
            </View>

            <View style={styles.detailContent}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Air date: {selectedEpisode?.airDate ?? '-'}</Text>
              </View>

              <Text style={styles.detailDescription}>{selectedEpisode?.synopsis || selectedEpisode?.sinopsis || ''}</Text>

              <TouchableOpacity style={styles.playButton} activeOpacity={0.9}>
                <Text style={styles.playButtonText}>Reproducir en Raspberry</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingTop: 10,
    marginBottom: 6,
  },
  title: {
    color: SimpsonPalette.black,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: SimpsonPalette.navy,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  cloud: {
    position: 'absolute',
    width: 94,
    height: 44,
    borderRadius: 30,
    backgroundColor: SimpsonPalette.cloud,
    opacity: 0.9,
  },
  cloudOne: {
    top: 36,
    right: 22,
  },
  cloudTwo: {
    top: 88,
    left: 30,
    width: 72,
    height: 34,
  },
  seasonsCenterZone: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 28,
  },
  albumList: {
    paddingHorizontal: (width - ALBUM_CARD_WIDTH) / 2,
    paddingTop: 32,
    paddingBottom: 8,
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
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 7,
  },
  albumImage: {
    width: '100%',
    height: ALBUM_CARD_WIDTH * 1.2,
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
  footerBox: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  footerText: {
    fontWeight: '700',
    color: SimpsonPalette.navy,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: SimpsonPalette.pink,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff1f9',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  episodesActionsRow: {
    paddingHorizontal: 16,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: SimpsonPalette.yellow,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffe875',
  },
  secondaryButtonText: {
    color: SimpsonPalette.black,
    fontWeight: '900',
  },
  episodesCounter: {
    color: SimpsonPalette.navy,
    fontWeight: '800',
  },
  episodesGrid: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  photoCard: {
    flex: 1,
    margin: 8,
    maxWidth: '46%',
    aspectRatio: 1,
    backgroundColor: '#FFF4B7',
    borderWidth: 2,
    borderColor: SimpsonPalette.orange,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#5f3a00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 4,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 114, 176, 0.92)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  photoLabelText: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  detailCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: SimpsonPalette.yellow,
    backgroundColor: '#fff9db',
  },
  detailImageWrap: {
    position: 'relative',
  },
  detailImage: {
    width: '100%',
    height: 260,
    backgroundColor: '#fff2b8',
  },
  durationBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(17, 72, 102, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  durationText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  detailContent: {
    padding: 14,
    gap: 10,
  },
  detailTitle: {
    color: SimpsonPalette.black,
    fontSize: 20,
    fontWeight: '900',
  },
  metaRow: {
    marginTop: 2,
  },
  metaLabel: {
    color: SimpsonPalette.black,
    fontWeight: '800',
    fontSize: 14,
  },
  detailDescription: {
    color: SimpsonPalette.navy,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  playButton: {
    marginTop: 8,
    backgroundColor: SimpsonPalette.pink,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffd6ea',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  fallbackImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffe570',
    width: '100%',
    height: '100%',
  },
  fallbackText: {
    fontWeight: '800',
    color: SimpsonPalette.black,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
