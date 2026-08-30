import { useMutation } from "@tanstack/react-query";
import { sendChatMessage } from "../api";

export function useSendChatMessage() {
  return useMutation({
    mutationFn: sendChatMessage,
  });
}
