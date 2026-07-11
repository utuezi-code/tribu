import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/home/HomeScreen";
import { CreateEventScreen } from "../screens/home/CreateEventScreen";
import { EventDetailScreen } from "../screens/event/EventDetailScreen";
import { EventMembersScreen } from "../screens/event/EventMembersScreen";
import type { MainStackParamList } from "./types";

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="EventMembers" component={EventMembersScreen} />
    </Stack.Navigator>
  );
}
