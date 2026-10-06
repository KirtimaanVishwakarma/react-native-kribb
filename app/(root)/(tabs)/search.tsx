import FilterModel from '@/components/FilterModel'
import PropertyCard from '@/components/PropertyCard'
import { supabase } from '@/lib/supabase'
import { formatePrice } from '@/lib/utils'
import { useFilterStore } from '@/store/filterStore'
import { Property } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function SearchScreen() {
  const { openFilters } = useLocalSearchParams<{ openFilters?: string }>()
  const [results, setResults] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilter, setShowFilter] = useState(openFilters === "true")

  useEffect(() => {
    if (openFilters === "true") {
      const timer = setTimeout(() => {
        setShowFilter(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [openFilters])
  const {
    search,
    type,
    bedrooms,
    maxPrice,
    minPrice,
    setSearch,
    setType,
    setBedrooms,
    setMinPrice,
    setMaxPrice
  } = useFilterStore()
  const activeFilterCount = [type !== null, bedrooms !== null, minPrice !== null, maxPrice !== null].filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setLoading(true);
    }, 0);

    let query = supabase.from("properties").select("*");

    if (search) {
      query = query.or(`title.ilike.%${search}%,city.ilike.%${search}%`);
    }
    if (type) {
      query = query.eq("type", type);
    }
    if (bedrooms) {
      query = query.eq("bedrooms", bedrooms);
    }
    if (minPrice) {
      query = query.gte("price", minPrice);
    }
    if (maxPrice) {
      query = query.lte("price", maxPrice);
    }

    query.order("created_at", { ascending: false }).then(({ data }) => {
      clearTimeout(timer);
      if (isMounted) {
        setResults(data ?? []);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, type, bedrooms, minPrice, maxPrice])


  return (
    <SafeAreaView className=' flex-1 bg-gray-50'>
      <View className='px-5 pt-4 pb-3'>
        <Text className='text-2xl font-bold text-gray-900 mb-4'>Find Property</Text>
        <View className='flex-row items-center gap-3'>
          <View className='flex-1 flex-row items-center bg-white rounded-2xl px-4 gap-3'
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2
            }}>
            <Ionicons name='search-outline' size={18} color={"#9CA3AF"} />
            <TextInput
              className='flex-1 py-3 text-gray-800'
              placeholder='Search by title or city...'
              placeholderTextColor={"#9CA3AF"}
              value={search}
              onChangeText={setSearch}
              autoCapitalize='none'
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name='close-circle' size={18} color={"#9ca3af"} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => setShowFilter(true)} className={`w-12 h-12 rounded-2xl items-center justify-center
          ${activeFilterCount > 0 ? "bg-blue-600" : "bg-white"}`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2
            }}
          >
            <Ionicons name='options-outline' size={20} color={activeFilterCount > 0 ? "#fff" : "#374151"} />
            {activeFilterCount > 0 && (
              <View className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center'>
                <Text className='text-white text-[9px] font-bold'>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        {/* Filter chips */}
        {activeFilterCount > 0 && (
          <View className='flex-row flex-wrap gap-2 mt-3'>
            {type && (
              <View className='flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 gap-1'>
                <Text className='text-blue-700 text-xs font-semibold capitalize'>
                  {type}
                </Text>
                <TouchableOpacity onPress={() => setType(null)}>
                  <Ionicons name='close' size={12} color={"#1d4ed8"} />
                </TouchableOpacity>
              </View>
            )}
            {bedrooms !== null && (
              <View className='flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 gap-1'>
                <Ionicons name='bed-outline' size={11} color={"#1d4ed8"} />
                <Text className='text-blue-700 text-xs font-semibold capitalize'>
                  {bedrooms === 4 ? "4+ beds" : `${bedrooms} bed${bedrooms > 1 ? "s" : ""}`}
                </Text>
                <TouchableOpacity onPress={() => setBedrooms(null)}>
                  <Ionicons name='close' size={12} color={"#1d4ed8"} />
                </TouchableOpacity>
              </View>
            )}
            {minPrice !== null && maxPrice !== null && (
              <View className='flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 gap-1'>
                <Text className='text-blue-700 text-xs font-semibold capitalize'>
                  {minPrice && maxPrice ? `${formatePrice(minPrice)} - ${formatePrice(maxPrice)}` : minPrice ? `From ${formatePrice(minPrice)}` : `Up to ${formatePrice(maxPrice)}`}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setMinPrice(null);
                    setMaxPrice(null)
                  }}>
                  <Ionicons name='close' size={12} color={"#1d4ed8"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
      {/* Results */}

      <FlatList data={results} keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text className='text-sm text-gray-400 mb-4'>{loading ? "Searching...": `${results.length} properties founed`}</Text>
        }

        renderItem={({ item }) => (
          <PropertyCard property={item} showSave />
        )}

        ListEmptyComponent={!loading ? (
          <View className='items-center py-10'>
            <Text className='text-gray-400 mt-4 text-base'>No properties found</Text>
            <Text className='text-gray-300 text-sm mt-1'>Try a different search or adjust filters</Text>
          </View>
        ) : null}
      />
      {/* Filter Model */}
      <FilterModel onClose={() => setShowFilter(false)} visible={showFilter} />
    </SafeAreaView>
  )
}

export default SearchScreen
