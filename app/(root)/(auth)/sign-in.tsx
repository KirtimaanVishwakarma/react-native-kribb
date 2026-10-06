import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SignIn() {
    const { signIn, errors, fetchStatus } = useSignIn();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");

    const isLoading = fetchStatus === "fetching";

    const onSignInPress = async () => {
        const { error } = await signIn.password({
            emailAddress: email,
            password: password,
        })

        if (error) {
            alert(error.message);
            return;
        }

        if (signIn.status === "complete") {
            await signIn.finalize({
                navigate: ({ session, decorateUrl }) => {
                    if (session?.currentTask) {
                        console.log(session?.currentTask);
                        return;
                    }
                    const url = decorateUrl("/")
                    router.replace(url as any)
                }
            })
        }
        else if (signIn.status === "needs_second_factor") {
            await signIn.mfa.sendPhoneCode()
        }
        else if (signIn.status === "needs_client_trust") {
            const emailCodeFactor = await signIn.supportedSecondFactors.find(factor => factor.strategy === "email_code")
            if (emailCodeFactor) {
                await signIn.mfa.sendEmailCode()
            }
        }
        else {
            console.error("sign in attempt not completed", signIn);

        }
    }

    const onVerifyPress = async () => {
        await signIn.mfa.verifyEmailCode({code: code})
        if (signIn.status === "complete") {
            await signIn.finalize({
                navigate: ({ session, decorateUrl }) => {
                    if (session?.currentTask) {
                        console.log(session?.currentTask);
                        return;
                    }
                    const url = decorateUrl("/")
                    router.replace(url as any)
                }
            })
        }
    }

    if(signIn.status === "needs_client_trust") {
        return  (
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

                    <TouchableOpacity onPress={()=> signIn.mfa.sendEmailCode()}>
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
                    <Text className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</Text>
                    <Text className="text-gray-500 mb-8">Sign in to continue</Text>
                    <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={"#9CA3AF"} className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
                        autoCapitalize="none" keyboardType="email-address" />
                    {errors.fields?.identifier && <Text className="text-red-500 mb-4">{errors.fields.identifier.message}</Text>}
                    <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={"#9CA3AF"} className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6" secureTextEntry />
                    {errors.fields?.password && <Text className="text-red-500 mb-4">{errors.fields.password.message}</Text>}
                    <TouchableOpacity onPress={onSignInPress} disabled={isLoading} className="w-full bg-blue-600 py-4 rounded-xl items-center mb-4">
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold">Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center">
                        <Text className="text-gray-500">Don&apos;t have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace("/sign-up")}>
                            <Text className="text-blue-600 font-semibold">Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                    <View nativeID="clerk-captcha" />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}