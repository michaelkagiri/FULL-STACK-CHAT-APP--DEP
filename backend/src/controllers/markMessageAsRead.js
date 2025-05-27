// export const markMessagesAsRead = async (req, res) => {
//   try {
//     const myId = req.user._id;
//     const { id: senderId } = req.params;

//     await Message.updateMany(
//       { senderId, receiverId: myId, isRead: false },
//       { $set: { isRead: true } }
//     );

//     res.sendStatus(200);
//   } catch (error) {
//     console.error("Error in markMessagesAsRead:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
