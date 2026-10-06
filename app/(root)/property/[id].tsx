import { useSavedProperties } from '@/hooks/useSavedProperties';
import { useSupabase } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { formatePrice } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import { Property } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Linking, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ImageViewing from "react-native-image-viewing";
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window")

const ADMIN_PHONE = "+917985036925"

const PropertyDetails = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    // const { userId } = useAuth();
    const router = useRouter();
    const isAdmin = useUserStore(state => state.isAdmin)

    const [property, setProperty] = useState<Property | null>(null)
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0)
    const [expanded, setExpended] = useState(false)
    const [imageViewerVisible, setImageViewerVisible] = useState(false);

    const authSupabase = useSupabase();
    const { isSaved, saveLoading, toggleSave } = useSavedProperties(id ?? "")

    useEffect(() => {
        if (!id) return;
        let isMounted = true;

        supabase
            .from("properties")
            .select("*")
            .eq("id", id)
            .single()
            .then(({ data }) => {
                if (isMounted) {
                    setProperty(data ?? null);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [id]);

    const onscroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width)
        setActiveIndex(index)
    }

    const isLongDesc = (property?.description?.length ?? 0) > 150;
    const displayDesc = expanded || !isLongDesc ? property?.description : property?.description?.slice(0, 150) + "...";

    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(property?.longitude ?? 0) - 0.003}%2C${(property?.latitude ?? 0) - 0.003}%2C${(property?.longitude ?? 0) + 0.003}%2C${(property?.latitude ?? 0) + 0.003}&layer=mapnik&marker=${property?.latitude}%2C${property?.longitude}`;

    const handleContact = () => {
        const message = `Hi I'm interested in the property: ${property?.title}`;
        const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`
        Linking.openURL(url)
    }

    const handleMarkSold = () => {
        Alert.alert("Mark as Sold", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Mark Sold",
                onPress: async () => {
                    await authSupabase.from("properties").update({ is_sold: true }).eq("id", id);
                    setProperty(prev => (prev ? { ...prev, is_sold: true } : prev))
                }
            }
        ])
    }
    const handleDelete = () => {
        Alert.alert("Delete Property", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                onPress: async () => {
                    await authSupabase.from("properties").delete().eq("id", id);
                    router.replace("/(root)/(tabs)")
                }
            }
        ])
    }

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!property) {
        return (
            <View className='flex-1 items-center justify-center bg-white'>
                <Text className='text-gray-500'>Property not found</Text>
            </View>
        )
    }
    return (
        <View className='flex-1 bg-white'>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View>
                    <View style={{ opacity: property.is_sold ? 0.5 : 1 }}>
                        <FlatList
                            data={property.images}
                            keyExtractor={(_, i) => i.toString()}
                            renderItem={(({ item }) => (
                                <TouchableOpacity onPress={() => setImageViewerVisible(true)}>
                                    <Image source={{ uri: item }} style={{ width, height: 300 }} resizeMode='cover' />
                                </TouchableOpacity>
                            ))}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={onscroll}
                            scrollEventThrottle={16}
                        />
                    </View>

                    {/* Image count badge */}
                    <View className='absolute bottom-3 right-4 bg-black/50 px-3 py-1 rounded-full'>
                        <Text className='text-white text-xs font-medium'>
                            {activeIndex + 1}/{property.images.length}
                        </Text>
                    </View>
                    <SafeAreaView className='absolute top-0 left-0 right-0'>
                        <View className='flex-row items-center justify-between px-4 pt-2'>
                            <TouchableOpacity onPress={() => router.back()} className='w-10 h-10 bg-white rounded-full items-center justify-center' style={{ elevation: 3 }}>
                                <Ionicons name='arrow-back' size={20} color={"#111827"} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={toggleSave} disabled={saveLoading} className='w-10 h-10 bg-white rounded-full items-center justify-center' style={{ elevation: 3 }}>
                                <Ionicons name={isSaved ? "heart" : "heart-outline"} size={20} color={isSaved ? "#ef4444" : "#111827"} />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
                <View className='px-5 pt-5 pb-8' style={{ opacity: property.is_sold ? 0.6 : 1 }}>
                    <View className='flex-row gap-2 mb-3 flex-wrap'>
                        <View className='bg-blue-50 px-3 py-1 rounded-full'>
                            <Text className='text-blue-600 text-xs font-semibold capitalize'>
                                {property.type}
                            </Text>
                        </View>
                        {property.is_featured && <View className='bg-amber-50 px-3 py-1 rounded-full'>
                            <Text className='text-amber-600 text-xs font-semibold capitalize'>
                                ⭐ Featured
                            </Text>
                        </View>}
                        {property.is_sold && <View className='bg-red-50 px-3 py-1 rounded-full'>
                            <Text className='text-red-500 text-xs font-semibold capitalize'>
                                Sold
                            </Text>
                        </View>}
                    </View>
                    <Text className='text-2xl font-bold text-gray-900 mb-1'>
                        {property.title}
                    </Text>
                    <Text className='text-xl font-bold text-blue-600 mb-4'>
                        {formatePrice(property.price)}
                    </Text>
                    <View className='flex-row justify-between bg-gray-50 rounded-2xl p-4 mb-5'>
                        <SpecItem icon='bed-outline' label='Beds' value={`${property.bedrooms}`} />
                        <SpecItem icon='water-outline' label='Bathrooms' value={`${property.bathrooms}`} />
                        <SpecItem icon='expand-outline' label='Area' value={`${property.area_sqft} ft²`} />
                        <SpecItem icon='home-outline' label='Type' value={property.type} />
                    </View>
                    <Text className='text-base font-bold text-gray-900 mb-2'>
                        Description
                    </Text>
                    <Text className='text-gray-500 text-sm leading-6 mb-1'>
                        {displayDesc}
                    </Text>

                    {isLongDesc && (
                        <TouchableOpacity onPress={() => setExpended(!expanded)}>
                            <Text className='text-blue-600 text-sm font-medium mb-5'>
                                {expanded ? "Show less" : "Read more"}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <Text className='text-base font-bold mb-2 mt-5 text-gray-900'>
                        Location
                    </Text>
                    <View className='flex-row items-center gap-2 mb-4'>
                        <Ionicons name='location-outline' size={16} color={"#6b7280"} />
                        <Text className='text-gray-500 text-sm flex-1'>
                            {property.address}, {property.city}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push({
                            pathname: "/(root)/property/map",
                            params: {
                                latitude: property.latitude,
                                longitude: property.longitude,
                                title: property.title,
                                address: `${property.address}, ${property.city}`
                            }
                        })}
                        activeOpacity={0.9} style={{ height: 200 }} className='rounded-2xl overflow-hidden mb-6'>
                        <WebView
                            source={{ uri: mapUrl }}
                            style={{ flex: 1 }}
                            scrollEnabled={false}
                            pointerEvents='none'
                        />
                        <View className='absolute bottom-3 right-3 bg-white/90 px-3 py-1 rounded-full flex-row items-center gap-1'>
                            <Ionicons name='expand-outline' size={12} color={"#374151"} />
                            <Text className='text-gray-600 text-xs font-medium'>
                                Tap to expand
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleContact} className='flex-row items-center justify-center gap-2 bg-green-600 py-4 rounded-2xl mb-4'>
                        <Ionicons name='logo-whatsapp' size={20} color={"white"} />
                        <Text className='text-white font-bold text-base'>
                            Contact Agent
                        </Text>
                    </TouchableOpacity>
                    {isAdmin && (
                        <View className='flex-row gap-3'>
                            {!property.is_sold && (
                                <TouchableOpacity onPress={handleMarkSold} className='flex-1 flex-row items-center justify-center gap-2 bg-amber-50 py-4 rounded-2xl border border-amber-200'>
                                    <Ionicons name='checkmark-circle-outline' size={18} color={"#d97706"} />
                                    <Text className='text-amber-600 font-semibold'>Mark Sold</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={handleDelete} className='flex-1 flex-row items-center justify-center gap-2 bg-red-50 py-4 rounded-2xl border border-amber-200'>
                                <Ionicons name='trash-bin-outline' size={18} color={"#ef4444"} />
                                <Text className='text-red-500 font-semibold'>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
            <ImageViewing
                images={property.images.map((uri) => ({ uri }))}
                imageIndex={activeIndex}
                visible={imageViewerVisible}
                onRequestClose={() => setImageViewerVisible(false)}
            />
        </View>
    )
}

export default PropertyDetails

function SpecItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
    return (
        <View className='items-center gap-1'>
            <Ionicons name={icon} size={20} color={"#2563eb"} />
            <Text className='text-gray-900 font-bold text-sm'>{value}</Text>
            <Text className='text-gray-400 text-xs'>{label}</Text>
        </View>
    )
}