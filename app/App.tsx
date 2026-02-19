import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import RootNavigator, { navigationRef } from "./src/navigation/RootNavigator";

// Handle notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const responseListener = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    // Handle notification tap - deep link to UploadStatus
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.screen === "UploadStatus" && navigationRef.current?.isReady()) {
          navigationRef.current.navigate("Main", { screen: "UploadStatus" } as any);
        }
      });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
