import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const useSocketListeners = () => {
  const { socket } = useAuthStore();
  const {
    selectedUser,
    messages,
    users,
    setSelectedUser,
    set,
  } = useChatStore.getState(); // Get values without re-rendering

  useEffect(() => {
    if (!socket) return;

    // 🔴 Listen for newMessage
    socket.on("newMessage", (newMessage) => {
      const selectedUserNow = useChatStore.getState().selectedUser;
      const messagesNow = useChatStore.getState().messages;
      const usersNow = useChatStore.getState().users;

      if (newMessage.senderId === selectedUserNow?._id) {
        useChatStore.setState({
          messages: [...messagesNow, newMessage],
        });
      } else {
        // Increment unreadCount
        useChatStore.setState({
          users: usersNow.map((user) =>
            user._id === newMessage.senderId
              ? { ...user, unreadCount: (user.unreadCount || 0) + 1 }
              : user
          ),
        });
      }
    });

    // 🟢 Listen for messagesRead
    socket.on("messagesRead", ({ senderId }) => {
      const usersNow = useChatStore.getState().users;

      useChatStore.setState({
        users: usersNow.map((user) =>
          user._id === senderId ? { ...user, unreadCount: 0 } : user
        ),
      });
    });

    return () => {
      socket.off("newMessage");
      socket.off("messagesRead");
    };
  }, [socket]);
};

export default useSocketListeners;
