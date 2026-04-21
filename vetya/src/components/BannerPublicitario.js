import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import usePublicidadStore from '../store/usePublicidadStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dimensiones del carrusel
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const CARD_HEIGHT = 130;

/**
 * BannerPublicitario
 * Carrusel horizontal con paginación por puntos.
 * Cada tarjeta muestra SOLO la imagen (desde Cloudinary).
 * Si el banner tiene `enlace`, al tocarlo abre la URL en el navegador.
 */
const BannerPublicitario = () => {
  const { banners, isLoading, fetchBanners } = usePublicidadStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Handler al tocar la tarjeta: abre el enlace si existe
  const handlePress = async (banner) => {
    if (!banner?.enlace) return;
    try {
      const supported = await Linking.canOpenURL(banner.enlace);
      if (supported) {
        await Linking.openURL(banner.enlace);
      } else {
        Alert.alert('Aviso', 'No se pudo abrir el enlace.');
      }
    } catch (err) {
      console.warn('Error al abrir enlace:', err);
    }
  };

  // Controla el índice activo según el scroll (snap a página)
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  // Render por tarjeta
  const renderItem = ({ item }) => {
    const hasLink = !!item.enlace;
    const Container = hasLink ? TouchableOpacity : View;

    return (
      <Container
        activeOpacity={0.9}
        onPress={hasLink ? () => handlePress(item) : undefined}
        style={styles.card}
      >
        <Image
          source={{ uri: item.urlImagen }}
          style={styles.image}
          resizeMode="cover"
        />
      </Container>
    );
  };

  // Estados vacíos / cargando
  if (isLoading && banners.length === 0) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="small" color="#1A237E" />
      </View>
    );
  }

  if (!banners || banners.length === 0) {
    return null; // No mostrar nada si no hay banners activos
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={(item) => String(item._id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: CARD_MARGIN }} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, activeIndex === i ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 12,
  },
  listContent: {
    paddingHorizontal: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8EAF6',
    // Sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Sombra Android
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#1A237E',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#C5CAE9',
  },
});

export default BannerPublicitario;
