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
import { X } from 'lucide-react-native';

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
      paddingTop: Platform.select({ android: 10, ios: 12, web: 10 }),
      paddingBottom: Platform.select({ android: 6, ios: 8, web: 10 }),
      paddingHorizontal: Platform.select({ android: 10, ios: 12, web: 12 }),
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Platform.select({ android: 6, ios: 8, web: 12 }),
    },
    filters: {
      paddingRight: 8,
    },
    filterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: Platform.select({ android: 10, ios: 12, web: 12 }),
      paddingVertical: Platform.select({ android: 5, ios: 6, web: 6 }),
      marginRight: Platform.select({ android: 6, ios: 8, web: 8 }),
      backgroundColor: colors.surface,
    },
    activeFilterItem: {
      backgroundColor: colors.dietary,
      borderColor: colors.dietary,
    },
    filterText: {
      fontSize: Platform.select({ android: 12, ios: 13, web: 13 }),
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    activeFilterText: {
      color: '#FFFFFF',
    },
    removeIcon: {
      marginLeft: 5,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Platform.select({ android: 3, ios: 5, web: 8 }),
    },
    activeFiltersText: {
      fontFamily: 'Inter-Regular',
      fontSize: Platform.select({ android: 11, ios: 12, web: 13 }),
      color: colors.text,
      flex: 1,
    },
    activeFiltersHighlight: {
      fontFamily: 'Inter-SemiBold',
      color: colors.dietary,
    },
    clearButton: {
      paddingVertical: 4,
      paddingLeft: 12,
    },
    clearButtonText: {
      fontFamily: 'Inter-Medium',
      fontSize: Platform.select({ android: 11, ios: 12, web: 13 }),
      color: colors.dietary,
    },
  });

  return (
    <View style={styles.container}>
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
        <View style={styles.footer}>
          <Text style={styles.activeFiltersText} numberOfLines={1}>
            Preferences:{' '}
            <Text style={styles.activeFiltersHighlight}>
              {selectedDietary.map((d) => d.name).join(', ')}
            </Text>
          </Text>
          <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
            <Text style={styles.clearButtonText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
