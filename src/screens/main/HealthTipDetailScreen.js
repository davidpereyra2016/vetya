import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header con imagen de fondo */}
      <View style={styles.header}>
        <View style={styles.headerOverlay}>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.headerImageContainer}>
          <View style={styles.headerImagePlaceholder}>
            <Ionicons name={getPetTypeIcon()} size={80} color="#fff" />
          </View>
        </View>
      </View>
      
      {/* Contenido principal */}
      <ScrollView style={styles.content}>
        <View style={styles.metaContainer}>
          <View style={styles.categoryContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{tip.category}</Text>
            </View>
            <View style={styles.petTypeBadge}>
              <Ionicons name={getPetTypeIcon()} size={14} color="#1E88E5" />
              <Text style={styles.petTypeText}>{getPetTypeName()}</Text>
            </View>
          </View>
          
          <View style={styles.dateReadContainer}>
            <Text style={styles.dateText}>{tip.date}</Text>
            <Text style={styles.readTimeText}>{tip.readTime} de lectura</Text>
          </View>
        </View>
        
        <Text style={styles.title}>{tip.title}</Text>
        
        <View style={styles.authorContainer}>
          <View style={styles.authorImagePlaceholder}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <Text style={styles.authorName}>{tip.author}</Text>
        </View>
        
        <Text style={styles.articleContent}>{articleContent}</Text>
        
        {/* Sección de consejos relacionados */}
        <View style={styles.relatedContainer}>
          <Text style={styles.relatedTitle}>Consejos relacionados</Text>
          
          <TouchableOpacity style={styles.relatedItem}>
            <View style={styles.relatedImagePlaceholder}>
              <Ionicons name={getPetTypeIcon()} size={24} color="#fff" />
            </View>
            <View style={styles.relatedInfo}>
              <Text style={styles.relatedItemTitle}>Cómo detectar alergias en tu mascota</Text>
              <Text style={styles.relatedItemCategory}>{tip.category}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.relatedItem}>
            <View style={styles.relatedImagePlaceholder}>
              <Ionicons name={getPetTypeIcon()} size={24} color="#fff" />
            </View>
            <View style={styles.relatedInfo}>
              <Text style={styles.relatedItemTitle}>Cuidados preventivos para cada etapa de vida</Text>
              <Text style={styles.relatedItemCategory}>Cuidados Generales</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 200,
    backgroundColor: '#1E88E5',
    position: 'relative',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 10,
  },
  categoryText: {
    color: '#1E88E5',
    fontWeight: '600',
    fontSize: 12,
  },
  petTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  petTypeText: {
    color: '#1E88E5',
    fontWeight: '500',
    fontSize: 12,
    marginLeft: 5,
  },
  dateReadContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  dateText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 2,
  },
  readTimeText: {
    color: '#999',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    lineHeight: 32,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorName: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
  },
  articleContent: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 30,
  },
  relatedContainer: {
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
    marginBottom: 15,
    backgroundColor: '#F7F9FC',
    padding: 15,
    borderRadius: 10,
  },
  relatedImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E88E5',
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
    marginBottom: 5,
  },
  relatedItemCategory: {
    fontSize: 12,
    color: '#666',
  },
});

export default HealthTipDetailScreen;
