import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PetDetailScreen from '../../screens/main/PetDetailScreen';
import usePetStore from '../../store/usePetStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Icon', MaterialCommunityIcons: 'Icon' }), { virtual: true });
jest.mock('../../components/common/ResponsiveModal', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({visible,children}) => visible ? <View>{children}</View> : null;
});
jest.mock('../../services/api', () => ({mascotaService:{pickPetImage:jest.fn()}}));
jest.mock('../../store/usePetStore', () => ({__esModule:true,default:{getState:jest.fn()}}));

test('editing a pet keeps the photo bounded and forwards the form changes', async () => {
  const pet = {_id:'pet-local-qa',nombre:'Mascota QA',tipo:'Perro',edad:'8',peso:'15',color:'Negro',imagen:'https://example.invalid/pet.jpg'};
  const updatePet = jest.fn(async(id,data)=>({success:true,data}));
  usePetStore.getState.mockReturnValue({fetchPetById:async()=>({success:true,data:pet}),updatePet});
  const screen = render(<PetDetailScreen route={{params:{petId:pet._id}}} navigation={{goBack:jest.fn()}}/>);
  await waitFor(()=>expect(screen.getByText('Editar información de Mascota QA')).toBeTruthy());
  fireEvent.press(screen.getByText('Editar información de Mascota QA'));
  expect(screen.getByText('Editar Mascota')).toBeTruthy();
  const preview = screen.UNSAFE_getAllByType(Image).find(node=>StyleSheet.flatten(node.props.style).height==='100%' && StyleSheet.flatten(node.parent.props.style)?.width===110);
  expect(preview).toBeTruthy();
  expect(StyleSheet.flatten(preview.parent.props.style)).toEqual(expect.objectContaining({width:110,height:110}));
  fireEvent.changeText(screen.getByPlaceholderText('Nombre de la mascota'),'Nombre editado QA');
  expect(screen.getByPlaceholderText('Describe cualquier necesidad especial o condición médica')).toBeTruthy();
  fireEvent.press(screen.getByText('Guardar cambios'));
  await waitFor(()=>expect(updatePet).toHaveBeenCalledWith(pet._id,expect.objectContaining({nombre:'Nombre editado QA',imagen:pet.imagen})));
},30000);
