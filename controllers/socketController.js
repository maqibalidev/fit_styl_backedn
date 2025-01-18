const connection = require("../db/db_config");
const { v4: uuidv4 } = require('uuid');

 const SaveMessage = (s_id,r_id,msg) => new Promise((resolve,reject)=>{
  const uniqueID = uuidv4();
    const query =
    "INSERT INTO chats (id,sender_id, receiver_id, message) VALUES (?,?, ?, ?)";
  connection.query(query, [uniqueID,s_id, r_id, msg], (err, result) => {
    if (err) {
        reject({ message: "Error saving user", error: err })
    }
    resolve(result)
  })
})

 const getUserMessages = (req,res)=>{
const {s_id} = req.body;
 const promise =  new Promise((resolve,reject)=>{

    const query = "SELECT * FROM chats where sender_id = ? OR receiver_id = ? ";
  connection.query(query, [s_id, s_id], (err, result) => {
    if (err) {
        reject(err)
    }
    resolve(result)
  })
})


promise.then((result)=>{
 return res.status(200).json({success:true,data:result});
}).catch((error)=>{
  return res.status(500).json({ message: "Failed to fetch messages", error: error.message });
})


}

module.exports = { SaveMessage, getUserMessages };