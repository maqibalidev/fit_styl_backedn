const connection = require("../db/db_config");

// const postChat = (req, res) => {
//   const senderId = req.user.userId;
//   const { receiver_id, message } = req.body;

//   const query =
//     "INSERT INTO chats (sender_id, receiver_id, message) VALUES (?, ?, ?)";
//   connection.query(query, [senderId, receiver_id, message], (err, result) => {
//     if (err) {
//       return res.status(500).json({ message: "Error saving user", error: err });
//     }
//     return res.status(200).json({
//       message: "chat posted successfully!",
//     });
//   });
// };

const getAllChats = (req, res) => {
  const {s_id} = req.query;
  const query =
    "SELECT * FROM chats where sender_id = ?  OR receiver_id = ? ORDER BY timestamp";
  connection.query(query, [s_id,s_id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error saving user", error: err });
    }
    return res.status(200).json({
      data: result
    });
  });
};
module.exports = { getAllChats };
