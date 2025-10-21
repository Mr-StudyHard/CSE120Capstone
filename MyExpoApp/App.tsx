import React, { useState, useRef, useEffect } from "react";
import { Platform } from 'react-native';
import { StatusBar } from "expo-status-bar";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import "./global.css";

// ExpandableMenu: central button expands to 4 radial options. On press-hold and drag,
// the hovered option becomes highlighted; on release, the hovered option is selected.
function ExpandableMenu() {
  const [open, setOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef(null);

  // option definitions (icon name and callback)
  const options = [
    { id: 'file', icon: 'file' },
    { id: 'attach', icon: 'paperclip' },
    { id: 'mic', icon: 'microphone' },
    { id: 'camera', icon: 'camera' },
  ];

  // compute which option index is under the point (x,y) relative to container center
  function indexForPoint(x: number, y: number, rect: DOMRect | null) {
    if (!rect) return null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
    // map angle to 4 quadrants: right (0), top (1), left (2), bottom (3)
    if (angle >= -45 && angle < 45) return 0; // right
    if (angle >= 45 && angle < 135) return 3; // bottom (because y grows down)
    if (angle >= 135 || angle < -135) return 2; // left
    return 1; // top
  }

  useEffect(() => {
    // prevent scrolling while menu is open on web
    function prevent(e: TouchEvent) {
      if (open) e.preventDefault();
    }
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, [open]);

  // handle pointer events at document level while open
  useEffect(() => {
    if (!open) return;
    const onPointerMove = (e: PointerEvent) => {
      const rect = (containerRef.current as any)?.getBoundingClientRect?.();
      const idx = indexForPoint(e.clientX, e.clientY, rect);
      setHoverIndex(idx);
    };
    const onPointerUp = (e: PointerEvent) => {
      const rect = (containerRef.current as any)?.getBoundingClientRect?.();
      const idx = indexForPoint(e.clientX, e.clientY, rect);
      setOpen(false);
      setHoverIndex(null);
      if (idx != null) {
        // perform action for selected option
        // For now, we just show an alert
        // In future, you can call a prop callback
        // Map idx to option
        const opt = options[idx];
        // eslint-disable-next-line no-alert
        alert(`Selected: ${opt.id}`);
      }
      document.removeEventListener('pointermove', onPointerMove as any);
      document.removeEventListener('pointerup', onPointerUp as any);
    };
    document.addEventListener('pointermove', onPointerMove as any);
    document.addEventListener('pointerup', onPointerUp as any);
    return () => {
      document.removeEventListener('pointermove', onPointerMove as any);
      document.removeEventListener('pointerup', onPointerUp as any);
    };
  }, [open]);

  return (
    <View ref={containerRef as any} className="relative items-center">
      {/* radial options */}
      {open && (
        <View className="absolute bottom-20 w-full items-center justify-center pointer-events-none">
          <View className="relative w-64 h-64 items-center justify-center">
            {options.map((opt, i) => {
              // positions for 4 items (right, top, left, bottom)
              const positions = [ {right: -80, top: 64}, {right: 64, top: -80}, {right: 208, top: 64}, {right: 64, top: 208} ];
              const pos = positions[i];
              const isHover = hoverIndex === i;
              return (
                <View key={opt.id} style={{ position: 'absolute', right: pos.right, top: pos.top }} pointerEvents="none">
                  <View className={`w-14 h-14 rounded-full items-center justify-center ${isHover? 'bg-button-outline' : 'bg-card-bg'}`}>
                    <FontAwesome name={opt.icon as any} size={20} color={isHover? 'black' : 'white'} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* central button */}
      <View className="w-full items-center">
        <View className="w-16 h-16 rounded-full bg-button-outline items-center justify-center">
          <Pressable
            onPressIn={(e) => {
              setOpen(true);
              const evt = (e as any).nativeEvent;
              const rect = (containerRef.current as any)?.getBoundingClientRect?.();
              const idx = indexForPoint(evt.pageX, evt.pageY, rect);
              setHoverIndex(idx);
            }}
            onPressOut={() => {
              // handled at document pointerup
            }}
            style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <FontAwesome name="plus" size={28} color="black" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<
    "landing" | "login" | "signup" | "home" | "settings"
  >("landing");

  // Track whether the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Lift files state to App so menu actions can add entries
  const [files, setFiles] = useState(() => [
    { id: 1, name: "note.md", date: "10/02/2025 10:20AM", type: "Note", typeColor: "green", number: "241" },
    { id: 2, name: "resume.pdf", date: "10/02/2025 10:22AM", type: "Doc", typeColor: "orange", number: "242" },
    { id: 3, name: "image.png", date: "10/02/2025 10:28AM", type: "Image", typeColor: "red", number: "243" },
    { id: 4, name: "video.mp4", date: "10/02/2025 10:30AM", type: "Recording", typeColor: "blue", number: "244" },
    { id: 5, name: "audio.mp3", date: "10/02/2025 10:32AM", type: "Recording", typeColor: "blue", number: "245" },
    { id: 6, name: "file.docx", date: "10/02/2025 10:34AM", type: "Doc", typeColor: "orange", number: "246" },
    { id: 7, name: "presentation.pptx", date: "10/02/2025 10:36AM", type: "Doc", typeColor: "orange", number: "247" },
    { id: 8, name: "spreadsheet.xlsx", date: "10/02/2025 10:38AM", type: "Doc", typeColor: "orange", number: "248" },
  ]);

  const getTypeColor = (color: string) => {
    switch (color) {
      case "button-border-color":
        return "#D7827E";
      case "green":
        return "bg-green-500";
      case "orange":
        return "bg-orange-500";
      case "red":
        return "bg-red-500";
      case "blue":
        return "bg-blue-500";
      default:
        return "bg-black";
    }
  };

  // Landing screen similar to the provided mockup
  const LandingScreen = () => {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <StatusBar style="light" />
        <View className="w-full max-w-md">
          <Text className="text-2xl text-button-outline font-extrabold mb-4 text-center">
            ConnectWork
          </Text>

          <Text className="text-gray-300 text-sm mb-10">
            Create your personalized layout of information from conferences and
            expo events that has links, business cards, photos, and detailed
            description of your links such as date, location, and type.
          </Text>

          <TouchableOpacity
            onPress={() => setScreen("login")}
            className="border-2 border-button-outline rounded-md py-3 mb-4 items-center"
          >
            <Text className="text-button-outline font-semibold">Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setScreen("signup")}
            className="border-2 border-button-outline rounded-md py-3 items-center"
          >
            <Text className="text-button-outline font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Login screen with username/password validation
  const LoginScreen = () => {
  // Pre-fill username and password with 'Admin' as requested
  const [username, setUsername] = useState("Admin");
  const [password, setPassword] = useState("Admin");

    const onSubmit = () => {
      // Validate username 'Admin' and password 'Admin' (case-sensitive)
      if (username === "Admin" && password === "Admin") {
        // Ensure navigation happens on web (Alert callbacks may not fire there)
        setIsLoggedIn(true);
        setScreen("home");
        Alert.alert("Success", "Logged in successfully");
      } else {
        Alert.alert("Error", "Invalid username or password");
      }
    };

    return (
      <SafeAreaView className="flex-1 bg-background px-6 items-center">
        <StatusBar style="light" />
        <View className="w-full max-w-md mt-24">
          <Text className="text-2xl text-button-outline font-extrabold mb-6 text-center">
            Log In
          </Text>

          <Text className="text-gray-300 mb-2">Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            className="bg-card-bg rounded px-4 py-3 text-white mb-4"
            placeholder="username"
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-gray-300 mb-2">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-card-bg rounded px-4 py-3 text-white mb-6"
            placeholder="password"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity
            onPress={onSubmit}
            className="bg-button-outline rounded-md py-3 items-center mb-4"
          >
            <Text className="text-black font-semibold">Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setScreen("landing")}
            className="items-center"
          >
            <Text className="text-gray-400">Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  const SignUpScreen = () => {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 items-center">
        <StatusBar style="light" />
        <View className="w-full max-w-md mt-24 items-center">
          <Text className="text-2xl text-button-outline font-extrabold mb-6">
            Sign Up
          </Text>
          <Text className="text-gray-300 mb-4 text-center">
            This is a placeholder Sign Up screen. You can implement account
            creation here.
          </Text>
          <TouchableOpacity
            onPress={() => setScreen("landing")}
            className="border-2 border-button-outline rounded-md py-3 px-6 items-center"
          >
            <Text className="text-button-outline">Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // The original main app content (renamed Home)
  const Home = ({ files, setFiles, getTypeColor }: { files: any[], setFiles: any, getTypeColor: (s:string)=>string }) => {
    const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());

    const toggleFileSelection = (fileId: number) => {
      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(fileId)) {
          newSet.delete(fileId);
        } else {
          newSet.add(fileId);
        }
        return newSet;
      });
    };


    // use getTypeColor passed from parent

    return (
      <SafeAreaView className="flex-1 bg-background">
        <StatusBar style="light" />

        {/* Header Section */}
        <View className="px-6 pt-4 pb-4 mt-10">
          {/* Email and Settings */}
          <View className="flex-row justify-between items-center mt-12 mb-2">
            <Text className="text-white text-base">dsanchez113@ucmerced.edu</Text>
              <TouchableOpacity onPress={() => setScreen("settings") }>
              <FontAwesome name="cog" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Bar and Bundle Button */}
          <View className="flex-row items-center space-x-3">
            <View className="flex-1 bg-white rounded-lg px-4 py-3 flex-row items-center">
              <FontAwesome name="search" size={20} color="black" />
              <TextInput
                placeholder="Search"
                placeholderTextColor="#9CA3AF"
                className="ml-2 flex-1 text-gray-900"
              />
            </View>
            <TouchableOpacity className="border-2 border-button-outline bg-black px-4 py-3 rounded-lg flex-row items-center">
              <FontAwesome
                name="link"
                size={20}
                color={getTypeColor("button-border-color")}
              />
              <Text className="ml-2  font-semibold text-button-outline text-lg">
                Link
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* File List */}
        <ScrollView className="flex-1 px-6">
          {files.map((file) => (
            <View
              key={file.id}
              className="bg-card-bg rounded-lg p-4 mb-3 flex-row items-center"
            >
              {/* Checkbox */}
              <TouchableOpacity
                className={`w-5 h-5 rounded mr-4 items-center justify-center ${
                  selectedFiles.has(file.id)
                    ? "bg-button-outline"
                    : "border-2 border-white"
                }`}
                onPress={() => toggleFileSelection(file.id)}
              >
                {selectedFiles.has(file.id) && (
                  <FontAwesome name="check" size={15} color="black" />
                )}
              </TouchableOpacity>

              {/* File Icon */}
              <View className="w-10 h-10 bg-button-outline rounded-full items-center justify-center mr-4">
                <Text className="text-black font-bold text-lg">D</Text>
              </View>

              {/* File Info */}
              <View className="flex-1">
                <Text className="text-white text-base font-medium mb-1">
                  {file.name}
                </Text>
                <Text className="text-gray-400 text-sm">{file.date}</Text>
              </View>

              {/* File Type and Number */}
              <View className="items-end">
                <View className="flex-row items-center mb-1">
                  <View
                    className={`w-2 h-2 rounded-full ${getTypeColor(
                      file.typeColor
                    )} mr-2`}
                  />
                  <Text className="text-white text-sm">{file.type}</Text>
                </View>
                <Text className="text-gray-400 text-sm">{file.number}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Navigation: central expandable button */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
          {/* Overlay that appears while expanding to capture moves */}
          {/** overlay covers bottom area when expanding */}
          <ExpandableMenu />
        </View>
      </SafeAreaView>
    );
  };

  // Settings screen
  const Settings = () => {
    return (
      <SafeAreaView className="flex-1 bg-background px-6">
        <StatusBar style="light" />
        <View className="mt-16">
          <Text className="text-2xl text-button-outline font-extrabold mb-6">Settings</Text>

          <View className="mb-4">
            <Text className="text-gray-300 mb-2">Account</Text>
            {isLoggedIn ? (
              <TouchableOpacity
                onPress={() => {
                  // Log out the user
                  setIsLoggedIn(false);
                  setScreen("landing");
                }}
                className="border-2 border-button-outline rounded-md py-3 items-center"
              >
                <Text className="text-button-outline">Log Out</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setScreen("landing")}
                className="border-2 border-button-outline rounded-md py-3 items-center"
              >
                <Text className="text-button-outline">Open Log In / Sign Up</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-gray-300 mb-2">Notifications</Text>
            <TouchableOpacity className="border-2 border-button-outline rounded-md py-3 items-center">
              <Text className="text-button-outline">Notification Options</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setScreen("home")} className="mt-6 items-center">
            <Text className="text-gray-400">Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Render the correct screen wrapped with SafeAreaProvider for web
  return (
    <SafeAreaProvider>
      {screen === "landing" ? (
        <LandingScreen />
      ) : screen === "login" ? (
        <LoginScreen />
      ) : screen === "signup" ? (
        <SignUpScreen />
      ) : screen === "settings" ? (
        <Settings />
      ) : (
        <Home files={files} setFiles={setFiles} getTypeColor={getTypeColor} />
      )}
    </SafeAreaProvider>
  );
}
