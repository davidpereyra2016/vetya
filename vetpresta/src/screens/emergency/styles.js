import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../../styles/globalStyles';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.grey,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...SHADOWS.medium,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statusContainer: {
    margin: 15,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    ...SHADOWS.small,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDefault: {
    backgroundColor: COLORS.grey + '30',
  },
  statusAssigned: {
    backgroundColor: COLORS.primary + '30',
  },
  statusOnWay: {
    backgroundColor: COLORS.warning + '30',
  },
  statusAttended: {
    backgroundColor: COLORS.success + '30',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.dark,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 10,
  },
  locationText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.dark,
    flex: 1,
  },
  infoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  distanceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.grey,
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginLeft: 8,
  },
  statusActionsContainer: {
    alignItems: 'center',
  },
  actionButtonsContainer: {
    marginVertical: 15,
    padding: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.background,
    ...SHADOWS.medium,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  mapPlaceholderText: {
    marginTop: 10,
    color: COLORS.grey,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 15,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.dark,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  clientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  clientImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
    marginLeft: 15,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  clientPhone: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 4,
  },
  callButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  petContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
  },
  petImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#FFB74D30',
  },
  petImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  petDetails: {
    fontSize: 14,
    color: COLORS.grey,
    marginBottom: 5,
  },
  petTag: {
    backgroundColor: '#FFB74D20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  petTagText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '500',
  },
  petDetailsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  petDetail: {
    marginRight: 15,
    flexDirection: 'row',
  },
  petDetailLabel: {
    fontSize: 14,
    color: COLORS.grey,
  },
  petDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
    marginLeft: 4,
  },
  emergencyDetailsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  emergencyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    width: 130,
    fontSize: 14,
    color: COLORS.grey,
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: '600',
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    ...SHADOWS.extraSmall,
  },
  highUrgency: {
    backgroundColor: '#F4433630',
  },
  mediumUrgency: {
    backgroundColor: '#FFC10730',
  },
  lowUrgency: {
    backgroundColor: '#4CAF5030',
  },
  urgencyText: {
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  descriptionContainer: {
    marginTop: 10,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.grey,
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
});

export default styles;
