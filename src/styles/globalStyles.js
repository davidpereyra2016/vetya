import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Paleta de colores principal
export const COLORS = {
  primary: '#1E88E5',    // Azul principal
  secondary: '#4CAF50',  // Verde secundario
  accent: '#F44336',     // Rojo para alertas y emergencias
  warning: '#FFC107',    // Amarillo para advertencias
  success: '#4CAF50',    // Verde para éxito
  info: '#2196F3',       // Azul información
  dark: '#333333',       // Texto oscuro
  grey: '#666666',       // Texto gris
  lightGrey: '#BBBBBB',  // Texto gris claro
  border: '#E0E0E0',     // Bordes
  background: '#F5F7FA', // Fondo general
  card: '#FFFFFF',       // Fondo tarjetas
  overlay: 'rgba(0,0,0,0.5)', // Overlay para modales
};

// Espaciado consistente
export const SIZES = {
  base: 8,
  small: 12,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 40,
  width,
  height
};

// Tipografía
export const FONTS = {
  h1: { fontSize: 30, fontWeight: 'bold' },
  h2: { fontSize: 22, fontWeight: 'bold' },
  h3: { fontSize: 18, fontWeight: 'bold' },
  h4: { fontSize: 16, fontWeight: 'bold' },
  body1: { fontSize: 16 },
  body2: { fontSize: 14 },
  body3: { fontSize: 12 },
  button: { fontSize: 16, fontWeight: '600' },
};

// Sombras para iOS y Android
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Estilos para elementos comunes
const globalStyles = StyleSheet.create({
  // Contenedores
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollViewContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  
  // Headers
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.medium,
    paddingTop: SIZES.large * 1.5,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.card,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Tarjetas y secciones
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    ...SHADOWS.small,
  },
  sectionContainer: {
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.medium,
    marginTop: SIZES.medium,
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.medium,
    borderRadius: 10,
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.dark,
  },
  
  // Inputs y formularios
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: SIZES.medium,
    paddingHorizontal: 10,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.dark,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  
  // Botones
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.medium,
  },
  primaryButtonText: {
    color: COLORS.card,
    ...FONTS.button,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.medium,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    ...FONTS.button,
  },
  dangerButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.medium,
  },
  dangerButtonText: {
    color: COLORS.card,
    ...FONTS.button,
  },
  
  // Textos
  title: {
    ...FONTS.h1,
    color: COLORS.dark,
    marginBottom: SIZES.small,
  },
  subtitle: {
    ...FONTS.h3,
    color: COLORS.dark,
    marginBottom: SIZES.medium,
  },
  bodyText: {
    ...FONTS.body1,
    color: COLORS.dark,
    marginBottom: SIZES.small,
  },
  captionText: {
    ...FONTS.body3,
    color: COLORS.grey,
  },
  errorText: {
    ...FONTS.body2,
    color: COLORS.accent,
    marginTop: SIZES.small,
    textAlign: 'center',
  },
  
  // Avatares e imágenes
  avatarContainer: {
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGrey,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.card,
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Estados vacíos
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xlarge,
  },
  emptyStateText: {
    ...FONTS.body2,
    color: COLORS.grey,
    textAlign: 'center',
    marginTop: SIZES.medium,
  },
});

export default globalStyles;
