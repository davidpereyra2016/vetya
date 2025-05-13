import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  TextInput,
  ScrollView, 
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const PetsScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petBreed, setPetBreed] = useState('');

  // Datos de ejemplo para las mascotas
  const [pets, setPets] = useState([
    {
      id: '1',
      name: 'Max',
      type: 'Perro',
      breed: 'Golden Retriever',
      age: '3 años',
      lastVisit: '10/04/2025',
      image: null,
      iconType: 'dog'
    },
    {
      id: '2',
      name: 'Luna',
      type: 'Gato',
      breed: 'Siamés',
      age: '2 años',
      lastVisit: '25/04/2025',
      image: null,
      iconType: 'cat'
    },
    {
      id: '3',
      name: 'Rocky',
      type: 'Perro',
      breed: 'Bulldog',
      age: '5 años',
      lastVisit: '03/05/2025',
      image: null,
      iconType: 'dog'
    },
  ]);

  const renderPetIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'perro':
      case 'dog':
        return <Ionicons name="paw" size={40} color="#1E88E5" />;
      case 'gato':
      case 'cat':
        return <Ionicons name="paw" size={40} color="#42A5F5" />;
      case 'ave':
      case 'bird':
        return <Ionicons name="airplane" size={40} color="#64B5F6" />;
      case 'pez':
      case 'fish':
        return <Ionicons name="fish" size={40} color="#2196F3" />;
      default:
        return <Ionicons name="paw" size={40} color="#90CAF9" />;
    }
  };

  const addPet = () => {
    if (petName && petType && petAge) {
      const newPet = {
        id: Date.now().toString(),
        name: petName,
        type: petType,
        breed: petBreed || 'No especificada',
        age: petAge,
        lastVisit: 'Sin visitas',
        image: null,
        iconType: petType.toLowerCase()
      };
      
      setPets([...pets, newPet]);
      setPetName('');
      setPetType('');
      setPetAge('');
      setPetBreed('');
      setModalVisible(false);
    } else {
      alert('Por favor complete los campos requeridos');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.petCard}>
      <View style={styles.petImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.petImage} />
        ) : (
          <View style={styles.petIconContainer}>
            {renderPetIcon(item.iconType)}
          </View>
        )}
      </View>
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petDetails}>{item.type} • {item.breed}</Text>
        <Text style={styles.petAge}>{item.age}</Text>
        <View style={styles.lastVisitContainer}>
          <Ionicons name="calendar-outline" size={14} color="#888" />
          <Text style={styles.lastVisitText}>Última visita: {item.lastVisit}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={20} color="#888" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const AddPetModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Mascota</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={petName}
                onChangeText={setPetName}
                placeholder="Nombre de tu mascota"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tipo de mascota *</Text>
              <TextInput
                style={styles.input}
                value={petType}
                onChangeText={setPetType}
                placeholder="Ej. Perro, Gato, Ave"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Raza</Text>
              <TextInput
                style={styles.input}
                value={petBreed}
                onChangeText={setPetBreed}
                placeholder="Raza de tu mascota"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Edad *</Text>
              <TextInput
                style={styles.input}
                value={petAge}
                onChangeText={setPetAge}
                placeholder="Ej. 2 años, 6 meses"
              />
            </View>
            
            <View style={styles.photoContainer}>
              <Text style={styles.photoText}>Agregar foto</Text>
              <TouchableOpacity style={styles.photoButton}>
                <Ionicons name="camera" size={28} color="#1E88E5" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={addPet}
            >
              <Text style={styles.addButtonText}>Guardar mascota</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Mascotas</Text>
        <TouchableOpacity
          style={styles.addPetButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {pets.length > 0 ? (
        <FlatList
          data={pets}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="paw" size={80} color="#1E88E5" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No tienes mascotas registradas</Text>
          <Text style={styles.emptySubText}>Agrega tu primera mascota para comenzar</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.emptyButtonText}>Agregar mascota</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <AddPetModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addPetButton: {
    backgroundColor: '#1E88E5',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  petCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  petImageContainer: {
    marginRight: 15,
  },
  petImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  petIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  petAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  lastVisitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastVisitText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 5,
  },
  moreButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollView: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  photoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90CAF9',
    borderStyle: 'dashed',
  },
  addButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PetsScreen;
