import { StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../../styles/globalStyles';

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
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 5,
    fontSize: 14,
    color: COLORS.grey,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '100%',
    ...SHADOWS.small,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  successButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  statusCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  statusCompletedText: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  mapContainer: {
    margin: 15,
    marginTop: 0,
    height: 200,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.small,
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
  openInMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
  },
  openInMapsText: {
    color: COLORS.white,
    fontWeight: '500',
    marginLeft: 5,
  },
  section: {
    margin: 15,
    marginTop: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
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
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  petImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
    marginLeft: 15,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  petDetails: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 4,
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
    borderRadius: 8,
    padding: 12,
  },
  emergencyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emergencyDetailLabel: {
    width: 120,
    fontSize: 14,
    color: COLORS.grey,
  },
  emergencyDetailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  urgencyHigh: {
    backgroundColor: COLORS.error + '20',
  },
  urgencyMedium: {
    backgroundColor: COLORS.warning + '20',
  },
  urgencyLow: {
    backgroundColor: COLORS.success + '20',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
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
