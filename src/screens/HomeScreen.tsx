import React from 'react';
import { View, Text, Button } from 'react-native';

const HomeScreen = ({ navigation }: any) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
      <Button 
        title="Not Ekle" 
        onPress={() => navigation.navigate('AddNote')} 
      />
    </View>
  );
};

export default HomeScreen;