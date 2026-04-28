// @ts-nocheck
import React, { useState, createContext, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert, NativeModules } from 'react-native';
import { NavigationContainer, useNavigationBuilder, createNavigatorFactory } from '@react-navigation/native';
import { StackRouter } from '@react-navigation/routers';

const { SimpleStorage } = NativeModules;

// --- STATE YÖNETİMİ (Context API) ---
const NotesContext = createContext();

export const useNotes = () => useContext(NotesContext);

// --- ÖZEL PURE JS NAVIGATOR ---
// Native kütüphanelerin (react-native-screens) RN 0.85'te çökmesini önlemek için
// React Navigation'ın çekirdek API'si ile tamamen JS tabanlı özel bir Stack Navigator oluşturuyoruz.
function CustomStackNavigator({ initialRouteName, children, screenOptions }) {
  const { state, navigation, descriptors } = useNavigationBuilder(StackRouter, {
    initialRouteName,
    children,
    screenOptions,
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      {descriptors[state.routes[state.index].key].render()}
    </View>
  );
}
const createCustomNavigator = createNavigatorFactory(CustomStackNavigator);
const Stack = createCustomNavigator();

// --- EKRANLAR ---

const HomeScreen = ({ navigation }) => {
  const { notesList } = useNotes();

  const renderNoteItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.noteItem}
      onPress={() => navigation.navigate('NoteDetail', { note: item })}
    >
      {item.title ? <Text style={styles.noteTitle}>{item.title}</Text> : null}
      <Text style={styles.noteText} numberOfLines={3}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Notlarım</Text>
      
      {notesList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz not eklemediniz</Text>
          <Text style={styles.subText}>Başlamak için + butonuna tıklayın</Text>
        </View>
      ) : (
        <FlatList
          data={notesList}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddNote')}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const AddNoteScreen = ({ navigation }) => {
  const { notesList, setNotesList } = useNotes();
  const [title, setTitle] = useState('');
  const [noteText, setNoteText] = useState('');

  const handleSave = () => {
    if (noteText.trim() !== '' || title.trim() !== '') {
      setNotesList([...notesList, { id: Date.now().toString(), title, text: noteText }]);
      navigation.navigate('Home');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitleSmall}>Yeni Not</Text>
        <View style={{ width: 50 }} />
      </View>

      <TextInput
        style={styles.titleInput}
        placeholder="Başlık"
        placeholderTextColor="#ADB5BD"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Buraya notunuzu yazın..."
        placeholderTextColor="#ADB5BD"
        value={noteText}
        onChangeText={setNoteText}
        multiline
        autoFocus
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Kaydet</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const NoteDetailScreen = ({ route, navigation }) => {
  const { notesList, setNotesList } = useNotes();
  const { note } = route.params;

  const handleDelete = () => {
    // Alert modülünde Android emülatör kaynaklı sorun olabileceği için 
    // direkt silme işlemini yapıyoruz.
    setNotesList(prevNotes => prevNotes.filter(n => n.id !== note.id));
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={[styles.backButton, { color: '#DC3545' }]}>Sil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailCard}>
        {note.title ? <Text style={styles.detailTitle}>{note.title}</Text> : null}
        <Text style={styles.detailText}>{note.text}</Text>
      </View>
    </View>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  return (
    <AppContent />
  );
}

// Provider'ı içermek için ara component
const AppContent = () => {
  const [notesList, setNotesList] = useState([]);
  
  React.useEffect(() => {
    const loadNotes = async () => {
      try {
        if (!SimpleStorage) return; 
        const storedNotes = await SimpleStorage.getItem('@notes_list');
        if (storedNotes !== null) {
          setNotesList(JSON.parse(storedNotes));
        }
      } catch (error) {
        console.error('Notlar yüklenirken hata:', error);
      }
    };
    loadNotes();
  }, []);

  const updateNotesList = (newNotesOrUpdater) => {
    if (typeof newNotesOrUpdater === 'function') {
      setNotesList((prev) => {
        const updated = newNotesOrUpdater(prev);
        if (SimpleStorage) {
          SimpleStorage.setItem('@notes_list', JSON.stringify(updated)).catch(() => {});
        }
        return updated;
      });
    } else {
      setNotesList(newNotesOrUpdater);
      if (SimpleStorage) {
        SimpleStorage.setItem('@notes_list', JSON.stringify(newNotesOrUpdater)).catch(() => {});
      }
    }
  };
  
  return (
    <NotesContext.Provider value={{ notesList, setNotesList: updateNotesList }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddNote" component={AddNoteScreen} />
          <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </NotesContext.Provider>
  );
};

// --- STİLLER ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  headerTitleSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6C757D',
    fontWeight: '500',
  },
  subText: {
    fontSize: 14,
    color: '#ADB5BD',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#008cffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabIcon: {
    fontSize: 30,
    color: 'white',
    lineHeight: 32,
  },
  noteItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  backButton: {
    fontSize: 16,
    color: '#008cffff',
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#212529',
    textAlignVertical: 'top',
    lineHeight: 26,
  },
  saveButton: {
    backgroundColor: '#008cffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    flex: 1,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    paddingBottom: 16,
  },
  detailText: {
    fontSize: 18,
    color: '#495057',
    lineHeight: 28,
  }
});