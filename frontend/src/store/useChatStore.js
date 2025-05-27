import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // 🔄 Fetch all users for sidebar
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");

      // 👇 Ensure users array includes unreadCount from backend
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // 💬 Fetch messages & mark them as read
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });

      // ✅ Mark messages from this user as read
      await get().markMessagesAsRead(userId);

      // 👇 Reset unreadCount locally (optional but gives instant feedback)
      set((state) => ({
        users: state.users.map((user) =>
          user._id === userId ? { ...user, unreadCount: 0 } : user
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // 📨 Send message
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // 📡 Real-time message updates
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { users, messages, selectedUser } = get();

      // If the message is from the selected user → update messages
      if (newMessage.senderId === selectedUser?._id) {
        set({ messages: [...messages, newMessage] });
      } else {
        // Otherwise → increment unread count for that sender
        set({
          users: users.map((user) =>
            user._id === newMessage.senderId
              ? { ...user, unreadCount: (user.unreadCount || 0) + 1 }
              : user
          ),
        });
      }
    });
  },

  // 📴 Clean up listeners
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  // ✅ Call backend to mark messages as read
  markMessagesAsRead: async (fromUserId) => {
    try {
      await axiosInstance.patch(`/messages/mark-read/${fromUserId}`);
    } catch (error) {
      toast.error("Failed to mark messages as read");
    }
  },

  // Change selected user
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
