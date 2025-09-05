import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ALLERGENS } from '@/contexts/AllergensContext';
import { X, Filter } from 'lucide-react-native';

type AllergenFilterProps = {
  selectedAllergens: { $id: string; name: string }[];
  onToggleFilter: (allergen: string) => void;
  onClearFilters: () => void;
};

export default function AllergenFilter({
  selectedAllergens,
  onToggleFilter,
  onClearFilters,
}: AllergenFilterProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12, // 👈 rounded corners
      paddingTop: Platform.OS === 'android' ? 1 : 2,
      marginBottom: 6, // 👈 spacing below
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Platform.OS === 'android' ? 8 : 12,
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
      fontSize: Platform.OS === 'android' ? 13 : 15,
      color: colors.primary,
      marginLeft: 8,
    },
    clearButton: {
      paddingVertical: 4,
    },
    clearButtonText: {
      fontFamily: 'Inter-Regular',
      fontSize: Platform.OS === 'android' ? 12 : 14,
      color: colors.primary,
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
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: Platform.OS === 'android' ? 11 : 13,
      color: colors.text,
    },
    activeFilterText: {
      color: '#FFFFFF',
    },
    removeIcon: {
      marginLeft: 5,
    },
    activeFiltersContainer: {
      backgroundColor: colors.surface,
      paddingHorizontal: Platform.OS === 'android' ? 6 : 8,
      paddingVertical: Platform.OS === 'android' ? 4 : 6,
      marginBottom: Platform.OS === 'android' ? 2 : 4,
    },
    activeFiltersText: {
      fontFamily: 'Inter-Regular',
      fontSize: Platform.OS === 'android' ? 11 : 13,
      color: colors.text,
    },
    activeFiltersHighlight: {
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Filter size={18} color={colors.primary} />
          <Text style={styles.title}>Filter Out Allergens</Text>
        </View>

        {selectedAllergens.length > 0 && (
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
        {ALLERGENS.map((allergen) => {
          const isActive = selectedAllergens.some(
            (a) => a.name === allergen.name
          );

          return (
            <TouchableOpacity
              key={allergen.$id}
              style={[styles.filterItem, isActive && styles.activeFilterItem]}
              onPress={() => onToggleFilter(allergen.name)}
            >
              <Text
                style={[styles.filterText, isActive && styles.activeFilterText]}
              >
                {allergen.name}
              </Text>

              {isActive && (
                <X size={12} color="#FFFFFF" style={styles.removeIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedAllergens.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>
            Showing recipes without:{' '}
            <Text style={styles.activeFiltersHighlight}>
              {selectedAllergens.map((a) => a.name).join(', ')}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}
