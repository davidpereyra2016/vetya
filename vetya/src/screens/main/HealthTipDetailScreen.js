import ScrollView from '../../components/common/AppScrollView';
import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useConsejosSaludStore from '../../store/useConsejosSaludStore';


const getCategoryPalette = (tip) => {
  const color = tip?.color || '#1E88E5';
  const category = tip?.category;
  switch (category) {
    case 'Nutricion':
    case 'Nutrición':
      return { bg: '#E65100', accent: '#FF9800', icon: 'restaurant' };
    case 'Comportamiento':
      return { bg: '#6A1B9A', accent: '#AB47BC', icon: 'happy' };
    case 'Prevencion':
    case 'Prevención':
      return { bg: '#2E7D32', accent: '#4CAF50', icon: 'shield-checkmark' };
    case 'Emergencias':
      return { bg: '#B71C1C', accent: '#EF5350', icon: 'alert-circle' };
    default:
      return { bg: color === '#1E88E5' ? '#1A237E' : color, accent: color, icon: tip?.icon || 'medical' };
  }
};

const getAuthorInitials = (author) => {
  if (!author) return 'V';
  const cleaned = String(author).replace(/^(Dr\.|Dra\.)\s*/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'V';
};

const getPetTypeIcon = (tip) => {
  const type = tip?.petType;
  if (type === 'cat') return 'logo-octocat';
  if (type === 'bird') return 'airplane';
  if (type === 'fish') return 'fish';
  if (type === 'reptile') return 'leaf';
  if (type === 'rabbit') return 'extension-puzzle';
  if (type === 'rodent') return 'ellipse';
  return 'paw';
};

const getPetTypeName = (tip) => {
  const types = Array.isArray(tip?.petTypes) && tip.petTypes.length > 0 ? tip.petTypes : ['Todos'];
  return types.join(', ');
};

const renderInlineMarkdown = (text, style, accentColor, key) => {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push({ type: 'bold', value: token.slice(2, -2) });
    } else {
      const link = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (link) parts.push({ type: 'link', value: link[1], url: link[2] });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) });

  return (
    <Text key={key} style={style}>
      {parts.map((part, index) => {
        if (part.type === 'bold') return <Text key={index} style={styles.inlineBold}>{part.value}</Text>;
        if (part.type === 'link') {
          return (
            <Text key={index} style={[styles.inlineLink, { color: accentColor }]} onPress={() => Linking.openURL(part.url)}>
              {part.value}
            </Text>
          );
        }
        return <Text key={index}>{part.value}</Text>;
      })}
    </Text>
  );
};

const MarkdownContent = ({ content, accentColor }) => {
  const blocks = String(content || '').trim().split(/\n\s*\n/).filter(Boolean);
  if (blocks.length === 0) return null;

  return (
    <View style={styles.articleBody}>
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (/^###\s+/.test(trimmed)) {
          return <Text key={idx} style={styles.subHeadingSmall}>{trimmed.replace(/^###\s+/, '')}</Text>;
        }
        if (/^##\s+/.test(trimmed)) {
          return <Text key={idx} style={styles.subHeading}>{trimmed.replace(/^##\s+/, '')}</Text>;
        }

        const lines = trimmed.split('\n').filter(Boolean);
        const isList = lines.every((line) => /^\s*(-|\d+\.)\s+/.test(line));
        if (isList) {
          return (
            <View key={idx} style={styles.listBlock}>
              {lines.map((line, lineIndex) => (
                <View key={lineIndex} style={styles.listItem}>
                  <View style={[styles.listBullet, { backgroundColor: accentColor }]}>
                    <Text style={styles.listBulletText}>{/^\s*\d+\./.test(line) ? lineIndex + 1 : '•'}</Text>
                  </View>
                  {renderInlineMarkdown(line.replace(/^\s*(-|\d+\.)\s+/, ''), styles.listItemText, accentColor)}
                </View>
              ))}
            </View>
          );
        }

        if (/^>/.test(trimmed)) {
          return (
            <View key={idx} style={[styles.quoteBlock, { borderLeftColor: accentColor }]}>
              {renderInlineMarkdown(trimmed.replace(/^>\s?/, ''), [styles.quoteText, { color: accentColor }], accentColor)}
            </View>
          );
        }

        return renderInlineMarkdown(trimmed, idx === 0 ? styles.leadText : styles.paragraph, accentColor, idx);
      })}
    </View>
  );
};

const HealthTipDetailScreen = ({ route, navigation }) => {
  const routeTip = route.params?.tip || null;
  const selectedConsejo = useConsejosSaludStore((state) => state.selectedConsejo);
  const isLoading = useConsejosSaludStore((state) => state.isLoading);
  const error = useConsejosSaludStore((state) => state.error);
  const fetchConsejoById = useConsejosSaludStore((state) => state.fetchConsejoById);
  const likeConsejo = useConsejosSaludStore((state) => state.likeConsejo);
  const clearSelectedConsejo = useConsejosSaludStore((state) => state.clearSelectedConsejo);

  const tip = selectedConsejo?.id === routeTip?.id ? selectedConsejo : routeTip || selectedConsejo;
  const palette = useMemo(() => getCategoryPalette(tip), [tip]);
  const authorInitials = getAuthorInitials(tip?.author);

  useEffect(() => {
    if (routeTip?.id) fetchConsejoById(routeTip.id);
    return () => clearSelectedConsejo();
  }, [clearSelectedConsejo, fetchConsejoById, routeTip?.id]);

  const handleShare = async () => {
    if (!tip) return;
    try {
      await Share.share({
        message: `${tip.title}\n\n${tip.description}\n\nLeido en la app VetYa`,
        title: 'Consejo de salud para mascotas',
      });
    } catch (error) {
      console.log('Error compartiendo:', error);
    }
  };

  const handleLike = () => {
    if (tip?.id) likeConsejo(tip.id);
  };

  if (!tip && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Cargando consejo...</Text>
      </View>
    );
  }

  if (!tip) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={58} color="#F44336" />
        <Text style={styles.loadingText}>{error || 'No se pudo cargar el consejo'}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.floatingHeader}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver" hitSlop={8} onPress={() => navigation.goBack()} style={styles.glassButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity accessibilityRole="button" hitSlop={8} style={[styles.glassButton, { marginRight: 10 }]} onPress={handleLike}>
            <Ionicons name="heart-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" hitSlop={8} style={styles.glassButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.heroSection, { backgroundColor: palette.bg }]}>
          {tip.image ? (
            <Image source={{ uri: tip.image }} style={styles.heroImage} />
          ) : (
            <Ionicons name={palette.icon} size={150} color="rgba(255,255,255,0.15)" />
          )}
          <View style={styles.heroOverlay} />
          <View style={styles.heroPetTypeBadge}>
            <Ionicons name={getPetTypeIcon(tip)} size={28} color="#FFF" />
          </View>
        </View>

        <View style={styles.sheetContainer}>
          <View style={styles.metaTopRow}>
            <View style={styles.metaTags}>
              <View style={[styles.categoryPill, { backgroundColor: `${palette.accent}1A` }]}>
                <Text style={[styles.categoryPillText, { color: palette.accent }]}>{tip.category}</Text>
              </View>
              <View style={styles.petTypePill}>
                <Ionicons name={getPetTypeIcon(tip)} size={12} color="#666" style={{ marginRight: 4 }} />
                <Text style={styles.petTypePillText}>{getPetTypeName(tip)}</Text>
              </View>
            </View>
            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={14} color="#999" style={{ marginRight: 4 }} />
              <Text style={styles.timeInfoText}>{tip.readTime}</Text>
            </View>
          </View>

          <Text style={styles.articleTitle}>{tip.title}</Text>
          <View style={styles.authorSection}>
            <View style={[styles.authorAvatar, { backgroundColor: `${palette.accent}1A` }]}>
              <Text style={[styles.authorInitials, { color: palette.accent }]}>{authorInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{tip.author}</Text>
              <Text style={styles.authorRole}>{tip.doctor || 'Especialista veterinario'} · {tip.date}</Text>
            </View>
          </View>

          <MarkdownContent content={tip.content || tip.description} accentColor={palette.accent} />

          {tip.source ? (
            <TouchableOpacity accessibilityRole="button" style={styles.sourceBox} onPress={() => Linking.openURL(tip.source)}>
              <Ionicons name="link-outline" size={18} color={palette.accent} />
              <Text style={[styles.sourceText, { color: palette.accent }]} numberOfLines={2}>Fuente profesional</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.fabWrapper}>
        <TouchableOpacity accessibilityRole="button"
          style={[styles.fabButton, { backgroundColor: palette.bg, shadowColor: palette.bg }]}
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
  container: { flex: 1, backgroundColor: '#FFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FFF' },
  loadingText: { color: '#607D8B', fontSize: 15, marginTop: 12, textAlign: 'center' },
  backButton: { backgroundColor: '#1E88E5', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginTop: 18 },
  backButtonText: { color: '#FFF', fontWeight: 'bold' },
  floatingHeader: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  headerRight: { flexDirection: 'row' },
  glassButton: {
    minHeight: 42,
    paddingVertical: 12,
    width: 42,

    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    aspectRatio: 1.6, width: '100%',  justifyContent: 'center', alignItems: 'center' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.24)' },
  heroPetTypeBadge: {
    position: 'absolute',
    bottom: 60,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
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
    elevation: 10,
  },
  metaTopRow: {
    flexWrap: 'wrap',
    gap: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  metaTags: {
    flexWrap: 'wrap',
    gap: 8, flexDirection: 'row', flexShrink: 1 },
  categoryPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginRight: 8 },
  categoryPillText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  petTypePill: { backgroundColor: '#F5F5F5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexShrink: 1 },
  petTypePillText: {
    flexShrink: 1, color: '#666', fontSize: 11, fontWeight: 'bold' },
  timeInfo: { flexDirection: 'row', alignItems: 'center' },
  timeInfoText: {
    flexShrink: 1, color: '#999', fontSize: 12, fontWeight: '600' },
  articleTitle: { fontSize: 26, fontWeight: '900', color: '#1A237E', lineHeight: 34, marginBottom: 20 },
  authorSection: { flexDirection: 'row', alignItems: 'center', paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginBottom: 25 },
  authorAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  authorInitials: { fontSize: 16, fontWeight: 'bold' },
  authorName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  authorRole: { fontSize: 12, color: '#888' },
  articleBody: { paddingBottom: 20 },
  leadText: { fontSize: 17, fontWeight: '600', color: '#444', lineHeight: 26, marginBottom: 16 },
  paragraph: { fontSize: 15, color: '#666', lineHeight: 24, marginBottom: 16 },
  subHeading: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 8, marginBottom: 12 },
  subHeadingSmall: { fontSize: 17, fontWeight: 'bold', color: '#333', marginTop: 6, marginBottom: 10 },
  inlineBold: { fontWeight: 'bold', color: '#333' },
  inlineLink: { fontWeight: 'bold', textDecorationLine: 'underline' },
  listBlock: { marginBottom: 18 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  listBullet: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  listBulletText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  listItemText: { flex: 1, fontSize: 15, color: '#555', lineHeight: 22 },
  quoteBlock: { backgroundColor: '#F5F7FA', borderLeftWidth: 4, padding: 16, borderTopRightRadius: 12, borderBottomRightRadius: 12, marginVertical: 15 },
  quoteText: { fontSize: 15, fontStyle: 'italic', fontWeight: '500', lineHeight: 22 },
  sourceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F9FC', padding: 14, borderRadius: 14, marginBottom: 28 },
  sourceText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1, fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  fabWrapper: {
    flexShrink: 0,     },
  fabButton: {
    minHeight: 56,
    paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',  borderRadius: 16, elevation: 8 },
  fabText: {
    flexShrink: 1, color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default HealthTipDetailScreen;
