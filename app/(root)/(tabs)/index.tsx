import FeatureCard from '@/components/FeatureCard';
import PropertyCard from '@/components/PropertyCard';
import { supabase } from '@/lib/supabase';
import { Property } from '@/types';
import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [recommendedProperties, setRecommendedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    setLoading(true);
    const { data: featuredData } = await supabase.from('properties')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    const { data: recommendedData } = await supabase.from('properties')
      .select('*')
      .eq('is_featured', false)
      .order('created_at', { ascending: false });

    setFeaturedProperties(featuredData || []);
    setRecommendedProperties(recommendedData || []);
    setLoading(false);
  }

  useFocusEffect(useCallback(() => {
    fetchProperties();
  }, []));

  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      <FlatList data={recommendedProperties} keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View>
              <View className='flex-row items-center justify-between px-5 pt-4 pb-5'>
                <Image source={require("../../../assets/images/kribb.png")} className='h-9 w-24' resizeMode='contain' />

                <View className='items-end'>
                  <Text>Good Morning 👋</Text>
                  <Text className='text-gray-900 text-base font-bold'>{user?.firstName ?? "User"}</Text>
                </View>
              </View>
            </View>

            {/* search bar */}
            <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/search")}
              className='mx-5 mb-6 bg-white flex-row items-center rounded-2xl px-4 py-3 gap-3'
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2
              }}>
              <Ionicons name='search-outline' size={18} color="#9CA3AF" />
              <Text className='text-gray-400 text-sm flex-1'>Search properties, cities...</Text>

              <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/search?openFilters=true")}
                className='bg-blue-600 w-8 h-8 items-center justify-center rounded-xl'>
                <Ionicons name='options-outline' size={15} color={"white"} />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Featured Properties */}
            <View className='mb-6'>
              <Text className='text-gray-900 text-lg font-bold px-5 mb-4'>Featured</Text>
              {loading ? (
                <ActivityIndicator size={"small"} color={"#2563EB"} className='py-10' />
              ) : (
                <FlatList horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{paddingHorizontal:20}}
                data={featuredProperties} keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <FeatureCard property={item}/>} />
              )}
            </View>

            {/* Recommended Properties */}
            <Text className='text-gray-900 text-lg font-bold px-5 mb-4'>Recommended</Text>
          </View>
        }

        renderItem={({ item }) => (
          <View className='px-5'>
            <PropertyCard property={item} showSave/>
          </View>
        )}

        ListEmptyComponent={!loading ? (
          <View className='items-center py-10'>
            <Text className='text-gray-400'>No properties found</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  )
}

export default HomeScreen
