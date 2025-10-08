import React from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';

const mockQuests = [
  {id: '1', title: 'Daily Check-In', description: 'Log your anime watch time today.'},
  {id: '2', title: 'Discover New Series', description: 'Explore three recommended titles.'},
  {id: '3', title: 'Share Progress', description: 'Update your friends on what you are watching.'},
];

const QuestBoardScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quest Board</Text>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={mockQuests}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: '#020617',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
  },
  listContent: {
    paddingVertical: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  cardDescription: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
  },
});

export default QuestBoardScreen;
