const connection = require("../db/db_config");
const { v4: uuidv4 } = require('uuid');

 const SaveMessage = (s_id,r_id,msg) => new Promise((resolve,reject)=>{
  const uniqueID = uuidv4();
    const query =
    "INSERT INTO chats (id,sender_id, receiver_id, message) VALUES ($1,$2, $3, $4);";
    const values = [uniqueID,s_id, r_id, msg];
  connection.query(query, values, (err, result) => {
    if (err) {
        reject({ message: "Error saving user", error: err })
    }
    resolve(result.rows)
  })
})

 const getUserMessages = (req,res)=>{
const {s_id} = req.body;
 const promise =  new Promise((resolve,reject)=>{

    const query = "SELECT * FROM chats where sender_id = $1 OR receiver_id = $2;";
    const values = [s_id, s_id];
  connection.query(query, values , (err, result) => {
    if (err) {
        reject(err)
    }
    resolve(result.rows)
  })
})

promise.then((result)=>{
 return res.status(200).json({success:true,data:result});
}).catch((error)=>{
  return res.status(500).json({ message: "Failed to fetch messages", error: error.message });
})


}

module.exports = { SaveMessage, getUserMessages };