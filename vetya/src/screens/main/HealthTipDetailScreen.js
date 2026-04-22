import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');

// Paleta de colores por categoría (para el hero/acentos visuales)
const getCategoryPalette = (category) => {
  switch (category) {
    case 'Nutrición':
      return { bg: '#E65100', accent: '#FF9800', icon: 'restaurant' };
    case 'Higiene':
      return { bg: '#00695C', accent: '#26A69A', icon: 'water' };
    case 'Cuidados Generales':
      return { bg: '#1565C0', accent: '#42A5F5', icon: 'heart' };
    case 'Comportamiento':
      return { bg: '#6A1B9A', accent: '#AB47BC', icon: 'happy' };
    case 'Actividad Física':
      return { bg: '#B71C1C', accent: '#EF5350', icon: 'fitness' };
    case 'Prevención':
      return { bg: '#2E7D32', accent: '#4CAF50', icon: 'shield-checkmark' };
    default:
      return { bg: '#1A237E', accent: '#3F51B5', icon: 'medical' };
  }
};

// Extrae iniciales del autor (ej: "Dr. Carlos Rodríguez" → "CR")
const getAuthorInitials = (author) => {
  if (!author) return 'V';
  const cleaned = String(author).replace(/^(Dr\.|Dra\.)\s*/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'V';
};

const HealthTipDetailScreen = ({ route, navigation }) => {
  const { tip } = route.params;
  
  // Función para compartir el consejo
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${tip.title} - ${tip.description}\n\nLeído en la app VetYa`,
        title: 'Consejo de salud para mascotas',
      });
    } catch (error) {
      console.log('Error compartiendo:', error);
    }
  };
  
  // Determinar el icono basado en el tipo de mascota
  const getPetTypeIcon = () => {
    switch (tip.petType) {
      case 'dog': return 'logo-reddit';
      case 'cat': return 'logo-octocat';
      case 'bird': return 'airplane';
      case 'fish': return 'fish';
      case 'reptile': return 'leaf';
      case 'rabbit': return 'extension-puzzle';
      case 'rodent': return 'ellipse';
      default: return 'paw';
    }
  };
  
  // Obtener el nombre del tipo de mascota
  const getPetTypeName = () => {
    switch (tip.petType) {
      case 'dog': return 'Perros';
      case 'cat': return 'Gatos';
      case 'bird': return 'Aves';
      case 'fish': return 'Peces';
      case 'reptile': return 'Reptiles';
      case 'rabbit': return 'Conejos';
      case 'rodent': return 'Roedores';
      default: return 'Todas las mascotas';
    }
  };
  
  // Texto para el contenido del artículo (simulado)
  const articleContent = `
${tip.description}

Los dueños de mascotas deben estar atentos a estos consejos para garantizar la salud y bienestar de sus compañeros. Es importante recordar que cada animal tiene necesidades específicas según su especie, raza, edad y condiciones de salud particulares.

Aspectos importantes a considerar:

1. **Alimentación**: Proporciona una dieta balanceada adaptada a sus necesidades específicas.
2. **Hidratación**: Asegúrate que siempre tenga agua fresca disponible.
3. **Ejercicio**: El nivel adecuado de actividad física es esencial para mantener un peso saludable.
4. **Visitas al veterinario**: Revisiones periódicas para prevenir problemas de salud.
5. **Higiene**: Mantener una rutina de limpieza y aseo adecuada para cada tipo de mascota.

Recuerda que cada mascota es única y puede tener necesidades especiales. Siempre consulta con un veterinario para obtener recomendaciones personalizadas para tu compañero.
  `;
  
  // Paleta del diseño basada en la categoría del consejo
  const palette = getCategoryPalette(tip.category);
  const heroBg = tip.bgColor || palette.bg;
  const heroIcon = tip.iconName || palette.icon;
  const accentColor = palette.accent;
  const authorInitials = getAuthorInitials(tip.author);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER FLOTANTE (botones absolutos con efecto cristal) */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.glassButton, { marginRight: 10 }]}>
            <Ionicons name="bookmark-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.glassButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HERO: icono grande con color de fondo dinámico */}
        <View style={[styles.heroSection, { backgroundColor: heroBg }]}>
          <Ionicons name={heroIcon} size={150} color="rgba(255,255,255,0.15)" />
          {/* Ícono de tipo de mascota como acento */}
          <View style={styles.heroPetTypeBadge}>
            <Ionicons name={getPetTypeIcon()} size={28} color="#FFF" />
          </View>
        </View>

        {/* SHEET CONTAINER (sube sobre el hero con bordes curvos) */}
        <View style={styles.sheetContainer}>
          {/* Metadatos superiores */}
          <View style={styles.metaTopRow}>
            <View style={styles.metaTags}>
              <View style={[styles.categoryPill, { backgroundColor: `${accentColor}1A` }]}>
                <Text style={[styles.categoryPillText, { color: accentColor }]}>{tip.category}</Text>
              </View>
              <View style={styles.petTypePill}>
                <Ionicons name={getPetTypeIcon()} size={12} color="#666" style={{ marginRight: 4 }} />
                <Text style={styles.petTypePillText}>{getPetTypeName()}</Text>
              </View>
            </View>
            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={14} color="#999" style={{ marginRight: 4 }} />
              <Text style={styles.timeInfoText}>{tip.readTime}</Text>
            </View>
          </View>

          {/* Título principal */}
          <Text style={styles.articleTitle}>{tip.title}</Text>

          {/* Tarjeta del autor */}
          <View style={styles.authorSection}>
            <View style={[styles.authorAvatar, { backgroundColor: `${accentColor}1A` }]}>
              <Text style={[styles.authorInitials, { color: accentColor }]}>{authorInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{tip.author}</Text>
              <Text style={styles.authorRole}>Especialista veterinario • {tip.date}</Text>
            </View>
          </View>

          {/* Cuerpo del artículo: se usa el mismo contenido pero renderizado
              con jerarquía visual (lead + párrafos + quote). */}
          <View style={styles.articleBody}>
            {(() => {
              // Parseamos articleContent para darle estilo por bloques
              const blocks = articleContent.trim().split(/\n\s*\n/).filter(Boolean);
              return blocks.map((block, idx) => {
                const trimmed = block.trim();

                // Primer bloque => lead text (descripción principal)
                if (idx === 0) {
                  return <Text key={idx} style={styles.leadText}>{trimmed}</Text>;
                }

                // Subtítulo: termina en ":"
                if (/:$/.test(trimmed) && !trimmed.includes('\n')) {
                  return <Text key={idx} style={styles.subHeading}>{trimmed}</Text>;
                }

                // Último bloque que comienza con "Recuerda" => quote
                if (/^recuerda/i.test(trimmed)) {
                  return (
                    <View key={idx} style={[styles.quoteBlock, { borderLeftColor: accentColor }]}>
                      <Text style={[styles.quoteText, { color: accentColor }]}>{trimmed}</Text>
                    </View>
                  );
                }

                // Bloques con líneas numeradas (1. 2. 3. ...) => lista destacada
                const lines = trimmed.split('\n').filter(Boolean);
                const isNumberedList = lines.every((l) => /^\s*\d+\.\s*/.test(l));
                if (isNumberedList) {
                  return (
                    <View key={idx} style={styles.listBlock}>
                      {lines.map((line, i) => (
                        <View key={i} style={styles.listItem}>
                          <View style={[styles.listBullet, { backgroundColor: accentColor }]}>
                            <Text style={styles.listBulletText}>{i + 1}</Text>
                          </View>
                          <Text style={styles.listItemText}>
                            {line.replace(/^\s*\d+\.\s*/, '').replace(/\*\*(.+?)\*\*:/g, '$1:')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                }

                // Bloque por defecto: párrafo
                return <Text key={idx} style={styles.paragraph}>{trimmed}</Text>;
              });
            })()}
          </View>

          {/* Sección de consejos relacionados (preservada) */}
          <View style={styles.relatedContainer}>
            <Text style={styles.relatedTitle}>Consejos relacionados</Text>

            <TouchableOpacity style={styles.relatedItem} activeOpacity={0.8}>
              <View style={[styles.relatedImagePlaceholder, { backgroundColor: `${accentColor}1A` }]}>
                <Ionicons name={getPetTypeIcon()} size={24} color={accentColor} />
              </View>
              <View style={styles.relatedInfo}>
                <Text style={styles.relatedItemTitle}>Cómo detectar alergias en tu mascota</Text>
                <Text style={styles.relatedItemCategory}>{tip.category}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.relatedItem} activeOpacity={0.8}>
              <View style={[styles.relatedImagePlaceholder, { backgroundColor: `${accentColor}1A` }]}>
                <Ionicons name={getPetTypeIcon()} size={24} color={accentColor} />
              </View>
              <View style={styles.relatedInfo}>
                <Text style={styles.relatedItemTitle}>Cuidados preventivos para cada etapa de vida</Text>
                <Text style={styles.relatedItemCategory}>Cuidados Generales</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTON (Agendar consulta) */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: heroBg, shadowColor: heroBg }]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AgendarCita')}
        >
          <Ionicons name="calendar-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.fabText}>Agendar consulta veterinaria</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  headerRight: {
    flexDirection: 'row',
  },
  glassButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    width: width,
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPetTypeBadge: {
    position: 'absolute',
    bottom: 60,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginTop: -35,
    paddingHorizontal: 25,
    paddingTop: 30,
    minHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  metaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaTags: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  petTypePill: {
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  petTypePillText: {
    color: '#666',
    fontSize: 11,
    fontWeight: 'bold',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInfoText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  articleTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A237E',
    lineHeight: 34,
    marginBottom: 20,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 25,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  authorInitials: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  authorRole: {
    fontSize: 12,
    color: '#888',
  },
  articleBody: {
    paddingBottom: 20,
  },
  leadText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#444',
    lineHeight: 26,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  subHeading: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 12,
  },
  listBlock: {
    marginBottom: 18,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  listBulletText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  quoteBlock: {
    backgroundColor: '#F5F7FA',
    borderLeftWidth: 4,
    padding: 16,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    marginVertical: 15,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 22,
  },
  relatedContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 14,
  },
  relatedImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  relatedInfo: {
    flex: 1,
  },
  relatedItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  relatedItemCategory: {
    fontSize: 12,
    color: '#888',
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
  },
  fabButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HealthTipDetailScreen;
