import {
    ActivityIndicator,
    Pressable,
    PressableProps,
    Text,
} from "react-native";

type ButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  loading?: boolean;
};

export function Button({
  title,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      className={`h-14 items-center justify-center rounded-button ${
        isDisabled
          ? "bg-slate-400"
          : "bg-primary-500 active:bg-primary-600"
      }`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-base font-bold text-white">
          {title}
        </Text>
      )}
    </Pressable>
  );
}