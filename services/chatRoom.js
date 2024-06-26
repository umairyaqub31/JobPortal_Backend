const Conversation = require("../models/conversation");
const User = require("../models/user");
const Message = require("../models/message");
const message = require("../models/message");

const checkRoom = async (data) => {
  const conversation = await Conversation.findOne({ roomId: data.roomId });

  if (!conversation) {
    try {
      const conversationToSave = new Conversation({
        roomId: data.roomId,
        members: [data.authorId, data.receiverId],
      });

      await conversationToSave.save();

      const user = await User.findById(data.authorId);
      let newObject = {
        roomId: data.roomId,
        chatedId: data.receiverId,
      };
      if (user) {
        await User.updateOne(
          { _id: data.authorId },
          { $push: { chatedUsers: newObject } }
        );
      } else {
        console.log("User not found.");
      }
    } catch (error) {
      console.log("save conversation error........", error);
    }
  }
};

const saveMessage = async (data) => {
  const messageToSave = new Message(data);
  console.log("saved data...", messageToSave);
  await messageToSave.save();
};

module.exports = { checkRoom, saveMessage };
