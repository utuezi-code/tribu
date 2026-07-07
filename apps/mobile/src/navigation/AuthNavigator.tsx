import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PhoneScreen } from "../screens/auth/PhoneScreen";
import { OtpScreen } from "../screens/auth/OtpScreen";
import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="OtpVerification" component={OtpScreen} />
    </Stack.Navigator>
  );
}
