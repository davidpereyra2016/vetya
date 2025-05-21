import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  Animated 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/useAuthStore';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = () => {
  // Usar Zustand en lugar de AuthContext
  const setIsFirstTime = useAuthStore(state => state.setIsFirstTime);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const slides = [
    {
      id: '1',
      title: 'Recibe solicitudes de emergencia',
      description: 'Como prestador, recibirás notificaciones de emergencias cercanas que requieren atención veterinaria inmediata a domicilio.',
      image: require('../../assets/images/pet-register.png'),
      icon: 'alert-circle'
    },
    {
      id: '2',
      title: 'Gestiona tus servicios',
      description: 'Configura los servicios que ofreces, tus tarifas y horarios de disponibilidad para atender a las mascotas de los clientes.',
      image: require('../../assets/images/app-usage.png'),
      icon: 'briefcase'
    },
    {
      id: '3',
      title: 'Atiende a domicilio',
      description: 'Acepta las solicitudes, consulta la ubicación del cliente y brinda atención veterinaria profesional en el domicilio.',
      image: require('../../assets/images/vet-contact.png'),
      icon: 'medkit'
    },
  ];

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      setIsFirstTime(false);
    }
  };

  const DotIndicator = ({ scrollX }) => {
    return (
      <View style={styles.dotContainer}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp'
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp'
          });
          
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { width: dotWidth, opacity, backgroundColor: '#1E88E5' }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={80} color="#1E88E5" />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.contentContainer}>
        <FlatList
          data={slides}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>
      
      <View style={styles.bottomContainer}>
        <DotIndicator scrollX={scrollX} />
        <TouchableOpacity style={styles.button} onPress={scrollTo}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color="#fff" 
            style={styles.buttonIcon} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  contentContainer: {
    flex: 3,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 150,
    height: 150,
    backgroundColor: '#E3F2FD',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E88E5',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 50,
  },
  dotContainer: {
    flexDirection: 'row',
    height: 20,
    marginTop: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#1E88E5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 10,
  },
});

export default OnboardingScreen;
