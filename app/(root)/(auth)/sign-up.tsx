import { useAuth, useSignUp } from "@clerk/expo";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SignUp() {
    const { signUp, errors, fetchStatus } = useSignUp();
    const { isSignedIn } = useAuth();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");

    const isLoading = fetchStatus === "fetching";

    if (signUp.status === "complete" || isSignedIn) return null;

    const onSignUpPress = async () => {
        const { error } = await signUp.password({
            emailAddress: email,
            password: password,
            firstName: firstName,
            lastName: lastName,
        })

        if (error) {
            alert(error.message);
            return;
        }
        if (!error) await signUp.verifications.sendEmailCode()
    }

    const onVerifyPress = async () => {
        await signUp.verifications.verifyEmailCode({ code: code })
        if (signUp.status === "complete") {
            await signUp.finalize({
                navigate: ({ decorateUrl }) => {
                    const url = decorateUrl("/")
                    router.replace(url as any)
                }
            })
        }
    }

    if (signUp.status === "missing_requirements" && signUp.unverifiedFields.includes("email_address") && signUp.missingFields.length === 0) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View className="flex-1 justify-center px-6 py-12">
                    <Image source={require("../../../assets/images/kribb.png")} className="w-32 h-16 mb-8" resizeMode="contain" />
                    <Text className="text-3xl font-bold text-gray-800 mb-2">Verify your account</Text>
                    <Text className="text-gray-500 mb-8">We sent a code to {email}</Text>
                    <TextInput value={code} onChangeText={setCode} placeholder="Verification Code" placeholderTextColor={"#9CA3AF"} className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4" keyboardType="number-pad" />
                    {errors.fields?.code && <Text className="text-red-500 mb-4">{errors.fields.code.message}</Text>}
                    <TouchableOpacity onPress={onVerifyPress} disabled={isLoading} className="w-full bg-blue-600 py-4 rounded-xl items-center mb-4">
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold">Verify</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => signUp.verifications.sendEmailCode()}>
                        <Text className="text-blue-600 font-semibold">I need a new code</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white" keyboardShouldPersistTaps="handled">
                <View className="flex-1 justify-center px-6 py-12">
                    <Image source={require("../../../assets/images/kribb.png")} className="w-32 h-16 mb-8" resizeMode="contain" />
                    <Text className="text-3xl font-bold text-gray-800 mb-2">Create an account</Text>
                    <Text className="text-gray-500 mb-8">Find your dream home today</Text>
                    <View className="flex-row gap-3 mb-4">
                        <TextInput value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor={"#9CA3AF"} className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
                            autoCapitalize="words" />
                        <TextInput value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor={"#9CA3AF"} className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
                            autoCapitalize="words" />
                    </View>
                    <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={"#9CA3AF"} className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
                        autoCapitalize="none" keyboardType="email-address" />
                    {errors.fields?.emailAddress && <Text className="text-red-500 mb-4">{errors.fields.emailAddress.message}</Text>}
                    <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={"#9CA3AF"} className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6" secureTextEntry />
                    {errors.fields?.password && <Text className="text-red-500 mb-4">{errors.fields.password.message}</Text>}
                    <TouchableOpacity onPress={onSignUpPress} disabled={isLoading} className="w-full bg-blue-600 py-4 rounded-xl items-center mb-4">
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold">Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center">
                        <Text className="text-gray-500">Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace("/sign-in")}>
                            <Text className="text-blue-600 font-semibold">Sign In</Text>
                        </TouchableOpacity>
                    </View>
                    <View nativeID="clerk-captcha" />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}