import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { DIETARY_PREFERENCES } from '@/contexts/DietaryContext';
import { X, Salad } from 'lucide-react-native';

type DietaryFilterProps = {
  selectedDietary: { $id: string; name: string }[];
  onToggleFilter: (dietary: string) => void;
  onClearFilters: () => void;
};

export default function DietaryFilter({
  selectedDietary,
  onToggleFilter,
  onClearFilters,
}: DietaryFilterProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingTop: Platform.OS === 'android' ? 1 : 2,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Platform.OS === 'android' ? 8 : 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Platform.OS === 'android' ? 6 : 8,
      marginBottom: Platform.OS === 'android' ? 2 : 4,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontFamily: 'Inter-SemiBold',
      fontSize: Platform.OS === 'android' ? 11 : 15,
      color: colors.dietary,
      marginLeft: 8,
    },
    clearButton: {
      paddingVertical: 4,
    },
    clearButtonText: {
      fontFamily: 'Inter-Regular',
      fontSize: Platform.OS === 'android' ? 10 : 14,
      color: colors.dietary,
    },
    filters: {
      paddingHorizontal: Platform.OS === 'android' ? 6 : 8,
      paddingBottom: Platform.OS === 'android' ? 2 : 4,
    },
    filterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 20,
      paddingHorizontal: Platform.OS === 'android' ? 6 : 8,
      paddingVertical: Platform.OS === 'android' ? 2 : 4,
      marginRight: Platform.OS === 'android' ? 3 : 4,
      backgroundColor: colors.surface,
    },
    activeFilterItem: {
      backgroundColor: colors.dietary,
      borderColor: colors.dietary,
    },
    filterText: {
      fontSize: Platform.OS === 'android' ? 9 : 13,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    activeFilterText: {
      color: '#FFFFFF',
    },
    removeIcon: {
      marginLeft: 6,
    },
    activeFiltersContainer: {
      backgroundColor: colors.surface,
      paddingHorizontal: Platform.OS === 'android' ? 6 : 8,
      paddingVertical: Platform.OS === 'android' ? 4 : 6,
      marginBottom: Platform.OS === 'android' ? 2 : 4,
    },
    activeFiltersText: {
      fontFamily: 'Inter-Regular',
      fontSize: Platform.OS === 'android' ? 9 : 13,
      color: colors.text,
    },
    activeFiltersHighlight: {
      fontFamily: 'Inter-SemiBold',
      color: colors.dietary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Salad size={18} color={colors.dietary} />
          <Text style={styles.title}>Dietary Preferences</Text>
        </View>

        {selectedDietary.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
            <Text style={styles.clearButtonText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {DIETARY_PREFERENCES.map((dietary) => {
          const isActive = selectedDietary.some((d) => d.name === dietary.name);

          return (
            <TouchableOpacity
              key={dietary.$id}
              style={[styles.filterItem, isActive && styles.activeFilterItem]}
              onPress={() => onToggleFilter(dietary.name)}
            >
              <Text
                style={[styles.filterText, isActive && styles.activeFilterText]}
              >
                {dietary.name}
              </Text>

              {isActive && (
                <X size={12} color="#FFFFFF" style={styles.removeIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedDietary.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Including preferences:{' '}
            <Text style={styles.activeFiltersHighlight}>
              {selectedDietary.map((d) => d.name).join(', ')}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}
