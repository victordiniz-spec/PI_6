import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
    Pressable,
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";

type TextFieldProps = TextInputProps & {
  label: string;
  password?: boolean;
  error?: string;
};

export function TextField({
  label,
  password = false,
  error,
  ...props
}: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-slate-600">
        {label}
      </Text>

      <View
        className={`h-14 flex-row items-center rounded-input border bg-slate-50 px-4 ${
          error ? "border-red-400" : "border-slate-200"
        }`}
      >
        <TextInput
          className="flex-1 text-base text-slate-900 outline-none"
          placeholderTextColor="#94A3B8"
          secureTextEntry={password && !showPassword}
          {...props}
        />

        {password && (
          <Pressable
            className="ml-3 h-10 w-10 items-center justify-center"
            onPress={() => setShowPassword((current) => !current)}
          >
            {showPassword ? (
              <EyeOff size={20} color="#64748B" />
            ) : (
              <Eye size={20} color="#64748B" />
            )}
          </Pressable>
        )}
      </View>

      {error && (
        <Text className="text-xs text-red-500">
          {error}
        </Text>
      )}
    </View>
  );
}